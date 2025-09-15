import React, { useState, useEffect } from 'react';
import { ServiceBooking, ServiceSupplier, Car, ServiceTrigger } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function ServiceBookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bookingsData, suppliersData, carsData] = await Promise.all([
        ServiceBooking.list('-created_date'),
        ServiceSupplier.list(),
        Car.list()
      ]);
      setBookings(bookingsData);
      setSuppliers(suppliersData);
      setCars(carsData);
    } catch (error) {
      console.error("Error loading service bookings:", error);
    }
    setIsLoading(false);
  };

  const getSupplierDetails = (supplierId) => {
    return suppliers.find(s => s.id === supplierId);
  };

  const getCarDetails = (carId) => {
    return cars.find(c => c.id === carId);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending_confirmation': 'bg-amber-100 text-amber-800 border-amber-200',
      'confirmed': 'bg-blue-100 text-blue-800 border-blue-200',
      'in_progress': 'bg-purple-100 text-purple-800 border-purple-200',
      'completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const approveAdditionalWork = async (bookingId, workIndex) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      const updatedWork = [...booking.additional_work_required];
      updatedWork[workIndex] = {
        ...updatedWork[workIndex],
        approved: true,
        approval_date: new Date().toISOString(),
        approved_by: 'Service Manager'
      };

      await ServiceBooking.update(bookingId, {
        additional_work_required: updatedWork
      });

      loadData();
    } catch (error) {
      console.error('Error approving additional work:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Active Service Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-100 h-32 rounded-lg"></div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Active Bookings</h3>
              <p className="text-slate-600">Service bookings will appear here once scheduled.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => {
                const supplier = getSupplierDetails(booking.supplier_id);
                const car = getCarDetails(booking.car_id);
                
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">
                          {car?.make} {car?.model}
                        </h3>
                        <Badge variant="outline" className="font-mono">
                          Fleet {car?.fleet_id}
                        </Badge>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-4 h-4" />
                        PO: {booking.po_number}
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Supplier</p>
                        <p className="font-semibold">{supplier?.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Scheduled Date</p>
                        <p className="font-semibold">
                          {booking.scheduled_date ? format(new Date(booking.scheduled_date), 'dd/MM/yyyy') : 'TBD'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Service Type</p>
                        <p className="font-semibold capitalize">{booking.service_type.replace(/_/g, ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Estimated Cost</p>
                        <p className="font-semibold">${booking.estimated_cost || 0}</p>
                      </div>
                    </div>

                    {/* Supplier Confirmation */}
                    {booking.status === 'pending_confirmation' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-amber-800 mb-2">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">Awaiting Supplier Confirmation</span>
                        </div>
                        <p className="text-sm text-amber-700">
                          Booking details sent to {supplier?.name}. Waiting for confirmation of date and time.
                        </p>
                      </div>
                    )}

                    {booking.supplier_confirmation?.confirmed && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-blue-800 mb-2">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">Confirmed by Supplier</span>
                        </div>
                        <div className="text-sm text-blue-700">
                          <p><strong>Confirmed Date:</strong> {format(new Date(booking.supplier_confirmation.confirmed_date), 'dd/MM/yyyy')}</p>
                          <p><strong>Time:</strong> {booking.supplier_confirmation.confirmed_time}</p>
                          {booking.supplier_confirmation.notes && (
                            <p><strong>Notes:</strong> {booking.supplier_confirmation.notes}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Additional Work Required */}
                    {booking.additional_work_required && booking.additional_work_required.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-orange-800 mb-3">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium">Additional Work Required</span>
                        </div>
                        <div className="space-y-3">
                          {booking.additional_work_required.map((work, index) => (
                            <div key={index} className="bg-white border border-orange-200 rounded p-3">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <p className="font-medium text-slate-900">{work.description}</p>
                                  <p className="text-sm text-slate-600">Estimated Cost: ${work.estimated_cost}</p>
                                </div>
                                {!work.approved ? (
                                  <Button
                                    onClick={() => approveAdditionalWork(booking.id, index)}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Approve
                                  </Button>
                                ) : (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    Approved
                                  </Badge>
                                )}
                              </div>
                              {work.approved && (
                                <p className="text-xs text-green-600">
                                  Approved by {work.approved_by} on {format(new Date(work.approval_date), 'dd/MM/yyyy')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Completion Documents */}
                    {booking.completion_documents && booking.completion_documents.length > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-emerald-800 mb-2">
                          <FileText className="w-4 h-4" />
                          <span className="font-medium">Service Completion Documents</span>
                        </div>
                        <div className="flex gap-2">
                          {booking.completion_documents.map((doc, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(doc, '_blank')}
                            >
                              Document {index + 1}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      {booking.status === 'confirmed' && (
                        <Button size="sm" variant="outline">
                          Mark In Progress
                        </Button>
                      )}
                      {booking.status === 'in_progress' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Mark Completed
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}