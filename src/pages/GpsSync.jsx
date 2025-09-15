import React, { useState, useEffect } from 'react';
import { GpsData, Car, ServiceTrigger, ServiceRecord } from '@/api/entities';
import { UploadFile, ExtractDataFromUploadedFile, InvokeLLM } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Satellite, 
  Car as CarIcon,
  Wrench,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  RefreshCw,
  Download,
  Link,
  Settings,
  MapPin,
  Gauge,
  Fuel,
  Thermometer,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function GpsSync() {
  const [activeTab, setActiveTab] = useState("upload");
  const [cars, setCars] = useState([]);
  const [recentGpsData, setRecentGpsData] = useState([]);
  const [serviceTriggers, setServiceTriggers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Upload states
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [carsData, gpsData, triggersData] = await Promise.all([
        Car.list(),
        GpsData.list('-timestamp', 50),
        ServiceTrigger.list('-created_date')
      ]);
      setCars(carsData);
      setRecentGpsData(gpsData);
      setServiceTriggers(triggersData);
    } catch (error) {
      console.error("Error loading GPS sync data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv',
      'text/plain'
    ];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx?|csv|txt)$/i)) {
      alert('Please upload an Excel (.xlsx, .xls), CSV, or TXT file');
      return;
    }

    setFile(selectedFile);
    setUploadResults(null);
  };

  const processGpsFile = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(10);
    
    try {
      // Step 1: Upload file
      const { file_url } = await UploadFile({ file });
      setUploadProgress(30);

      // Step 2: Extract data using AI
      const extractResult = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            gps_records: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  vehicle_id: { type: "string" },
                  fleet_id: { type: "string" },
                  timestamp: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  speed: { type: "number" },
                  heading: { type: "number" },
                  odometer: { type: "number" },
                  fuel_level: { type: "number" },
                  engine_status: { type: "string" },
                  engine_hours: { type: "number" },
                  diagnostic_codes: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      if (extractResult.status === 'error') {
        throw new Error(extractResult.details);
      }

      setUploadProgress(60);

      // Step 3: Process and enhance data with AI
      await processGpsRecords(extractResult.output.gps_records);
      
    } catch (error) {
      console.error('GPS file processing error:', error);
      alert('Failed to process GPS file: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const processGpsRecords = async (gpsRecords) => {
    setProcessing(true);
    setUploadProgress(70);

    try {
      const results = {
        processed: 0,
        matched: 0,
        service_triggers: 0,
        errors: []
      };

      // Process records in batches
      const batchSize = 50;
      for (let i = 0; i < gpsRecords.length; i += batchSize) {
        const batch = gpsRecords.slice(i, i + batchSize);
        
        for (const record of batch) {
          try {
            // Find matching car
            const car = cars.find(c => 
              c.fleet_id === record.fleet_id || 
              c.id === record.vehicle_id ||
              c.license_plate === record.vehicle_id
            );

            if (!car) {
              results.errors.push(`No matching vehicle found for ID: ${record.vehicle_id || record.fleet_id}`);
              continue;
            }

            // Create GPS data record
            const gpsDataRecord = {
              car_id: car.id,
              fleet_id: car.fleet_id,
              timestamp: record.timestamp,
              latitude: record.latitude,
              longitude: record.longitude,
              speed: record.speed || 0,
              heading: record.heading || 0,
              odometer: record.odometer,
              engine_status: record.engine_status || 'unknown',
              fuel_level: record.fuel_level,
              engine_hours: record.engine_hours,
              diagnostic_codes: record.diagnostic_codes || [],
              data_source: 'uploaded_file',
              raw_data: record
            };

            await GpsData.create(gpsDataRecord);
            results.processed++;
            results.matched++;

            // Update car's current GPS data
            await Car.update(car.id, {
              gps_latitude: record.latitude,
              gps_longitude: record.longitude,
              gps_speed: record.speed || 0,
              gps_heading: record.heading || 0,
              mileage: record.odometer || car.mileage,
              fuel_level: record.fuel_level || car.fuel_level,
              gps_last_update: record.timestamp,
              gps_engine_on: record.engine_status === 'on'
            });

            // Check for service triggers
            await checkServiceTriggers(car, record, results);

          } catch (error) {
            results.errors.push(`Error processing record for ${record.vehicle_id}: ${error.message}`);
          }
        }

        // Update progress
        setUploadProgress(70 + (i / gpsRecords.length) * 25);
      }

      setUploadProgress(100);
      setUploadResults(results);
      
      // Reload data to show updates
      await loadData();

    } catch (error) {
      console.error('Error processing GPS records:', error);
      alert('Error processing GPS records: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const checkServiceTriggers = async (car, gpsRecord, results) => {
    try {
      // Check mileage-based service triggers
      if (gpsRecord.odometer && car.last_service_date) {
        const lastServiceRecord = await ServiceRecord.filter({ car_id: car.id }, '-service_date', 1);
        
        if (lastServiceRecord.length > 0) {
          const lastService = lastServiceRecord[0];
          const mileageSinceService = gpsRecord.odometer - (lastService.mileage_at_service || 0);
          
          // Trigger service if more than 10,000km since last service
          if (mileageSinceService > 10000) {
            const existingTrigger = serviceTriggers.find(t => 
              t.car_id === car.id && t.status === 'triggered'
            );

            if (!existingTrigger) {
              await ServiceTrigger.create({
                car_id: car.id,
                trigger_type: 'mileage_due',
                current_mileage: gpsRecord.odometer,
                mileage_at_last_service: lastService.mileage_at_service,
                days_since_last_service: Math.floor((new Date() - new Date(lastService.service_date)) / (1000 * 60 * 60 * 24)),
                last_service_date: lastService.service_date,
                status: 'triggered'
              });
              results.service_triggers++;
            }
          }
        }
      }

      // Check diagnostic codes for immediate attention
      if (gpsRecord.diagnostic_codes && gpsRecord.diagnostic_codes.length > 0) {
        const criticalCodes = ['P0001', 'P0002', 'P0003']; // Example critical codes
        const hasCriticalCode = gpsRecord.diagnostic_codes.some(code => criticalCodes.includes(code));
        
        if (hasCriticalCode) {
          await ServiceTrigger.create({
            car_id: car.id,
            trigger_type: 'diagnostic_alert',
            current_mileage: gpsRecord.odometer,
            status: 'triggered',
            requires_human_intervention: true,
            intervention_reason: `Critical diagnostic codes detected: ${gpsRecord.diagnostic_codes.join(', ')}`
          });
          results.service_triggers++;
        }
      }

    } catch (error) {
      console.error('Error checking service triggers:', error);
    }
  };

  const generateSampleTemplate = () => {
    const sampleData = [
      ['Fleet ID', 'Timestamp', 'Latitude', 'Longitude', 'Speed (km/h)', 'Heading', 'Odometer (km)', 'Fuel Level (%)', 'Engine Status', 'Engine Hours'],
      ['FL001', '2024-01-15 09:30:00', '-31.9523', '115.8613', '65', '180', '45230', '78', 'on', '2340'],
      ['FL002', '2024-01-15 09:30:00', '-31.9580', '115.8701', '45', '90', '67890', '45', 'on', '3456'],
      ['FL003', '2024-01-15 09:30:00', '-31.9601', '115.8789', '0', '0', '23456', '89', 'off', '1234']
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gps_data_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading GPS sync data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            GPS Data Sync & Service Integration
          </h1>
          <p className="text-slate-600 text-lg">Upload GPS tracking data and automatically trigger service requirements</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Data
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Satellite className="w-4 h-4" />
              Recent GPS Data
            </TabsTrigger>
            <TabsTrigger value="triggers" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Service Triggers
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Sync Settings
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    Upload GPS Tracking Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      Upload GPS data files (CSV, Excel, or TXT). The system will automatically match vehicles by Fleet ID and create service triggers based on mileage and diagnostic codes.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="gps-file">Select GPS Data File</Label>
                      <Input
                        id="gps-file"
                        type="file"
                        accept=".csv,.xlsx,.xls,.txt"
                        onChange={handleFileUpload}
                        className="mt-2"
                      />
                    </div>

                    {file && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-blue-900">{file.name}</p>
                            <p className="text-sm text-blue-700">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            onClick={processGpsFile}
                            disabled={uploading || processing}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {uploading || processing ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Process File
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {(uploading || processing) && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Processing GPS data...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="w-full" />
                      </div>
                    )}

                    {uploadResults && (
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <h3 className="font-medium text-green-900">Upload Complete</h3>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="font-medium text-green-900">{uploadResults.processed}</div>
                              <div className="text-green-700">Records Processed</div>
                            </div>
                            <div>
                              <div className="font-medium text-green-900">{uploadResults.matched}</div>
                              <div className="text-green-700">Vehicles Matched</div>
                            </div>
                            <div>
                              <div className="font-medium text-green-900">{uploadResults.service_triggers}</div>
                              <div className="text-green-700">Service Triggers</div>
                            </div>
                            <div>
                              <div className="font-medium text-red-600">{uploadResults.errors.length}</div>
                              <div className="text-red-500">Errors</div>
                            </div>
                          </div>
                          {uploadResults.errors.length > 0 && (
                            <div className="mt-4">
                              <details>
                                <summary className="cursor-pointer text-red-700 font-medium">View Errors</summary>
                                <div className="mt-2 space-y-1">
                                  {uploadResults.errors.slice(0, 10).map((error, index) => (
                                    <p key={index} className="text-sm text-red-600">• {error}</p>
                                  ))}
                                  {uploadResults.errors.length > 10 && (
                                    <p className="text-sm text-red-600">... and {uploadResults.errors.length - 10} more errors</p>
                                  )}
                                </div>
                              </details>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={generateSampleTemplate}>
                        <Download className="w-4 h-4 mr-2" />
                        Download Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recent GPS Data Tab */}
          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Satellite className="w-5 h-5" />
                  Recent GPS Data ({recentGpsData.length} records)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {recentGpsData.map((record, index) => {
                    const car = cars.find(c => c.id === record.car_id);
                    return (
                      <div key={record.id || index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <CarIcon className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">{car?.make} {car?.model}</span>
                            <Badge variant="outline">{record.fleet_id}</Badge>
                          </div>
                          <div className="text-right text-sm text-slate-600">
                            {record.timestamp ? format(new Date(record.timestamp), 'MMM d, HH:mm') : 'No timestamp'}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{record.latitude?.toFixed(4)}, {record.longitude?.toFixed(4)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Gauge className="w-3 h-3 text-slate-400" />
                            <span>{record.speed || 0} km/h</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Fuel className="w-3 h-3 text-slate-400" />
                            <span>{record.fuel_level || 'N/A'}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-slate-400" />
                            <span className="capitalize">{record.engine_status || 'unknown'}</span>
                          </div>
                        </div>
                        {record.odometer && (
                          <div className="mt-2 text-sm text-slate-600">
                            Odometer: {record.odometer.toLocaleString()} km
                          </div>
                        )}
                        {record.diagnostic_codes && record.diagnostic_codes.length > 0 && (
                          <div className="mt-2">
                            <Badge className="bg-red-100 text-red-800">
                              {record.diagnostic_codes.length} Diagnostic Code{record.diagnostic_codes.length > 1 ? 's' : ''}
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service Triggers Tab */}
          <TabsContent value="triggers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Automated Service Triggers ({serviceTriggers.filter(t => t.status === 'triggered').length} active)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {serviceTriggers.filter(t => t.status === 'triggered').map(trigger => {
                    const car = cars.find(c => c.id === trigger.car_id);
                    return (
                      <div key={trigger.id} className="p-4 border-l-4 border-orange-400 bg-orange-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <CarIcon className="w-4 h-4 text-orange-600" />
                              <span className="font-medium">{car?.make} {car?.model}</span>
                              <Badge variant="outline">{car?.fleet_id}</Badge>
                            </div>
                            <p className="text-sm text-orange-700 mt-1">
                              {trigger.trigger_type === 'mileage_due' 
                                ? `Service due - ${trigger.current_mileage - trigger.mileage_at_last_service} km since last service`
                                : trigger.intervention_reason || 'Service required'
                              }
                            </p>
                          </div>
                          <Badge className="bg-orange-100 text-orange-800">
                            {trigger.trigger_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        {trigger.requires_human_intervention && (
                          <Alert className="mt-2">
                            <AlertTriangle className="w-4 h-4" />
                            <AlertDescription>
                              Requires immediate attention: {trigger.intervention_reason}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    );
                  })}
                  
                  {serviceTriggers.filter(t => t.status === 'triggered').length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No active service triggers</p>
                      <p className="text-sm">Service triggers will appear here when vehicles need maintenance</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  GPS Sync Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Configure automatic service trigger thresholds and GPS data processing rules.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Service Trigger Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Mileage Service Interval (km)</Label>
                        <Input defaultValue="10000" />
                        <p className="text-xs text-slate-600 mt-1">Trigger service when vehicle exceeds this mileage since last service</p>
                      </div>
                      <div>
                        <Label>Time-based Service Interval (months)</Label>
                        <Input defaultValue="6" />
                        <p className="text-xs text-slate-600 mt-1">Trigger service after this many months regardless of mileage</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">GPS Data Processing</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Data Retention Period (days)</Label>
                        <Input defaultValue="365" />
                        <p className="text-xs text-slate-600 mt-1">How long to keep detailed GPS records</p>
                      </div>
                      <div>
                        <Label>Critical Diagnostic Codes</Label>
                        <Input defaultValue="P0001,P0002,P0003,P0171,P0174" />
                        <p className="text-xs text-slate-600 mt-1">Comma-separated list of codes that trigger immediate service</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Settings className="w-4 h-4 mr-2" />
                      Save Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}