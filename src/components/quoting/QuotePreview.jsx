
import React from 'react';
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from 'lucide-react';
import { CalendarHelper } from '@/api/integrations';// New import for CalendarHelper

export default function QuotePreview({ quote, totals, onEdit, onSend, onAccept, isSending }) {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 14);

    // Define the calendar event object based on quote details
    const calendarEvent = {
        id: quote.id, // Assuming 'quote.id' exists for unique event identification
        title: `Vehicle Pickup - ${quote.customer_name}`,
        description: `Vehicle Category: ${quote.vehicle_category}\nCustomer: ${quote.customer_name}\nPhone: ${quote.customer_phone || 'N/A'}\nPickup: ${quote.pickup_location}\nDropoff: ${quote.dropoff_location}`,
        startDate: quote.pickup_date, // Assuming 'quote.pickup_date' is a valid date object or string
        endDate: quote.dropoff_date, // Assuming 'quote.dropoff_date' is a valid date object or string
        location: quote.pickup_location || 'Fleet Depot'
    };

    return (
        // Replaced Card component with a div as per the outline's new wrapping structure
        <div className="max-w-4xl mx-auto bg-white shadow-lg">
            {/* Header section - content previously inside CardHeader */}
            <div className="p-6"> {/* Added padding to replicate CardHeader's default padding */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="text-2xl" style={{color: 'var(--wwfh-navy)'}}>Quote Preview</CardTitle>
                        <p className="text-slate-500 mt-1">This is a preview of the email that will be sent to the customer.</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={onEdit} className="w-1/2 sm:w-auto">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                        <Button
                            onClick={onSend} // Changed from 'onConfirm' to 'onSend'
                            disabled={isSending}
                            className="text-white w-1/2 sm:w-auto" style={{background: 'var(--wwfh-red)'}}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            {isSending ? 'Sending...' : 'Confirm & Send'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quote Details and new integrations - content previously inside CardContent, now wrapped in p-8 */}
            <div className="p-8">
                {/* Existing quote details (email preview) */}
                <div className="border rounded-lg p-6 bg-slate-50 overflow-x-auto">
                    <div style={{ minWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif', color: '#333' }}>
                        <div style={{ background: 'linear-gradient(135deg, #1C2945, #2A3B5C)', padding: '30px', textAlign: 'center', borderRadius: '8px 8px 0 0' }}>
                            <h1 style={{ color: 'white', margin: 0 }}>WWFH Fleet Hire Quote</h1>
                        </div>

                        <div style={{ padding: '30px', background: 'white', borderRadius: '0 0 8px 8px' }}>
                            <p>Dear {quote.customer_name},</p>
                            <p>Thank you for your interest in our vehicle hire services. Please find your quote details below:</p>

                            <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
                                <h3 style={{ color: '#1C2945', marginTop: 0 }}>Quote Summary</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <tbody>
                                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                            <td style={{ padding: '8px 0' }}><strong>Vehicle Type:</strong></td>
                                            <td style={{ textAlign: 'right' }}>{quote.vehicle_category}</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                            <td style={{ padding: '8px 0' }}><strong>Duration:</strong></td>
                                            <td style={{ textAlign: 'right' }}>{quote.hire_duration_days} days</td>
                                        </tr>
                                        {quote.pickup_location && (
                                            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                                <td style={{ padding: '8px 0' }}><strong>Pickup:</strong></td>
                                                <td style={{ textAlign: 'right' }}>{quote.pickup_location}</td>
                                            </tr>
                                        )}
                                        {quote.dropoff_location && (
                                            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                                <td style={{ padding: '8px 0' }}><strong>Dropoff:</strong></td>
                                                <td style={{ textAlign: 'right' }}>{quote.dropoff_location}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ background: '#F0F9FF', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
                                <h4 style={{ color: '#1C2945', marginTop: 0 }}>Line Items</h4>
                                {quote.line_items.map((item, index) => (
                                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                                        <span>{item.description} (x{item.quantity})</span>
                                        <span>${item.total.toFixed(2)}</span>
                                    </div>
                                ))}
                                <hr style={{ margin: '15px 0' }}/>
                                <div style={{display: 'flex', justifyContent: 'space-between', color: '#475569'}}><span>Subtotal</span><span>${totals.subtotal.toFixed(2)}</span></div>
                                <div style={{display: 'flex', justifyContent: 'space-between', color: '#475569'}}><span>GST (10%)</span><span>${totals.tax.toFixed(2)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', color: '#1C2945', marginTop: '10px' }}>
                                    <span>Total (inc. GST)</span>
                                    <span>${totals.total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', margin: '30px 0' }}>
                                <div style={{
                                    background: '#CE202E',
                                    color: 'white',
                                    padding: '15px 30px',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    display: 'inline-block'
                                }}>
                                    ACCEPT QUOTE
                                </div>
                            </div>

                            <p style={{ color: '#64748B', fontSize: '14px' }}>
                                This quote is valid until {validUntil.toLocaleDateString()}.
                                {quote.notes && (
                                    <>
                                        <br/><br/>
                                        <strong>Additional Notes:</strong> {quote.notes}
                                    </>
                                )}
                            </p>

                            <div style={{ background: '#FEF2F2', borderLeft: '4px solid #EF4444', padding: '15px', margin: '20px 0' }}>
                                <p style={{ margin: 0, color: '#B91C1C', fontWeight: 'bold' }}>Important:</p>
                                <p style={{ margin: '5px 0 0 0', color: '#7F1D1D' }}>
                                    All vehicles are subject to availability. A reservation will be confirmed upon acceptance of this quote.
                                </p>
                            </div>
                        </div>

                        <div style={{ background: '#F8FAFC', padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
                            <p>WWFH Fleet Services | Contact: fleet@wwfh.com.au</p>
                        </div>
                    </div>
                </div>

                {/* Calendar Integration - New section */}
                {quote.pickup_date && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-blue-900 mb-2">Add to Your Calendar</h3>
                        <p className="text-sm text-blue-700 mb-3">
                            Never miss a pickup or return date. Add this booking to your calendar.
                        </p>
                        <CalendarHelper
                            event={calendarEvent}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
