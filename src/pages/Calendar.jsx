
import React, { useState, useEffect, useMemo } from 'react';
import { Car, VehicleWorkflow, CheckoutReport, Reservation, VehicleType } from '@/api/entities';
import { Location } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Card imports preserved
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge"; // Badge import preserved
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  Car as CarIcon,
  Filter,
  Users,
  Wrench,
  Bookmark,
  Sparkles,
  TestTubeDiagonal,
  CheckCircle,
  HelpCircle,
  Circle
} from "lucide-react";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isWithinInterval, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import BookingModal from '../components/calendar/BookingModal';
import VehicleDetailsModal from '../components/calendar/VehicleDetailsModal';

const statusConfig = {
  available: { label: 'Available', color: 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300', textColor: 'text-emerald-800', icon: Circle },
  on_hire: { label: 'On Hire', color: 'bg-amber-100 border-amber-300', textColor: 'text-amber-800', icon: Users },
  reserved: { label: 'Reserved', color: 'bg-blue-100 border-blue-300', textColor: 'text-blue-800', icon: Bookmark },
  inactive: { label: 'Inactive', color: 'bg-slate-100 border-slate-300', textColor: 'text-slate-600', icon: Circle },
};

const CalendarCell = ({ vehicle, day, statusInfo, onClick, onVehicleClick }) => {
  const config = statusConfig[statusInfo.status] || statusConfig.inactive;
  const isToday = isSameDay(day, new Date());
  const isClickable = statusInfo.status === 'available' && onClick;

  const handleCellClick = (e) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      // Modifier key held - show vehicle details
      onVehicleClick(vehicle);
    } else if (isClickable) {
      // Normal click on available vehicle - create booking
      onClick(vehicle, day);
    } else {
      // Click on non-available vehicle - show details
      onVehicleClick(vehicle);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={handleCellClick}
            className={`
              relative h-16 border transition-all duration-200 flex flex-col items-center justify-center cursor-pointer
              ${config.color} 
              hover:shadow-md
              ${isToday ? 'ring-2 ring-blue-500' : ''}
            `}
          >
            <config.icon className={`w-4 h-4 ${config.textColor} mb-1`} />
            
            {statusInfo.status === 'on_hire' && statusInfo.customerName && statusInfo.customerName !== 'In Process' && (
              <div className="text-xs font-medium text-center px-1 leading-tight">
                <div className="truncate max-w-full">{statusInfo.customerName}</div>
              </div>
            )}
            
            {statusInfo.status === 'reserved' && statusInfo.customerName && (
              <div className="text-xs font-medium text-center px-1 leading-tight">
                <div className="truncate max-w-full">{statusInfo.customerName}</div>
              </div>
            )}
            
            {statusInfo.status === 'available' && isClickable && (
              <div className="text-xs text-center text-emerald-700 font-medium">
                <div>Click to</div>
                <div>Book</div>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="text-center">
            <p className="font-bold">{config.label}</p>
            <p className="text-sm">{statusInfo.details}</p>
            <p className="text-xs text-slate-500 mt-1">{format(day, 'MMMM d, yyyy')}</p>
            <p className="text-xs text-blue-500 mt-1">Click for details • Shift+Click for booking</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const WeekView = ({ vehicles, startDate, onCellClick, onVehicleClick, getVehicleStatusForDay }) => {
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    weekDays.push(day);
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border">
      {/* Week Header */}
      <div className="grid grid-cols-8 gap-0 border-b bg-slate-50">
        <div className="p-2 md:p-3 font-medium text-slate-700 border-r">
          <span className="text-xs md:text-sm">Vehicle</span>
        </div>
        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={`p-1 md:p-2 text-center text-xs md:text-sm border-r ${
                isToday ? 'bg-blue-50 text-blue-800 font-bold' : 'text-slate-700'
              }`}
            >
              <div className="font-medium">{format(day, 'EEE')}</div>
              <div className="text-lg md:text-xl font-bold">{format(day, 'd')}</div>
            </div>
          );
        })}
      </div>

      {/* Vehicle Rows */}
      {vehicles.map((vehicle) => (
        <div key={vehicle.id} className="grid grid-cols-8 gap-0 border-b hover:bg-slate-25">
          {/* Vehicle Info */}
          <div 
            className="p-2 md:p-3 border-r bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={() => onVehicleClick(vehicle)}
          >
            <div className="font-bold text-xs md:text-sm text-slate-900 truncate">
              Fleet {vehicle.fleet_id}
            </div>
            <div className="text-xs text-slate-500 font-mono truncate">
              {vehicle.license_plate}
            </div>
            <div className="text-xs text-blue-600 mt-1">Click for details</div>
          </div>
          
          {/* Calendar Days */}
          {weekDays.map((day) => {
            const statusInfo = getVehicleStatusForDay(vehicle, day);
            return (
              <CalendarCell 
                key={day.toISOString()}
                vehicle={vehicle}
                day={day}
                statusInfo={statusInfo}
                onClick={onCellClick}
                onVehicleClick={onVehicleClick}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

const MonthView = ({ currentDate, cars, checkouts, reservations, workflows, onDayClick }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd]);

  const dailySummary = useMemo(() => {
    const summary = {};
    const filteredCarIds = new Set(cars.map(c => c.id));
    const events = [
      ...checkouts.map(c => ({ car_id: c.car_id, start: new Date(c.checkout_date), end: new Date(c.expected_return_date) })),
      ...reservations.map(r => ({ car_id: r.assigned_vehicle_id, start: new Date(r.pickup_date), end: new Date(r.dropoff_date) })),
    ];

    days.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const busyCars = new Set();
      
      events.forEach(event => {
        if (event.car_id && filteredCarIds.has(event.car_id) && isWithinInterval(day, { start: event.start, end: event.end })) {
          busyCars.add(event.car_id);
        }
      });

      // Also count workflows as busy for filtered cars
      workflows.forEach(wf => {
          if(wf.car_id && filteredCarIds.has(wf.car_id) && wf.workflow_status === 'in_progress') {
              busyCars.add(wf.car_id);
          }
      });
      
      summary[dayKey] = busyCars.size;
    });
    return summary;
  }, [cars, checkouts, reservations, workflows, days]);
  
  const weekDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-white rounded-lg shadow-lg border">
      <div className="grid grid-cols-7 text-center font-bold text-slate-700 border-b">
        {weekDayNames.map(dayName => (
          <div key={dayName} className="py-2 border-r last:border-r-0">{dayName}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          const busyCount = dailySummary[format(day, 'yyyy-MM-dd')] || 0;
          const availableCount = cars.length - busyCount;

          return (
            <div
              key={day.toISOString()}
              onClick={() => isCurrentMonth && onDayClick(day)} // Only allow click for current month days
              className={`h-24 md:h-28 border-b ${index % 7 === 6 ? '' : 'border-r'} p-2 ${isCurrentMonth ? 'cursor-pointer hover:bg-blue-50' : 'bg-slate-50 text-slate-400 cursor-default'} ${isToday ? 'bg-blue-100' : ''}`}
            >
              <div className={`font-medium ${isToday ? 'text-blue-700' : ''}`}>{format(day, 'd')}</div>
              {isCurrentMonth && (
                <div className="mt-1 space-y-1 text-xs">
                   <Badge variant="outline" className="w-full justify-center bg-emerald-50 border-emerald-200 text-emerald-800">
                     {availableCount} Avail
                   </Badge>
                   <Badge variant="outline" className="w-full justify-center bg-amber-50 border-amber-200 text-amber-800">
                     {busyCount} Busy
                   </Badge>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Calendar() {
  const [cars, setCars] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [checkouts, setCheckouts] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBookingData, setSelectedBookingData] = useState(null);

  const [viewMode, setViewMode] = useState('week'); // week or month
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
  });

  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [selectedVehicleForDetails, setSelectedVehicleForDetails] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [carsData, vehicleTypesData, checkoutsData, workflowsData, reservationsData, locationsData] = await Promise.all([
        Car.list(),
        VehicleType.list(),
        CheckoutReport.list(),
        VehicleWorkflow.list(),
        Reservation.list(),
        Location.list()
      ]);
      setCars(carsData.sort((a,b) => (a.fleet_id || '').localeCompare(b.fleet_id || '')));
      setVehicleTypes(vehicleTypesData.filter(vt => vt.active));
      setCheckouts(checkoutsData);
      setWorkflows(workflowsData);
      setReservations(reservationsData);
      setLocations(locationsData.filter(l => l.active));
    } catch (error) {
      console.error("Error loading calendar data:", error);
    }
    setIsLoading(false);
  };

  const getVehicleStatusForDay = useMemo(() => (vehicle, day) => {
    const dayToCheck = new Date(day);
    dayToCheck.setHours(12, 0, 0, 0); // Normalize time to avoid off-by-one day issues

    // Check if vehicle is inactive (globally or specifically on its record)
    if (vehicle.active === false) { // Assuming 'active' property on Car entity
      return { status: 'inactive', details: 'Vehicle is inactive', customerName: null };
    }

    // Check for checkouts (on hire)
    const checkout = checkouts.find(c =>
      c.car_id === vehicle.id &&
      isWithinInterval(dayToCheck, { start: new Date(c.checkout_date), end: new Date(c.expected_return_date) })
    );
    if (checkout) {
      return {
        status: 'on_hire',
        details: `On Hire: ${checkout.customer_name || 'Customer'}`,
        customerName: checkout.customer_name || 'Customer'
      };
    }

    // Check for reservations
    const reservation = reservations.find(r =>
      r.assigned_vehicle_id === vehicle.id &&
      ['confirmed', 'in_progress'].includes(r.status) &&
      isWithinInterval(dayToCheck, { start: new Date(r.pickup_date), end: new Date(r.dropoff_date) })
    );
    if (reservation) {
      return {
        status: 'reserved',
        details: `Reserved for: ${reservation.customer_name}`,
        customerName: reservation.customer_name
      };
    }

    // Check for active workflows - treat as on hire if in process
    const workflow = workflows.find(w =>
        w.car_id === vehicle.id &&
        w.workflow_status === 'in_progress'
    );
    if (workflow) {
      return {
        status: 'on_hire',
        details: `Vehicle in process (${workflow.current_stage?.replace(/_/g, ' ') || 'Unknown'})`,
        customerName: 'In Process'
      };
    }

    // Vehicle is available
    if (vehicle.status === 'available') {
      return { status: 'available', details: 'Click to create a new booking', customerName: null };
    }

    // Fallback for other statuses on the car record or if not explicitly handled
    return { status: 'inactive', details: `Status: ${vehicle.status.replace(/_/g, ' ')}`, customerName: null };

  }, [reservations, checkouts, workflows]);

  const getVehiclesByCategory = () => {
    const activeVehicleTypeNames = new Set(vehicleTypes.map(vt => vt.name));

    const filtered = selectedCategory === 'all'
      ? cars
      : cars.filter(car => car.category === selectedCategory);

    const grouped = filtered.reduce((acc, car) => {
      const category = activeVehicleTypeNames.has(car.category) ? car.category : 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(car);
      return acc;
    }, {});

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (a === 'Uncategorized') return 1;
        if (b === 'Uncategorized') return -1;
        return a.localeCompare(b);
    });

    const sortedGrouped = {};
    for (const key of sortedKeys) {
        sortedGrouped[key] = grouped[key];
    }

    return sortedGrouped;
  };

  const navigateWeek = (direction) => {
    setSelectedWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  };
  
  const handleMonthDayClick = (day) => {
      setSelectedWeekStart(startOfWeek(day, { weekStartsOn: 1 }));
      setViewMode('week');
  };

  const handleCellClick = (vehicle, date) => {
    setSelectedBookingData({ vehicle, date });
    setShowBookingModal(true);
  };

  const handleBookingCreated = () => {
    loadData();
    setShowBookingModal(false);
  };

  const handleVehicleDetailsClick = (vehicle) => {
    setSelectedVehicleForDetails(vehicle);
    setShowVehicleDetails(true);
  };

  // Generate dynamic colors for categories based on vehicle types from admin
  // This function is no longer used due to the updated design, but kept if original implementation needs it for other components.
  const getCategoryColor = (categoryName, index) => {
    const colors = [
      'border-l-blue-500',
      'border-l-indigo-500',
      'border-l-green-500',
      'border-l-purple-500',
      'border-l-orange-500',
      'border-l-red-500',
      'border-l-pink-500',
      'border-l-teal-500',
      'border-l-yellow-500',
      'border-l-cyan-500'
    ];
    return colors[index % colors.length];
  };

  const vehiclesByCategory = getVehiclesByCategory();
  const allFilteredVehicles = useMemo(() => Object.values(vehiclesByCategory).flat(), [vehiclesByCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2" style={{color: 'var(--wwfh-navy)'}}>
              Fleet Calendar
            </h1>
            <p className="text-slate-600 text-sm md:text-lg">
              Visual overview of vehicle availability and bookings.
            </p>
          </div>

          <div className="flex flex-col space-y-4">
            {/* Navigation and View Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => { viewMode === 'week' ? navigateWeek('prev') : navigateMonth('prev') }}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-lg md:text-2xl font-bold text-slate-900 min-w-0">
                  {viewMode === 'week'
                    ? `Week of ${format(selectedWeekStart, 'MMM d, yyyy')}`
                    : format(currentDate, 'MMMM yyyy')
                  }
                </h2>
                <Button variant="outline" size="sm" onClick={() => { viewMode === 'week' ? navigateWeek('next') : navigateMonth('next') }}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                >
                  Week View
                </Button>
                <Button
                  variant={viewMode === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                >
                  Month View
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by vehicle type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vehicle Types</SelectItem>
                    {vehicleTypes.map(type => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusConfig).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-1 text-xs">
                    <div className={`w-3 h-3 rounded-full ${config.color.split(' ')[0]}`}></div>
                    <span className="text-slate-700">{config.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Calendar Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {isLoading ? (
            <div className="text-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading calendar...</p>
            </div>
          ) : (
            viewMode === 'week' ? (
                /* Week View */
                <div className="space-y-6">
                  {Object.entries(vehiclesByCategory).map(([category, categoryVehicles]) => (
                    <motion.div key={category} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className={`p-3 font-bold text-white text-lg flex items-center gap-2 rounded-t-lg ${
                        category === 'Uncategorized' ? 'bg-red-500' : 'bg-slate-600'
                      }`}>
                        <CarIcon className="w-5 h-5" />
                        {category}
                        <span className="ml-auto text-sm opacity-90">
                          {categoryVehicles.length} vehicle{categoryVehicles.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <WeekView
                        vehicles={categoryVehicles}
                        startDate={selectedWeekStart}
                        onCellClick={handleCellClick}
                        onVehicleClick={handleVehicleDetailsClick}
                        getVehicleStatusForDay={getVehicleStatusForDay}
                      />
                    </motion.div>
                  ))}
                </div>
            ) : (
                /* Month View */
                <MonthView 
                    currentDate={currentDate}
                    cars={allFilteredVehicles}
                    checkouts={checkouts}
                    reservations={reservations}
                    workflows={workflows}
                    onDayClick={handleMonthDayClick}
                />
            )
          )}
        </motion.div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedBookingData && (
        <BookingModal
          selectedDate={selectedBookingData.date}
          selectedVehicle={selectedBookingData.vehicle}
          locations={locations}
          onClose={() => setShowBookingModal(false)}
          onBookingCreated={handleBookingCreated}
        />
      )}

      {/* Vehicle Details Modal */}
      <VehicleDetailsModal
        vehicle={selectedVehicleForDetails}
        isOpen={showVehicleDetails}
        onClose={() => {
          setShowVehicleDetails(false);
          setSelectedVehicleForDetails(null);
        }}
      />
    </div>
  );
}
