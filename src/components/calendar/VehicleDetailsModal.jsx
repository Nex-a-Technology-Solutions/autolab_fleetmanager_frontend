import React, { useState, useEffect } from 'react';
import { Car, CheckoutReport, VehicleWorkflow } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  X, 
  Car as CarIcon, 
  Calendar as CalendarIcon, 
  User, 
  Fuel, 
  Gauge, 
  MapPin, 
  Clock,
  Wrench,
  FileText,
  Hash,
  Palette,
  Calendar1
} from "lucide-react";
import { format } from 'date-fns';

export default function VehicleDetailsModal({ vehicle, isOpen, onClose }) {
  const [checkoutHistory, setCheckoutHistory] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && vehicle) {
      loadVehicleDetails();
    }
  }, [isOpen, vehicle]);

  const loadVehicleDetails = async () => {
    setIsLoading(true);
    try {
      // Load checkout history for this vehicle
      const checkouts = await CheckoutReport.filter({ car_id: vehicle.id }, '-created_date', 5);
      setCheckoutHistory(checkouts);

      // Load active workflow if any
      const workflows = await VehicleWorkflow.filter({ 
        car_id: vehicle.id, 
        workflow_status: 'in_progress' 
      });
      setActiveWorkflow(workflows.length > 0 ? workflows[0] : null);
    } catch (error) {
      console.error("Error loading vehicle details:", error);
    }
    setIsLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'checked_out': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'maintenance_required': return 'bg-red-100 text-red-800 border-red-200';
      case 'in_inspection': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_cleaning': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'in_driving_check': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getWorkflowStageColor = (stage) => {
    switch (stage) {
      case 'returned': return 'bg-blue-100 text-blue-800';
      case 'washing': return 'bg-purple-100 text-purple-800';
      case 'driving_test': return 'bg-indigo-100 text-indigo-800';
      case 'servicing': return 'bg-orange-100 text-orange-800';
      case 'approval': return 'bg-cyan-100 text-cyan-800';
      case 'ready_for_hire': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (!vehicle) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <CarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold" style={{color: 'var(--wwfh-navy)'}}>
                  {vehicle.make} {vehicle.model}
                </DialogTitle>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Hash className="w-3 h-3" />
                  <span className="font-mono font-bold">Fleet {vehicle.fleet_id}</span>
                </div>
              </div>
            </div>
            <Badge className={`${getStatusColor(vehicle.status)} border font-medium`}>
              {vehicle.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {vehicle.license_plate && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">License Plate</p>
                      <p className="font-mono font-bold">{vehicle.license_plate}</p>
                    </div>
                  </div>
                )}
                
                {vehicle.year && (
                  <div className="flex items-center gap-2">
                    <Calendar1 className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Year</p>
                      <p className="font-medium">{vehicle.year}</p>
                    </div>
                  </div>
                )}
                
                {vehicle.color && (
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Color</p>
                      <p className="font-medium capitalize">{vehicle.color}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Mileage</p>
                    <p className="font-medium">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'Not recorded'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Fuel Level</p>
                    <p className="font-medium">{vehicle.fuel_level || 0}%</p>
                  </div>
                </div>
                
                {vehicle.last_service_date && (
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Last Service</p>
                      <p className="font-medium">{format(new Date(vehicle.last_service_date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {vehicle.notes && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Notes</p>
                  <p className="text-sm text-slate-700">{vehicle.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Workflow */}
          {activeWorkflow && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Active Workflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Stage:</span>
                    <Badge className={`${getWorkflowStageColor(activeWorkflow.current_stage)} border font-medium`}>
                      {activeWorkflow.current_stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant="outline" className={activeWorkflow.workflow_status === 'in_progress' ? 'border-blue-200 text-blue-800' : ''}>
                      {activeWorkflow.workflow_status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  
                  {activeWorkflow.damage_flagged && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-medium text-red-800">⚠️ Damage Reported</p>
                      <p className="text-xs text-red-600">This vehicle requires attention</p>
                    </div>
                  )}
                  
                  {activeWorkflow.notes && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Workflow Notes</p>
                      <p className="text-sm text-slate-700">{activeWorkflow.notes}</p>
                    </div>
                  )}
                  
                  <div className="text-xs text-slate-500">
                    Last updated: {activeWorkflow.last_updated ? format(new Date(activeWorkflow.last_updated), 'MMM d, h:mm a') : 'Not available'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Checkout History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Recent Checkout History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : checkoutHistory.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No checkout history available</p>
              ) : (
                <div className="space-y-3">
                  {checkoutHistory.map((checkout, index) => (
                    <div key={checkout.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-sm">{checkout.customer_name}</p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(checkout.checkout_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Return Expected</p>
                        <p className="text-sm font-medium">
                          {checkout.expected_return_date 
                            ? format(new Date(checkout.expected_return_date), 'MMM d, yyyy')
                            : 'Not set'
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}