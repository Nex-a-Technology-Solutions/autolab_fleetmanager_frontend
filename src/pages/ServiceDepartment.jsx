import React, { useState, useEffect } from 'react';
import { ServiceTrigger, ServiceSupplier, ServiceBooking, Car, WeeklyServiceReport } from '@/api/entities';
import { User } from "@/api/entities";
import RoleGuard from "../components/layout/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wrench, 
  AlertTriangle, 
  Calendar, 
  Users, 
  FileText, 
  Settings,
  Clock,
  CheckCircle,
  Mail,
  Phone
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

import ServiceTriggersTab from "../components/service/ServiceTriggersTab";
import ServiceBookingsTab from "../components/service/ServiceBookingsTab";
import ServiceSuppliersTab from "../components/service/ServiceSuppliersTab";
import WeeklyReportsTab from "../components/service/WeeklyReportsTab";
import ServiceSettingsTab from "../components/service/ServiceSettingsTab";

export default function ServiceDepartment() {
  const [activeTab, setActiveTab] = useState("triggers");
  const [currentUser, setCurrentUser] = useState(null);
  const [serviceStats, setServiceStats] = useState({
    pending_triggers: 0,
    awaiting_response: 0,
    scheduled_services: 0,
    overdue_reminders: 0
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
        setCurrentUser({ role: 'user' });
      }
    };
    loadUser();
    loadServiceStats();
  }, []);

  const loadServiceStats = async () => {
    try {
      const triggers = await ServiceTrigger.list();
      
      const stats = {
        pending_triggers: triggers.filter(t => t.status === 'triggered').length,
        awaiting_response: triggers.filter(t => t.status === 'awaiting_client_response').length,
        scheduled_services: triggers.filter(t => t.status === 'scheduled').length,
        overdue_reminders: triggers.filter(t => 
          t.status === 'awaiting_client_response' && 
          t.last_reminder_sent && 
          new Date() - new Date(t.last_reminder_sent) > 48 * 60 * 60 * 1000 // 48 hours
        ).length
      };
      
      setServiceStats(stats);
    } catch (error) {
      console.error("Error loading service stats:", error);
    }
  };

  const serviceStatsCards = [
    {
      title: "Pending Service Triggers",
      value: serviceStats.pending_triggers,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    },
    {
      title: "Awaiting Client Response",
      value: serviceStats.awaiting_response,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200"
    },
    {
      title: "Scheduled Services",
      value: serviceStats.scheduled_services,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Overdue Reminders",
      value: serviceStats.overdue_reminders,
      icon: Mail,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{color: 'var(--wwfh-navy)'}}>
            Service Department
          </h1>
          <p className="text-lg text-slate-600">
            Automated service scheduling, supplier management, and client communication.
          </p>
        </motion.div>

        <RoleGuard requiredRole="operations" userRole={currentUser?.role}>
          {/* Service Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {serviceStatsCards.map((stat, index) => (
                <Card key={stat.title} className={`${stat.bgColor} ${stat.borderColor} border-2 shadow-lg`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">
                          {stat.title}
                        </p>
                        <p className={`text-3xl font-bold ${stat.color}`}>
                          {stat.value}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.color} bg-white/50`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                <TabsTrigger value="triggers" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Service Triggers
                </TabsTrigger>
                <TabsTrigger value="bookings" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Active Bookings
                </TabsTrigger>
                <TabsTrigger value="suppliers" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Suppliers
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Weekly Reports
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="triggers">
                <ServiceTriggersTab onStatsUpdate={loadServiceStats} />
              </TabsContent>

              <TabsContent value="bookings">
                <ServiceBookingsTab />
              </TabsContent>

              <TabsContent value="suppliers">
                <ServiceSuppliersTab />
              </TabsContent>

              <TabsContent value="reports">
                <WeeklyReportsTab />
              </TabsContent>

              <TabsContent value="settings">
                <ServiceSettingsTab />
              </TabsContent>
            </Tabs>
          </motion.div>
        </RoleGuard>
      </div>
    </div>
  );
}