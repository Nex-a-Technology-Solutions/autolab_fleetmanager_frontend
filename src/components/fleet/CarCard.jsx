import React from 'react';
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  Fuel, 
  Settings, 
  Hash,
  Gauge,
  MapPin,
  Palette,
  EyeOff
} from "lucide-react";

export default function CarCard({ car, vehicleType, index, statusColors, onEdit, isSelected, onSelect }) {
  const getStatusDisplay = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const isInactive = car.active === false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group h-full flex flex-col ${
        isInactive ? 'opacity-60' : ''
      } ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-300' : ''
      }`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(car, checked)}
                className="mt-1"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg text-slate-900 truncate" title={car.category}>
                    {car.category}
                  </h3>
                  {isInactive && (
                    <Badge variant="outline" className="bg-slate-100 text-slate-600 flex items-center gap-1">
                      <EyeOff className="w-3 h-3" />
                      Inactive
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                  <span>{car.year}</span>
                  {car.color && (
                    <>
                      <span className="text-slate-300">•</span>
                      <Palette className="w-4 h-4" />
                      <span>{car.color}</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="font-mono text-sm font-bold truncate" style={{color: 'var(--wwfh-navy)'}} title={`Fleet ID: ${car.fleet_id}`}>
                    Fleet {car.fleet_id}
                  </span>
                </div>
                {car.license_plate && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="font-mono text-sm text-slate-600 truncate" title={`License Plate: ${car.license_plate}`}>
                      {car.license_plate}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <Badge 
              className={`${statusColors[car.status]} border-0 font-medium px-2 md:px-3 py-1 text-xs md:text-sm flex-shrink-0`}
            >
              <span className="hidden sm:inline">{getStatusDisplay(car.status)}</span>
              <span className="sm:hidden">{car.status.split('_')[0]}</span>
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              {/* Mileage */}
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Mileage</p>
                  <p className="font-semibold text-slate-900 truncate">
                    {car.mileage?.toLocaleString() || 'N/A'} km
                  </p>
                </div>
              </div>
              {/* Fuel Level */}
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Fuel Level</p>
                  <p className="font-semibold text-slate-900">
                    {car.fuel_level || 'N/A'}%
                  </p>
                </div>
              </div>
            </div>

            {/* Last Service */}
            {car.last_service_date && (
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  Last service: {format(new Date(car.last_service_date), "MMM d, yyyy")}
                </span>
              </div>
            )}
          </div>
          
          <Button
            variant="outline"
            className="w-full mt-auto group-hover:bg-slate-50 transition-colors"
            size="sm"
            onClick={() => onEdit(car)}
          >
            <Settings className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Manage Vehicle</span>
            <span className="sm:hidden">Manage</span>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}