import React, { useState } from 'react';
import { Car } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertTriangle, UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';

const jsonExample = `[
  {
    "fleet_id": "WWFH-001",
    "gps_latitude": -31.953512,
    "gps_longitude": 115.857048,
    "gps_speed": 60.5,
    "gps_heading": 180,
    "gps_engine_on": true,
    "gps_last_update": "2023-10-27T10:00:00Z"
  },
  {
    "fleet_id": "WWFH-002",
    "gps_latitude": -32.053512,
    "gps_longitude": 115.957048,
    "gps_speed": 0,
    "gps_heading": 270,
    "gps_engine_on": false,
    "gps_last_update": "2023-10-27T10:01:00Z"
  }
]`;

export default function RealTimeSync() {
  const [jsonData, setJsonData] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    let data;
    try {
      data = JSON.parse(jsonData);
      if (!Array.isArray(data)) {
        throw new Error("JSON data must be an array of vehicle objects.");
      }
    } catch (error) {
      setSyncResult({ success: false, message: `Invalid JSON format: ${error.message}` });
      setIsSyncing(false);
      return;
    }

    try {
      const allCars = await Car.list();
      const carMap = new Map(allCars.map(car => [car.fleet_id, car]));
      
      let successfulUpdates = 0;
      const notFoundFleetIds = [];
      const updatePromises = [];

      for (const vehicleData of data) {
        if (!vehicleData.fleet_id) continue;

        const carToUpdate = carMap.get(vehicleData.fleet_id);
        if (carToUpdate) {
          const updatePayload = {
            gps_latitude: vehicleData.gps_latitude,
            gps_longitude: vehicleData.gps_longitude,
            gps_speed: vehicleData.gps_speed,
            gps_heading: vehicleData.gps_heading,
            gps_engine_on: vehicleData.gps_engine_on,
            gps_last_update: vehicleData.gps_last_update,
          };
          updatePromises.push(Car.update(carToUpdate.id, updatePayload));
          successfulUpdates++;
        } else {
          notFoundFleetIds.push(vehicleData.fleet_id);
        }
      }

      await Promise.all(updatePromises);

      let message = `Successfully synced ${successfulUpdates} vehicles.`;
      if (notFoundFleetIds.length > 0) {
        message += ` Could not find vehicles with Fleet IDs: ${notFoundFleetIds.join(', ')}.`;
      }
      setSyncResult({ success: true, message });

    } catch (error) {
      setSyncResult({ success: false, message: `An error occurred during sync: ${error.message}` });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Manual GPS Data Sync</CardTitle>
        <CardDescription>
          Paste GPS data from your external system in the specified JSON format to bulk-update your fleet's location.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-sm mb-2">Required JSON Format:</h4>
          <pre className="bg-slate-100 p-3 rounded-md text-xs overflow-x-auto">
            <code>{jsonExample}</code>
          </pre>
        </div>
        
        <Textarea
          placeholder="Paste your JSON data here..."
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          rows={10}
        />
        
        <Button onClick={handleSync} disabled={isSyncing || !jsonData}>
          {isSyncing ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing...</>
          ) : (
            <><UploadCloud className="w-4 h-4 mr-2" /> Sync GPS Data</>
          )}
        </Button>

        {syncResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Alert variant={syncResult.success ? "default" : "destructive"}>
              {syncResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertTitle>{syncResult.success ? "Sync Complete" : "Sync Failed"}</AlertTitle>
              <AlertDescription>{syncResult.message}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}