import React, { useState, useEffect } from 'react';
import djangoClient from '@/api/djangoClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  DollarSign,
  Settings,
  AlertTriangle,
  Calculator,
  Trash,
  Car // Added for Vehicle Types Management title icon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import MassRateUpdateModal from "./MassRateUpdateModal";

// VehicleTypeForm component - handles adding/editing vehicle types
const VehicleTypeForm = ({ vehicleType, onSave, onCancel }) => {
  const [formData, setFormData] = useState(() => {
    const baseData = {
      name: '',
      diagram_type: 'car', // New field, default 'car'
      category: 'ute',
      daily_rate: 0, // Still exists, will be synced with tier_1_14_days
      pricing_tiers: { // New pricing tiers object
        tier_1_14_days: 0,
        tier_15_29_days: 0,
        tier_30_178_days: 0,
        tier_179_363_days: 0,
        tier_364_plus_days: 0
      },
      specifications: {
        drive_type: '4WD',
        cab_type: 'Dual Cab',
        body_type: '',
        seating_capacity: 2,
        payload_capacity: '',
        mine_spec: true
      },
      active: true,
      notes: ''
    };

    if (vehicleType) {
      // Merge existing vehicleType data, ensuring nested objects exist
      return {
        ...baseData, // Start with defaults to ensure all fields are present
        ...vehicleType,
        pricing_tiers: {
          ...baseData.pricing_tiers,
          ...vehicleType.pricing_tiers,
          // Sync daily_rate to tier_1_14_days if tiers don't exist or if tier is zero
          tier_1_14_days: vehicleType.pricing_tiers?.tier_1_14_days || vehicleType.daily_rate || 0 
        },
        specifications: {
          ...baseData.specifications,
          ...vehicleType.specifications
        },
        // Ensure diagram_type exists, fall back to default if not present
        diagram_type: vehicleType.diagram_type || 'car',
      };
    }
    return baseData;
  });

  // Generic handler for input changes, including nested objects
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('pricing_tiers.')) {
      const tierName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        pricing_tiers: {
          ...prev.pricing_tiers,
          [tierName]: type === 'number' ? parseFloat(value) || 0 : value
        }
      }));
    } else if (name.startsWith('specifications.')) {
      const specName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specName]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
      }));
    }
  };

  // Generic handler for Select component changes, including nested objects
  const handleSelectChange = (name, value) => {
    if (name.startsWith('specifications.')) {
      const specName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specName]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Vehicle Name *</Label>
          <Input 
            id="name" 
            name="name" 
            placeholder="e.g., Hilux SR 4WD D/Cab Mine Spec Ute - Well Body" 
            value={formData.name} 
            onChange={handleChange} 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleSelectChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ute">Ute</SelectItem>
              <SelectItem value="wagon">Wagon</SelectItem>
              <SelectItem value="bus">Bus</SelectItem>
              <SelectItem value="truck">Truck</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="diagram_type">Inspection Diagram</Label>
          <Select 
            value={formData.diagram_type} 
            onValueChange={(val) => handleSelectChange('diagram_type', val)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="car">Car (Sedan)</SelectItem>
              <SelectItem value="ute">Ute/Pickup</SelectItem>
              <SelectItem value="suv">SUV/4x4</SelectItem>
              <SelectItem value="bus">Bus/Van</SelectItem>
              <SelectItem value="truck">Truck</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3 text-slate-900">Daily Rates by Hire Period</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">1-14 Days ($)</Label>
            <Input
              type="number"
              step="0.01"
              name="pricing_tiers.tier_1_14_days"
              value={formData.pricing_tiers.tier_1_14_days}
              onChange={handleChange}
              placeholder="150"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">15-29 Days ($)</Label>
            <Input
              type="number"
              step="0.01"
              name="pricing_tiers.tier_15_29_days"
              value={formData.pricing_tiers.tier_15_29_days}
              onChange={handleChange}
              placeholder="140"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">30-178 Days ($)</Label>
            <Input
              type="number"
              step="0.01"
              name="pricing_tiers.tier_30_178_days"
              value={formData.pricing_tiers.tier_30_178_days}
              onChange={handleChange}
              placeholder="130"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">179-363 Days ($)</Label>
            <Input
              type="number"
              step="0.01"
              name="pricing_tiers.tier_179_363_days"
              value={formData.pricing_tiers.tier_179_363_days}
              onChange={handleChange}
              placeholder="120"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">364+ Days ($)</Label>
            <Input
              type="number"
              step="0.01"
              name="pricing_tiers.tier_364_plus_days"
              value={formData.pricing_tiers.tier_364_plus_days}
              onChange={handleChange}
              placeholder="110"
            />
          </div>
        </div>
      </div>

      {/* Vehicle Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Drive Type</Label>
          <Select
            value={formData.specifications.drive_type}
            onValueChange={(value) => handleSelectChange('specifications.drive_type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2WD">2WD</SelectItem>
              <SelectItem value="4WD">4WD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Cab Type</Label>
          <Select
            value={formData.specifications.cab_type}
            onValueChange={(value) => handleSelectChange('specifications.cab_type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Single Cab">Single Cab</SelectItem>
              <SelectItem value="Dual Cab">Dual Cab</SelectItem>
              <SelectItem value="Crew Cab">Crew Cab</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Body Type</Label>
          <Input
            name="specifications.body_type"
            value={formData.specifications.body_type}
            onChange={handleChange}
            placeholder="e.g., Well Body, Tray Back"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Seating Capacity</Label>
          <Input
            type="number"
            name="specifications.seating_capacity"
            value={formData.specifications.seating_capacity}
            onChange={handleChange}
            placeholder="2"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Payload Capacity</Label>
          <Input
            name="specifications.payload_capacity"
            value={formData.specifications.payload_capacity}
            onChange={handleChange}
            placeholder="e.g., 1.2T, 3T"
          />
        </div>
      </div>
      
      {/* Checkboxes and Notes */}
      <div className="mt-4 space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="mine-spec"
            name="specifications.mine_spec"
            checked={formData.specifications.mine_spec}
            onCheckedChange={(checked) => handleSelectChange('specifications.mine_spec', checked)}
          />
          <Label htmlFor="mine-spec">Mine Specification</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="active"
            name="active"
            checked={formData.active}
            onCheckedChange={(checked) => handleSelectChange('active', checked)}
          />
          <Label htmlFor="active">Available for Hire</Label>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional notes about this vehicle type..."
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="text-white" style={{background: 'var(--wwfh-red)'}}>
          <Save className="w-4 h-4 mr-2" />
          Save Vehicle Type
        </Button>
      </DialogFooter>
    </form>
  );
};


