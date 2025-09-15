import React, { useState } from 'react';
import { 
  Car, CheckoutReport, ServiceRecord, VehicleWorkflow, Quote, Invoice,
  VehicleType, PricingRule, Location, Reservation, Notification, ServiceTrigger,
  ServiceSupplier, ServiceBooking, WeeklyServiceReport, ThemeSettings,
  NavigationSettings, Client, ClientRateOverride, GpsData
} from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Download, 
  Database, 
  FileText, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Settings,
  Car as CarIcon,
  Users,
  Wrench
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const entityGroups = {
  core: {
    title: "Core Fleet Data",
    icon: CarIcon,
    entities: [
      { key: "Car", name: "Vehicles", entity: Car },
      { key: "VehicleType", name: "Vehicle Types", entity: VehicleType },
      { key: "Location", name: "Locations", entity: Location }
    ]
  },
  operations: {
    title: "Operations & Bookings",
    icon: Calendar,
    entities: [
      { key: "CheckoutReport", name: "Checkout Reports", entity: CheckoutReport },
      { key: "Quote", name: "Quotes", entity: Quote },
      { key: "Reservation", name: "Reservations", entity: Reservation },
      { key: "Invoice", name: "Invoices", entity: Invoice },
      { key: "VehicleWorkflow", name: "Vehicle Workflows", entity: VehicleWorkflow }
    ]
  },
  service: {
    title: "Service & Maintenance",
    icon: Wrench,
    entities: [
      { key: "ServiceRecord", name: "Service Records", entity: ServiceRecord },
      { key: "ServiceTrigger", name: "Service Triggers", entity: ServiceTrigger },
      { key: "ServiceSupplier", name: "Service Suppliers", entity: ServiceSupplier },
      { key: "ServiceBooking", name: "Service Bookings", entity: ServiceBooking },
      { key: "WeeklyServiceReport", name: "Weekly Reports", entity: WeeklyServiceReport }
    ]
  },
  clients: {
    title: "Client Management",
    icon: Users,
    entities: [
      { key: "Client", name: "Clients", entity: Client },
      { key: "ClientRateOverride", name: "Rate Overrides", entity: ClientRateOverride }
    ]
  },
  system: {
    title: "System & Configuration",
    icon: Settings,
    entities: [
      { key: "PricingRule", name: "Pricing Rules", entity: PricingRule },
      { key: "ThemeSettings", name: "Theme Settings", entity: ThemeSettings },
      { key: "NavigationSettings", name: "Navigation Settings", entity: NavigationSettings },
      { key: "Notification", name: "Notifications", entity: Notification },
      { key: "GpsData", name: "GPS Data", entity: GpsData }
    ]
  }
};

