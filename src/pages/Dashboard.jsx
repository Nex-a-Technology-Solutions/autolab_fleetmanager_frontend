import React, { useState, useEffect } from "react";
import djangoClient from "@/api/djangoClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Car as CarIcon,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Plus,
  ArrowRight,
  RefreshCw,
  BookmarkPlus
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

import FleetStatusCards from "../components/dashboard/FleetStatusCards";
import WorkflowSummary from "../components/dashboard/WorkflowSummary";
import QuickActions from "../components/dashboard/QuickActions";
import RealtimeUpdates from "../components/dashboard/RealtimeUpdates";
import AnalyticsCharts from "../components/dashboard/AnalyticsCharts";

export default function Dashboard() {
  const [cars, setCars] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [checkoutReports, setCheckoutReports] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
    // Set up auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    console.log('Starting to load dashboard data...');
    setIsLoading(true);
    
    try {
        const [dashboardResponse, reservationsResponse, vehiclesResponse] = await Promise.all([
            djangoClient.get('/vehicles/dashboard/'),
            djangoClient.get('/reservations/reservations/'),
            djangoClient.get('/vehicles/cars/').catch(() => null),
        ]);

        if (dashboardResponse) {
            console.log('Setting dashboard stats:', dashboardResponse);
            setDashboardStats(dashboardResponse);
        }

        console.log('Raw APIs Responses:', {
            dashboard: dashboardResponse,
            reservations: reservationsResponse,
            vehicles: vehiclesResponse
        });

        // Extract dashboard stats - data is directly in dashboard object, not dashboard.status
        

        // Extract vehicles - data is in vehicles.results, not vehicles.status.results
        if (vehiclesResponse?.results) {
            console.log('Setting vehicles:', vehiclesResponse.results);
            setCars(vehiclesResponse.results);
        }

        // Extract reservations - data is in reservations.results, not reservations.status.results
        if (reservationsResponse?.results) {
            console.log('Setting reservations:', reservationsResponse.reservations.results);
            setReservations(reservationsResponse.reservations.results);
        }

        setLastUpdated(new Date());
        
    } catch (error) {
        console.error('Dashboard data loading failed:', error);
    } finally {
        console.log('Finished loading dashboard data');
        setIsLoading(false);
    }
  };

  const unallocatedReservations = reservations.filter(res => 
    !res.assigned_vehicle_id && 
    ['pending_confirmation', 'confirmed'].includes(res.status)
  );

  const getFleetStats = () => {
    // Use dashboard stats from the API if available
    if (dashboardStats) {
      return {
        total: dashboardStats.total_vehicles || 0,
        available: dashboardStats.available_vehicles || 0,
        checked_out: dashboardStats.checked_out_vehicles || 0,
        maintenance: dashboardStats.maintenance_vehicles || 0,
        in_process: 0,
        damaged: 0,
        out_of_service: dashboardStats.out_of_service_vehicles || 0
      };
    }

    // Fallback to calculating from actual cars array if dashboard stats not available
    const total = cars.length;
    const available = cars.filter(car => car.status === 'available').length;
    const checked_out = cars.filter(car => car.status === 'checked_out').length;
    const maintenance = cars.filter(car => car.status === 'maintenance_required').length;
    const out_of_service = cars.filter(car => car.status === 'out_of_service').length;

    const in_process = cars.filter(car =>
      ['in_inspection', 'in_cleaning', 'in_driving_check', 'in_service'].includes(car.status)
    ).length;

    const damaged = workflows.filter(w => w.damage_flagged && w.workflow_status === 'in_progress').length;

    return {
      total,
      available,
      checked_out,
      in_process,
      maintenance,
      damaged,
      out_of_service
    };
  };

  const getTodaysMetrics = () => {
    const today = new Date().toDateString();
    const stats = getFleetStats();

    // Checkouts today
    const checkouts_today = checkoutReports.filter(r =>
      new Date(r.created_date).toDateString() === today
    ).length;

    // Returns processed today (workflows that moved to completed status today)
    const returns_today = workflows.filter(w =>
      w.workflow_status === 'completed' &&
      w.last_updated &&
      new Date(w.last_updated).toDateString() === today
    ).length;

    // Fleet utilization percentage - handle division by zero
    const utilization = stats.total > 0 ? Math.round((stats.checked_out / stats.total) * 100) : 0;

    // Active damage reports
    const active_damage = workflows.filter(w => w.damage_flagged && w.workflow_status === 'in_progress').length;

    return {
      checkouts_today,
      returns_today,
      utilization,
      active_damage
    };
  };

  const getAnalyticsData = () => {
    const stats = getFleetStats();
    
    // Fleet utilization over the last 7 days
    const utilizationData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Use actual data when available
      const totalVehicles = stats.total > 0 ? stats.total : 1;
      const checkedOut = stats.checked_out;
      const utilization = totalVehicles > 0 ? (checkedOut / totalVehicles) * 100 : 0;

      utilizationData.push({
        date: format(date, 'MMM d'),
        utilization: Math.round(utilization),
        checkedOut: checkedOut,
        available: totalVehicles - checkedOut
      });
    }

    // Workflow stage distribution
    const stageDistribution = [
      { stage: 'Available', count: stats.available, color: '#10b981' },
      { stage: 'On Hire', count: stats.checked_out, color: '#f59e0b' },
      { stage: 'In Process', count: stats.in_process, color: '#3b82f6' },
      { stage: 'Maintenance', count: stats.maintenance, color: '#ef4444' },
      { stage: 'Out of Service', count: stats.out_of_service || 0, color: '#6b7280' }
    ];

    // Vehicle category breakdown using dashboard stats
    const categoryBreakdown = [];
    if (dashboardStats?.vehicles_by_type) {
      Object.entries(dashboardStats.vehicles_by_type).forEach(([category, count]) => {
        const shortCategory = category.length > 20 ? category.substring(0, 20) + '...' : category;
        categoryBreakdown.push({
          category: shortCategory,
          count: count,
          available: Math.floor(count * (stats.available / Math.max(stats.total, 1))),
          onHire: Math.floor(count * (stats.checked_out / Math.max(stats.total, 1)))
        });
      });
    } else {
      // Fallback to calculating from cars array
      const categoryMap = cars.reduce((acc, car) => {
        const category = car.category || 'Unknown';
        const shortCategory = category.length > 20 ? category.substring(0, 20) + '...' : category;

        if (!acc[shortCategory]) {
          acc[shortCategory] = { category: shortCategory, count: 0, available: 0, onHire: 0 };
        }
        acc[shortCategory].count++;

        if (car.status === 'available') acc[shortCategory].available++;
        if (car.status === 'checked_out') acc[shortCategory].onHire++;

        return acc;
      }, {});
      
      categoryBreakdown.push(...Object.values(categoryMap));
    }

    // Revenue trends placeholder - you may want to get this from another API endpoint
    const revenueData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      revenueData.push({
        month: format(date, 'MMM'),
        revenue: 0, // Set to 0 since we don't have real revenue data
        bookings: 0  // Set to 0 since we don't have real booking data
      });
    }

    return {
      utilizationData,
      stageDistribution,
      categoryBreakdown,
      revenueData
    };
  };

  const stats = getFleetStats();
  const todaysMetrics = getTodaysMetrics();
  const analyticsData = getAnalyticsData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 text-slate-600">
            <p className="text-base sm:text-lg">Real-time fleet management system</p>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadDashboardData}
                className="ml-2"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link to={createPageUrl("Checkout")} className="flex-1">
              <Button
                className="w-full text-white shadow-lg hover:shadow-xl transition-all"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)', // Fixed red gradient
                }}
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Checkout
              </Button>
            </Link>
            
            <Link to={createPageUrl("Calendar")} className="flex-1">
              <Button
                className="w-full text-white shadow-lg hover:shadow-xl transition-all"
                style={{
                  background: 'linear-gradient(135deg, #1e3a8a, #1e40af)', // Fixed navy gradient
                }}
                size="lg"
              >
                <BookmarkPlus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            </Link>
            
            <Link to={createPageUrl("Summary")} className="flex-1">
              <Button
                variant="outline"
                className="w-full border-2 hover:bg-slate-50 transition-colors"
                style={{
                  borderColor: '#1e3a8a', // Fixed navy border
                  color: '#1e3a8a'       // Fixed navy text
                }}
                size="lg"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Summary Screen
              </Button>
            </Link>
          </div>
        </motion.div>
        
        {/* Unallocated Reservations Alert */}
        {unallocatedReservations.length > 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-lg border-2 border-amber-400 bg-amber-50">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-900 text-lg">Action Required</h3>
                    <p className="text-amber-800">
                      You have <span className="font-bold text-xl">{unallocatedReservations.length}</span> reservation(s) that need a vehicle assigned.
                    </p>
                  </div>
                </div>
                <Link to={createPageUrl("Reservations")}>
                  <Button 
                    className="bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto shadow-md hover:shadow-lg transition-all"
                  >
                    Allocate Vehicles
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Fleet Status Cards */}
        <FleetStatusCards stats={stats} isLoading={isLoading} />

        {/* Analytics Charts Section */}
        <AnalyticsCharts
          analyticsData={analyticsData}
          todaysMetrics={todaysMetrics}
          isLoading={isLoading}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Workflow Summary */}
          <div className="xl:col-span-2">
            <WorkflowSummary
              workflows={workflows}
              cars={cars}
              isLoading={isLoading}
              onRefresh={loadDashboardData}
            />
          </div>

          {/* Right Column - Quick Actions & Real-time Updates */}
          <div className="space-y-6">
            <QuickActions />
            <RealtimeUpdates workflows={workflows} cars={cars} />

            {/* Performance Metrics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900 text-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Today's Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Checkouts Today</span>
                    <span className="font-bold text-slate-900">
                      {todaysMetrics.checkouts_today}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Returns Processed</span>
                    <span className="font-bold text-slate-900">
                      {todaysMetrics.returns_today}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Fleet Utilization</span>
                    <span className="font-bold text-emerald-600">
                      {todaysMetrics.utilization}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Active Damage Reports</span>
                    <span className={`font-bold ${todaysMetrics.active_damage > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {todaysMetrics.active_damage}
                    </span>
                  </div>
                  
                  {/* Additional Dashboard Stats */}
                  {dashboardStats && (
                    <>
                      <div className="flex justify-between items-center border-t pt-4">
                        <span className="text-slate-600">Service Due</span>
                        <span className={`font-bold ${dashboardStats.service_due_count > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {dashboardStats.service_due_count || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Overdue Service</span>
                        <span className={`font-bold ${dashboardStats.overdue_service_count > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {dashboardStats.overdue_service_count || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Avg Fuel Level</span>
                        <span className="font-bold text-slate-900">
                          {Math.round(dashboardStats.average_fuel_level || 0)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Avg Mileage</span>
                        <span className="font-bold text-slate-900">
                          {Math.round(dashboardStats.average_mileage || 0).toLocaleString()} km
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}