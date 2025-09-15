
import React, { useState, useEffect } from "react";
import { VehicleType } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"; // Added Switch import
import { Trash2 } from "lucide-react";

export default function EditCarDialog({ open, onOpenChange, car, onSave, onDelete }) {
  const [carData, setCarData] = useState(car);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // When the dialog opens with a new car, update the form state
    if (car) {
      // Ensure 'active' property defaults to true if not present in car object
      setCarData({ ...car, active: car.active === undefined ? true : car.active });
    }
  }, [car, open]);

  useEffect(() => {
    if (open) {
      const fetchVehicleTypes = async () => {
        try {
          const types = await VehicleType.filter({ active: true });
          setVehicleTypes(types);
        } catch (error) {
          console.error("Error fetching vehicle types:", error);
        }
      };
      fetchVehicleTypes();
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = ['year', 'mileage', 'fuel_level'].includes(name) ? parseInt(value) || 0 : value;
    setCarData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleSelectChange = (name, value) => {
    setCarData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(carData);
    } catch (error) {
      console.error("Error saving car:", error);
      alert("Failed to save vehicle. Please check the details and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => { // Renamed to avoid conflict with prop
    if (window.confirm(`Are you sure you want to permanently delete this vehicle? This action cannot be undone.`)) {
      onDelete(car.id);
    }
  };

  const handleToggleActive = () => {
    const newActiveStatus = carData.active === false ? true : false; // Toggle logic: if false, make true, else make false
    setCarData(prev => ({ ...prev, active: newActiveStatus }));
  };

  if (!car) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
          <DialogDescription>
            Update the details for Fleet ID: {car.fleet_id}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="category">Vehicle Type *</Label>
            <Select
              value={carData.category}
              onValueChange={(value) => handleSelectChange('category', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a vehicle type..." />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type.id} value={type.name}>
                    {type.name}
                  </SelectItem>
                ))}
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
           <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={carData.status}
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="checked_out">Checked Out</SelectItem>
                    <SelectItem value="in_inspection">In Inspection</SelectItem>
                    <SelectItem value="in_cleaning">In Cleaning</SelectItem>
                    <SelectItem value="in_driving_check">Driving Check</SelectItem>
                    <SelectItem value="maintenance_required">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={carData.active === true} // Ensure it's explicitly checked if true
              onCheckedChange={handleToggleActive}
            />
            <Label htmlFor="active">Vehicle is active</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteClick} // Used renamed function
              className="mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Vehicle
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
