import React, { useState, useEffect } from 'react';
import { Quote, Reservation, Car, VehicleType, Location, Notification } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Calendar, 
  Car as CarIcon,
  Search,
  RefreshCw,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  MapPin,
  Hash,
  DollarSign,
  Edit,
  Trash2,
  Move,
  Filter,
  Grid3X3,
  List,
  CalendarDays
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isAfter, compareDesc, parseISO } from "date-fns";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import EditReservationModal from '../components/reservations/EditReservationModal';

export default function Reservations() {
  const [quotes, setQuotes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [cars, setCars] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pipeline");
  const [viewMode, setViewMode] = useState("kanban"); // kanban, list, timeline
  const [sortBy, setSortBy] = useState("created_date"); // created_date, pickup_date, customer_name
  const [filterStatus, setFilterStatus] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [processingItems, setProcessingItems] = useState(new Set());
  
  // Modal states
  const [showEditReservation, setShowEditReservation] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  useEffect(() => {
    loadReservationData();
    const interval = setInterval(loadReservationData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadReservationData = async () => {
    setIsLoading(true);
    try {
      const [quotesData, reservationsData, carsData, vehicleTypesData, locationsData] = await Promise.all([
        Quote.list('-created_date').catch(() => []),
        Reservation.list('-created_date').catch(() => []),
        Car.list().catch(() => []),
        VehicleType.list().catch(() => []),
        Location.list().catch(() => [])
      ]);
      
      setQuotes(quotesData);
      setReservations(reservationsData);
      setCars(carsData);
      setVehicleTypes(vehicleTypesData);
      setLocations(locationsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading reservation data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort data
  const getFilteredData = () => {
    let filteredQuotes = quotes.filter(quote => 
      (quote.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       quote.quote_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       quote.vehicle_category?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filterStatus === "all" || quote.status === filterStatus)
    );

    let filteredReservations = reservations.filter(res => 
      (res.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       res.vehicle_category?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filterStatus === "all" || res.status === filterStatus)
    );

    // Sort logic
    const sortFunction = (a, b) => {
      switch (sortBy) {
        case 'pickup_date':
          if (!a.pickup_date) return 1;
          if (!b.pickup_date) return -1;
          return compareDesc(parseISO(a.pickup_date), parseISO(b.pickup_date));
        case 'customer_name':
          return (a.customer_name || '').localeCompare(b.customer_name || '');
        case 'created_date':
        default:
          return compareDesc(parseISO(a.created_date), parseISO(b.created_date));
      }
    };

    return {
      quotes: filteredQuotes.sort(sortFunction),
      reservations: filteredReservations.sort(sortFunction)
    };
  };

  const { quotes: filteredQuotes, reservations: filteredReservations } = getFilteredData();

  // Kanban columns for reservations
  const kanbanColumns = {
    pending_confirmation: {
      title: "Pending Confirmation",
      items: filteredReservations.filter(r => r.status === 'pending_confirmation'),
      color: "bg-amber-50 border-amber-200"
    },
    confirmed: {
      title: "Confirmed",
      items: filteredReservations.filter(r => r.status === 'confirmed'),
      color: "bg-blue-50 border-blue-200"
    },
    in_progress: {
      title: "In Progress",
      items: filteredReservations.filter(r => r.status === 'in_progress'),
      color: "bg-green-50 border-green-200"
    },
    completed: {
      title: "Completed",
      items: filteredReservations.filter(r => r.status === 'completed'),
      color: "bg-gray-50 border-gray-200"
    },
    cancelled: {
      title: "Cancelled",
      items: filteredReservations.filter(r => r.status === 'cancelled'),
      color: "bg-red-50 border-red-200"
    }
  };

  const handleConvertQuoteToReservation = async (quote, allocateVehicle = false) => {
    setProcessingItems(prev => new Set(prev).add(quote.id));
    try {
      if (!quote.pickup_date || !quote.dropoff_date) {
        alert('Quote must have pickup and dropoff dates to convert.');
        return;
      }

      const pickupDateTime = `${quote.pickup_date}T${quote.pickup_time || '09:00:00'}`;
      const dropoffDateTime = `${quote.dropoff_date}T${quote.dropoff_time || '17:00:00'}`;
      
      let assignedVehicleId = null;
      
      if (allocateVehicle) {
        const availableVehicles = cars.filter(car => 
          car.category === quote.vehicle_category && 
          car.status === 'available'
        );
        
        if (availableVehicles.length === 0) {
          alert(`No ${quote.vehicle_category} vehicles available. Creating unallocated reservation.`);
        } else {
          assignedVehicleId = availableVehicles[0].id;
        }
      }

      const reservation = await Reservation.create({
        quote_id: quote.id,
        customer_name: quote.customer_name,
        customer_email: quote.customer_email,
        customer_phone: quote.customer_phone,
        vehicle_category: quote.vehicle_category,
        pickup_date: new Date(pickupDateTime).toISOString(),
        dropoff_date: new Date(dropoffDateTime).toISOString(),
        pickup_location: quote.pickup_location,
        dropoff_location: quote.dropoff_location,
        status: assignedVehicleId ? 'confirmed' : 'pending_confirmation',
        assigned_vehicle_id: assignedVehicleId,
        total_amount: quote.total,
        special_requirements: quote.special_requirements,
        daily_km_allowance: quote.daily_km_allowance,
        insurance_option: quote.insurance_option,
        notes: quote.notes
      });

      await Quote.update(quote.id, { 
        status: 'accepted', 
        accepted_date: new Date().toISOString() 
      });

      await Notification.create({
        type: 'quote_accepted',
        title: assignedVehicleId ? 'Quote Converted & Vehicle Allocated' : 'Quote Converted to Reservation',
        message: assignedVehicleId 
          ? `Quote ${quote.quote_number} converted and vehicle allocated to ${quote.customer_name}`
          : `Quote ${quote.quote_number} converted to reservation - vehicle allocation needed`,
        priority: 'normal',
        related_entity_id: reservation.id,
        related_entity_type: 'reservation'
      });

      loadReservationData();
      alert(assignedVehicleId ? 'Quote converted and vehicle allocated!' : 'Quote converted to reservation!');
    } catch (error) {
      console.error('Error converting quote:', error);
      alert('Failed to convert quote: ' + error.message);
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(quote.id);
        return newSet;
      });
    }
  };

  const handleAllocateVehicle = async (reservation, vehicleId) => {
    setProcessingItems(prev => new Set(prev).add(reservation.id));
    try {
      await Reservation.update(reservation.id, {
        assigned_vehicle_id: vehicleId,
        status: 'confirmed'
      });

      await Notification.create({
        type: 'reservation_pending',
        title: 'Vehicle Allocated',
        message: `Vehicle allocated to ${reservation.customer_name}'s reservation`,
        priority: 'normal',
        related_entity_id: reservation.id,
        related_entity_type: 'reservation'
      });

      loadReservationData();
      alert('Vehicle successfully allocated!');
    } catch (error) {
      console.error('Error allocating vehicle:', error);
      alert('Failed to allocate vehicle: ' + error.message);
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(reservation.id);
        return newSet;
      });
    }
  };

  const handleEditReservation = (reservation) => {
    setSelectedReservation(reservation);
    setShowEditReservation(true);
  };

  const handleDeleteReservation = async (reservation) => {
    if (!confirm(`Are you sure you want to delete the reservation for ${reservation.customer_name}?`)) {
      return;
    }

    setProcessingItems(prev => new Set(prev).add(reservation.id));
    try {
      await Reservation.delete(reservation.id);
      loadReservationData();
      alert('Reservation deleted successfully');
    } catch (error) {
      console.error('Error deleting reservation:', error);
      alert('Failed to delete reservation: ' + error.message);
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(reservation.id);
        return newSet;
      });
    }
  };

  const handleReservationUpdated = () => {
    loadReservationData();
    setShowEditReservation(false);
    setSelectedReservation(null);
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const reservation = reservations.find(r => r.id === draggableId);
    if (!reservation) return;

    const newStatus = destination.droppableId;
    
    setProcessingItems(prev => new Set(prev).add(reservation.id));
    try {
      await Reservation.update(reservation.id, { status: newStatus });
      
      await Notification.create({
        type: 'reservation_pending',
        title: 'Reservation Status Updated',
        message: `${reservation.customer_name}'s reservation moved to ${newStatus.replace('_', ' ')}`,
        priority: 'normal',
        related_entity_id: reservation.id,
        related_entity_type: 'reservation'
      });

      loadReservationData();
    } catch (error) {
      console.error('Error updating reservation status:', error);
      alert('Failed to update reservation status: ' + error.message);
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(reservation.id);
        return newSet;
      });
    }
  };

  const getStageStats = () => {
    const allReservations = filteredReservations;
    return {
      quotes: {
        total: filteredQuotes.length,
        sent: filteredQuotes.filter(q => q.status === 'sent').length,
        accepted: filteredQuotes.filter(q => q.status === 'accepted').length
      },
      reservations: {
        total: allReservations.length,
        pending: allReservations.filter(r => r.status === 'pending_confirmation').length,
        confirmed: allReservations.filter(r => r.status === 'confirmed').length,
        in_progress: allReservations.filter(r => r.status === 'in_progress').length,
        completed: allReservations.filter(r => r.status === 'completed').length
      }
    };
  };

  const stats = getStageStats();

  const QuoteCard = ({ quote }) => {
    const isExpired = quote.valid_until && isAfter(new Date(), new Date(quote.valid_until));
    const isProcessing = processingItems.has(quote.id);
    
    return (
      <Card key={quote.id} className="border shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg">{quote.customer_name}</h3>
              <p className="text-sm text-slate-600">Quote #{quote.quote_number}</p>
              <div className="flex items-center gap-2 mt-1">
                <CarIcon className="w-4 h-4 text-slate-400" />
                <span className="text-sm">{quote.vehicle_category}</span>
              </div>
            </div>
            <Badge variant={quote.status === 'sent' ? 'default' : 'secondary'}>
              {isExpired ? 'Expired' : quote.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{quote.pickup_date ? format(new Date(quote.pickup_date), 'MMM d, yyyy') : 'Not set'}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span>${quote.total?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{quote.pickup_location || 'Not set'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{quote.hire_duration_days || 0} days</span>
            </div>
          </div>

          {quote.special_requirements && (
            <div className="mb-4 p-2 bg-blue-50 rounded text-sm">
              <strong>Requirements:</strong> {quote.special_requirements}
            </div>
          )}

          <div className="flex gap-2">
            {quote.status === 'sent' && !isExpired && (
              <>
                <Button
                  onClick={() => handleConvertQuoteToReservation(quote, false)}
                  disabled={isProcessing}
                  variant="outline"
                  size="sm"
                >
                  {isProcessing ? 'Converting...' : 'Convert to Reservation'}
                </Button>
                <Button
                  onClick={() => handleConvertQuoteToReservation(quote, true)}
                  disabled={isProcessing}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isProcessing ? 'Converting...' : 'Convert & Allocate Vehicle'}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const ReservationCard = ({ reservation, showActions = true }) => {
    const isProcessing = processingItems.has(reservation.id);
    const assignedCar = cars.find(c => c.id === reservation.assigned_vehicle_id);
    
    return (
      <Card className="border shadow-sm hover:shadow-md transition-shadow mb-3">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-lg">{reservation.customer_name}</h3>
              <p className="text-sm text-slate-600">
                {format(new Date(reservation.pickup_date), 'MMM d')} - {format(new Date(reservation.dropoff_date), 'MMM d, yyyy')}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <CarIcon className="w-4 h-4 text-slate-400" />
                <span className="text-sm">{reservation.vehicle_category}</span>
              </div>
            </div>
            <Badge className={`
              ${reservation.status === 'pending_confirmation' ? 'bg-amber-100 text-amber-800' : ''}
              ${reservation.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : ''}
              ${reservation.status === 'in_progress' ? 'bg-green-100 text-green-800' : ''}
              ${reservation.status === 'completed' ? 'bg-gray-100 text-gray-800' : ''}
              ${reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
            `}>
              {reservation.status.replace('_', ' ')}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{reservation.pickup_location || 'Main Office'}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span>${reservation.total_amount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          {assignedCar && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">Fleet {assignedCar.fleet_id}</span>
              </div>
              <p className="text-sm text-green-700">
                {assignedCar.license_plate || 'No plate set'}
              </p>
            </div>
          )}

          {reservation.special_requirements && (
            <div className="mb-4 p-2 bg-blue-50 rounded text-sm">
              <strong>Requirements:</strong> {reservation.special_requirements}
            </div>
          )}

          {showActions && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleEditReservation(reservation)}
                disabled={isProcessing}
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              
              {!reservation.assigned_vehicle_id && (
                <select
                  className="text-sm border rounded px-2 py-1"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAllocateVehicle(reservation, e.target.value);
                      e.target.value = '';
                    }
                  }}
                  disabled={isProcessing}
                >
                  <option value="">Allocate Vehicle...</option>
                  {cars
                    .filter(car => car.category === reservation.vehicle_category && car.status === 'available')
                    .map(car => (
                      <option key={car.id} value={car.id}>
                        Fleet {car.fleet_id} ({car.license_plate})
                      </option>
                    ))
                  }
                </select>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDeleteReservation(reservation)}
                disabled={isProcessing}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{color: 'var(--wwfh-navy)'}}>
                Reservations Pipeline  
              </h1>
              <div className="flex items-center gap-4 text-slate-600">
                <p className="text-base md:text-lg">Manage quotes and reservations with ease</p>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                  <Button variant="ghost" size="sm" onClick={loadReservationData}>
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search customers, quotes, vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_date">Created Date</SelectItem>
                <SelectItem value="pickup_date">Pickup Date</SelectItem>
                <SelectItem value="customer_name">Customer Name</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="sent">Sent Quotes</SelectItem>
                <SelectItem value="pending_confirmation">Pending Confirmation</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
              >
                <Grid3X3 className="w-4 h-4 mr-1" />
                Kanban
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4 mr-1" />
                List
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.quotes.total}</div>
                <div className="text-sm text-slate-600">Total Quotes</div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{stats.reservations.pending}</div>
                <div className="text-sm text-slate-600">Pending</div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.reservations.confirmed}</div>
                <div className="text-sm text-slate-600">Confirmed</div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.reservations.in_progress}</div>
                <div className="text-sm text-slate-600">Active</div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.reservations.completed}</div>
                <div className="text-sm text-slate-600">Completed</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quotes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Quotes ({stats.quotes.total})
              </TabsTrigger>
              <TabsTrigger value="pipeline" className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Reservations ({stats.reservations.total})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quotes" className="mt-6">
              {isLoading ? (
                <div className="text-center py-8">Loading quotes...</div>
              ) : filteredQuotes.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No quotes found</div>
              ) : (
                <div className="grid gap-4">
                  {filteredQuotes.map(quote => <QuoteCard key={quote.id} quote={quote} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pipeline" className="mt-6">
              {isLoading ? (
                <div className="text-center py-8">Loading reservations...</div>
              ) : viewMode === "kanban" ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {Object.entries(kanbanColumns).map(([columnId, column]) => (
                      <div key={columnId} className={`rounded-lg border-2 ${column.color} p-4`}>
                        <h3 className="font-semibold mb-4 text-center">
                          {column.title} ({column.items.length})
                        </h3>
                        <Droppable droppableId={columnId}>
                          {(provided, snapshot) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className={`min-h-[200px] ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                            >
                              <AnimatePresence>
                                {column.items.map((reservation, index) => (
                                  <Draggable 
                                    key={reservation.id} 
                                    draggableId={reservation.id} 
                                    index={index}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`${snapshot.isDragging ? 'rotate-5 shadow-lg' : ''}`}
                                      >
                                        <ReservationCard reservation={reservation} />
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              </AnimatePresence>
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    ))}
                  </div>
                </DragDropContext>
              ) : (
                <div className="space-y-4">
                  {filteredReservations.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">No reservations found</div>
                  ) : (
                    filteredReservations.map(reservation => 
                      <ReservationCard key={reservation.id} reservation={reservation} />
                    )
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Edit Reservation Modal */}
      {showEditReservation && selectedReservation && (
        <EditReservationModal
          reservation={selectedReservation}
          onClose={() => {
            setShowEditReservation(false);
            setSelectedReservation(null);
          }}
          onSuccess={handleReservationUpdated}
        />
      )}
    </div>
  );
}