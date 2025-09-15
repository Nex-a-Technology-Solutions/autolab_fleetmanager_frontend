import React, { useState, useMemo } from 'react';
import { Quote, Reservation, Notification, Car } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, AlertTriangle, ArrowRight, Car as CarIcon } from "lucide-react";

export default function AllocationModal({ isOpen, onClose, quote, cars, onRefresh }) {
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const availableVehicles = useMemo(() => {
    if (!quote || !cars) return [];
    return cars.filter(car => 
      car.category === quote.vehicle_category && 
      car.status === 'available' && 
      car.active !== false
    );
  }, [quote, cars]);

  const createDateFromQuote = (dateStr, timeStr, defaultTime) => {
      const finalTimeStr = timeStr || defaultTime;
      const dateParts = dateStr.split(/[-/]/).map(p => parseInt(p, 10));
      const timeParts = finalTimeStr.split(':').map(p => parseInt(p, 10));
      if (dateParts.length !== 3 || timeParts.length < 2 || dateParts.some(isNaN) || timeParts.some(isNaN)) {
          throw new Error(`Invalid date or time format: ${dateStr} ${finalTimeStr}`);
      }
      const [year, month, day] = dateParts;
      const [hours, minutes] = timeParts;
      return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
  };

  const handleConversion = async (isDirectAllocation = false) => {
    setIsProcessing(true);
    setError('');
    try {
      if (isDirectAllocation && !selectedVehicleId) {
        throw new Error("You must select a vehicle for direct allocation.");
      }
      if (!quote.pickup_date || !quote.dropoff_date) {
        throw new Error('Quote must have a pickup and dropoff date to be converted.');
      }

      const pickupDate = createDateFromQuote(quote.pickup_date, quote.pickup_time, '09:00:00');
      const dropoffDate = createDateFromQuote(quote.dropoff_date, quote.dropoff_time, '17:00:00');

      const reservationData = {
        quote_id: quote.id,
        customer_name: quote.customer_name,
        customer_email: quote.customer_email,
        customer_phone: quote.customer_phone,
        vehicle_category: quote.vehicle_category,
        pickup_date: pickupDate.toISOString(),
        dropoff_date: dropoffDate.toISOString(),
        pickup_location: quote.pickup_location,
        dropoff_location: quote.dropoff_location,
        total_amount: quote.total,
        notes: quote.notes,
        special_requirements: quote.special_requirements,
        daily_km_allowance: quote.daily_km_allowance,
        insurance_option: quote.insurance_option,
        status: isDirectAllocation ? 'confirmed' : 'pending_confirmation',
        assigned_vehicle_id: isDirectAllocation ? selectedVehicleId : null,
        confirmation_required_by: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      
      const reservation = await Reservation.create(reservationData);
      await Quote.update(quote.id, { status: 'accepted', accepted_date: new Date().toISOString() });
      
      const notificationTitle = isDirectAllocation ? 'Quote Directly Allocated' : 'Quote Converted';
      const notificationMessage = `Quote ${quote.quote_number} for ${quote.customer_name} has been converted to a reservation.`;
      
      await Notification.create({
        type: 'quote_accepted',
        title: notificationTitle,
        message: notificationMessage,
        priority: 'high',
        related_entity_id: reservation.id,
        related_entity_type: 'reservation',
        action_required: !isDirectAllocation
      });

      onRefresh();
      onClose();
    } catch (e) {
      console.error('Error during conversion:', e);
      setError(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !quote) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl shadow-2xl animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Convert Quote #{quote.quote_number}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
          <CardDescription>
            Convert for {quote.customer_name} - {quote.vehicle_category}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <p>{error}</p>
            </div>
          )}

          {/* Path 1: Create Unallocated */}
          <div className="p-4 border rounded-lg bg-slate-50">
            <h3 className="font-semibold text-slate-800 mb-2">Option 1: Create Unallocated Reservation</h3>
            <p className="text-sm text-slate-600 mb-4">
              This will create a reservation that needs a vehicle to be assigned later. Use this if a vehicle is not yet available or decided.
            </p>
            <Button onClick={() => handleConversion(false)} disabled={isProcessing}>
              Create Unallocated <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Path 2: Allocate Directly */}
          <div className="p-4 border rounded-lg bg-slate-50">
            <h3 className="font-semibold text-slate-800 mb-2">Option 2: Allocate Vehicle & Create Reservation</h3>
            <p className="text-sm text-slate-600 mb-4">
              Select an available vehicle from the fleet to assign it to this reservation immediately.
            </p>
            {availableVehicles.length > 0 ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <Select onValueChange={setSelectedVehicleId} value={selectedVehicleId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select available vehicle..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        Fleet {vehicle.fleet_id} - {vehicle.license_plate || 'No plate'} ({vehicle.mileage?.toLocaleString()} km)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => handleConversion(true)} 
                  disabled={!selectedVehicleId || isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CarIcon className="w-4 h-4 mr-2" />
                  Allocate & Create
                </Button>
              </div>
            ) : (
              <p className="text-amber-700 font-medium">No vehicles of type "{quote.vehicle_category}" are currently available for direct allocation.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}