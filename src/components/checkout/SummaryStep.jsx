
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { motion } from 'framer-motion';

export default function SummaryStep({ onNext, onBack, data }) {
  const { car_details, customer_name, evaluator_name, expected_return_date, fleet_id, ...report } = data;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Confirm Checkout Details</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Vehicle & Customer Info */}
        <Card>
          <CardHeader><CardTitle>Vehicle & Customer</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Vehicle:</span>
              <span className="font-semibold text-slate-800">{car_details?.make} {car_details?.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Fleet ID:</span>
              <span className="font-bold font-mono" style={{color: 'var(--wwfh-navy)'}}>
                {fleet_id ? `Fleet ${fleet_id}` : 'N/A'}
              </span>
            </div>
            {car_details?.license_plate && (
              <div className="flex justify-between">
                <span className="text-slate-600">License Plate:</span>
                <span className="font-semibold text-slate-800">{car_details.license_plate}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">Customer:</span>
              <span className="font-semibold text-slate-800">{customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Evaluator:</span>
              <span className="font-semibold text-slate-800">{evaluator_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Expected Return:</span>
              <span className="font-semibold text-slate-800">
                {expected_return_date ? format(new Date(expected_return_date), 'MMM d, yyyy, h:mm a') : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Condition Summary */}
        <Card>
          <CardHeader><CardTitle>Condition Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Exterior Rating:</span>
              <span className="font-semibold text-slate-800 capitalize">
                {report.exterior_condition?.overall_rating || 'Good'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Damages Logged:</span>
              <span className="font-semibold text-slate-800">
                {report.exterior_condition?.damages?.length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Interior Cleanliness:</span>
              <span className="font-semibold text-slate-800 capitalize">
                {report.interior_condition?.cleanliness || 'Good'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Engine Status:</span>
              <span className="font-semibold text-slate-800 capitalize">
                {report.mechanical_check?.engine_status || 'Good'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Tire Condition:</span>
              <span className="font-semibold text-slate-800 capitalize">
                {report.mechanical_check?.tire_condition || 'Good'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Fuel Level Out:</span>
              <span className="font-semibold text-slate-800">
                {report.fuel_level_out || 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Mileage Out:</span>
              <span className="font-semibold text-slate-800">
                {report.mileage_out?.toLocaleString() || 0} km
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} className="bg-emerald-600 hover:bg-emerald-700">
          Confirm & Complete Checkout
        </Button>
      </div>
    </motion.div>
  );
}
