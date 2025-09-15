
import React, { useState, useEffect } from 'react';
import { Car, ServiceRecord } from '@/api/entities';
import { UploadFile, ExtractDataFromUploadedFile } from '@/api/integrations';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge"; // Added Badge import
import {
  Settings,
  Car as CarIcon,
  Plus,
  Search,
  Download,
  Upload,
  BarChart3,
  Trash,
  AlertTriangle,
  Wrench,
  Globe,
  FileSpreadsheet,
  CheckCircle,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FleetManagementTab() {
  const [cars, setCars] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);

  // New states for the outlined buttons
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false); // For handleExportFleet

  useEffect(() => {
    loadCars();
  }, []);

  const loadCars = async () => {
    setIsLoading(true);
    try {
      const carsData = await Car.list('-created_date');
      setCars(carsData);
    } catch (error) {
      console.error("Error loading cars:", error);
    }
    setIsLoading(false);
  };

  const cleanDuplicates = async () => {
    if (!window.confirm('This will remove duplicate vehicles based on Fleet ID. Continue?')) {
      return;
    }

    setIsCleaningDuplicates(true);
    try {
      const duplicateMap = new Map();
      const duplicatesToDelete = [];

      // Group by fleet_id and find duplicates
      cars.forEach(car => {
        const key = car.fleet_id?.toLowerCase().trim();
        if (key && duplicateMap.has(key)) {
          // Keep the one with most recent created_date or better status
          const existing = duplicateMap.get(key);
          const current = car;
          
          // Logic: keep current if it's newer, OR if it's available and existing isn't (more likely to be the "active" one)
          const keepCurrent = new Date(current.created_date) > new Date(existing.created_date) ||
                              (current.status === 'available' && existing.status !== 'available' && new Date(current.created_date) >= new Date(existing.created_date));
          
          if (keepCurrent) {
            duplicatesToDelete.push(existing.id); // Mark the existing one for deletion
            duplicateMap.set(key, current); // Replace with the current (newer/better status) one
          } else {
            duplicatesToDelete.push(current.id); // Mark the current one for deletion
          }
        } else if (key) {
          duplicateMap.set(key, car); // First time seeing this fleet_id, add it to map
        }
      });

      // Delete duplicates
      for (const id of duplicatesToDelete) {
        await Car.delete(id);
      }

      if (duplicatesToDelete.length > 0) {
        alert(`Removed ${duplicatesToDelete.length} duplicate vehicles.`);
        loadCars(); // Reload data to reflect changes
      } else {
        alert('No duplicates found.');
      }
    } catch (error) {
      console.error("Error cleaning duplicates:", error);
      alert('Error cleaning duplicates. Please try again.');
    }
    setIsCleaningDuplicates(false);
  };

  const handleExportFleet = async () => {
    setIsExporting(true);
    try {
      const cars = await Car.list();
      
      const csvHeaders = [
        'Fleet ID', 'License Plate', 'Make', 'Model', 'Year', 'Color', 
        'Status', 'Category', 'Mileage', 'Fuel Level', 'Last Service Date', 'Notes'
      ];
      
      const csvData = cars.map(car => [
        car.fleet_id || '',
        car.license_plate || '',
        car.make || '',
        car.model || '',
        car.year || '',
        car.color || '',
        car.status || '',
        car.category || '',
        car.mileage || '',
        car.fuel_level || '',
        car.last_service_date || '',
        car.notes || ''
      ]);

      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')) // Escaping double quotes
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fleet-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Error exporting fleet data:", error);
      alert("Failed to export fleet data. Please try again.");
    }
    setIsExporting(false);
  };

  const filteredCars = cars.filter(car =>
    car.fleet_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    car.license_plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    car.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    car.model?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const carsWithIssues = cars.filter(car => !car.fleet_id);

  const statusColors = {
    available: "bg-emerald-100 text-emerald-800",
    checked_out: "bg-amber-100 text-amber-800",
    in_inspection: "bg-blue-100 text-blue-800",
    in_cleaning: "bg-purple-100 text-purple-800",
    in_driving_check: "bg-indigo-100 text-indigo-800",
    maintenance_required: "bg-red-100 text-red-800"
  };

  const getStatusDisplay = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const fleetStats = {
    total: cars.length,
    available: cars.filter(c => c.status === 'available').length,
    checked_out: cars.filter(c => c.status === 'checked_out').length,
    maintenance: cars.filter(c => c.status === 'maintenance_required').length,
  };

  return (
    <div className="space-y-6">
      {/* Fleet Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Fleet</p>
              <p className="text-2xl font-bold" style={{color: 'var(--wwfh-navy)'}}>{fleetStats.total}</p>
            </div>
            <CarIcon className="w-8 h-8 text-slate-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Available</p>
              <p className="text-2xl font-bold text-emerald-600">{fleetStats.available}</p>
            </div>
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CarIcon className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">On Hire</p>
              <p className="text-2xl font-bold text-amber-600">{fleetStats.checked_out}</p>
            </div>
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <CarIcon className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Maintenance</p>
              <p className="text-2xl font-bold text-red-600">{fleetStats.maintenance}</p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <CarIcon className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Data Integrity Issues */}
      {carsWithIssues.length > 0 && (
        <Card className="shadow-lg border-2 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Data Integrity Issues Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 mb-4">
              The following {carsWithIssues.length} vehicle(s) are missing a <strong>Fleet ID</strong>. This will prevent them from being processed in the Check-in workflow. Please edit these vehicles to add the required information.
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {carsWithIssues.map(car => (
                <div key={car.id} className="p-3 border border-red-200 rounded-lg bg-white">
                  <p className="font-semibold">{car.make} {car.model} ({car.year})</p>
                  <p className="text-xs text-slate-500">License Plate: {car.license_plate || 'N/A'}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* NEW CARD: Fleet Administration Tools */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle style={{color: 'var(--wwfh-navy)'}}>Fleet Administration Tools</CardTitle>
          <CardDescription>Advanced fleet management and system utilities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              onClick={() => setShowBulkStatusModal(true)}
              className="h-20 flex flex-col items-center justify-center gap-2"
              variant="outline"
            >
              <Settings className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium">Bulk Status Update</span>
            </Button>
            
            <Button 
              onClick={() => setShowMaintenanceModal(true)}
              className="h-20 flex flex-col items-center justify-center gap-2"
              variant="outline"
            >
              <Wrench className="w-6 h-6 text-orange-600" />
              <span className="text-sm font-medium">Schedule Maintenance</span>
            </Button>

            <Button 
              onClick={() => window.open(createPageUrl('EmbedGuide'), '_blank')}
              className="h-20 flex flex-col items-center justify-center gap-2"
              variant="outline"
            >
              <Globe className="w-6 h-6 text-purple-600" />
              <span className="text-sm font-medium">Embed Quote Builder</span>
            </Button>

            <Button 
              onClick={handleExportFleet}
              disabled={isExporting}
              className="h-20 flex flex-col items-center justify-center gap-2"
              variant="outline"
            >
              {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6 text-emerald-600" />}
              <span className="text-sm font-medium">Export Fleet Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ORIGINAL CARD: Fleet Administration (now primarily for search and list, with consolidated buttons) */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2" style={{color: 'var(--wwfh-navy)'}}>
              <Settings className="w-5 h-5" />
              Fleet Administration
            </CardTitle>
            <div className="flex gap-3">
              <Button 
                onClick={cleanDuplicates}
                disabled={isCleaningDuplicates}
                variant="outline" 
                size="sm"
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <Trash className="w-4 h-4 mr-2" />
                {isCleaningDuplicates ? 'Cleaning...' : 'Clean Duplicates'}
              </Button>
              {/* Export Data button was moved to the new "Fleet Administration Tools" card */}
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import Fleet
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search fleet by ID, license plate, make, or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Fleet List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="h-5 bg-slate-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))
            ) : filteredCars.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No vehicles found matching your search.</p>
              </div>
            ) : (
              filteredCars.map((car, index) => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-slate-900">
                          {car.make} {car.model} ({car.year})
                        </h3>
                        <span className="font-mono text-sm font-bold px-2 py-1 bg-slate-100 rounded">
                          Fleet {car.fleet_id}
                        </span>
                        <Badge className={`${statusColors[car.status]} border-0`}>
                          {getStatusDisplay(car.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                        <div>
                          <span className="font-medium text-slate-900">License:</span> {car.license_plate || 'Not set'}
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">Color:</span> {car.color || 'Not set'}
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">Mileage:</span> {car.mileage?.toLocaleString() || 'Not set'} km
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">Fuel:</span> {car.fuel_level || 'Not set'}%
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Placeholder Modals (ensure component compiles and functions if these states are triggered) */}
      {showBulkStatusModal && (
        <Dialog open={showBulkStatusModal} onOpenChange={setShowBulkStatusModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Bulk Status Update</DialogTitle>
              <DialogDescription>
                This is a placeholder for the Bulk Status Update modal content.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Label htmlFor="status">New Status</Label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="checked_out">Checked Out</SelectItem>
                  <SelectItem value="in_inspection">In Inspection</SelectItem>
                  <SelectItem value="maintenance_required">Maintenance Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowBulkStatusModal(false)}>Close</Button>
          </DialogContent>
        </Dialog>
      )}
      {showMaintenanceModal && (
        <Dialog open={showMaintenanceModal} onOpenChange={setShowMaintenanceModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Schedule Maintenance</DialogTitle>
              <DialogDescription>
                This is a placeholder for the Schedule Maintenance modal content.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Label htmlFor="vehicleId">Vehicle Fleet ID</Label>
              <Input id="vehicleId" placeholder="Enter Fleet ID" />
              <Label htmlFor="description">Maintenance Description</Label>
              <Textarea id="description" placeholder="Describe the maintenance needed" />
            </div>
            <Button onClick={() => setShowMaintenanceModal(false)}>Close</Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
