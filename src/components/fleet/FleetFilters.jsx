import React, { useState, useEffect } from 'react';
import { VehicleType } from '@/api/entities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Filter, Eye, EyeOff } from "lucide-react";
import djangoClient from "@/api/djangoClient";

export default function FleetFilters({ filters, onFiltersChange }) {
  const [vehicleTypes, setVehicleTypes] = useState([]);

  useEffect(() => {
    const loadVehicleTypes = async () => {
      try {
        const response = await djangoClient.get('/vehicles/types/');
        setVehicleTypes(response.data || []);
      } catch (error) {
        console.error("Failed to load vehicle types:", error);
      }
    };
    loadVehicleTypes();
  }, []);

  const handleFilterChange = (type, value) => {
    onFiltersChange(prev => ({
      ...prev,
      [type]: value
    }));
  };

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange("status", value)}
        >
          <SelectTrigger className="w-40 bg-white/80 backdrop-blur-sm border-slate-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="checked_out">Checked Out</SelectItem>
            <SelectItem value="in_inspection">In Inspection</SelectItem>
            <SelectItem value="in_cleaning">In Cleaning</SelectItem>
            <SelectItem value="in_driving_check">Driving Check</SelectItem>
            <SelectItem value="maintenance_required">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={filters.category}
          onValueChange={(value) => handleFilterChange("category", value)}
        >
          <SelectTrigger className="w-48 bg-white/80 backdrop-blur-sm border-slate-200">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {vehicleTypes.map(type => (
              <SelectItem key={type.id} value={type.name}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-md px-3 py-2">
        {filters.showInactive ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
        <Label htmlFor="show-inactive" className="text-sm">
          {filters.showInactive ? 'Hide Inactive' : 'Show Inactive'}
        </Label>
        <Switch
          id="show-inactive"
          checked={filters.showInactive}
          onCheckedChange={(checked) => handleFilterChange("showInactive", checked)}
        />
      </div>
    </div>
  );
}