export default function DatabaseExportTab() {
  const [selectedEntities, setSelectedEntities] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportResults, setExportResults] = useState(null);
  const [exportFormat, setExportFormat] = useState('json'); // json or csv

  useState(() => {
    // Select all entities by default
    const allSelected = {};
    Object.values(entityGroups).forEach(group => {
      group.entities.forEach(entity => {
        allSelected[entity.key] = true;
      });
    });
    setSelectedEntities(allSelected);
  }, []);

  const toggleEntity = (entityKey) => {
    setSelectedEntities(prev => ({
      ...prev,
      [entityKey]: !prev[entityKey]
    }));
  };

  const toggleGroup = (groupKey) => {
    const group = entityGroups[groupKey];
    const allSelected = group.entities.every(entity => selectedEntities[entity.key]);
    
    setSelectedEntities(prev => {
      const newSelected = { ...prev };
      group.entities.forEach(entity => {
        newSelected[entity.key] = !allSelected;
      });
      return newSelected;
    });
  };

  const selectAll = () => {
    const allSelected = {};
    Object.values(entityGroups).forEach(group => {
      group.entities.forEach(entity => {
        allSelected[entity.key] = true;
      });
    });
    setSelectedEntities(allSelected);
  };

  const selectNone = () => {
    const noneSelected = {};
    Object.values(entityGroups).forEach(group => {
      group.entities.forEach(entity => {
        noneSelected[entity.key] = false;
      });
    });
    setSelectedEntities(noneSelected);
  };

  const exportDatabase = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportResults(null);

    const exportData = {
      export_metadata: {
        generated_at: new Date().toISOString(),
        exported_by: 'WWFH Fleet System',
        format: exportFormat,
        entities_exported: Object.keys(selectedEntities).filter(key => selectedEntities[key])
      },
      data: {}
    };

    const selectedEntityKeys = Object.keys(selectedEntities).filter(key => selectedEntities[key]);
    const totalEntities = selectedEntityKeys.length;
    let completedEntities = 0;
    const results = { success: 0, errors: 0, total_records: 0 };

    try {
      for (const entityKey of selectedEntityKeys) {
        try {
          // Find the entity in our groups
          let entityInfo = null;
          for (const group of Object.values(entityGroups)) {
            entityInfo = group.entities.find(e => e.key === entityKey);
            if (entityInfo) break;
          }

          if (!entityInfo) {
            results.errors++;
            continue;
          }

          // Fetch all data for this entity
          const entityData = await entityInfo.entity.list();
          exportData.data[entityKey] = entityData;
          results.total_records += entityData.length;
          results.success++;

        } catch (error) {
          console.error(`Error exporting ${entityKey}:`, error);
          results.errors++;
          exportData.data[entityKey] = { error: error.message };
        }

        completedEntities++;
        setExportProgress((completedEntities / totalEntities) * 100);
      }

      // Generate and download file
      const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
      const filename = `wwfh_fleet_database_export_${timestamp}.${exportFormat}`;

      if (exportFormat === 'json') {
        downloadJSON(exportData, filename);
      } else {
        downloadCSV(exportData, filename);
      }

      setExportResults(results);

    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed: ' + error.message);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (data, filename) => {
    // Create a ZIP-like structure with multiple CSV files
    let csvContent = '';
    
    Object.entries(data.data).forEach(([entityName, records]) => {
      if (Array.isArray(records) && records.length > 0) {
        csvContent += `\n\n=== ${entityName} ===\n`;
        
        // Get headers from first record
        const headers = Object.keys(records[0]);
        csvContent += headers.join(',') + '\n';
        
        // Add data rows
        records.forEach(record => {
          const row = headers.map(header => {
            const value = record[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value).replace(/,/g, ';'); // Replace commas to avoid CSV conflicts
          });
          csvContent += row.join(',') + '\n';
        });
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.replace('.csv', '.txt'); // Use .txt for multi-entity format
    link.click();
    URL.revokeObjectURL(url);
  };

  const getSelectedCount = () => {
    return Object.values(selectedEntities).filter(Boolean).length;
  };

  const getTotalEntities = () => {
    return Object.values(entityGroups).reduce((total, group) => total + group.entities.length, 0);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          <strong>Database Export:</strong> Download your complete fleet management database including all vehicles, 
          bookings, service records, and configuration data. Perfect for backups, data analysis, or system migration.
        </AlertDescription>
      </Alert>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Export Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Select Data to Export</h3>
              <p className="text-sm text-slate-600">
                {getSelectedCount()} of {getTotalEntities()} entities selected
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={selectNone}>
                Select None
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(entityGroups).map(([groupKey, group]) => {
              const groupSelected = group.entities.filter(entity => selectedEntities[entity.key]).length;
              const groupTotal = group.entities.length;
              
              return (
                <div key={groupKey} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <group.icon className="w-5 h-5 text-slate-600" />
                      <h4 className="font-medium">{group.title}</h4>
                      <Badge variant="outline">
                        {groupSelected}/{groupTotal}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroup(groupKey)}
                    >
                      {groupSelected === groupTotal ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.entities.map(entity => (
                      <div key={entity.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={entity.key}
                          checked={selectedEntities[entity.key] || false}
                          onCheckedChange={() => toggleEntity(entity.key)}
                        />
                        <label htmlFor={entity.key} className="text-sm font-medium cursor-pointer">
                          {entity.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Export Format</h3>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="json"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={(e) => setExportFormat(e.target.value)}
                    />
                    <label htmlFor="json" className="text-sm font-medium">
                      JSON (Recommended)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="csv"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value)}
                    />
                    <label htmlFor="csv" className="text-sm font-medium">
                      CSV/Text
                    </label>
                  </div>
                </div>
              </div>

              {isExporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Exporting database...</span>
                    <span>{Math.round(exportProgress)}%</span>
                  </div>
                  <Progress value={exportProgress} className="w-full" />
                </div>
              )}

              {exportResults && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="flex justify-between items-center">
                      <div>
                        <strong>Export Complete!</strong> Successfully exported {exportResults.success} entities 
                        with {exportResults.total_records} total records.
                        {exportResults.errors > 0 && (
                          <span className="text-red-600 ml-2">
                            ({exportResults.errors} entities had errors)
                          </span>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={exportDatabase}
                disabled={isExporting || getSelectedCount() === 0}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Exporting Database...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Export Selected Data ({getSelectedCount()} entities)
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Export Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">What's Included:</h4>
            <ul className="space-y-1 text-sm text-slate-600">
              <li>• All selected entity data with complete records</li>
              <li>• Export metadata including timestamp and entity list</li>
              <li>• Data formatted for easy import or analysis</li>
              <li>• Preserves all relationships and references between entities</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Security Notes:</h4>
            <ul className="space-y-1 text-sm text-slate-600">
              <li>• User account data is not included for privacy protection</li>
              <li>• Exported data should be handled securely</li>
              <li>• Consider this as containing sensitive business information</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Use Cases:</h4>
            <ul className="space-y-1 text-sm text-slate-600">
              <li>• <strong>Backup:</strong> Regular data backups for disaster recovery</li>
              <li>• <strong>Analysis:</strong> Import into Excel/BI tools for reporting</li>
              <li>• <strong>Migration:</strong> Move data to another system</li>
              <li>• <strong>Compliance:</strong> Data auditing and compliance reporting</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Quick Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Export Presets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                selectNone();
                setSelectedEntities(prev => ({
                  ...prev,
                  Car: true,
                  VehicleType: true,
                  Location: true
                }));
              }}
              className="flex items-center gap-2 h-auto p-4"
            >
              <CarIcon className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Fleet Data Only</div>
                <div className="text-xs text-slate-600">Vehicles, types, and locations</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                selectNone();
                setSelectedEntities(prev => ({
                  ...prev,
                  Quote: true,
                  Reservation: true,
                  Invoice: true,
                  CheckoutReport: true
                }));
              }}
              className="flex items-center gap-2 h-auto p-4"
            >
              <Calendar className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Bookings & Revenue</div>
                <div className="text-xs text-slate-600">Quotes, reservations, and invoices</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                selectNone();
                setSelectedEntities(prev => ({
                  ...prev,
                  ServiceRecord: true,
                  ServiceTrigger: true,
                  ServiceBooking: true,
                  GpsData: true
                }));
              }}
              className="flex items-center gap-2 h-auto p-4"
            >
              <Wrench className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Service Data</div>
                <div className="text-xs text-slate-600">Maintenance and GPS records</div>
              </div>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                selectNone();
                setSelectedEntities(prev => ({
                  ...prev,
                  PricingRule: true,
                  ThemeSettings: true,
                  NavigationSettings: true
                }));
              }}
              className="flex items-center gap-2 h-auto p-4"
            >
              <Settings className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Configuration</div>
                <div className="text-xs text-slate-600">System settings and rules</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}