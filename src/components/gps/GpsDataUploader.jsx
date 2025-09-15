import React, { useState } from 'react';
import { GpsData, Car, ServiceTrigger } from '@/api/entities';
import { UploadFile, ExtractDataFromUploadedFile, InvokeLLM } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Satellite, 
  Car as CarIcon,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Brain,
  Wrench,
  Loader2
} from "lucide-react";

export default function GpsDataUploader({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  const handleFileSelect = (e) => {
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
      alert('Please upload a CSV, Excel, or text file');
      return;
    }

    setFile(selectedFile);
    setResults(null);
  };

  const processGpsFile = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(10);

    try {
      // Step 1: Upload file
      const { file_url } = await UploadFile({ file });
      setProgress(25);

      // Step 2: Use AI to analyze and extract GPS data
      const aiPrompt = `
        Analyze this GPS tracking data file and extract vehicle location and diagnostic information.
        
        I need you to identify and extract:
        1. Vehicle identifiers (Fleet ID, VIN, License Plate, etc.)
        2. GPS coordinates (latitude, longitude)
        3. Timestamps
        4. Vehicle telemetry (speed, heading, odometer, fuel level)
        5. Engine data (status, hours, diagnostics)
        6. Any maintenance alerts or diagnostic codes
        
        Map the data to our GPS tracking schema and return standardized records.
        If the data format is unclear, make reasonable assumptions based on common GPS tracking formats.
      `;

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
                  vehicle_identifier: { type: "string", description: "Fleet ID, VIN, or license plate" },
                  timestamp: { type: "string", description: "ISO timestamp or parseable date string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  speed: { type: "number" },
                  heading: { type: "number" },
                  odometer: { type: "number" },
                  fuel_level: { type: "number" },
                  engine_status: { type: "string" },
                  engine_hours: { type: "number" },
                  diagnostic_codes: { type: "array", items: { type: "string" } },
                  raw_record: { type: "object" }
                }
              }
            }
          }
        }
      });

      if (extractResult.status === 'error') {
        throw new Error(extractResult.details);
      }

      setProgress(50);

      // Step 3: Process and match vehicles
      const gpsRecords = extractResult.output.gps_records || [];
      const cars = await Car.list();
      
      setProgress(60);
      setProcessing(true);

      const processResults = {
        total_records: gpsRecords.length,
        processed: 0,
        matched_vehicles: 0,
        service_triggers_created: 0,
        errors: []
      };

      // Process records in batches
      for (let i = 0; i < gpsRecords.length; i++) {
        const record = gpsRecords[i];
        
        try {
          // Find matching car
          const car = cars.find(c => 
            c.fleet_id?.toLowerCase() === record.vehicle_identifier?.toLowerCase() ||
            c.license_plate?.toLowerCase() === record.vehicle_identifier?.toLowerCase() ||
            c.id === record.vehicle_identifier
          );

          if (!car) {
            processResults.errors.push(`No vehicle found for identifier: ${record.vehicle_identifier}`);
            continue;
          }

          // Create GPS data record
          const gpsData = await GpsData.create({
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
            data_source: 'manual_upload',
            raw_data: record.raw_record
          });

          processResults.processed++;
          processResults.matched_vehicles++;

          // Update car's current position and data
          await Car.update(car.id, {
            gps_latitude: record.latitude,
            gps_longitude: record.longitude,
            gps_speed: record.speed || 0,
            gps_heading: record.heading || 0,
            gps_last_update: record.timestamp,
            gps_engine_on: record.engine_status === 'on',
            mileage: record.odometer || car.mileage,
            fuel_level: record.fuel_level || car.fuel_level
          });

          // Check for service triggers
          if (record.odometer && car.last_service_date) {
            // Simple service trigger logic
            const daysSinceService = Math.floor((new Date() - new Date(car.last_service_date)) / (1000 * 60 * 60 * 24));
            const mileageDifference = record.odometer - (car.mileage || 0);
            
            if (daysSinceService > 180 || mileageDifference > 10000) { // 6 months or 10k km
              const existingTrigger = await ServiceTrigger.filter({ car_id: car.id, status: 'triggered' });
              
              if (existingTrigger.length === 0) {
                await ServiceTrigger.create({
                  car_id: car.id,
                  trigger_type: daysSinceService > 180 ? 'time_due' : 'mileage_due',
                  current_mileage: record.odometer,
                  days_since_last_service: daysSinceService,
                  last_service_date: car.last_service_date,
                  status: 'triggered'
                });
                processResults.service_triggers_created++;
              }
            }
          }

          // Check diagnostic codes for critical issues
          if (record.diagnostic_codes && record.diagnostic_codes.length > 0) {
            const criticalCodes = ['P0001', 'P0002', 'P0171', 'P0174', 'P0300'];
            const hasCritical = record.diagnostic_codes.some(code => criticalCodes.includes(code));
            
            if (hasCritical) {
              await ServiceTrigger.create({
                car_id: car.id,
                trigger_type: 'diagnostic_alert',
                current_mileage: record.odometer,
                status: 'triggered',
                requires_human_intervention: true,
                intervention_reason: `Critical diagnostic codes: ${record.diagnostic_codes.join(', ')}`
              });
              processResults.service_triggers_created++;
            }
          }

        } catch (error) {
          processResults.errors.push(`Error processing record ${i + 1}: ${error.message}`);
        }

        // Update progress
        setProgress(60 + (i / gpsRecords.length) * 35);
      }

      setProgress(100);
      setResults(processResults);
      onUploadComplete && onUploadComplete();

    } catch (error) {
      console.error('GPS upload error:', error);
      alert('Failed to process GPS data: ' + error.message);
    } finally {
      setUploading(false);
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Satellite className="w-5 h-5" />
          GPS Data Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Brain className="w-4 h-4" />
          <AlertDescription>
            Upload GPS tracking data in any format (CSV, Excel, or text files). 
            AI will automatically analyze the structure and extract vehicle locations, 
            diagnostics, and create service triggers when maintenance is due.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="gps-upload">Upload GPS Data File</Label>
            <Input
              id="gps-upload"
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              onChange={handleFileSelect}
              className="mt-2"
            />
          </div>

          {file && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
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
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {uploading ? 'Uploading...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Process with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {(uploading || processing) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{uploading ? 'Uploading file...' : 'Processing GPS data...'}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {results && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-green-900">GPS Data Processing Complete</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-green-900">{results.processed}</div>
                    <div className="text-green-700">Records Processed</div>
                  </div>
                  <div>
                    <div className="font-medium text-green-900">{results.matched_vehicles}</div>
                    <div className="text-green-700">Vehicles Updated</div>
                  </div>
                  <div>
                    <div className="font-medium text-orange-600">{results.service_triggers_created}</div>
                    <div className="text-orange-700">Service Triggers</div>
                  </div>
                  <div>
                    <div className="font-medium text-red-600">{results.errors.length}</div>
                    <div className="text-red-500">Errors</div>
                  </div>
                </div>
                
                {results.service_triggers_created > 0 && (
                  <Alert className="mt-4">
                    <Wrench className="w-4 h-4" />
                    <AlertDescription>
                      <strong>{results.service_triggers_created} service trigger(s) created!</strong> 
                      Check the Service Department to review vehicles that need maintenance.
                    </AlertDescription>
                  </Alert>
                )}

                {results.errors.length > 0 && (
                  <div className="mt-4">
                    <details>
                      <summary className="cursor-pointer text-red-700 font-medium">
                        View Processing Errors ({results.errors.length})
                      </summary>
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                        {results.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-600">• {error}</p>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}