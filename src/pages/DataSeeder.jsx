
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Database, 
  Code,
  FileJson,
  FileCode2
} from "lucide-react";
import * as entities from '@/api/entities';
import { User } from "@/api/entities";
import RoleGuard from "../components/layout/RoleGuard";
import { cn } from '@/lib/utils';

// The source code is now stored here directly to avoid invalid file path errors.
const sourceCode = {
  'pages/Dashboard.js': `
import React, { useState, useEffect } from "react";
import { Car, CheckoutReport, VehicleWorkflow, VehicleType } from "@/api/entities";
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
  const [checkoutReports, setCheckoutReports] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = new useState(new Date());

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    // ... function implementation
  };
  
  // ... more code
  `,
  'pages/Checkout.js': `
import React, { useState, useEffect } from "react";
import { CheckoutReport, Car as CarEntity } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stepper, Step, StepLabel, StepContent } from "@/components/ui/stepper";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Car, User, ClipboardList, FileCheck } from "lucide-react";
import CarSelectionStep from "../components/checkout/CarSelectionStep";
import CustomerInfoStep from "../components/checkout/CustomerInfoStep";
import InspectionStep from "../components/checkout/InspectionStep";
import SummaryStep from "../components/checkout/SummaryStep";

const steps = [
  { label: "Select Vehicle", icon: Car },
  { label: "Customer Info", icon: User },
  { label: "Pre-Hire Inspection", icon: ClipboardList },
  { label: "Confirmation", icon: FileCheck },
];

export default function Checkout() {
  const [activeStep, setActiveStep] = useState(0);
  const [checkoutData, setCheckoutData] = useState({
    car_id: null,
    car_details: null,
    fleet_id: null,
    customer_name: "",
    evaluator_name: "",
    expected_return_date: null,
    // ... more properties
  });

  const handleNext = (data) => {
    setCheckoutData(prev => ({ ...prev, ...data }));
    setActiveStep(prev => prev + 1);
  };
  
  // ... more code
  `,
  'components/quoting/QuoteBuilder.js': `
import React, { useState, useEffect, useCallback } from 'react';
import { Location, VehicleType, PricingRule, Quote } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Plus, Trash2, Calendar as CalendarIcon, Send, Loader2, CheckCircle, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import QuotePreview from './QuotePreview';

export default function QuoteBuilder() {
  const [quote, setQuote] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    // ... more properties
  });
  
  // ... more code
  `,
};

// Filter out non-entity exports (like 'default') and only keep actual entity classes
const entityNames = Object.keys(entities)
  .filter(name => name !== 'default' && entities[name] && typeof entities[name].schema === 'function')
  .sort();

export default function DataSeeder() {
  const [schemas, setSchemas] = useState({});
  const [selectedEntity, setSelectedEntity] = useState(entityNames[0]);
  const [selectedFile, setSelectedFile] = useState(Object.keys(sourceCode)[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = React.useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
        // Fallback for demonstration or if user fetching fails
        setCurrentUser({ role: 'user', name: 'Guest' }); 
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const loadSchemas = async () => {
      setIsLoading(true);
      const loadedSchemas = {};
      for (const entityName of entityNames) {
        try {
          const entity = entities[entityName];
          if (entity && typeof entity.schema === 'function') {
            const schema = await entity.schema();
            loadedSchemas[entityName] = schema;
          } else {
            loadedSchemas[entityName] = { error: `${entityName} does not have a schema method.` };
          }
        } catch (error) {
          console.error(`Error loading schema for ${entityName}:`, error);
          loadedSchemas[entityName] = { error: `Could not load schema for ${entityName}: ${error.message}` };
        }
      }
      setSchemas(loadedSchemas);
      setIsLoading(false);
    };
    loadSchemas();
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{color: 'var(--wwfh-navy)'}}>
            Developer Reference
          </h1>
          <p className="text-lg text-slate-600">Explore data schemas, models, and source code.</p>
        </motion.div>

        <RoleGuard requiredRole="admin" userRole={currentUser?.role}>
          <Tabs defaultValue="schemas">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="schemas" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Entity Schemas
              </TabsTrigger>
              <TabsTrigger value="source" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Source Code Viewer
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="schemas">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Data Models & Schemas</CardTitle>
                  <CardDescription>
                    Select an entity to view its JSON schema definition. This defines the structure of the data stored in the database.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                      <h3 className="font-semibold mb-3">Entities</h3>
                      <ScrollArea className="h-96 border rounded-lg">
                        <div className="p-2">
                          {entityNames.map(name => (
                            <button
                              key={name}
                              onClick={() => setSelectedEntity(name)}
                              className={cn(
                                "w-full text-left p-2 rounded-md text-sm transition-colors",
                                {
                                  "bg-red-100 text-red-800 font-semibold": selectedEntity === name,
                                  "hover:bg-slate-100": selectedEntity !== name,
                                }
                              )}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    <div className="md:col-span-2">
                       <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <FileJson className="w-5 h-5" />
                        Schema: {selectedEntity}
                      </h3>
                      <ScrollArea className="h-96 border rounded-lg bg-slate-900 text-white font-mono text-sm">
                        <pre className="p-4">
                          {isLoading 
                            ? 'Loading schemas...'
                            : JSON.stringify(schemas[selectedEntity], null, 2)
                          }
                        </pre>
                      </ScrollArea>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="source">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                 <CardHeader>
                  <CardTitle>Source Code Viewer</CardTitle>
                  <CardDescription>
                    A read-only view of key source code files for reference. This content is for informational purposes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Select a file to view:</label>
                        <Select value={selectedFile} onValueChange={setSelectedFile}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(sourceCode).map(filename => (
                              <SelectItem key={filename} value={filename}>
                                {filename}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                         <h3 className="font-semibold flex items-center gap-2">
                          <FileCode2 className="w-5 h-5" />
                          Content: {selectedFile}
                        </h3>
                        <ScrollArea className="h-[60vh] border rounded-lg bg-slate-900 text-white font-mono text-sm">
                          <pre className="p-4">{sourceCode[selectedFile]}</pre>
                        </ScrollArea>
                      </div>
                   </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </RoleGuard>
      </div>
    </div>
  );
}
