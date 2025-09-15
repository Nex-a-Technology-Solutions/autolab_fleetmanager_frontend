
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Database, 
  Calendar,
  FileSpreadsheet,
  Smartphone,
  Globe,
  Settings,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";

import ExportManager from '../components/integrations/ExportManager';
import CalendarExport from '../components/integrations/CalendarExport'; // Changed from CalendarHelper
import RealTimeSync from '../components/integrations/RealTimeSync';
import BackendIntegrations from '../components/integrations/BackendIntegrations';

const integrationCards = [
  {
    title: "Data Export Manager",
    description: "Export your fleet data in various formats for external systems",
    icon: FileSpreadsheet,
    status: "active",
    component: "export"
  },
  {
    title: "Calendar Integration Helper",
    description: "Generate calendar feeds and booking links for external systems",
    icon: Calendar,
    status: "active", 
    component: "calendar"
  },
  {
    title: "GPS Data Sync",
    description: "Sync GPS location data from your tracking system",
    icon: Database,
    status: "active",
    component: "gps"
  },
  {
    title: "Backend Functions",
    description: "Advanced server-side integrations and automations",
    icon: Zap,
    status: "beta",
    component: "backend"
  }
];

export default function Integrations() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{color: 'var(--wwfh-navy)'}}>
            Business Integrations
          </h1>
          <p className="text-slate-600 text-lg">
            Connect FleetFlow with your existing business systems and external tools.
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="overview">
              <Globe className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="export">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Data Export
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="gps">
              <Database className="w-4 h-4 mr-2" />
              GPS Sync
            </TabsTrigger>
            <TabsTrigger value="backend">
              <Zap className="w-4 h-4 mr-2" />
              Backend
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-6 md:grid-cols-2"
            >
              {integrationCards.map((integration, index) => (
                <motion.div
                  key={integration.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-300"
                    onClick={() => setActiveTab(integration.component)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                            <integration.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{integration.title}</CardTitle>
                          </div>
                        </div>
                        <Badge 
                          variant={integration.status === 'active' ? 'default' : 'secondary'}
                          className={integration.status === 'active' ? 'bg-emerald-100 text-emerald-800' : ''}
                        >
                          {integration.status === 'active' ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                          ) : (
                            <><AlertTriangle className="w-3 h-3 mr-1" /> Beta</>
                          )}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600">{integration.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Integration Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Standard Integrations</h4>
                      <p className="text-blue-800 text-sm">
                        Data Export and Calendar integrations work out of the box with any FleetFlow account.
                      </p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg">
                      <h4 className="font-semibold text-amber-900 mb-2">Advanced Integrations</h4>
                      <p className="text-amber-800 text-sm">
                        Backend Functions require enabling server-side capabilities. Contact support for setup assistance.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="export" className="mt-6">
            <ExportManager />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <CalendarExport /> {/* Changed from CalendarHelper */}
          </TabsContent>

          <TabsContent value="gps" className="mt-6">
            <RealTimeSync />
          </TabsContent>

          <TabsContent value="backend" className="mt-6">
            <BackendIntegrations />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
