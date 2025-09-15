
import React, { useState, useEffect } from 'react';
import { Location } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  DollarSign,
  Building,
  Trash // Add Trash icon for clean duplicates
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LocationsTab() {
  const [locations, setLocations] = useState([]);
  const [editingLocation, setEditingLocation] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false); // New state for cleaning duplicates
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    transport_fee: 0,
    is_main_office: false,
    active: true,
    notes: ''
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setIsLoading(true);
    try {
      const locationData = await Location.list('name');
      setLocations(locationData);
    } catch (error) {
      console.error("Error loading locations:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    try {
      if (editingLocation) {
        await Location.update(editingLocation.id, formData);
      } else {
        await Location.create(formData);
      }
      resetForm();
      loadLocations();
    } catch (error) {
      console.error("Error saving location:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await Location.delete(id);
        loadLocations();
      } catch (error) {
        console.error("Error deleting location:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', address: '', transport_fee: 0, is_main_office: false, active: true, notes: ''
    });
    setEditingLocation(null);
    setShowAddForm(false);
  };

  const startEdit = (location) => {
    setFormData(location);
    setEditingLocation(location);
    setShowAddForm(true);
  };

  const cleanDuplicates = async () => {
    if (!window.confirm('This will remove duplicate locations based on name. Continue?')) {
      return;
    }

    setIsCleaningDuplicates(true);
    try {
      const duplicateMap = new Map(); // Stores the "keeper" for each unique name
      const duplicatesToDelete = [];

      // Group by name and find duplicates
      locations.forEach(location => {
        const key = location.name.toLowerCase().trim();
        if (duplicateMap.has(key)) {
          // Keep the one that is active or has more recent created_date
          const existing = duplicateMap.get(key);
          const current = location;
          
          const keepCurrent = (current.active && !existing.active) || // Current is active, existing is not
                              (current.active === existing.active && // Both are active or both are inactive
                               new Date(current.created_date) > new Date(existing.created_date)); // Keep newer if active states are same
          
          if (keepCurrent) {
            duplicatesToDelete.push(existing.id); // The existing one becomes a duplicate
            duplicateMap.set(key, current); // Update the map with the current (better) location
          } else {
            duplicatesToDelete.push(current.id); // The current one is a duplicate
          }
        } else {
          duplicateMap.set(key, location); // First time seeing this name, add to map
        }
      });

      // Delete identified duplicates
      for (const id of duplicatesToDelete) {
        await Location.delete(id);
      }

      if (duplicatesToDelete.length > 0) {
        alert(`Removed ${duplicatesToDelete.length} duplicate locations.`);
        loadLocations(); // Reload locations after deletion
      } else {
        alert('No duplicates found.');
      }
    } catch (error) {
      console.error("Error cleaning duplicates:", error);
      alert('Error cleaning duplicates. Please try again.');
    }
    setIsCleaningDuplicates(false);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2" style={{color: 'var(--wwfh-navy)'}}>
              <MapPin className="w-5 h-5" />
              Pickup/Dropoff Locations
            </CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
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
                onClick={() => setShowAddForm(true)}
                className="text-white flex-1 sm:flex-none"
                style={{background: 'var(--wwfh-red)'}}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-6 border rounded-lg bg-slate-50"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {editingLocation ? 'Edit Location' : 'Add New Location'}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Location Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Port Hedland"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Transport Fee ($)</Label>
                    <Input
                      type="number"
                      value={formData.transport_fee}
                      onChange={(e) => setFormData({...formData, transport_fee: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label>Full Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="e.g., 36 Guthrie Street Osborne Park"
                    />
                  </div>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="main-office"
                      checked={formData.is_main_office}
                      onCheckedChange={(checked) => setFormData({...formData, is_main_office: checked})}
                    />
                    <Label htmlFor="main-office">Main Office Location</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                    />
                    <Label htmlFor="active">Active Location</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Additional notes about this location..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="text-white" style={{background: 'var(--wwfh-red)'}}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Location
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Locations List */}
          <div className="space-y-4">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="h-5 bg-slate-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))
            ) : locations.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No locations configured yet. Add your first location above.</p>
              </div>
            ) : (
              locations.map((location) => (
                <motion.div
                  key={location.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-slate-600" />
                        <h3 className="font-bold text-lg text-slate-900">{location.name}</h3>
                        {location.is_main_office && (
                          <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                            <Building className="w-3 h-3 mr-1" />
                            Main Office
                          </Badge>
                        )}
                        <Badge variant={location.active ? "default" : "secondary"}>
                          {location.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 mb-3">
                        {location.address && (
                          <div>
                            <span className="font-medium text-slate-900">Address:</span> {location.address}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          <span className="font-medium text-slate-900">Transport Fee:</span>
                          <span className="font-bold" style={{color: 'var(--wwfh-navy)'}}>
                            {location.transport_fee > 0 ? `$${location.transport_fee}` : 'Free'}
                          </span>
                        </div>
                      </div>
                      
                      {location.notes && (
                        <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                          {location.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => startEdit(location)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(location.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
