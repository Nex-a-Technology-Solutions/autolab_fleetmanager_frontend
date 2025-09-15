import React, { useState } from 'react';
import { Reservation } from '@/api/entities';
import { Notification } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Calendar as CalendarIcon, User, Mail, Phone } from "lucide-react";
import { format } from 'date-fns';

export default function BookingModal({ selectedDate, selectedVehicle, locations, onClose, onBookingCreated }) {
  const [isCreating, setIsCreating] = useState(false);
  const [bookingData, setBookingData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    pickup_date: selectedDate ? selectedDate.toISOString() : '',
    dropoff_date: '',
    pickup_location: '',
    dropoff_location: '',
    notes: ''
  });

  const handleCreateBooking = async () => {
    if (!bookingData.customer_name || !bookingData.customer_email || !bookingData.dropoff_date) {
      alert('Please fill in customer name, email, and dropoff date.');
      return;
    }

    setIsCreating(true);
    try {
      // Create reservation
      const reservation = await Reservation.create({
        customer_name: bookingData.customer_name,
        customer_email: bookingData.customer_email,
        customer_phone: bookingData.customer_phone,
        vehicle_category: selectedVehicle.category,
        pickup_date: bookingData.pickup_date,
        dropoff_date: bookingData.dropoff_date,
        pickup_location: bookingData.pickup_location,
        dropoff_location: bookingData.dropoff_location,
        assigned_vehicle_id: selectedVehicle.id,
        status: 'pending_confirmation',
        notes: bookingData.notes,
        total_amount: 0, // Will be calculated later
        quote_id: '', // Direct booking, no quote
        confirmation_required_by: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      });

      // Create notification
      await Notification.create({
        type: 'reservation_pending',
        title: 'New Direct Booking',
        message: `${bookingData.customer_name} has booked ${selectedVehicle.make} ${selectedVehicle.model} (Fleet ${selectedVehicle.fleet_id}) from ${format(new Date(bookingData.pickup_date), 'MMM d')} to ${format(new Date(bookingData.dropoff_date), 'MMM d')}.`,
        priority: 'high',
        related_entity_id: reservation.id,
        related_entity_type: 'reservation',
        action_required: true
      });

      onBookingCreated && onBookingCreated(reservation);
      onClose();
      alert('Booking created successfully! A notification has been added for confirmation.');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    }
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2" style={{color: 'var(--wwfh-navy)'}}>
              <CalendarIcon className="w-5 h-5" />
              New Booking
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-sm text-slate-600">
            <p><strong>Vehicle:</strong> {selectedVehicle?.make} {selectedVehicle?.model}</p>
            <p><strong>Fleet ID:</strong> {selectedVehicle?.fleet_id}</p>
            <p><strong>Date:</strong> {selectedDate ? format(selectedDate, 'PPP') : 'Not selected'}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Name
              </Label>
              <Input
                value={bookingData.customer_name}
                onChange={(e) => setBookingData({...bookingData, customer_name: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                type="email"
                value={bookingData.customer_email}
                onChange={(e) => setBookingData({...bookingData, customer_email: e.target.value})}
                placeholder="john@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone (Optional)
              </Label>
              <Input
                value={bookingData.customer_phone}
                onChange={(e) => setBookingData({...bookingData, customer_phone: e.target.value})}
                placeholder="+61 4XX XXX XXX"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Dropoff Date & Time</Label>
              <Input
                type="datetime-local"
                value={bookingData.dropoff_date}
                onChange={(e) => setBookingData({...bookingData, dropoff_date: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Pickup Location</Label>
                <Select
                  value={bookingData.pickup_location}
                  onValueChange={(value) => setBookingData({...bookingData, pickup_location: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations && locations.map(location => (
                      <SelectItem key={location.id} value={location.name}>
                        {location.name}
                        {location.transport_fee > 0 && ` (+$${location.transport_fee})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dropoff Location</Label>
                <Select
                  value={bookingData.dropoff_location}
                  onValueChange={(value) => setBookingData({...bookingData, dropoff_location: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations && locations.map(location => (
                      <SelectItem key={location.id} value={location.name}>
                        {location.name}
                        {location.transport_fee > 0 && ` (+$${location.transport_fee})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={bookingData.notes}
                onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                placeholder="Any special requirements..."
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBooking}
              disabled={isCreating}
              className="text-white"
              style={{background: 'var(--wwfh-red)'}}
            >
              {isCreating ? 'Creating...' : 'Create Booking'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}