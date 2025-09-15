import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Thermometer, Gauge, MapPin } from 'lucide-react';

export default function VehicleGpsList({ vehicles, selectedVehicle, onVehicleSelect }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {vehicles.map(vehicle => (
        <motion.div
          key={vehicle.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => onVehicleSelect(vehicle)}
          className={`
            p-4 border-b cursor-pointer transition-colors duration-200
            ${selectedVehicle?.id === vehicle.id ? 'bg-blue-100' : 'hover:bg-slate-50'}
          `}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 
              className={`font-bold text-lg ${selectedVehicle?.id === vehicle.id ? 'text-blue-800' : ''}`}
              style={{color: selectedVehicle?.id !== vehicle.id ? 'var(--wwfh-navy)' : '' }}
            >
              Fleet {vehicle.fleet_id}
            </h3>
            <div 
              className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
                vehicle.gps_engine_on ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${vehicle.gps_engine_on ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {vehicle.gps_engine_on ? 'On' : 'Off'}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{vehicle.distanceFromHome?.toFixed(1) || 'N/A'} km from base</span>
            </div>
            <div className="flex items-center gap-1">
              <Gauge className="w-4 h-4" />
              <span>{vehicle.gps_speed?.toFixed(1) || '0'} km/h</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}