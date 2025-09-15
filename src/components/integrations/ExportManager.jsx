import React, { useState } from 'react';
import { Quote, Invoice, CheckoutReport, Car, Reservation } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  FileSpreadsheet, 
  Calendar as CalendarIcon,
  Mail,
  DollarSign,
  Users,
  Loader2,
  CheckCircle,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";

export default function ExportManager() {
  const [isExporting, setIsExporting] = useState({});
  const [exportResults, setExportResults] = useState({});

  const downloadFile = (content, filename, type = 'text/csv') => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportAccountingData = async () => {
    setIsExporting(prev => ({ ...prev, accounting: true }));
    try {
      const [quotes, invoices] = await Promise.all([
        Quote.list('-created_date'),
        Invoice.list('-created_date')
      ]);

      // Export Quotes for Accounting
      const quoteHeaders = [
        'Quote Number', 'Date', 'Customer Name', 'Customer Email', 'Status',
        'Vehicle Category', 'Pickup Date', 'Dropoff Date', 'Days',
        'Subtotal', 'Tax', 'Total', 'Notes'
      ];

      const quoteData = quotes.map(quote => [
        quote.quote_number || '',
        quote.created_date ? format(new Date(quote.created_date), 'yyyy-MM-dd') : '',
        quote.customer_name || '',
        quote.customer_email || '',
        quote.status || '',
        quote.vehicle_category || '',
        quote.pickup_date || '',
        quote.dropoff_date || '',
        quote.hire_duration_days || '',
        quote.subtotal || 0,
        quote.tax || 0,
        quote.total || 0,
        quote.notes || ''
      ]);

      const quoteCsv = [quoteHeaders, ...quoteData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      downloadFile(quoteCsv, `quotes-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);

      // Export Invoices for Accounting
      if (invoices.length > 0) {
        const invoiceHeaders = [
          'Invoice Number', 'Quote ID', 'Issue Date', 'Due Date', 'Status',
          'Customer Name', 'Customer Email', 'Subtotal', 'Tax', 'Total',
          'Amount Paid', 'Balance Due', 'Notes'
        ];

        const invoiceData = invoices.map(invoice => [
          invoice.invoice_number || '',
          invoice.quote_id || '',
          invoice.issue_date || '',
          invoice.due_date || '',
          invoice.status || '',
          invoice.customer_name || '',
          invoice.customer_email || '',
          invoice.subtotal || 0,
          invoice.tax || 0,
          invoice.total || 0,
          invoice.amount_paid || 0,
          (invoice.total || 0) - (invoice.amount_paid || 0),
          invoice.notes || ''
        ]);

        const invoiceCsv = [invoiceHeaders, ...invoiceData]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');

        downloadFile(invoiceCsv, `invoices-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      }

      setExportResults(prev => ({ 
        ...prev, 
        accounting: `Exported ${quotes.length} quotes${invoices.length > 0 ? ` and ${invoices.length} invoices` : ''}` 
      }));

    } catch (error) {
      console.error('Error exporting accounting data:', error);
      setExportResults(prev => ({ ...prev, accounting: 'Export failed' }));
    }
    setIsExporting(prev => ({ ...prev, accounting: false }));
  };

  const exportCustomerData = async () => {
    setIsExporting(prev => ({ ...prev, customers: true }));
    try {
      const [quotes, checkouts, reservations] = await Promise.all([
        Quote.list('-created_date'),
        CheckoutReport.list('-created_date'),
        Reservation.list('-created_date').catch(() => [])
      ]);

      const customerMap = new Map();

      // Collect customers from all sources
      [...quotes, ...checkouts, ...reservations].forEach(record => {
        const email = record.customer_email;
        const name = record.customer_name;
        if (email && name) {
          if (!customerMap.has(email)) {
            customerMap.set(email, {
              name,
              email,
              phone: record.customer_phone || '',
              firstContact: record.created_date,
              lastActivity: record.created_date,
              totalQuotes: 0,
              totalBookings: 0,
              totalValue: 0
            });
          }
          
          const customer = customerMap.get(email);
          if (record.total) customer.totalValue += record.total;
          if (quotes.includes(record)) customer.totalQuotes++;
          if (checkouts.includes(record) || reservations.includes(record)) customer.totalBookings++;
        }
      });

      const customerHeaders = [
        'Name', 'Email', 'Phone', 'First Contact', 'Last Activity',
        'Total Quotes', 'Total Bookings', 'Total Value', 'Customer Type'
      ];

      const customerData = Array.from(customerMap.values()).map(customer => [
        customer.name,
        customer.email,
        customer.phone,
        customer.firstContact ? format(new Date(customer.firstContact), 'yyyy-MM-dd') : '',
        customer.lastActivity ? format(new Date(customer.lastActivity), 'yyyy-MM-dd') : '',
        customer.totalQuotes,
        customer.totalBookings,
        customer.totalValue.toFixed(2),
        customer.totalBookings > 0 ? 'Active Customer' : 'Lead'
      ]);

      const customerCsv = [customerHeaders, ...customerData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      downloadFile(customerCsv, `customers-mailchimp-${format(new Date(), 'yyyy-MM-dd')}.csv`);

      setExportResults(prev => ({ 
        ...prev, 
        customers: `Exported ${customerData.length} unique customers` 
      }));

    } catch (error) {
      console.error('Error exporting customer data:', error);
      setExportResults(prev => ({ ...prev, customers: 'Export failed' }));
    }
    setIsExporting(prev => ({ ...prev, customers: false }));
  };

  const generateCalendarFile = (event) => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//WWFH Fleet//Vehicle Booking//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@wwfhfleet.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      `LOCATION:${event.location || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  };

  const exportUpcomingBookings = async () => {
    setIsExporting(prev => ({ ...prev, calendar: true }));
    try {
      const [checkouts, reservations] = await Promise.all([
        CheckoutReport.list('-expected_return_date'),
        Reservation.list('-pickup_date').catch(() => [])
      ]);

      const upcomingEvents = [];

      // Add checkout returns
      checkouts.forEach(checkout => {
        if (checkout.expected_return_date) {
          const returnDate = new Date(checkout.expected_return_date);
          if (returnDate > new Date()) {
            upcomingEvents.push({
              id: `checkout-${checkout.id}`,
              title: `Vehicle Return: ${checkout.customer_name}`,
              description: `Fleet ID: ${checkout.fleet_id}\nCustomer: ${checkout.customer_name}\nReturn inspection required`,
              start: returnDate,
              end: new Date(returnDate.getTime() + 60 * 60 * 1000), // 1 hour
              location: 'Fleet Depot'
            });
          }
        }
      });

      // Add reservations
      reservations.forEach(reservation => {
        if (reservation.pickup_date) {
          const pickupDate = new Date(reservation.pickup_date);
          const dropoffDate = new Date(reservation.dropoff_date || pickupDate);
          
          upcomingEvents.push({
            id: `reservation-${reservation.id}`,
            title: `Vehicle Pickup: ${reservation.customer_name}`,
            description: `Vehicle Category: ${reservation.vehicle_category}\nCustomer: ${reservation.customer_name}\nPickup Location: ${reservation.pickup_location}`,
            start: pickupDate,
            end: new Date(pickupDate.getTime() + 60 * 60 * 1000), // 1 hour
            location: reservation.pickup_location || 'Fleet Depot'
          });

          if (dropoffDate > pickupDate) {
            upcomingEvents.push({
              id: `return-${reservation.id}`,
              title: `Vehicle Return: ${reservation.customer_name}`,
              description: `Vehicle Category: ${reservation.vehicle_category}\nCustomer: ${reservation.customer_name}\nDropoff Location: ${reservation.dropoff_location}`,
              start: dropoffDate,
              end: new Date(dropoffDate.getTime() + 60 * 60 * 1000), // 1 hour
              location: reservation.dropoff_location || 'Fleet Depot'
            });
          }
        }
      });

      // Create a single ICS file with all events
      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//WWFH Fleet//Vehicle Bookings//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ];

      upcomingEvents.forEach(event => {
        const startDate = event.start;
        const endDate = event.end;
        
        const formatDate = (date) => {
          return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        icsContent.push(
          'BEGIN:VEVENT',
          `UID:${event.id}@wwfhfleet.com`,
          `DTSTAMP:${formatDate(new Date())}`,
          `DTSTART:${formatDate(startDate)}`,
          `DTEND:${formatDate(endDate)}`,
          `SUMMARY:${event.title}`,
          `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
          `LOCATION:${event.location}`,
          'STATUS:CONFIRMED',
          'END:VEVENT'
        );
      });

      icsContent.push('END:VCALENDAR');

      const icsFile = icsContent.join('\r\n');
      downloadFile(icsFile, `fleet-bookings-${format(new Date(), 'yyyy-MM-dd')}.ics`, 'text/calendar');

      setExportResults(prev => ({ 
        ...prev, 
        calendar: `Generated calendar file with ${upcomingEvents.length} events` 
      }));

    } catch (error) {
      console.error('Error exporting calendar data:', error);
      setExportResults(prev => ({ ...prev, calendar: 'Export failed' }));
    }
    setIsExporting(prev => ({ ...prev, calendar: false }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Accounting Integration */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Accounting Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Export quotes and invoices as CSV files for Xero, MYOB, or any accounting software.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Xero Compatible</Badge>
              <Badge variant="outline" className="text-xs">MYOB Compatible</Badge>
            </div>
            <Button 
              onClick={exportAccountingData}
              disabled={isExporting.accounting}
              className="w-full"
            >
              {isExporting.accounting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export Financial Data
            </Button>
            {exportResults.accounting && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                {exportResults.accounting}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Data for Mailchimp */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-orange-600" />
              Email Marketing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Export customer data for Mailchimp, Constant Contact, or other email marketing platforms.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Mailchimp Ready</Badge>
              <Badge variant="outline" className="text-xs">CSV Format</Badge>
            </div>
            <Button 
              onClick={exportCustomerData}
              disabled={isExporting.customers}
              className="w-full"
            >
              {isExporting.customers ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Users className="w-4 h-4 mr-2" />
              )}
              Export Customer List
            </Button>
            {exportResults.customers && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                {exportResults.customers}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar Integration */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              Calendar Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Generate calendar files for Google Calendar, Outlook, Apple Calendar, and more.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Universal .ics</Badge>
              <Badge variant="outline" className="text-xs">All Calendars</Badge>
            </div>
            <Button 
              onClick={exportUpcomingBookings}
              disabled={isExporting.calendar}
              className="w-full"
            >
              {isExporting.calendar ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CalendarIcon className="w-4 h-4 mr-2" />
              )}
              Export Calendar Events
            </Button>
            {exportResults.calendar && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                {exportResults.calendar}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Integration Instructions */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Integration Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-green-600">Accounting (Xero/MYOB)</h4>
              <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                <li>Click "Export Financial Data"</li>
                <li>Save the CSV files to your computer</li>
                <li>In Xero/MYOB, go to Import/Banking</li>
                <li>Upload the CSV files</li>
                <li>Map the columns and import</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-orange-600">Email Marketing (Mailchimp)</h4>
              <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                <li>Click "Export Customer List"</li>
                <li>Open Mailchimp and go to Audience</li>
                <li>Click "Import Contacts"</li>
                <li>Upload the CSV file</li>
                <li>Map fields and import subscribers</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-blue-600">Calendar Sync</h4>
              <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                <li>Click "Export Calendar Events"</li>
                <li>Open the downloaded .ics file</li>
                <li>Your calendar app will import events</li>
                <li>Or manually import in Google/Outlook</li>
                <li>Events appear with full details</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}