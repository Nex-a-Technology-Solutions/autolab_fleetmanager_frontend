
import React, { useState, useEffect } from 'react';
import { Client, ClientRateOverride, Quote, Reservation, VehicleType } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Search, 
  Plus, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Building,
  Phone,
  Mail,
  MapPin,
  Settings,
  History,
  Percent
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

import ClientDetailsModal from '../components/clients/ClientDetailsModal';
import AddClientModal from '../components/clients/AddClientModal';
import RateOverrideModal from '../components/clients/RateOverrideModal';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [rateOverrides, setRateOverrides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showRateOverride, setShowRateOverride] = useState(false);

  useEffect(() => {
    loadClientsData();
  }, []);

  const loadClientsData = async () => {
    setIsLoading(true);
    try {
      const [clientsData, quotesData, reservationsData, vehicleTypesData, rateOverridesData] = await Promise.all([
        Client.list('-last_booking_date').catch(() => []),
        Quote.list().catch(() => []),
        Reservation.list().catch(() => []),
        VehicleType.list().catch(() => []),
        ClientRateOverride.list().catch(() => [])
      ]);
      
      // Enrich clients with booking statistics
      const enrichedClients = clientsData.map(client => {
        const clientQuotes = quotesData.filter(q => q.customer_email === client.email);
        const clientReservations = reservationsData.filter(r => r.customer_email === client.email);
        
        const totalBookings = clientReservations.filter(r => r.status === 'completed').length;
        const totalRevenue = clientReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);
        const lastBooking = clientReservations.length > 0 
          ? clientReservations.sort((a, b) => new Date(b.pickup_date) - new Date(a.pickup_date))[0]
          : null;

        return {
          ...client,
          totalBookings,
          totalRevenue,
          lastBookingDate: lastBooking?.pickup_date || null,
          recentQuotes: clientQuotes.slice(0, 5),
          recentReservations: clientReservations.slice(0, 5)
        };
      });
      
      setClients(enrichedClients);
      setQuotes(quotesData);
      setReservations(reservationsData);
      setVehicleTypes(vehicleTypesData);
      setRateOverrides(rateOverridesData);
    } catch (error) {
      console.error("Error loading clients data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setShowClientDetails(true);
  };

  const handleAddRateOverride = (client) => {
    setSelectedClient(client);
    setShowRateOverride(true);
  };

  const handleViewHistory = (client) => {
    setSelectedClient(client);
    setShowClientDetails(true); // Re-use ClientDetailsModal for history view
  };

  const ClientCard = ({ client }) => {
    const clientOverrides = rateOverrides.filter(ro => ro.client_id === client.id && ro.active);
    
    return (
      <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => handleClientClick(client)}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-lg">{client.name}</h3>
              {client.company && (
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <Building className="w-3 h-3" />
                  <span>{client.company}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                <Mail className="w-3 h-3" />
                <span>{client.email}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <Badge variant={client.client_type === 'corporate' ? 'default' : 'secondary'}>
                {client.client_type}
              </Badge>
              {clientOverrides.length > 0 && (
                <Badge className="bg-orange-100 text-orange-800">
                  {clientOverrides.length} Override{clientOverrides.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-lg text-slate-900">{client.totalBookings}</div>
              <div className="text-slate-600">Bookings</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-green-600">${client.totalRevenue.toLocaleString()}</div>
              <div className="text-slate-600">Revenue</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-blue-600">
                {client.lastBookingDate 
                  ? format(new Date(client.lastBookingDate), 'MMM d')
                  : 'Never'
                }
              </div>
              <div className="text-slate-600">Last Hire</div>
            </div>
          </div>

          <div className="flex gap-2 mt-4 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => handleAddRateOverride(client)}
            >
              <Percent className="w-3 h-3 mr-1" />
              Rates
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => handleViewHistory(client)}
            >
              <History className="w-3 h-3 mr-1" />
              History
            </Button>
          </div>
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
                Client Management
              </h1>
              <p className="text-slate-600 text-base md:text-lg">
                Manage clients, view history, and set custom rates
              </p>
            </div>
            <Button 
              onClick={() => setShowAddClient(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Client
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search clients by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold">Total Clients</h3>
                  </div>
                  <span className="text-2xl font-bold">{clients.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold">Corporate</h3>
                  </div>
                  <span className="text-2xl font-bold">
                    {clients.filter(c => c.client_type === 'corporate').length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold">Rate Overrides</h3>
                  </div>
                  <span className="text-2xl font-bold">{rateOverrides.filter(ro => ro.active).length}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold">Total Revenue</h3>
                  </div>
                  <span className="text-2xl font-bold">
                    ${clients.reduce((sum, c) => sum + c.totalRevenue, 0).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded mb-4 w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {searchQuery ? 'No matching clients found' : 'No clients yet'}
                </h3>
                <p className="text-slate-600 mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : 'Add your first client to get started'
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowAddClient(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Client
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map(client => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      {showClientDetails && selectedClient && (
        <ClientDetailsModal
          client={selectedClient}
          onClose={() => {
            setShowClientDetails(false);
            setSelectedClient(null);
          }}
          onRefresh={loadClientsData}
        />
      )}

      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onSuccess={loadClientsData}
        />
      )}

      {showRateOverride && selectedClient && (
        <RateOverrideModal
          client={selectedClient}
          vehicleTypes={vehicleTypes}
          existingOverrides={rateOverrides.filter(ro => ro.client_id === selectedClient.id)}
          onClose={() => {
            setShowRateOverride(false);
            setSelectedClient(null);
          }}
          onSuccess={loadClientsData}
        />
      )}
    </div>
  );
}
