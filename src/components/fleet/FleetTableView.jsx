import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  Fuel,
  Gauge,
  MapPin,
  Palette,
  Hash,
  Settings,
  EyeOff
} from "lucide-react";
import { format } from "date-fns";

const TableRow = ({ car, vehicleType, isSelected, onSelect, onEdit, statusColors, isExpanded, onToggleExpand }) => {
  const isInactive = car.active === false;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`border-b hover:bg-slate-50/80 transition-colors cursor-pointer ${
          isInactive ? 'opacity-60' : ''
        } ${isSelected ? 'bg-blue-50/50' : ''}`}
        onClick={() => onToggleExpand(car.id)}
      >
        <td className="p-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(car, checked)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4"
          />
        </td>
        <td className="p-3">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-slate-400" />
            <span className="font-mono font-bold" style={{color: 'var(--wwfh-navy)'}}>
              {car.fleet_id}
            </span>
          </div>
        </td>
        <td className="p-3">
          <div>
            <div className="font-semibold text-slate-900">{car.category}</div>
            {car.year && (
              <div className="text-sm text-slate-500 flex items-center gap-1">
                {car.year}
                {car.color && (
                  <>
                    <span>•</span>
                    <Palette className="w-3 h-3" />
                    <span>{car.color}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </td>
        <td className="p-3">
          {car.license_plate ? (
            <div className="flex items-center gap-1 font-mono text-sm">
              <MapPin className="w-3 h-3 text-slate-400" />
              {car.license_plate}
            </div>
          ) : (
            <span className="text-slate-400 text-sm">Not set</span>
          )}
        </td>
        <td className="p-3">
          <Badge className={`${statusColors[car.status]} border-0 font-medium text-xs`}>
            {car.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
          {isInactive && (
            <Badge variant="outline" className="bg-slate-100 text-slate-600 ml-1 text-xs">
              <EyeOff className="w-3 h-3 mr-1" />
              Inactive
            </Badge>
          )}
        </td>
        <td className="p-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(car);
              }}
              className="text-slate-600 hover:text-slate-900"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost" 
              size="sm"
              className="text-slate-400 hover:text-slate-600"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </td>
      </motion.tr>
      
      {/* Expanded Details Row */}
      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b bg-slate-50/50"
          >
            <td colSpan={6} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Mileage</p>
                    <p className="font-semibold">
                      {car.mileage?.toLocaleString() || 'N/A'} km
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Fuel Level</p>
                    <p className="font-semibold">
                      {car.fuel_level || 'N/A'}%
                    </p>
                  </div>
                </div>
                
                {car.last_service_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Last Service</p>
                      <p className="font-semibold">
                        {format(new Date(car.last_service_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                )}
                
                {car.notes && (
                  <div className="md:col-span-2 lg:col-span-1">
                    <p className="text-xs text-slate-500 mb-1">Notes</p>
                    <p className="font-semibold text-slate-700 text-xs bg-white p-2 rounded border">
                      {car.notes}
                    </p>
                  </div>
                )}
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
};

export default function FleetTableView({ cars, vehicleTypes, selectedCars, onSelectCar, onEdit, statusColors }) {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: 'fleet_id', direction: 'asc' });

  const sortedCars = useMemo(() => {
    const sorted = [...cars].sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortConfig.direction === 'asc' 
        ? (aValue > bValue ? 1 : -1)
        : (aValue < bValue ? 1 : -1);
    });
    return sorted;
  }, [cars, sortConfig]);

  const toggleExpanded = (carId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(carId)) {
      newExpanded.delete(carId);
    } else {
      newExpanded.add(carId);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const SortableHeader = ({ children, sortKey, className = "" }) => (
    <th
      className={`p-3 text-left font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors ${className}`}
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortConfig.key === sortKey && (
          sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </th>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100/80 border-b">
                <tr>
                  <th className="p-3 w-12">
                    <div className="w-4 h-4"></div>
                  </th>
                  <SortableHeader sortKey="fleet_id">Fleet ID</SortableHeader>
                  <SortableHeader sortKey="category">Vehicle</SortableHeader>
                  <SortableHeader sortKey="license_plate">License</SortableHeader>
                  <SortableHeader sortKey="status">Status</SortableHeader>
                  <th className="p-3 w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedCars.map((car) => (
                  <TableRow
                    key={car.id}
                    car={car}
                    vehicleType={vehicleTypes[car.category]}
                    isSelected={selectedCars.find(c => c.id === car.id) !== undefined}
                    onSelect={onSelectCar}
                    onEdit={onEdit}
                    statusColors={statusColors}
                    isExpanded={expandedRows.has(car.id)}
                    onToggleExpand={toggleExpanded}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-sm text-slate-500 text-center">
        Showing {sortedCars.length} vehicles • Click on any row to expand details
      </div>
    </motion.div>
  );
}