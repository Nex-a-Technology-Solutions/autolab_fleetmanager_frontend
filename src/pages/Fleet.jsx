import React, { useState, useEffect, useMemo } from "react";
import djangoClient from "@/api/djangoClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Search,
  Car as CarIcon,
  AlertTriangle,
  RefreshCw,
  Grid3X3,
  List
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";

import AddCarDialog from "../components/fleet/AddCarDialog";
import EditCarDialog from "../components/fleet/EditCarDialog";
import CarCard from "../components/fleet/CarCard";
import FleetFilters from "../components/fleet/FleetFilters";
import BulkActionsBar from "../components/fleet/BulkActionsBar";
import FleetTableView from "../components/fleet/FleetTableView";
import { groupBy } from 'lodash';

export default function Fleet() {
  const [cars, setCars] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState({});
  const [filteredCars, setFilteredCars] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCars, setSelectedCars] = useState([]);
  const [viewMode, setViewMode] = useState("cards");
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    showInactive: false
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndGroupCars();
  }, [cars, searchQuery, filters]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [carsData, typesData] = await Promise.all([
        djangoClient.get('/vehicles/cars/', { params: { ordering: '-created_date' } }),
        djangoClient.get('/vehicles/types/')
      ]);
      
      console.log("Loaded cars:", carsData); 
      setCars(carsData.results || []);
      
      const typesMap = (typesData.data || []).reduce((acc, type) => {
        acc[type.name] = type;
        return acc;
      }, {});
      setVehicleTypes(typesMap);

    } catch (error) {
      console.error("Error loading data:", error);
      setError("A network error occurred. Please check your connection and try again.");
    }
    setIsLoading(false);
  };

  const filterAndGroupCars = () => {
    let tempFiltered = cars;

    if (!filters.showInactive) {
      tempFiltered = tempFiltered.filter(car => car.active !== false);
    }

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      tempFiltered = tempFiltered.filter(car =>
        car.fleet_id?.toLowerCase().includes(lowerCaseQuery) ||
        car.license_plate?.toLowerCase().includes(lowerCaseQuery) ||
        car.category?.toLowerCase().includes(lowerCaseQuery)
      );
    }

    if (filters.status !== "all") {
      tempFiltered = tempFiltered.filter(car => car.status === filters.status);
    }

    if (filters.category !== "all") {
      tempFiltered = tempFiltered.filter(car => car.category === filters.category);
    }

    setFilteredCars(tempFiltered);
  };
  
  const groupedCars = useMemo(() => {
      if (filteredCars.length === 0) return {};
      return groupBy(filteredCars, 'category');
  }, [filteredCars]);

  const handleAddCar = async (carData) => {
    try {
      await djangoClient.post('/vehicles/cars/', carData);
      setShowAddDialog(false);
      loadData();
    } catch (error) {
      console.error("Error adding car:", error);
    }
  };

  const handleEdit = (car) => {
    setEditingCar(car);
    setShowEditDialog(true);
  };

  const handleSelectCar = (car, isSelected) => {
    setSelectedCars(prev => {
      if (isSelected) {
        return [...prev, car];
      } else {
        return prev.filter(c => c.id !== car.id);
      }
    });
  };

  const handleSelectAll = (carsInCategory, isSelected) => {
    if (isSelected) {
      setSelectedCars(prev => {
        const newSelection = [...prev];
        carsInCategory.forEach(car => {
          if (!newSelection.find(c => c.id === car.id)) {
            newSelection.push(car);
          }
        });
        return newSelection;
      });
    } else {
      setSelectedCars(prev => prev.filter(selected => 
        !carsInCategory.find(car => car.id === selected.id)
      ));
    }
  };

  const handleUpdateCar = async (carData) => {
    if (!editingCar) return;
    try {
      await djangoClient.put(`/vehicles/cars/${editingCar.id}/`, carData);
      setShowEditDialog(false);
      setEditingCar(null);
      await loadData();
    } catch (error) {
      console.error("Error updating car:", error);
    }
  };

  const handleDeleteCar = async (carId) => {
    try {
      await djangoClient.delete(`/vehicles/cars/${carId}/`);
      setShowEditDialog(false);
      setEditingCar(null);
      await loadData();
    } catch (error) {
      console.error("Error deleting car:", error);
      alert("Failed to delete vehicle. Please try again.");
    }
  };

  const handleBulkUpdate = async (carsToUpdate, updates) => {
    try {
      await Promise.all(carsToUpdate.map(car => 
        djangoClient.put(`/vehicles/cars/${car.id}/`, { ...car, ...updates })
      ));
      setSelectedCars([]);
      loadData();
    } catch (error) {
      console.error("Error bulk updating cars:", error);
      alert("Failed to update vehicles. Please try again.");
    }
  };

  const handleBulkDelete = async (carsToDelete) => {
    try {
      await Promise.all(carsToDelete.map(car => 
        djangoClient.delete(`/vehicles/cars/${car.id}/`)
      ));
      setSelectedCars([]);
      loadData();
    } catch (error) {
      console.error("Error bulk deleting cars:", error);
      alert("Failed to delete vehicles. Please try again.");
    }
  };

  const handleBulkDeactivate = async (carsToDeactivate) => {
    try {
      await Promise.all(carsToDeactivate.map(car => 
        djangoClient.patch(`/vehicles/cars/${car.id}/`, { active: false })
      ));
      setSelectedCars([]);
      loadData();
    } catch (error) {
      console.error("Error deactivating cars:", error);
      alert("Failed to deactivate vehicles. Please try again.");
    }
  };

  const handleBulkActivate = async (carsToActivate) => {
    try {
      await Promise.all(carsToActivate.map(car => 
        djangoClient.patch(`/vehicles/cars/${car.id}/`, { active: true })
      ));
      setSelectedCars([]);
      loadData();
    } catch (error) {
      console.error("Error activating cars:", error);
      alert("Failed to activate vehicles. Please try again.");
    }
  };

  const statusColors = {
    available: "bg-emerald-100 text-emerald-800",
    checked_out: "bg-amber-100 text-amber-800",
    in_inspection: "bg-blue-100 text-blue-800",
    in_cleaning: "bg-purple-100 text-purple-800",
    in_driving_check: "bg-indigo-100 text-indigo-800",
    maintenance_required: "bg-red-100 text-red-800"
  };

  return (
    <div className="fixed inset-0 bg-gray-100" style={{ top: '73px', left: '256px' }}>
      <div className="w-full h-full bg-white overflow-auto">
        <div className="w-full space-y-6 md:space-y-8 p-3 sm:p-4 md:p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{color: 'var(--wwfh-navy)'}}>
                Fleet Management
              </h1>
              <p className="text-slate-600 text-base md:text-lg">
                Manage your entire vehicle fleet
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <Button
                onClick={() => setShowAddDialog(true)}
                className="text-white shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, var(--wwfh-red), var(--wwfh-red-light))',
                  borderRadius: '30px'
                }}
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Vehicle
              </Button>
              
              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "cards" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                >
                  <Grid3X3 className="w-4 h-4 mr-1" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  <List className="w-4 h-4 mr-1" />
                  Table
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Error Display */}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="bg-red-50 border-red-200 text-red-800">
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium">{error}</p>
                  </div>
                  <Button onClick={loadData} variant="destructive">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Search and Filters */}
          {!error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col gap-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by Fleet ID, license plate, or vehicle type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-slate-200"
                />
              </div>
              <FleetFilters filters={filters} onFiltersChange={setFilters} />
            </motion.div>
          )}

          {/* Bulk Actions Bar */}
          {selectedCars.length > 0 && (
            <BulkActionsBar
              selectedCars={selectedCars}
              onBulkUpdate={handleBulkUpdate}
              onBulkDelete={handleBulkDelete}
              onBulkDeactivate={handleBulkDeactivate}
              onBulkActivate={handleBulkActivate}
              onClearSelection={() => setSelectedCars([])}
              vehicleTypes={Object.values(vehicleTypes)}
            />
          )}

          {/* Fleet Summary */}
          {!error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-lg border-0 bg-white">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-slate-600 mb-1">Total Vehicles</p>
                      <p className="text-2xl md:text-3xl font-bold text-slate-900">{cars.length}</p>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-sm text-slate-600 mb-1">Showing Results</p>
                      <p className="text-lg md:text-xl font-semibold text-slate-900">{filteredCars.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Fleet Content - Conditional Rendering */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 md:p-6 shadow-lg animate-pulse">
                    <div className="h-4 bg-slate-200 rounded mb-4"></div>
                    <div className="h-8 bg-slate-200 rounded mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : !error && filteredCars.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 md:py-16"
              >
                <CarIcon className="w-12 h-12 md:w-16 md:h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-2">No vehicles found</h3>
                <p className="text-slate-600 mb-6 text-sm md:text-base px-4">
                  {searchQuery || filters.status !== "all" || filters.category !== "all" || filters.showInactive
                    ? "Try adjusting your search or filters"
                    : "Add your first vehicle to get started"}
                </p>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="text-white"
                  style={{
                    background: 'linear-gradient(135deg, var(--wwfh-red), var(--wwfh-red-light))',
                    borderRadius: '30px'
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicle
                </Button>
              </motion.div>
            ) : !error && viewMode === "table" ? (
              <FleetTableView
                cars={filteredCars}
                vehicleTypes={vehicleTypes}
                selectedCars={selectedCars}
                onSelectCar={handleSelectCar}
                onEdit={handleEdit}
                statusColors={statusColors}
              />
            ) : !error ? (
              <div className="space-y-8">
                {Object.entries(groupedCars).map(([category, carsInCategory]) => {
                  const selectedInCategory = selectedCars.filter(selected => 
                    carsInCategory.find(car => car.id === selected.id)
                  );
                  const allSelected = selectedInCategory.length === carsInCategory.length && carsInCategory.length > 0;
                  const someSelected = selectedInCategory.length > 0 && !allSelected;

                  return (
                    <motion.div key={category} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={(checked) => handleSelectAll(carsInCategory, checked)}
                            className="w-5 h-5"
                            ref={(el) => {
                              if (el) el.indeterminate = someSelected && !allSelected;
                            }}
                          />
                          <h2 className="text-xl font-bold text-slate-800">
                            {category} <Badge variant="secondary" className="ml-1">{carsInCategory.length}</Badge>
                          </h2>
                        </div>
                        {selectedInCategory.length > 0 && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            {selectedInCategory.length} selected
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                        {carsInCategory.map((car, index) => (
                          <CarCard
                            key={car.id}
                            car={car}
                            vehicleType={vehicleTypes[car.category]}
                            index={index}
                            statusColors={statusColors}
                            onEdit={handleEdit}
                            isSelected={selectedCars.find(c => c.id === car.id) !== undefined}
                            onSelect={handleSelectCar}
                          />
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : null}
          </AnimatePresence>

          {/* Add Car Dialog */}
          <AddCarDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onSave={handleAddCar}
          />

          {/* Edit Car Dialog */}
          {editingCar && (
            <EditCarDialog
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
              car={editingCar}
              onSave={handleUpdateCar}
              onDelete={handleDeleteCar}
            />
          )}
        </div>
      </div>
    </div>
  );
}