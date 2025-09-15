import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  Calendar,
  Mail,
  DollarSign,
  Loader2
} from "lucide-react";

export default function BackendIntegrations() {
  const [isTestingConnection, setIsTestingConnection] = useState({});
  const [connectionResults, setConnectionResults] = useState({});

  const testConnection = async (service) => {
    setIsTestingConnection(prev => ({ ...prev, [service]: true }));
    
    try {
      // These would call your backend functions when they're set up
      const response = await fetch(`/.netlify/functions/${service}-integration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_connection',
          data: {}
        })
      });

      const result = await response.json();
      
      setConnectionResults(prev => ({
        ...prev,
        [service]: result.success ? 'connected' : 'error'
      }));
    } catch (error) {
      console.error(`Error testing ${service} connection:`, error);
      setConnectionResults(prev => ({
        ...prev,
        [service]: 'error'
      }));
    }
    
    setIsTestingConnection(prev => ({ ...prev, [service]: false }));
  };

  const syncData = async (service, action, data) => {
    try {
      const response = await fetch(`/.netlify/functions/${service}-integration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          data
        })
      });

      return await response.json();
    } catch (error) {
      console.error(`Error syncing with ${service}:`, error);
      throw error;
    }
  };

  const integrationServices = [
    {
      id: 'xero',
      name: 'Xero',
      icon: DollarSign,
      color: 'text-blue-600',
      description: 'Sync quotes and invoices to your accounting system',
      features: ['Auto-sync invoices', 'Quote management', 'Customer sync']
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      icon: Calendar,
      color: 'text-red-600',
      description: 'Create calendar events for bookings and returns',
      features: ['Pickup events', 'Return reminders', 'Customer notifications']
    },
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      icon: Mail,
      color: 'text-orange-600',
      description: 'Automatically manage your customer email lists',
      features: ['Customer sync', 'Smart segmentation', 'Campaign targeting']
    },
    {
      id: 'outlook',
      name: 'Microsoft 365',
      icon: Calendar,
      color: 'text-blue-500',
      description: 'Integrate with Outlook calendar and email',
      features: ['Calendar sync', 'Email notifications', 'Contact management']
    }
  ];

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Settings className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Backend Functions Required:</strong> To use these real-time integrations, you'll need to set up the corresponding backend functions in your Netlify dashboard. 
          The frontend is ready to connect once your functions are deployed.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrationServices.map((service) => {
          const Icon = service.icon;
          const status = connectionResults[service.id] || 'untested';
          const isTesting = isTestingConnection[service.id];
          
          return (
            <Card key={service.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-8 h-8 ${service.color}`} />
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <Badge 
                        variant={status === 'connected' ? 'default' : status === 'error' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {status === 'connected' ? 'Connected' : 
                         status === 'error' ? 'Connection Error' : 
                         'Not Configured'}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testConnection(service.id)}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Test Connection'
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">{service.description}</p>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Features:</h4>
                  <ul className="space-y-1">
                    {service.features.map((feature, index) => (
                      <li key={index} className="text-xs text-slate-600 flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Create Backend Functions</h4>
              <p className="text-sm text-slate-600">
                In your Netlify dashboard, create functions for each integration:
                <code className="bg-slate-100 px-2 py-1 rounded text-xs ml-2">
                  xero-integration.js, google-calendar-integration.js, mailchimp-integration.js, outlook-integration.js
                </code>
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Add Environment Variables</h4>
              <p className="text-sm text-slate-600">
                Configure your API keys in Netlify environment variables:
              </p>
              <div className="bg-slate-50 p-3 rounded text-xs font-mono mt-2">
                <div>XERO_CLIENT_ID=your_xero_client_id</div>
                <div>GOOGLE_SERVICE_ACCOUNT_KEY=your_google_key</div>
                <div>MAILCHIMP_API_KEY=your_mailchimp_key</div>
                <div>MICROSOFT_ACCESS_TOKEN=your_microsoft_token</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Test Connections</h4>
              <p className="text-sm text-slate-600">
                Once your functions are deployed, use the "Test Connection" buttons above to verify everything is working.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}