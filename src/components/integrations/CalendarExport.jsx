import React, { useState } from 'react';
import { CheckoutReport, Reservation } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Calendar as CalendarIcon,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";

export default function CalendarExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  const downloadFile = (content, filename, type = 'text/calendar') => {
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
  
  const exportUpcomingBookings = async () => {
    setIsExporting(true);
    setExportResult(null);
    try {
      const [checkouts, reservations] = await Promise.all([
        CheckoutReport.list('-expected_return_date'),
        Reservation.list('-pickup_date').catch(() => [])
      ]);

      const upcomingEvents = [];
      const now = new Date();

      // Add upcoming checkout returns
      checkouts.forEach(checkout => {
        if (checkout.expected_return_date) {
          const returnDate = new Date(checkout.expected_return_date);
          if (returnDate > now) {
            upcomingEvents.push({
              id: `checkout-${checkout.id}`,
              title: `Vehicle Return: ${checkout.customer_name}`,
              description: `Fleet ID: ${checkout.fleet_id}\\nCustomer: ${checkout.customer_name}\\nReturn inspection required`,
              start: returnDate,
              end: new Date(returnDate.getTime() + 60 * 60 * 1000), // 1 hour duration
              location: 'Fleet Depot'
            });
          }
        }
      });

      // Add upcoming reservations
      reservations.forEach(reservation => {
        if (reservation.pickup_date) {
          const pickupDate = new Date(reservation.pickup_date);
          if (pickupDate > now) {
              upcomingEvents.push({
                id: `reservation-pickup-${reservation.id}`,
                title: `Vehicle Pickup: ${reservation.customer_name}`,
                description: `Vehicle Category: ${reservation.vehicle_category}\\nCustomer: ${reservation.customer_name}\\nPickup Location: ${reservation.pickup_location}`,
                start: pickupDate,
                end: new Date(pickupDate.getTime() + 60 * 60 * 1000), // 1 hour
                location: reservation.pickup_location || 'Fleet Depot'
              });
          }
          
          if (reservation.dropoff_date) {
              const dropoffDate = new Date(reservation.dropoff_date);
              if (dropoffDate > now && dropoffDate > pickupDate) {
                upcomingEvents.push({
                  id: `reservation-return-${reservation.id}`,
                  title: `Vehicle Return: ${reservation.customer_name}`,
                  description: `Vehicle Category: ${reservation.vehicle_category}\\nCustomer: ${reservation.customer_name}\\nDropoff Location: ${reservation.dropoff_location}`,
                  start: dropoffDate,
                  end: new Date(dropoffDate.getTime() + 60 * 60 * 1000), // 1 hour
                  location: reservation.dropoff_location || 'Fleet Depot'
                });
              }
          }
        }
      });

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
          `DESCRIPTION:${event.description}`,
          `LOCATION:${event.location}`,
          'STATUS:CONFIRMED',
          'END:VEVENT'
        );
      });

      icsContent.push('END:VCALENDAR');

      const icsFile = icsContent.join('\r\n');
      downloadFile(icsFile, `fleet-bookings-${format(new Date(), 'yyyy-MM-dd')}.ics`, 'text/calendar');
      
      setExportResult(`Generated calendar file with ${upcomingEvents.length} upcoming events.`);

    } catch (error) {
      console.error('Error exporting calendar data:', error);
      setExportResult('Export failed. Check the console for details.');
    }
    setIsExporting(false);
  };
  
  return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            Export Calendar Feed
          </CardTitle>
          <CardDescription>
            Generate a universal .ics calendar file containing all upcoming bookings and returns. This file can be imported into Google Calendar, Outlook, Apple Calendar, and more.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={exportUpcomingBookings}
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...</>
            ) : (
              <><Download className="w-4 h-4 mr-2" /> Export All Upcoming Events</>
            )}
          </Button>
          {exportResult && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              {exportResult}
            </div>
          )}
        </CardContent>
      </Card>
  );
}