import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import djangoClient from "@/api/djangoClient";

export default function AddCarDialog({ open, onOpenChange, onSave }) {
  const [carData, setCarData] = useState({
    fleet_id: "",
    license_plate: "",
    year: new Date().getFullYear(),
    color: "",
    mileage: 0,
    status: "available",
    vehicle_type: "", // This will store the ID as string
    fuel_level: 100,
  });
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (open) {
      fetchVehicleTypes();
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setCarData({
      fleet_id: "", 
      license_plate: "", 
      year: new Date().getFullYear(),
      color: "", 
      mileage: 0, 
      status: "available", 
      vehicle_type: "",
      fuel_level: 100
    });
    setFormErrors({});
  };

  const fetchVehicleTypes = async () => {
    setIsLoadingTypes(true);
    try {
      const response = await djangoClient.get('/vehicles/types/');
      console.log("Vehicle types response:", response); // Debug log
      
      // Handle different possible response structures
      let types = [];
      if (response.data) {
        types = response.data.results || response.data;
      } else if (response.results) {
        types = response.results;
      } else {
        types = response;
      }
      
      console.log("Processed vehicle types:", types); // Debug log
      
      // Ensure we have an array and filter active types
      const activeTypes = Array.isArray(types) ? types.filter(type => type.active !== false) : [];
      
      setVehicleTypes(activeTypes);
      
      if (activeTypes.length === 0) {
        console.warn("No active vehicle types found");
      }
    } catch (error) {
      console.error("Error fetching vehicle types:", error);
      setFormErrors({ vehicle_type: "Failed to load vehicle types. Please try again." });
    } finally {
      setIsLoadingTypes(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCarData((prev) => ({ ...prev, [name]: value }));
    
    // Clear specific field errors when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleSelectChange = (name, value) => {
    console.log(`Setting ${name} to:`, value, typeof value); // Debug log
    setCarData((prev) => ({ ...prev, [name]: value }));
    
    // Clear specific field errors
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!carData.fleet_id.trim()) {
      errors.fleet_id = "Fleet ID is required";
    }
    
    if (!carData.license_plate.trim()) {
      errors.license_plate = "License plate is required";
    }
    
    if (!carData.vehicle_type) {
      errors.vehicle_type = "Please select a vehicle type";
    }
    
    if (carData.year < 1900 || carData.year > new Date().getFullYear() + 1) {
      errors.year = "Please enter a valid year";
    }
    
    if (carData.mileage < 0) {
      errors.mileage = "Mileage cannot be negative";
    }
    
    if (carData.fuel_level < 0 || carData.fuel_level > 100) {
      errors.fuel_level = "Fuel level must be between 0 and 100";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Find the selected vehicle type to validate it exists
      const selectedVehicleType = vehicleTypes.find(
        type => type.id.toString() === carData.vehicle_type.toString()
      );
      
      if (!selectedVehicleType) {
        setFormErrors({ vehicle_type: "Selected vehicle type is invalid. Please refresh and try again." });
        setIsSaving(false);
        return;
      }
      
      // Prepare data for submission - only include fields that the backend expects
      const dataToSend = {
        fleet_id: carData.fleet_id.trim(),
        license_plate: carData.license_plate.trim(),
        year: parseInt(carData.year),
        color: carData.color.trim(),
        mileage: parseInt(carData.mileage) || 0,
        status: carData.status,
        vehicle_type: carData.vehicle_type, // Keep as UUID string, don't convert to integer
        fuel_level: parseInt(carData.fuel_level) || 100,
        category: selectedVehicleType.category, // Include category as backend expects it
        active: true // Ensure new vehicles are active by default
      };
      
      console.log('Sending data:', dataToSend); // Debug log
      console.log('Selected vehicle type:', selectedVehicleType); // Debug log
      
      await onSave(dataToSend);
      resetForm();
      
    } catch (error) {
      console.error("Error saving car:", error);
      
      // Handle different error response structures
      let errorData = null;
      if (error.response?.data) {
        errorData = error.response.data;
      } else if (error.data) {
        errorData = error.data;
      }
      
      if (errorData) {
        // Map backend validation errors to form fields
        const fieldErrors = {};
        Object.entries(errorData).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            fieldErrors[field] = messages.join(', ');
          } else if (typeof messages === 'string') {
            fieldErrors[field] = messages;
          } else {
            fieldErrors[field] = 'Invalid value';
          }
        });
        
        setFormErrors(fieldErrors);
        
        // Show a general error message
        const errorMessage = Object.entries(fieldErrors)
          .map(([field, message]) => `${field}: ${message}`)
          .join('\n');
        
        alert(`Failed to save vehicle:\n${errorMessage}`);
      } else {
        alert("Failed to save vehicle. Please check your connection and try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
          <DialogDescription>
            Fill in the details for the new vehicle. It will be added to the fleet and available for management.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="vehicle_type">Vehicle Type *</Label>
            <Select
              value={carData.vehicle_type}
              onValueChange={(value) => handleSelectChange('vehicle_type', value)}
              disabled={isLoadingTypes}
              required
            >
              <SelectTrigger className={formErrors.vehicle_type ? "border-red-500" : ""}>
                <SelectValue placeholder={isLoadingTypes ? "Loading..." : "Select a vehicle type..."} />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.length > 0 ? (
                  vehicleTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name} {type.category && `(${type.category})`}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-sm text-slate-500">
                    {isLoadingTypes ? "Loading vehicle types..." : "No active vehicle types found. Please add one in Admin first."}
                  </div>
                )}
              </SelectContent>
            </Select>
            {formErrors.vehicle_type && (
              <p className="text-sm text-red-600 mt-1">{formErrors.vehicle_type}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fleet_id">Fleet ID *</Label>
              <Input 
                id="fleet_id" 
                name="fleet_id" 
                value={carData.fleet_id} 
                onChange={handleChange} 
                className={formErrors.fleet_id ? "border-red-500" : ""}
                required 
              />
              {formErrors.fleet_id && (
                <p className="text-sm text-red-600 mt-1">{formErrors.fleet_id}</p>
              )}
            </div>
            <div>
              <Label htmlFor="license_plate">License Plate *</Label>
              <Input 
                id="license_plate" 
                name="license_plate" 
                value={carData.license_plate} 
                onChange={handleChange} 
                className={formErrors.license_plate ? "border-red-500" : ""}
                required 
              />
              {formErrors.license_plate && (
                <p className="text-sm text-red-600 mt-1">{formErrors.license_plate}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Year</Label>
              <Input 
                id="year" 
                name="year" 
                type="number" 
                min="1900" 
                max={new Date().getFullYear() + 1}
                value={carData.year} 
                onChange={handleChange}
                className={formErrors.year ? "border-red-500" : ""}
              />
              {formErrors.year && (
                <p className="text-sm text-red-600 mt-1">{formErrors.year}</p>
              )}
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input 
                id="color" 
                name="color" 
                value={carData.color} 
                onChange={handleChange}
                className={formErrors.color ? "border-red-500" : ""}
              />
              {formErrors.color && (
                <p className="text-sm text-red-600 mt-1">{formErrors.color}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mileage">Mileage</Label>
              <Input 
                id="mileage" 
                name="mileage" 
                type="number" 
                min="0"
                value={carData.mileage} 
                onChange={handleChange}
                className={formErrors.mileage ? "border-red-500" : ""}
              />
              {formErrors.mileage && (
                <p className="text-sm text-red-600 mt-1">{formErrors.mileage}</p>
              )}
            </div>
            <div>
              <Label htmlFor="fuel_level">Fuel Level (%)</Label>
              <Input 
                id="fuel_level" 
                name="fuel_level" 
                type="number" 
                min="0" 
                max="100" 
                value={carData.fuel_level} 
                onChange={handleChange}
                className={formErrors.fuel_level ? "border-red-500" : ""}
              />
              {formErrors.fuel_level && (
                <p className="text-sm text-red-600 mt-1">{formErrors.fuel_level}</p>
              )}
            </div>
          </div>
        </form>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || isLoadingTypes} onClick={handleSubmit}>
            {isSaving ? 'Saving...' : 'Save Vehicle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}