import React, { useState, useEffect } from 'react';
import { WeeklyServiceReport, Car, CheckoutReport } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Send, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from "date-fns";

export default function WeeklyReportsTab() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const reportsData = await WeeklyServiceReport.list('-report_date');
      setReports(reportsData);
    } catch (error) {
      console.error("Error loading weekly reports:", error);
    }
    setIsLoading(false);
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const [cars, checkouts] = await Promise.all([
        Car.filter({ status: 'checked_out' }),
        CheckoutReport.list('-created_date')
      ]);

      const customerVehicleMap = new Map();
      
      // Group vehicles by customer
      for (const car of cars) {
        const checkout = checkouts.find(c => c.car_id === car.id);
        if (checkout) {
          const customerEmail = checkout.customer_email;
          if (!customerVehicleMap.has(customerEmail)) {
            customerVehicleMap.set(customerEmail, {
              customer_name: checkout.customer_name,
              vehicles: []
            });
          }
          customerVehicleMap.get(customerEmail).vehicles.push({
            vehicle_id: car.id,
            fleet_id: car.fleet_id,
            registration: car.license_plate,
            vehicle_type: car.category,
            current_odometer: car.mileage,
            service_type_needed: 'Routine Check',
            reported_issues: [],
            service_location: 'On-site'
          });
        }
      }

      for (const [email, data] of customerVehicleMap.entries()) {
        const report = {
          report_date: new Date().toISOString().split('T')[0],
          week_starting: new Date().toISOString().split('T')[0],
          client_email: email,
          client_name: data.customer_name,
          vehicles_on_hire: data.vehicles,
          email_sent: false
        };
        await WeeklyServiceReport.create(report);
      }
      
      alert(`Generated reports for ${customerVehicleMap.size} clients.`);
      loadReports();
    } catch (error) {
      console.error("Error generating reports:", error);
      alert('Failed to generate reports.');
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Weekly Client Reports
          </CardTitle>
          <Button onClick={handleGenerateReport} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Generate & Send Weekly Reports
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : reports.length === 0 ? (
             <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Reports Found</h3>
              <p className="text-slate-600">Click "Generate" to create the first batch of weekly reports.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map(report => (
                <Card key={report.id} className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-semibold">{report.client_name}</h4>
                      <p className="text-sm text-slate-600">{report.client_email}</p>
                      <p className="text-sm text-slate-500">Report for week starting {format(new Date(report.week_starting), 'dd/MM/yyyy')}</p>
                    </div>
                    <div>
                      {report.email_sent ? (
                        <Badge className="bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-4 h-4 mr-2" /> Sent
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" /> Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}