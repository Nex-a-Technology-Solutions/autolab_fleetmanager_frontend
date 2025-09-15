
import React, { useState, useEffect } from "react";
import { Car, VehicleWorkflow, CheckoutReport } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Car as CarIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Sparkles,
  TestTubeDiagonal,
  ShieldCheck,
  Search,
  RefreshCw,
  Edit3,
  Filter,
  Calendar,
  MapPin
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Summary() {
  const [workflows, setWorkflows] = useState([]);
  const [cars, setCars] = useState([]);
  const [checkouts, setCheckouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadSummaryData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSummaryData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSummaryData = async () => {
    setIsLoading(true);
    try {
      const [workflowData, carsData, checkoutData] = await Promise.all([
        VehicleWorkflow.list('-last_updated'),
        Car.list(),
        CheckoutReport.list('-created_date')
      ]);
      setWorkflows(workflowData);
      setCars(carsData);
      setCheckouts(checkoutData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading summary data:", error);
    }
    setIsLoading(false);
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const car = cars.find(c => c.id === workflow.car_id);
    if (!car) return false;

    // Stage filter
    if (filterStage !== "all" && workflow.current_stage !== filterStage) return false;

    // Search filter
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      return (
        car.license_plate?.toLowerCase().includes(searchTerm) ||
        car.make?.toLowerCase().includes(searchTerm) ||
        car.model?.toLowerCase().includes(searchTerm)
      );
    }

    return true;
  });

  const stageIcons = {
    'checked_out': Clock,
    'returned': Clock,
    'washing': Sparkles,
    'driving_test': TestTubeDiagonal,
    'servicing': Wrench,
    'approval': ShieldCheck,
    'ready_for_hire': CheckCircle2,
    'damaged': AlertTriangle
  };

  const stageColors = {
    'checked_out': 'bg-amber-100 text-amber-800 border-amber-200',
    'returned': 'bg-blue-100 text-blue-800 border-blue-200',
    'washing': 'bg-purple-100 text-purple-800 border-purple-200',
    'driving_test': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'servicing': 'bg-orange-100 text-orange-800 border-orange-200',
    'approval': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'ready_for_hire': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'damaged': 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Vehicle Summary Screen
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-slate-600">
              <p className="text-sm md:text-base">Real-time workflow tracking for all vehicles</p>
              <div className="flex items-center gap-2 text-xs md:text-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>Live • Updated {lastUpdated.toLocaleTimeString()}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={loadSummaryData}
                  className="ml-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search by license plate, make, or model..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['all', 'returned', 'washing', 'driving_test', 'servicing', 'approval', 'damaged'].map((stage) => (
                    <Button
                      key={stage}
                      variant={filterStage === stage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStage(stage)}
                      className="flex items-center gap-1 text-xs"
                    >
                      {stage !== 'all' && React.createElement(stageIcons[stage], { className: "w-3 h-3" })}
                      {stage === 'all' ? 'All' : stage.replace(/_/g, ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="grid gap-4">
              {Array(6).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 md:p-6">
                    <div className="h-4 bg-slate-200 rounded mb-2 w-1/4"></div>
                    <div className="h-6 bg-slate-200 rounded mb-4 w-1/2"></div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-slate-200 rounded w-20"></div>
                      <div className="h-8 bg-slate-200 rounded w-24"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="p-8 md:p-12 text-center">
                <CarIcon className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-2">No workflows found</h3>
                <p className="text-slate-600 text-sm md:text-base">
                  {searchQuery || filterStage !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'No vehicles are currently in the workflow system'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredWorkflows.map((workflow, index) => {
                const car = cars.find(c => c.id === workflow.car_id);
                // Updated to link checkout by workflow's checkout_report_id
                const checkout = checkouts.find(c => c.id === workflow.checkout_report_id);
                if (!car) return null;
                
                const StageIcon = stageIcons[workflow.damage_flagged ? 'damaged' : workflow.current_stage] || Clock;
                const stageColor = stageColors[workflow.damage_flagged ? 'damaged' : workflow.current_stage] || 'bg-gray-100 text-gray-800 border-gray-200';
                
                return (
                  <motion.div
                    key={workflow.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`shadow-lg border-0 bg-white/90 backdrop-blur-sm transition-all hover:shadow-xl ${
                      workflow.damage_flagged ? 'ring-2 ring-red-200' : ''
                    }`}>
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                              <h3 className="text-lg md:text-xl font-bold text-slate-900">
                                {car.make} {car.model}
                              </h3>
                              <div className="flex items-center gap-1 font-mono text-sm bg-slate-100 px-3 py-1 rounded-full">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {car.license_plate}
                              </div>
                              {workflow.damage_flagged && (
                                <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                                  <AlertTriangle className="w-3 h-3" />
                                  DAMAGE REPORTED
                                </div>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 text-sm text-slate-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <div>
                                  <p className="text-xs text-slate-500">Return Date</p>
                                  <p className="font-medium">
                                    {/* Changed to access return_date from checkin_data */}
                                    {workflow.checkin_data?.return_date ? format(new Date(workflow.checkin_data.return_date), 'MMM d, h:mm a') : 'Not set'}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Vehicle Type</p>
                                <p className="font-medium capitalize">{car.category?.replace(/_/g, ' ') || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Customer</p>
                                <p className="font-medium">{checkout?.customer_name || 'Not available'}</p>
                              </div>
                            </div>
                          </div>
                          
                          <Badge className={`${stageColor} border font-medium px-3 md:px-4 py-1 md:py-2 flex items-center gap-2 text-sm self-start`}>
                            <StageIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">
                              {workflow.current_stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </Badge>
                        </div>

                        {/* Workflow Progress */}
                        <div className="mb-4">
                          <div className="flex gap-1 mb-2">
                            {['returned', 'washing', 'driving_test', 'servicing', 'approval'].map((stage, idx) => {
                              const isCompleted = workflow.stages_completed?.includes(stage);
                              const isCurrent = workflow.current_stage === stage;
                              
                              return (
                                <div
                                  key={stage}
                                  className={`flex-1 h-2 rounded-full transition-all ${
                                    isCompleted 
                                      ? 'bg-emerald-400' 
                                      : isCurrent 
                                      ? 'bg-blue-400'
                                      : 'bg-slate-200'
                                  }`}
                                />
                              );
                            })}
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Returned</span>
                            <span>Wash/Check</span>
                            <span>Drive Test</span>
                            <span>Service</span>
                            <span>Approval</span>
                          </div>
                        </div>

                        {/* Notes Section */}
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">Communication Notes:</span>
                            <Button variant="ghost" size="sm">
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-slate-600">
                            {workflow.notes || 'No team notes available. Click edit to add important messages.'}
                          </p>
                        </div>

                        {/* Priority and Staff Assignment */}
                        <div className="flex justify-between items-center mt-4 text-xs text-slate-500">
                          <div className="flex gap-4">
                            {workflow.priority && workflow.priority !== 'normal' && (
                              <span className={`px-2 py-1 rounded ${
                                workflow.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                workflow.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {workflow.priority.toUpperCase()} PRIORITY
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p>Last updated: {new Date(workflow.last_updated || workflow.created_date).toLocaleString()}</p>
                            {workflow.updated_by && <p>by {workflow.updated_by}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
