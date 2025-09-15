
import React, { useState, useEffect, useMemo } from 'react';
import { Car, ThemeSettings } from '@/api/entities';
import { motion } from 'framer-motion';
import { AlertTriangle, Map, List, Loader2, RefreshCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import TrackingMap from '../components/gps/TrackingMap';
import VehicleGpsList from '../components/gps/VehicleGpsList';
import GpsDataUploader from '../components/gps/GpsDataUploader'; // New import
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // Assuming shadcn/ui tabs

// Haversine formula to calculate distance between two points on Earth
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function GpsTracking() {
  const [vehicles, setVehicles] = useState([]);
  const [homeBase, setHomeBase] = useState({ lat: -31.9523, lng: 115.8613 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState('map'); // New state for tabs

  const loadGpsData = async () => {
    setIsLoading(true);
    try {
      const [carsData, themeSettings] = await Promise.all([
        Car.list(),
        ThemeSettings.list()
      ]);
      
      setVehicles(carsData.filter(c => c.gps_latitude && c.gps_longitude));
      
      if (themeSettings.length > 0) {
        setHomeBase({
          lat: themeSettings[0].home_base_latitude || -31.9523,
          lng: themeSettings[0].home_base_longitude || 115.8613
        });
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading GPS data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGpsData();
    const interval = setInterval(loadGpsData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const vehiclesWithDistance = useMemo(() => {
    return vehicles.map(v => ({
      ...v,
      distanceFromHome: calculateDistance(homeBase.lat, homeBase.lng, v.gps_latitude, v.gps_longitude)
    })).sort((a,b) => {
      const aFleetId = a.fleet_id || '';
      const bFleetId = b.fleet_id || '';
      return aFleetId.localeCompare(bFleetId);
    });
  }, [vehicles, homeBase]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            GPS Vehicle Tracking
          </h1>
          <p className="text-slate-600 text-lg">Real-time location tracking and fleet monitoring</p>
        </motion.div>

        {/* Display Last Updated info generally, near the main title/description */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Last Updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="map">Live Map</TabsTrigger>
            <TabsTrigger value="list">Vehicle List</TabsTrigger>
            <TabsTrigger value="upload">Upload Data</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            {isLoading && vehiclesWithDistance.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500"/>
              </div>
            ) : vehiclesWithDistance.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 bg-white rounded-lg shadow-sm">
                <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">No GPS Data Available for Map</h2>
                <p className="text-slate-600 mb-4">
                    There are currently no vehicles broadcasting GPS data to display on the map.
                    <br />
                    Please use the "Upload Data" tab to add sample GPS data, or wait for vehicles to report.
                </p>
              </div>
            ) : (
              <div className="h-[70vh] w-full rounded-lg overflow-hidden shadow-lg border">
                <TrackingMap 
                  vehicles={vehiclesWithDistance} 
                  homeBase={homeBase} 
                  selectedVehicle={selectedVehicle}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="list">
            {isLoading && vehiclesWithDistance.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500"/>
              </div>
            ) : vehiclesWithDistance.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 bg-white rounded-lg shadow-sm">
                <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">No GPS Data Available for List</h2>
                <p className="text-slate-600 mb-4">
                    There are currently no vehicles broadcasting GPS data to display in the list.
                    <br />
                    Please use the "Upload Data" tab to add sample GPS data, or wait for vehicles to report.
                </p>
              </div>
            ) : (
                <div className="bg-white rounded-lg shadow-lg border p-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <List className="w-5 h-5"/>
                      Vehicle Status ({vehiclesWithDistance.length})
                    </h2>
                    <VehicleGpsList
                        vehicles={vehiclesWithDistance}
                        selectedVehicle={selectedVehicle}
                        onVehicleSelect={setSelectedVehicle}
                    />
                </div>
            )}
          </TabsContent>

          <TabsContent value="upload">
            <GpsDataUploader onUploadComplete={loadGpsData} />
          </TabsContent>

          <TabsContent value="history">
            <div className="bg-white rounded-lg shadow-lg border p-8 text-center text-slate-600">
                <h2 className="text-xl font-bold mb-4">GPS History</h2>
                <p>GPS history features coming soon!</p>
                <p>This section will allow you to view historical routes and data for your vehicles.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
