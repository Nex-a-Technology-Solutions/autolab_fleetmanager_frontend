import React, { useState } from 'react';
import { Reservation, Car, Notification } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { 
  Calendar, 
  AlertCircle, 
  Car as CarIcon,
  User,
  MapPin,
  Clock,
  CheckCircle
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

export default function UnallocatedStage({ reservations, cars, vehicleTypes, locations, onRefresh, isLoading }) {
  const [allocatingReservation, setAllocatingReservation] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState({});

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_confirmation': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getAvailableVehiclesForReservation = (reservation) => {
    const reservationCategory = reservation.vehicle_category;
    return cars.filter(car => 
      car.category === reservationCategory && 
      car.status === 'available' && 
      car.active !== false
    );
  };

  const handleAllocateVehicle = async (reservation) => {
    const vehicleId = selectedVehicle[reservation.id];
    if (!vehicleId) {
      alert('Please select a vehicle to allocate.');
      return;
    }

    setAllocatingReservation(reservation.id);
    try {
      // Update reservation with allocated vehicle
      await Reservation.update(reservation.id, {
        assigned_vehicle_id: vehicleId,
        status: 'confirmed'
      });

      // Create notification
      await Notification.create({
        type: 'reservation_pending',
        title: 'Vehicle Allocated to Reservation',
        message: `Vehicle has been allocated to ${reservation.customer_name}'s reservation. Pickup scheduled for ${format(new Date(reservation.pickup_date), 'MMM d, yyyy')}.`,
        priority: 'normal',
        related_entity_id: reservation.id,
        related_entity_type: 'reservation'
      });

      onRefresh && onRefresh();
      alert('Vehicle successfully allocated to reservation!');
    } catch (error) {
      console.error('Error allocating vehicle:', error);
      alert('Failed to allocate vehicle. Please try again.');
    } finally {
      setAllocatingReservation(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {Array(3).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-slate-200 rounded mb-2"></div>
              <div className="h-6 bg-slate-200 rounded mb-4 w-1/2"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-slate-200 rounded w-32"></div>
                <div className="h-8 bg-slate-200 rounded w-24"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No unallocated reservations</h3>
          <p className="text-slate-600">All current reservations have been allocated to vehicles.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reservations.map((reservation, index) => {
        const availableVehicles = getAvailableVehiclesForReservation(reservation);
        const daysUntilPickup = differenceInDays(new Date(reservation.pickup_date), new Date());
        const isUrgent = daysUntilPickup <= 2;
        
        return (
          <motion.div
            key={reservation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all ${
              isUrgent ? 'ring-2 ring-amber-200' : ''
            }`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Reservation #{reservation.id?.slice(-8)}
                        {isUrgent && (
                          <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                            URGENT
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User className="w-3 h-3" />
                        <span>{reservation.customer_name}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(reservation.status)} border font-medium`}>
                    NEEDS VEHICLE
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Pickup</p>
                      <p className="font-medium">
                        {format(new Date(reservation.pickup_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CarIcon className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Required Vehicle</p>
                      <p className="font-medium">{reservation.vehicle_category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Pickup Location</p>
                      <p className="font-medium">{reservation.pickup_location || 'Main Office'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Days Until</p>
                      <p className={`font-medium ${isUrgent ? 'text-red-600' : ''}`}>
                        {daysUntilPickup} days
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-700">Available Vehicles ({availableVehicles.length})</p>
                    {availableVehicles.length === 0 && (
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                        NO VEHICLES AVAILABLE
                      </Badge>
                    )}
                  </div>
                  {availableVehicles.length > 0 ? (
                    <div className="flex gap-2">
                      <Select
                        value={selectedVehicle[reservation.id] || ''}
                        onValueChange={(value) => setSelectedVehicle(prev => ({...prev, [reservation.id]: value}))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a vehicle to allocate..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVehicles.map(vehicle => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              Fleet {vehicle.fleet_id} - {vehicle.license_plate || 'No plate'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => handleAllocateVehicle(reservation)}
                        disabled={!selectedVehicle[reservation.id] || allocatingReservation === reservation.id}
                        className="text-white"
                        style={{background: 'var(--wwfh-red)'}}
                      >
                        {allocatingReservation === reservation.id ? 'Allocating...' : 'Allocate'}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">
                      No {reservation.vehicle_category} vehicles are currently available. 
                      Consider checking back later or contacting the customer about alternatives.
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-xs text-slate-500">
                    Booked: {reservation.created_date ? format(new Date(reservation.created_date), 'MMM d, h:mm a') : 'Unknown'}
                    {reservation.confirmation_required_by && (
                      <span className="ml-3">
                        Confirmation needed by: {format(new Date(reservation.confirmation_required_by), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}