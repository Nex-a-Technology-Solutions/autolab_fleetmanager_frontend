import React, { useState, useEffect } from "react";
import { Car } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search as SearchIcon, Car as CarIcon, BarChart, History, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allCars, setAllCars] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const loadAllCars = async () => {
      setIsLoading(true);
      try {
        const cars = await Car.list();
        setAllCars(cars);
      } catch (error) {
        console.error("Error loading vehicles:", error);
      }
      setIsLoading(false);
    };
    loadAllCars();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) {
      setSearchResults([]);
      return;
    };
    setIsSearching(true);
    // Search is now client-side on the pre-loaded data for speed.
    const lowerCaseQuery = searchQuery.toLowerCase();
    const results = allCars.filter(car => 
      car.fleet_id?.toLowerCase().includes(lowerCaseQuery) ||
      car.license_plate?.toLowerCase().includes(lowerCaseQuery) ||
      car.category?.toLowerCase().includes(lowerCaseQuery)
    );
    setSearchResults(results);
    setIsSearching(false);
    setSelectedCar(null);
  };
  
  const loadCarDetails = async (car) => {
      setSelectedCar(car);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Vehicle Search</h1>
          <p className="text-slate-600 text-lg">Find any vehicle in the fleet and view its complete history.</p>
        </motion.div>
        
        <form onSubmit={handleSearch}>
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by Fleet ID, license plate, or vehicle type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={isSearching || isLoading} className="w-full md:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Data...
                  </>
                ) : isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </Button>
            </CardContent>
          </Card>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Search Results */}
          <div className="md:col-span-1">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Search Results ({searchResults.length})</h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {searchResults.map(car => (
                <Card 
                    key={car.id} 
                    onClick={() => loadCarDetails(car)}
                    className={`cursor-pointer transition-all ${selectedCar?.id === car.id ? 'border-blue-500 ring-2 ring-blue-500' : 'hover:bg-slate-50'}`}
                >
                  <CardContent className="p-4">
                    <p className="font-semibold">{car.category}</p>
                    <p className="text-sm font-bold font-mono" style={{color: 'var(--wwfh-navy)'}}>Fleet {car.fleet_id}</p>
                    {car.license_plate && (
                      <p className="text-sm text-slate-600">{car.license_plate}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Details View */}
          <div className="md:col-span-2">
            {selectedCar ? (
                <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}>
                    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedCar.category}</h2>
                            <p className="font-bold font-mono text-lg mb-2" style={{color: 'var(--wwfh-navy)'}}>Fleet {selectedCar.fleet_id}</p>
                            {selectedCar.license_plate && (
                              <p className="font-mono text-slate-700">{selectedCar.license_plate}</p>
                            )}
                             <div className="mt-6 space-y-4">
                               <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                                  <CarIcon className="w-6 h-6 text-blue-600" />
                                  <div>
                                    <p className="font-semibold">Current Status</p>
                                    <p className="text-slate-600 capitalize">{selectedCar.status.replace(/_/g, ' ')}</p>
                                  </div>
                               </div>
                               <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                                  <History className="w-6 h-6 text-purple-600" />
                                  <div>
                                    <p className="font-semibold">Rental History</p>
                                    <p className="text-slate-600">No history available in this demo.</p>
                                  </div>
                               </div>
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                                  <BarChart className="w-6 h-6 text-emerald-600" />
                                  <div>
                                    <p className="font-semibold">Maintenance Records</p>
                                    <p className="text-slate-600">No records available in this demo.</p>
                                  </div>
                               </div>
                             </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                 <div className="flex items-center justify-center h-full rounded-lg border-2 border-dashed border-slate-300">
                    <div className="text-center text-slate-500">
                        <SearchIcon className="w-12 h-12 mx-auto mb-4" />
                        <p>Search for a vehicle to see its details.</p>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}