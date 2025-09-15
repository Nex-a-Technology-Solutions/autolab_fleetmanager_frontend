import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save } from "lucide-react";

export default function ServiceSettingsTab() {
  const [settings, setSettings] = useState({
    mileage_interval: 10000,
    time_interval_days: 180, // 6 months
    mileage_trigger_threshold: 1200,
    time_trigger_threshold_days: 10, // 170 days for a 180 day interval
    default_service_email: 'service@wwfleethire.com.au',
    reminder_template_email: `
Dear {customer_name},

This is a reminder that your hired vehicle ({vehicle_make} {vehicle_model}, Fleet ID: {fleet_id}) is due for scheduled maintenance.

We need to confirm your off-hire date to schedule the service appropriately. Please reply to confirm your off-hire date or let us know of any changes.

Thank you,
WWFH Fleet Services
    `.trim()
  });

  const handleSave = () => {
    // In a real app, this would save to a configuration entity
    console.log("Saving settings:", settings);
    alert("Settings saved! (Simulated)");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Service Workflow Settings
          </CardTitle>
          <CardDescription>
            Configure the automated service triggers and communication templates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Service Intervals */}
          <Card className="p-6 bg-slate-50 border-slate-200">
            <h3 className="font-semibold mb-4">Service Intervals</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mileage_interval">Service every (km)</Label>
                <Input
                  id="mileage_interval"
                  type="number"
                  value={settings.mileage_interval}
                  onChange={(e) => setSettings(s => ({ ...s, mileage_interval: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="time_interval_days">Service every (days)</Label>
                <Input
                  id="time_interval_days"
                  type="number"
                  value={settings.time_interval_days}
                  onChange={(e) => setSettings(s => ({ ...s, time_interval_days: parseInt(e.target.value) }))}
                />
              </div>
            </div>
          </Card>
          
          {/* Trigger Thresholds */}
          <Card className="p-6 bg-slate-50 border-slate-200">
            <h3 className="font-semibold mb-4">Trigger Thresholds</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mileage_trigger_threshold">Mileage trigger threshold (km before due)</Label>
                <Input
                  id="mileage_trigger_threshold"
                  type="number"
                  value={settings.mileage_trigger_threshold}
                  onChange={(e) => setSettings(s => ({ ...s, mileage_trigger_threshold: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="time_trigger_threshold_days">Time trigger threshold (days before due)</Label>
                <Input
                  id="time_trigger_threshold_days"
                  type="number"
                  value={settings.time_trigger_threshold_days}
                  onChange={(e) => setSettings(s => ({ ...s, time_trigger_threshold_days: parseInt(e.target.value) }))}
                />
              </div>
            </div>
          </Card>

          {/* Email Settings */}
          <Card className="p-6 bg-slate-50 border-slate-200">
            <h3 className="font-semibold mb-4">Email & Communication</h3>
            <div>
              <Label htmlFor="default_service_email">Default Service Email Address</Label>
              <Input
                id="default_service_email"
                type="email"
                value={settings.default_service_email}
                onChange={(e) => setSettings(s => ({ ...s, default_service_email: e.target.value }))}
              />
            </div>
            <div className="mt-4">
              <Label htmlFor="reminder_template_email">Client Reminder Email Template</Label>
              <Textarea
                id="reminder_template_email"
                rows={10}
                value={settings.reminder_template_email}
                onChange={(e) => setSettings(s => ({ ...s, reminder_template_email: e.target.value }))}
              />
              <p className="text-xs text-slate-500 mt-1">
                Available placeholders: {`{customer_name}, {vehicle_make}, {vehicle_model}, {fleet_id}`}
              </p>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}