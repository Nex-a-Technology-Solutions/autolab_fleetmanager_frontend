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
    vehicle_type: "", // This will store the ID
    fuel_level: 100,
  });
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchVehicleTypes = async () => {
        try {
          const response = await djangoClient.get('/vehicles/types/');
          setVehicleTypes(response.results || []);
        } catch (error) {
          console.error("Error fetching vehicle types:", error);
        }
      };
      fetchVehicleTypes();
      // Reset form when dialog opens
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
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCarData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name, value) => {
    setCarData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!carData.vehicle_type) {
      alert("Please select a vehicle type.");
      return;
    }
    setIsSaving(true);
    try {
      // Find the selected vehicle type to get its category
      const selectedVehicleType = vehicleTypes.find(
        type => type.id.toString() === carData.vehicle_type.toString()
      );
      
      if (!selectedVehicleType) {
        alert("Selected vehicle type not found. Please try again.");
        setIsSaving(false);
        return;
      }
      
      // Prepare data for submission
      const dataToSend = {
        ...carData,
        vehicle_type: parseInt(carData.vehicle_type),
        category: selectedVehicleType.category, // Use the category from the vehicle type
        // Note: organization is handled by the backend based on authenticated user
      };
      
      console.log('Sending data:', dataToSend); // Debug log
      
      await onSave(dataToSend);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving car:", error);
      
      // More detailed error handling
      if (error.data) {
        const errorMessages = Object.entries(error.data)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
        alert(`Failed to save vehicle:\n${errorMessages}`);
      } else if (error.response && error.response.data) {
        const errorMessages = Object.entries(error.response.data)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
        alert(`Failed to save vehicle:\n${errorMessages}`);
      } else {
        alert("Failed to save vehicle. Please check the details and try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
          <DialogDescription>
            Fill in the details for the new vehicle. It will be added to the fleet and available for management.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="vehicle_type">Vehicle Type *</Label>
            <Select
              value={carData.vehicle_type}
              onValueChange={(value) => handleSelectChange('vehicle_type', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a vehicle type..." />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.length > 0 ? (
                  vehicleTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name} {type.category && `(${type.category})`}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-sm text-slate-500">No active vehicle types found. Please add one in Admin first.</div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fleet_id">Fleet ID *</Label>
              <Input id="fleet_id" name="fleet_id" value={carData.fleet_id} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="license_plate">License Plate *</Label>
              <Input id="license_plate" name="license_plate" value={carData.license_plate} onChange={handleChange} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Year</Label>
              <Input id="year" name="year" type="number" value={carData.year} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input id="color" name="color" value={carData.color} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mileage">Mileage</Label>
              <Input id="mileage" name="mileage" type="number" value={carData.mileage} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="fuel_level">Fuel Level (%)</Label>
              <Input id="fuel_level" name="fuel_level" type="number" min="0" max="100" value={carData.fuel_level} onChange={handleChange} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={isSaving} onClick={handleSubmit}>
            {isSaving ? 'Saving...' : 'Save Vehicle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}