export default function VehicleTypesTab() {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [editingVehicleType, setEditingVehicleType] = useState(null); // Renamed from editingType for clarity
  const [isFormOpen, setIsFormOpen] = useState(false); // New state for dialog
  const [showMassUpdate, setShowMassUpdate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); 
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);

  useEffect(() => {
    loadVehicleTypes();
  }, []);

  const loadVehicleTypes = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await djangoClient.get('/vehicles/types/', {
            params: { ordering: '-created_date' }
        });
        setVehicleTypes(response.results || []);
        console.log("Loaded vehicle types:", response || []);
    } catch (err) {
        console.error("Error loading vehicle types:", err);
        setError("A network error occurred. Please check your connection and try again.");
    }
    setIsLoading(false);
  };

  const handleSave = async (data) => {
    try {
        // Sync daily_rate with tier_1_14_days for backward compatibility
        const dataToSave = {
            ...data,
            daily_rate: data.pricing_tiers.tier_1_14_days || 0
        };
        
        if (dataToSave.id) {
            // Update existing vehicle type
            await djangoClient.put(`/vehicles/types/${dataToSave.id}/`, dataToSave);
        } else {
            // Create new vehicle type
            await djangoClient.post('/vehicles/types/', dataToSave);
        }
        setIsFormOpen(false);
        setEditingVehicleType(null);
        loadVehicleTypes();
    } catch (error) {
        console.error("Error saving vehicle type:", error);
        alert(`Error saving vehicle type: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle type?')) {
        try {
            await djangoClient.delete(`/vehicles/types/${id}/`);
            loadVehicleTypes();
        } catch (error) {
            console.error("Error deleting vehicle type:", error);
            alert(`Error deleting vehicle type: ${error.response?.data?.detail || error.message}`);
        }
    }
  };

  const handleEdit = (type) => {
    setEditingVehicleType(type);
    setIsFormOpen(true);
  };

  const handleMassUpdateComplete = () => {
    setShowMassUpdate(false);
    loadVehicleTypes(); // Reload vehicle types after mass update
  };

  const cleanDuplicates = async () => {
    if (!window.confirm('This will remove duplicate vehicle types based on name. Continue?')) {
        return;
    }

    setIsCleaningDuplicates(true);
    try {
        const duplicateMap = new Map();
        const duplicatesToDelete = [];

        // Group by name and find duplicates
        vehicleTypes.forEach(type => {
            const key = type.name.toLowerCase().trim();
            if (duplicateMap.has(key)) {
                const existing = duplicateMap.get(key);
                const current = type;
                
                const keepCurrent = 
                    (new Date(current.created_date) > new Date(existing.created_date)) ||
                    (current.pricing_tiers && !existing.pricing_tiers);
                
                if (keepCurrent) {
                    duplicatesToDelete.push(existing.id);
                    duplicateMap.set(key, current);
                } else {
                    duplicatesToDelete.push(current.id);
                }
            } else {
                duplicateMap.set(key, type);
            }
        });

        // Delete duplicates
        if (duplicatesToDelete.length > 0) {
            await Promise.all(
                duplicatesToDelete.map(id => djangoClient.delete(`/vehicles/types/${id}/`))
            );
            alert(`Removed ${duplicatesToDelete.length} duplicate vehicle types.`);
            loadVehicleTypes();
        } else {
            alert('No duplicates found.');
        }
    } catch (error) {
        console.error("Error cleaning duplicates:", error);
        alert('Error cleaning duplicates. Please try again.');
    } finally {
        setIsCleaningDuplicates(false);
    }
  };

  // Helper function to determine the daily rate based on a given number of days
  const getDailyRateForPeriod = (type, days) => {
    // Early return if type is undefined/null
    if (!type) return 0;

    // If no pricing_tiers, return daily_rate or 0
    if (!type.pricing_tiers) {
        return Number(type.daily_rate) || 0;
    }
    
    let rate = 0;
    
    if (days >= 364) {
        rate = type.pricing_tiers.tier_364_plus_days;
    } else if (days >= 179) {
        rate = type.pricing_tiers.tier_179_363_days;
    } else if (days >= 30) {
        rate = type.pricing_tiers.tier_30_178_days;
    } else if (days >= 15) {
        rate = type.pricing_tiers.tier_15_29_days;
    } else {
        rate = type.pricing_tiers.tier_1_14_days;
    }

    // Ensure we return a number
    return Number(rate || type.daily_rate || 0);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2" style={{color: 'var(--wwfh-navy)'}}>
              <Car className="w-5 h-5" /> {/* Changed icon to Car */}
              Vehicle Types Management
            </CardTitle>
            <div className="flex gap-2 w-full sm:w-auto flex-wrap">
              <Button 
                onClick={cleanDuplicates}
                disabled={isCleaningDuplicates}
                variant="outline"
                className="flex-1 sm:flex-none border-red-200 text-red-700 hover:bg-red-50"
              >
                <Trash className="w-4 h-4 mr-2" />
                {isCleaningDuplicates ? 'Cleaning...' : 'Clean Duplicates'}
              </Button>
              <Button 
                onClick={() => setShowMassUpdate(true)}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Mass Rate Update
              </Button>
              <Button 
                onClick={() => { setEditingVehicleType(null); setIsFormOpen(true); }} // Open dialog
                className="text-white flex-1 sm:flex-none"
                style={{background: 'var(--wwfh-red)'}}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Vehicle Type
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Vehicle Types List */}
          <div className="space-y-4">
            {error && (
              <div className="text-center py-8 text-red-600 bg-red-50 p-4 rounded-lg">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                <p className="font-semibold text-lg">Failed to Load Data</p>
                <p className="mb-4">{error}</p>
                <Button onClick={loadVehicleTypes} variant="outline" className="border-red-300 text-red-600 hover:bg-red-100">
                  Try Again
                </Button>
              </div>
            )}
            
            {isLoading && !error && (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="h-5 bg-slate-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))
            )}

            {!isLoading && !error && vehicleTypes.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Car className="w-12 h-12 mx-auto mb-4 opacity-50" /> {/* Changed icon to Car */}
                <p>No vehicle types configured yet. Add your first vehicle type above.</p>
              </div>
            )}

            {!isLoading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> {/* Added grid layout */}
                {vehicleTypes.map((type, index) => (
                  <motion.div
                    key={type.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }} // Staggered animation
                  >
                    <Card className="hover:shadow-lg transition-shadow"> {/* Changed from div to Card */}
                      <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                          <span className="flex-1 font-bold text-lg text-slate-900">{type.name}</span>
                          <Badge variant={type.active ? "default" : "secondary"} className={type.active ? 'bg-green-100 text-green-800' : ''}>
                            {type.active ? "Active" : "Inactive"}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                          Base Rate: <span className="font-bold" style={{color: 'var(--wwfh-navy)'}}>${getDailyRateForPeriod(type, 1).toFixed(2)}/day</span>
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                          <div>
                            <span className="font-medium text-slate-900">Category:</span> {type.category}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">Diagram:</span> {type.diagram_type || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">Drive:</span> {type.specifications?.drive_type || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">Seats:</span> {type.specifications?.seating_capacity || 'N/A'}
                          </div>
                          {type.specifications?.mine_spec && (
                            <div className="col-span-2">
                              <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                                Mine Spec
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Pricing Tiers Display */}
                        {type.pricing_tiers && (
                          <div className="mb-3">
                            <div className="text-xs text-slate-500 mb-1">Hire Period Rates:</div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                              <div className="bg-slate-100 p-2 rounded">
                                <div className="font-medium">1-14 days</div>
                                <div className="text-slate-700">${Number(type.pricing_tiers.tier_1_14_days || 0).toFixed(2)}</div>
                              </div>
                              <div className="bg-slate-100 p-2 rounded">
                                <div className="font-medium">15-29 days</div>
                                <div className="text-slate-700">${Number(type.pricing_tiers.tier_15_29_days || 0).toFixed(2)}</div>
                              </div>
                              <div className="bg-slate-100 p-2 rounded">
                                <div className="font-medium">30-178 days</div>
                                <div className="text-slate-700">${Number(type.pricing_tiers.tier_30_178_days || 0).toFixed(2)}</div>
                              </div>
                              <div className="bg-slate-100 p-2 rounded">
                                <div className="font-medium">179-363 days</div>
                                <div className="text-slate-700">${Number(type.pricing_tiers.tier_179_363_days || 0).toFixed(2)}</div>
                              </div>
                              <div className="bg-slate-100 p-2 rounded">
                                <div className="font-medium">364+ days</div>
                                <div className="text-slate-700">${Number(type.pricing_tiers.tier_364_plus_days || 0).toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {type.notes && (
                          <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded mt-3">
                            {type.notes}
                          </p>
                        )}
                        
                        <div className="flex gap-2 pt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(type)}
                          >
                            <Edit className="w-3 h-3 mr-1" /> Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(type.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mass Rate Update Modal */}
      {showMassUpdate && (
        <MassRateUpdateModal
          vehicleTypes={vehicleTypes}
          onClose={() => setShowMassUpdate(false)}
          onComplete={handleMassUpdateComplete}
        />
      )}

      {/* Add/Edit Vehicle Type Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{editingVehicleType ? 'Edit' : 'Add'} Vehicle Type</DialogTitle>
          </DialogHeader>
          <VehicleTypeForm 
            vehicleType={editingVehicleType}
            onSave={handleSave}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
