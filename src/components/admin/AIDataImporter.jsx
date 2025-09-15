import React, { useState } from 'react';
import { VehicleType, PricingRule } from '@/api/entities';
import { UploadFile, ExtractDataFromUploadedFile, InvokeLLM } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileSpreadsheet, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Brain,
  Download,
  Eye,
  Wand2
} from "lucide-react";
import { motion } from "framer-motion";

export default function AIDataImporter() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  
  const [fileData, setFileData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [mappedData, setMappedData] = useState(null);
  const [importResults, setImportResults] = useState(null);
  
  const [activeTab, setActiveTab] = useState("upload");

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx?|csv)$/i)) {
      alert('Please upload an Excel (.xlsx, .xls) or CSV file');
      return;
    }

    setFile(selectedFile);
    setFileData(null);
    setAiAnalysis(null);
    setMappedData(null);
    setImportResults(null);
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // 1. Upload the file
      const { file_url } = await UploadFile({ file });
      
      // 2. Extract data from the file
      const extractResult = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: true
              }
            }
          }
        }
      });

      if (extractResult.status === 'error') {
        throw new Error(extractResult.details);
      }

      setFileData(extractResult.output.data);
      setActiveTab("analyze");
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload and extract data: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (!fileData) return;

    setAnalyzing(true);
    try {
      const prompt = `
        You are an AI assistant helping to import vehicle rental pricing data into a fleet management system.
        
        I have uploaded a spreadsheet with vehicle rental pricing information. Please analyze this data and map it to our system structure.
        
        Raw data from spreadsheet:
        ${JSON.stringify(fileData.slice(0, 20), null, 2)}
        ${fileData.length > 20 ? `\n... and ${fileData.length - 20} more rows` : ''}
        
        Our system uses:
        1. VehicleTypes with these pricing tiers:
           - tier_1_14_days (1-14 days)
           - tier_15_29_days (15-29 days) 
           - tier_30_178_days (30-178 days)
           - tier_179_363_days (179-363 days)
           - tier_364_plus_days (364+ days)
        
        2. PricingRules for:
           - insurance (daily_rate_adjustment)
           - location_surcharge (daily_rate_adjustment)
           - km_allowance (daily_rate_adjustment)
           - additional_service (daily_rate_adjustment or one_time_fee)
        
        Please analyze the data and provide:
        1. A summary of what vehicle types and pricing information you found
        2. How you would map this data to our VehicleType and PricingRule entities
        3. Any data quality issues or missing information
        4. Suggested vehicle categories and their pricing structures
      `;

      const analysis = await InvokeLLM({ 
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
              description: "Summary of the data found"
            },
            vehicle_types_found: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string" },
                  pricing_found: { type: "object" },
                  confidence: { type: "number" }
                }
              }
            },
            pricing_rules_found: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  description: { type: "string" },
                  value: { type: "number" },
                  confidence: { type: "number" }
                }
              }
            },
            data_quality: {
              type: "object",
              properties: {
                issues: { type: "array", items: { type: "string" } },
                missing_data: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } }
              }
            },
            mapping_confidence: {
              type: "number",
              description: "Overall confidence in mapping (0-100)"
            }
          }
        }
      });

      setAiAnalysis(analysis);
      setActiveTab("review");
      
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze data: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateMapping = async () => {
    if (!aiAnalysis || !fileData) return;

    setAnalyzing(true);
    try {
      const prompt = `
        Based on my previous analysis, now generate the exact data structure needed to import this pricing data.
        
        Original data: ${JSON.stringify(fileData.slice(0, 10), null, 2)}
        Previous analysis: ${JSON.stringify(aiAnalysis, null, 2)}
        
        Generate the exact VehicleType and PricingRule objects that should be created in our system.
        
        For VehicleTypes, use this structure:
        {
          "name": "Toyota Hilux SR5",
          "diagram_type": "ute",
          "category": "ute", 
          "daily_rate": 120,
          "pricing_tiers": {
            "tier_1_14_days": 120,
            "tier_15_29_days": 110,
            "tier_30_178_days": 100,
            "tier_179_363_days": 90,
            "tier_364_plus_days": 80
          },
          "specifications": {
            "drive_type": "4WD",
            "cab_type": "Dual Cab",
            "seating_capacity": 5
          },
          "active": true
        }
        
        For PricingRules, use this structure:
        {
          "name": "Reduced Liability Insurance",
          "type": "insurance",
          "daily_rate_adjustment": 35,
          "description": "Reduced excess insurance option",
          "active": true
        }
      `;

      const mapping = await InvokeLLM({ 
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            vehicle_types: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  diagram_type: { type: "string", enum: ["car", "ute", "suv", "bus", "truck"] },
                  category: { type: "string", enum: ["ute", "wagon", "bus", "truck"] },
                  daily_rate: { type: "number" },
                  pricing_tiers: {
                    type: "object",
                    properties: {
                      tier_1_14_days: { type: "number" },
                      tier_15_29_days: { type: "number" },
                      tier_30_178_days: { type: "number" },
                      tier_179_363_days: { type: "number" },
                      tier_364_plus_days: { type: "number" }
                    }
                  },
                  specifications: { type: "object" },
                  active: { type: "boolean" }
                }
              }
            },
            pricing_rules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string", enum: ["insurance", "location_surcharge", "km_allowance", "additional_service"] },
                  daily_rate_adjustment: { type: "number" },
                  one_time_fee: { type: "number" },
                  description: { type: "string" },
                  active: { type: "boolean" }
                }
              }
            }
          }
        }
      });

      setMappedData(mapping);
      setActiveTab("import");
      
    } catch (error) {
      console.error('Mapping error:', error);
      alert('Failed to generate mapping: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImport = async () => {
    if (!mappedData) return;

    setImporting(true);
    try {
      const results = {
        vehicle_types: { created: 0, updated: 0, errors: [] },
        pricing_rules: { created: 0, updated: 0, errors: [] }
      };

      // Import Vehicle Types
      for (const vehicleType of mappedData.vehicle_types) {
        try {
          await VehicleType.create(vehicleType);
          results.vehicle_types.created++;
        } catch (error) {
          results.vehicle_types.errors.push(`${vehicleType.name}: ${error.message}`);
        }
      }

      // Import Pricing Rules
      for (const pricingRule of mappedData.pricing_rules) {
        try {
          await PricingRule.create(pricingRule);
          results.pricing_rules.created++;
        } catch (error) {
          results.pricing_rules.errors.push(`${pricingRule.name}: ${error.message}`);
        }
      }

      setImportResults(results);
      setActiveTab("results");
      
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import data: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileData(null);
    setAiAnalysis(null);
    setMappedData(null);
    setImportResults(null);
    setActiveTab("upload");
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          AI Vehicle Pricing Importer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="analyze" disabled={!fileData}>Analyze</TabsTrigger>
            <TabsTrigger value="review" disabled={!aiAnalysis}>Review</TabsTrigger>
            <TabsTrigger value="import" disabled={!mappedData}>Import</TabsTrigger>
            <TabsTrigger value="results" disabled={!importResults}>Results</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Upload Vehicle Pricing Data</h3>
                <p className="text-slate-600">
                  Upload an Excel (.xlsx, .xls) or CSV file with vehicle pricing information.
                  Our AI will analyze it and map it to your fleet pricing structure.
                </p>
              </div>
              <div className="mt-4">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <Upload className="w-4 h-4" />
                    Select File
                  </div>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              
              {file && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-slate-600">
                    Size: {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Button 
                    onClick={handleUploadAndAnalyze} 
                    disabled={uploading}
                    className="mt-3"
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                    ) : (
                      <><Wand2 className="w-4 h-4 mr-2" /> Analyze with AI</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analyze" className="space-y-4">
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
              <h3 className="text-lg font-semibold">File Uploaded Successfully</h3>
              <p className="text-slate-600">
                Found {fileData?.length || 0} rows of data. Click below to analyze with AI.
              </p>
              
              {fileData && fileData.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg text-left">
                  <h4 className="font-medium mb-2">Sample Data Preview:</h4>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(fileData.slice(0, 3), null, 2)}
                  </pre>
                  {fileData.length > 3 && (
                    <p className="text-xs text-slate-500 mt-2">
                      ... and {fileData.length - 3} more rows
                    </p>
                  )}
                </div>
              )}
              
              <Button onClick={handleAIAnalysis} disabled={analyzing} size="lg">
                {analyzing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> AI is analyzing...</>
                ) : (
                  <><Brain className="w-4 h-4 mr-2" /> Start AI Analysis</>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="review" className="space-y-6">
            {aiAnalysis && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">AI Analysis Results</h3>
                  <Badge variant={aiAnalysis.mapping_confidence > 80 ? "default" : "secondary"}>
                    {aiAnalysis.mapping_confidence}% Confidence
                  </Badge>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {aiAnalysis.summary}
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Vehicle Types Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {aiAnalysis.vehicle_types_found?.map((vt, i) => (
                          <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                            <span className="font-medium">{vt.name}</span>
                            <Badge variant={vt.confidence > 80 ? "default" : "secondary"}>
                              {vt.confidence}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Pricing Rules Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {aiAnalysis.pricing_rules_found?.map((pr, i) => (
                          <div key={i} className="p-2 bg-slate-50 rounded">
                            <div className="font-medium">{pr.description}</div>
                            <div className="text-sm text-slate-600">
                              Type: {pr.type} | Value: ${pr.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {aiAnalysis.data_quality?.issues?.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Data Quality Issues:</strong>
                      <ul className="list-disc list-inside mt-2">
                        {aiAnalysis.data_quality.issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button onClick={handleGenerateMapping} disabled={analyzing}>
                    {analyzing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <>Generate Import Mapping</>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    Start Over
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            {mappedData && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ready to Import</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Vehicle Types ({mappedData.vehicle_types?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {mappedData.vehicle_types?.map((vt, i) => (
                          <div key={i} className="p-3 border rounded-lg">
                            <div className="font-medium">{vt.name}</div>
                            <div className="text-sm text-slate-600">
                              Category: {vt.category} | Daily Rate: ${vt.daily_rate}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Tiers: ${vt.pricing_tiers?.tier_1_14_days} - ${vt.pricing_tiers?.tier_364_plus_days}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Pricing Rules ({mappedData.pricing_rules?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {mappedData.pricing_rules?.map((pr, i) => (
                          <div key={i} className="p-3 border rounded-lg">
                            <div className="font-medium">{pr.name}</div>
                            <div className="text-sm text-slate-600">
                              Type: {pr.type} | Rate: ${pr.daily_rate_adjustment || pr.one_time_fee}
                            </div>
                            <div className="text-xs text-slate-500">
                              {pr.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleImport} disabled={importing} size="lg">
                    {importing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
                    ) : (
                      <>Import All Data</>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("review")}>
                    Back to Review
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {importResults && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <h3 className="text-lg font-semibold">Import Complete</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base text-green-600">Vehicle Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Created:</span>
                          <span className="font-bold">{importResults.vehicle_types.created}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Errors:</span>
                          <span className="font-bold text-red-600">
                            {importResults.vehicle_types.errors.length}
                          </span>
                        </div>
                        {importResults.vehicle_types.errors.length > 0 && (
                          <div className="mt-2 text-sm text-red-600">
                            {importResults.vehicle_types.errors.map((error, i) => (
                              <div key={i}>• {error}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base text-blue-600">Pricing Rules</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Created:</span>
                          <span className="font-bold">{importResults.pricing_rules.created}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Errors:</span>
                          <span className="font-bold text-red-600">
                            {importResults.pricing_rules.errors.length}
                          </span>
                        </div>
                        {importResults.pricing_rules.errors.length > 0 && (
                          <div className="mt-2 text-sm text-red-600">
                            {importResults.pricing_rules.errors.map((error, i) => (
                              <div key={i}>• {error}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Button onClick={handleReset} size="lg">
                  Import Another File
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}