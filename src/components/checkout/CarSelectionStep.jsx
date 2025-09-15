import React, { useState, useEffect } from "react";
import { Car as CarEntity } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Car as CarIcon, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CarSelectionStep({ onNext, vehicleTypes }) {
  const [availableCars, setAvailableCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAvailableCars = async () => {
      setIsLoading(true);
      try {
        const cars = await CarEntity.filter({ status: 'available' });
        setAvailableCars(cars);
        setFilteredCars(cars);
      } catch (error) {
        console.error("Error loading available cars:", error);
      }
      setIsLoading(false);
    };
    loadAvailableCars();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredCars(availableCars);
      return;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = availableCars.filter(car =>
      car.fleet_id?.toLowerCase().includes(lowerCaseQuery) ||
      car.license_plate?.toLowerCase().includes(lowerCaseQuery) ||
      car.category?.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredCars(filtered);
  }, [searchQuery, availableCars]);

  const handleSelectCar = (car) => {
    setSelectedCar(car);
  };

  const handleNextStep = () => {
    if (selectedCar) {
      const vehicleType = vehicleTypes.find(vt => vt.name === selectedCar.category);
      onNext({
        car_id: selectedCar.id,
        car_details: selectedCar,
        vehicle_type_details: vehicleType,
        fleet_id: selectedCar.fleet_id,
        mileage_out: selectedCar.mileage,
        fuel_level_out: selectedCar.fuel_level,
      });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Select an Available Vehicle</h2>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder="Search by Fleet ID, license plate, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2 -m-2">
        <AnimatePresence>
          {isLoading ? (
            <div className="col-span-full flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : filteredCars.length === 0 ? (
            <p className="text-slate-500 col-span-full text-center py-8">No available cars match your search.</p>
          ) : (
            filteredCars.map(car => (
              <motion.div key={car.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card
                  onClick={() => handleSelectCar(car)}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedCar?.id === car.id
                      ? 'border-blue-500 ring-2 ring-blue-500 shadow-xl'
                      : 'hover:shadow-md'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-lg font-bold text-slate-800">{car.category}</p>
                            <Badge variant="outline" className="mt-1">{car.license_plate}</Badge>
                            <div className="flex items-center gap-1 text-sm font-bold mt-2" style={{color: 'var(--wwfh-navy)'}}>
                              <CarIcon className="w-4 h-4" />
                              <span>Fleet {car.fleet_id}</span>
                            </div>
                        </div>
                        {selectedCar?.id === car.id && (
                          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-end mt-8">
        <Button onClick={handleNextStep} disabled={!selectedCar}>
          Continue
        </Button>
      </div>
    </motion.div>
  );
}