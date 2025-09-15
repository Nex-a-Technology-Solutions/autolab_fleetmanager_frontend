
import React, { useState, useEffect } from 'react';
import { Car, CheckoutReport, VehicleWorkflow } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Car as CarIcon, Loader2, User, Calendar, Hash, MapPin } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import CheckinInspectionForm from '../components/checkin/CheckinInspectionForm';
import WashCheckForm from '../components/workflow/WashCheckForm';
import DrivingCheckForm from '../components/workflow/DrivingCheckForm';
import ApprovalForm from '../components/workflow/ApprovalForm';
import WorkflowStepper from '../components/workflow/WorkflowStepper';

export default function Checkin() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCar, setSelectedCar] = useState(null);
  const [checkoutReport, setCheckoutReport] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [vehiclesOnHire, setVehiclesOnHire] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadVehiclesOnHire();
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [searchQuery, vehiclesOnHire]);

  const loadVehiclesOnHire = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get all cars that are marked as 'checked_out'
      const allCheckedOutCars = await Car.filter({ status: 'checked_out' });

      // 2. IMPORTANT: Filter out cars with missing fleet_id to prevent errors
      const validCheckedOutCars = allCheckedOutCars.filter(car => car.fleet_id);
      
      if (validCheckedOutCars.length === 0) {
        setVehiclesOnHire([]);
        setIsLoading(false);
        return;
      }

      // 3. Get all checkout reports, sorted by created_date descending to ensure we pick the latest
      const allCheckoutReports = await CheckoutReport.list('-created_date');
      const reportsMap = new Map();
      for (const report of allCheckoutReports) {
        // Store only the latest report for each car_id (since they are sorted by -created_date)
        if (report.car_id && !reportsMap.has(report.car_id)) {
          reportsMap.set(report.car_id, report);
        }
      }

      // 4. Combine valid car data with the latest checkout info
      const vehiclesWithInfo = validCheckedOutCars.map(car => ({
        ...car,
        checkoutInfo: reportsMap.get(car.id) || null,
      }));
      
      setVehiclesOnHire(vehiclesWithInfo);

    } catch (err) {
      console.error("Error loading vehicles on hire:", err);
      setError("Failed to load vehicles on hire. Please try again.");
    }
    setIsLoading(false);
  };

  const filterVehicles = () => {
    if (!searchQuery) {
      setFilteredVehicles(vehiclesOnHire);
      return;
    }

    const filtered = vehiclesOnHire.filter(vehicle =>
      vehicle.license_plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.fleet_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.checkoutInfo?.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredVehicles(filtered);
  };

  const resetState = () => {
    setSearchQuery("");
    setSelectedCar(null);
    setCheckoutReport(null);
    setWorkflow(null);
    setIsLoading(false);
    setIsSubmitting(false);
    setError(null);
  };
  
  const handleVehicleSelect = async (vehicle) => {
    setIsLoading(true);
    setError(null);
    
    // Ensure there's a checkout report to proceed
    if (!vehicle.checkoutInfo) {
      setError(`Cannot start check-in for Fleet ${vehicle.fleet_id}: No associated checkout report found.`);
      setIsLoading(false);
      return;
    }

    try {
      const newWorkflow = await VehicleWorkflow.create({
          car_id: vehicle.id,
          checkout_report_id: vehicle.checkoutInfo?.id || null, // Use optional chaining for safety
          current_stage: 'returned',
          workflow_status: 'in_progress',
          return_date: new Date().toISOString(),
          stages_completed: []
      });
      
      // Only update the status field, which is all that's changing here.
      await Car.update(vehicle.id, { status: 'in_inspection' });
      
      // Update the local car state with the new status
      setSelectedCar({ ...vehicle, status: 'in_inspection' });
      setCheckoutReport(vehicle.checkoutInfo);
      setWorkflow(newWorkflow);

    } catch (err) {
      console.error("Error starting check-in process:", err);
      setError("An unexpected error occurred. Please try again.");
    }
    setIsLoading(false);
  };
  
  const refreshWorkflow = async () => {
    if(!workflow) return;
    const updatedWorkflow = await VehicleWorkflow.get(workflow.id);
    setWorkflow(updatedWorkflow);
  };

  const handleCheckinSubmit = async (checkinData) => {
    setIsSubmitting(true);
    try {
      const updatedWorkflowData = {
        checkin_data: checkinData,
        current_stage: 'washing',
        stages_completed: ['returned'],
      };
      await VehicleWorkflow.update(workflow.id, updatedWorkflowData);
      await Car.update(selectedCar.id, { status: 'in_cleaning' });
      await refreshWorkflow();
    } catch (err) {
      console.error("Error submitting check-in:", err);
      setError("Failed to submit check-in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWashSubmit = async (washData) => {
    setIsSubmitting(true);
    try {
      const damageFound = washData.damage_found;
      const nextStage = damageFound ? 'servicing' : 'driving_test';
      const newCarStatus = damageFound ? 'maintenance_required' : 'in_driving_check';

      const updatedWorkflowData = {
        wash_check_data: washData,
        current_stage: nextStage,
        stages_completed: [...workflow.stages_completed, 'washing'],
        damage_flagged: workflow.damage_flagged || damageFound
      };
      
      await VehicleWorkflow.update(workflow.id, updatedWorkflowData);
      await Car.update(selectedCar.id, { status: newCarStatus });
      await refreshWorkflow();
    } catch (err) {
      console.error("Error submitting wash check:", err);
      setError("Failed to submit wash check. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrivingSubmit = async (drivingData) => {
    setIsSubmitting(true);
    try {
      const issuesFound = drivingData.issues_found;
      const nextStage = issuesFound ? 'servicing' : 'approval';
      const newCarStatus = issuesFound ? 'maintenance_required' : 'in_service';

      const updatedWorkflowData = {
        driving_test_data: drivingData,
        current_stage: nextStage,
        stages_completed: [...workflow.stages_completed, 'driving_test']
      };

      await VehicleWorkflow.update(workflow.id, updatedWorkflowData);
      await Car.update(selectedCar.id, { status: newCarStatus });
      await refreshWorkflow();
    } catch (err) {
      console.error("Error submitting driving check:", err);
      setError("Failed to submit driving check. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprovalSubmit = async (approvalData) => {
    setIsSubmitting(true);
    try {
      if (approvalData.approved) {
         await VehicleWorkflow.update(workflow.id, {
          approval_data: {
            approved_for_hire: true,
            manager_name: approvalData.manager_name,
            final_notes: approvalData.final_inspection_notes,
            approval_date: new Date().toISOString()
          },
          current_stage: 'ready_for_hire',
          workflow_status: 'completed',
          stages_completed: [...workflow.stages_completed, 'approval']
        });
        await Car.update(selectedCar.id, { status: 'available' });
        alert('Vehicle approved and is now available for hire.');
        resetState();
        await loadVehiclesOnHire();
      } else {
        await VehicleWorkflow.update(workflow.id, {
          current_stage: 'servicing',
          notes: `Approval rejected by ${approvalData.manager_name}. Notes: ${approvalData.final_inspection_notes}`
        });
        await Car.update(selectedCar.id, { status: 'maintenance_required' });
        await refreshWorkflow();
      }
    } catch (err) {
      console.error("Error submitting approval:", err);
      setError("Failed to submit approval. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderCurrentStage = () => {
    if (!workflow) return null;

    switch (workflow.current_stage) {
      case 'returned':
        return <CheckinInspectionForm car={selectedCar} checkoutReport={checkoutReport} onNext={handleCheckinSubmit} isSubmitting={isSubmitting} />;
      case 'washing':
        return <WashCheckForm workflow={workflow} car={selectedCar} onComplete={handleWashSubmit} />;
      case 'driving_test':
        return <DrivingCheckForm workflow={workflow} car={selectedCar} onComplete={handleDrivingSubmit} />;
      case 'approval':
        return <ApprovalForm onComplete={handleApprovalSubmit} isSubmitting={isSubmitting} />;
      case 'servicing':
        return (
          <Card className="text-center">
            <CardContent className="p-8">
              <h3 className="text-lg font-semibold text-orange-600">Vehicle in Maintenance</h3>
              <p className="text-slate-600 mt-2">This vehicle requires service. Please complete maintenance tasks in the service module.</p>
              <Button className="mt-4" onClick={async () => {
                  await VehicleWorkflow.update(workflow.id, { current_stage: 'approval' });
                  await Car.update(selectedCar.id, { status: 'in_service' });
                  await refreshWorkflow();
              }}>
                Manager Override: Skip to Approval
              </Button>
            </CardContent>
          </Card>
        );
      default:
        return <p>Unknown workflow stage.</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Vehicle Check-in Process</h1>
          <p className="text-slate-600 text-lg">Process returning vehicles through the complete workflow.</p>
        </motion.div>
        
        <AnimatePresence mode="wait">
          {!selectedCar ? (
            <motion.div key="vehicle-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Select Vehicle to Check In</CardTitle>
                  <p className="text-sm text-slate-600">Choose from vehicles currently on hire</p>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input 
                        placeholder="Search by Fleet ID, license plate, customer name, or vehicle make..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-600 text-center">{error}</p>
                    </div>
                  )}

                  <div className="text-sm text-slate-600 mb-4">
                    {isLoading ? 'Loading...' : `${filteredVehicles.length} vehicles on hire`}
                  </div>

                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array(6).fill(0).map((_, i) => (
                        <div key={i} className="bg-slate-100 rounded-xl p-4 animate-pulse">
                          <div className="h-5 bg-slate-200 rounded mb-2"></div>
                          <div className="h-4 bg-slate-200 rounded mb-4 w-3/4"></div>
                          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredVehicles.length === 0 ? (
                    <div className="text-center py-12">
                      <CarIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        {searchQuery ? 'No matching vehicles found' : 'No vehicles on hire'}
                      </h3>
                      <p className="text-slate-600">
                        {searchQuery ? 'Try adjusting your search terms' : 'All vehicles are currently available or in process'}
                      </p>
                      {searchQuery && (
                        <Button variant="outline" onClick={() => setSearchQuery("")} className="mt-4">
                          Clear Search
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        onClick={loadVehiclesOnHire} 
                        className="mt-4 ml-2"
                      >
                        Refresh List
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                      {filteredVehicles.map((vehicle) => (
                        <motion.div 
                          key={vehicle.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card 
                            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300"
                            onClick={() => handleVehicleSelect(vehicle)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-bold text-lg text-slate-800">
                                    {vehicle.make} {vehicle.model}
                                  </h3>
                                  <div className="flex items-center gap-1 text-sm font-bold mb-1" style={{color: 'var(--wwfh-navy)'}}>
                                    <Hash className="w-3 h-3" />
                                    <span>Fleet {vehicle.fleet_id}</span>
                                  </div>
                                </div>
                                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                                  On Hire
                                </Badge>
                              </div>
                              
                              {vehicle.license_plate && (
                                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                                  <MapPin className="w-4 h-4" />
                                  <span className="font-mono">{vehicle.license_plate}</span>
                                </div>
                              )}
                              
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-600">
                                  <User className="w-4 h-4" />
                                  <span><strong>Customer:</strong> {vehicle.checkoutInfo?.customer_name || 'N/A'}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    <strong>Expected Return:</strong>{' '}
                                    {vehicle.checkoutInfo?.expected_return_date 
                                      ? format(new Date(vehicle.checkoutInfo.expected_return_date), 'MMM d, h:mm a')
                                      : 'Not set'
                                    }
                                  </span>
                                </div>
                              </div>
                              
                              <div className="mt-4 pt-3 border-t">
                                <Button variant="outline" className="w-full">
                                  Start Check-in Process
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="workflow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
              <Card>
                <CardHeader className="flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{selectedCar.make} {selectedCar.model}</CardTitle>
                    <p className="text-slate-500 font-mono">{selectedCar.license_plate}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Customer: <strong>{checkoutReport?.customer_name}</strong>
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => { resetState(); loadVehiclesOnHire(); }}>
                    Back to Vehicle List
                  </Button>
                </CardHeader>
                <CardContent>
                  <WorkflowStepper currentStage={workflow?.current_stage} completedStages={workflow?.stages_completed} />
                </CardContent>
              </Card>
              <div>
                {renderCurrentStage()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
