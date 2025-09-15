import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  CheckCircle, 
  Car as CarIcon,
  User,
  MapPin,
  Calendar,
  Clock,
  Hash
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

export default function AllocatedStage({ reservations, cars, vehicleTypes, locations, onRefresh, isLoading }) {
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getVehicleForReservation = (reservationVehicleId) => {
    return cars.find(car => car.id === reservationVehicleId);
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
          <CheckCircle className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No allocated reservations</h3>
          <p className="text-slate-600">Reservations with allocated vehicles will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reservations.map((reservation, index) => {
        const allocatedVehicle = getVehicleForReservation(reservation.assigned_vehicle_id);
        const daysUntilPickup = differenceInDays(new Date(reservation.pickup_date), new Date());
        const isToday = daysUntilPickup === 0;
        const isTomorrow = daysUntilPickup === 1;
        
        return (
          <motion.div
            key={reservation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all ${
              isToday ? 'ring-2 ring-green-300' : isTomorrow ? 'ring-2 ring-blue-300' : ''
            }`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Reservation #{reservation.id?.slice(-8)}
                        {isToday && (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                            PICKUP TODAY
                          </Badge>
                        )}
                        {isTomorrow && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                            PICKUP TOMORROW
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
                    VEHICLE ALLOCATED
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
                      <p className="text-xs text-slate-500">Vehicle Type</p>
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
                      <p className={`font-medium ${isToday ? 'text-green-600' : isTomorrow ? 'text-blue-600' : ''}`}>
                        {daysUntilPickup === 0 ? 'Today' : daysUntilPickup === 1 ? 'Tomorrow' : `${daysUntilPickup} days`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Allocated Vehicle Info */}
                {allocatedVehicle && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-green-800">Allocated Vehicle</p>
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                        READY
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3 text-green-600" />
                        <div>
                          <p className="text-xs text-green-600">Fleet ID</p>
                          <p className="font-mono font-bold text-green-800">Fleet {allocatedVehicle.fleet_id}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-green-600">License Plate</p>
                        <p className="font-mono font-medium text-green-800">{allocatedVehicle.license_plate || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600">Status</p>
                        <p className="font-medium text-green-800 capitalize">{allocatedVehicle.status.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {reservation.notes && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Special Requirements</p>
                    <p className="text-sm text-slate-700">{reservation.notes}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-xs text-slate-500">
                    Return Date: {reservation.dropoff_date ? format(new Date(reservation.dropoff_date), 'MMM d, yyyy') : 'Not set'}
                  </div>
                  <div className="flex gap-2">
                    {(isToday || isTomorrow) && (
                      <Button
                        size="sm"
                        className="text-white"
                        style={{background: 'var(--wwfh-red)'}}
                        onClick={() => window.open('/Checkout', '_blank')}
                      >
                        Start Checkout Process
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}