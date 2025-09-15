import React, { useState, useEffect } from 'react';
import { ServiceTrigger, Car, CheckoutReport } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertTriangle, 
  Clock, 
  Mail, 
  Phone, 
  Calendar,
  CheckCircle,
  X,
  Send,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { format, differenceInDays } from "date-fns";

export default function ServiceTriggersTab({ onStatsUpdate }) {
  const [triggers, setTriggers] = useState([]);
  const [cars, setCars] = useState([]);
  const [checkouts, setCheckouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrigger, setSelectedTrigger] = useState(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [triggersData, carsData, checkoutsData] = await Promise.all([
        ServiceTrigger.list('-created_date'),
        Car.list(),
        CheckoutReport.list('-created_date')
      ]);
      setTriggers(triggersData);
      setCars(carsData);
      setCheckouts(checkoutsData);
    } catch (error) {
      console.error("Error loading service triggers data:", error);
    }
    setIsLoading(false);
  };

  const getCarDetails = (carId) => {
    return cars.find(c => c.id === carId);
  };

  const getCheckoutDetails = (carId) => {
    return checkouts.find(c => c.car_id === carId);
  };

  const getStatusColor = (status) => {
    const colors = {
      'triggered': 'bg-red-100 text-red-800 border-red-200',
      'awaiting_client_response': 'bg-amber-100 text-amber-800 border-amber-200',
      'scheduled': 'bg-blue-100 text-blue-800 border-blue-200',
      'in_service': 'bg-purple-100 text-purple-800 border-purple-200',
      'completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'delayed': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[status] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const sendClientReminder = async (trigger) => {
    setIsProcessingAction(true);
    try {
      const car = getCarDetails(trigger.car_id);
      const checkout = getCheckoutDetails(trigger.car_id);
      
      if (!checkout || !checkout.customer_email) {
        alert('Cannot send reminder: No customer contact information found.');
        return;
      }

      // Send email reminder
      await SendEmail({
        to: checkout.customer_email,
        subject: `Service Required - Fleet Vehicle ${car?.fleet_id}`,
        body: `
Dear ${checkout.customer_name},

Your hired vehicle (Fleet ID: ${car?.fleet_id}, ${car?.make} ${car?.model}) is due for scheduled maintenance.

Current Details:
- Expected off-hire date: ${format(new Date(trigger.off_hire_date), 'dd/MM/yyyy')}
- Days until return: ${trigger.days_until_off_hire}

We need to confirm your off-hire date to schedule the service appropriately:

- If your off-hire date is within 12 days: We may delay the service until after return
- If your off-hire date is more than 12 days away: We'll arrange service now

Please reply to confirm your off-hire date or let us know of any changes.

Thank you,
WWFH Fleet Services
        `
      });

      // Update trigger with reminder info
      await ServiceTrigger.update(trigger.id, {
        reminder_count: (trigger.reminder_count || 0) + 1,
        last_reminder_sent: new Date().toISOString(),
        status: 'awaiting_client_response'
      });

      alert('Reminder sent successfully!');
      loadData();
      onStatsUpdate?.();
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder. Please try again.');
    }
    setIsProcessingAction(false);
  };

  const updateOffHireDate = async (trigger, newDate) => {
    setIsProcessingAction(true);
    try {
      const daysUntil = differenceInDays(new Date(newDate), new Date());
      
      await ServiceTrigger.update(trigger.id, {
        off_hire_date: newDate,
        days_until_off_hire: daysUntil,
        client_response: {
          responded: true,
          response_date: new Date().toISOString(),
          updated_off_hire_date: newDate
        },
        status: daysUntil > 12 ? 'scheduled' : 'delayed'
      });

      loadData();
      onStatsUpdate?.();
      setSelectedTrigger(null);
    } catch (error) {
      console.error('Error updating off-hire date:', error);
      alert('Failed to update off-hire date.');
    }
    setIsProcessingAction(false);
  };

  const markRequiresIntervention = async (trigger, reason) => {
    setIsProcessingAction(true);
    try {
      await ServiceTrigger.update(trigger.id, {
        requires_human_intervention: true,
        intervention_reason: reason,
        status: 'delayed'
      });

      // Send alert email to service department
      await SendEmail({
        to: 'service@wwfleethire.com.au',
        subject: `Service Trigger Requires Human Intervention - ${getCarDetails(trigger.car_id)?.fleet_id}`,
        body: `
A service trigger requires human intervention:

Vehicle: ${getCarDetails(trigger.car_id)?.make} ${getCarDetails(trigger.car_id)?.model}
Fleet ID: ${getCarDetails(trigger.car_id)?.fleet_id}
Reason: ${reason}
Trigger Date: ${format(new Date(trigger.created_date), 'dd/MM/yyyy')}

Please review and take appropriate action.
        `
      });

      loadData();
      onStatsUpdate?.();
      setSelectedTrigger(null);
    } catch (error) {
      console.error('Error marking for intervention:', error);
    }
    setIsProcessingAction(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Active Service Triggers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-100 h-24 rounded-lg"></div>
              ))}
            </div>
          ) : triggers.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Active Service Triggers</h3>
              <p className="text-slate-600">All vehicles are up to date with their service requirements.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {triggers.map((trigger) => {
                const car = getCarDetails(trigger.car_id);
                const checkout = getCheckoutDetails(trigger.car_id);
                
                return (
                  <motion.div
                    key={trigger.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg">
                            {car?.make} {car?.model}
                          </h3>
                          <Badge variant="outline" className="font-mono">
                            Fleet {car?.fleet_id}
                          </Badge>
                          <Badge className={getStatusColor(trigger.status)}>
                            {trigger.status.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                          <div>
                            <span className="font-medium">Trigger:</span> {trigger.trigger_type === 'mileage_due' ? 'Mileage Due' : 'Time Due'}
                          </div>
                          <div>
                            <span className="font-medium">Off-hire:</span> {format(new Date(trigger.off_hire_date), 'dd/MM/yyyy')} ({trigger.days_until_off_hire} days)
                          </div>
                          <div>
                            <span className="font-medium">Customer:</span> {checkout?.customer_name || 'N/A'}
                          </div>
                        </div>
                        
                        {trigger.reminder_count > 0 && (
                          <div className="mt-2 text-sm text-amber-600">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {trigger.reminder_count} reminder(s) sent. Last: {format(new Date(trigger.last_reminder_sent), 'dd/MM/yyyy HH:mm')}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        {trigger.status === 'triggered' && (
                          <Button
                            onClick={() => sendClientReminder(trigger)}
                            disabled={isProcessingAction}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Contact Client
                          </Button>
                        )}
                        
                        {trigger.status === 'awaiting_client_response' && (
                          <>
                            <Button
                              onClick={() => sendClientReminder(trigger)}
                              disabled={isProcessingAction}
                              size="sm"
                              variant="outline"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Send Reminder
                            </Button>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  Update Date
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Update Off-Hire Date</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Input
                                    type="date"
                                    defaultValue={trigger.off_hire_date}
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        updateOffHireDate(trigger, e.target.value);
                                      }
                                    }}
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}
                        
                        {trigger.status === 'awaiting_client_response' && trigger.reminder_count >= 3 && (
                          <Button
                            onClick={() => markRequiresIntervention(trigger, 'Multiple reminders sent with no response')}
                            disabled={isProcessingAction}
                            size="sm"
                            variant="destructive"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Escalate
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}