
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  X, 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  DollarSign,
  FileText,
  History,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";

export default function ClientDetailsModal({ client, onClose, onRefresh }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2" style={{color: 'var(--wwfh-navy)'}}>
                <User className="w-5 h-5" />
                {client.name}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                {client.company && (
                  <div className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    <span>{client.company}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>{client.email}</span>
                </div>
                <Badge variant={client.client_type === 'corporate' ? 'default' : 'secondary'}>
                  {client.client_type}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-800">{client.totalBookings}</div>
                <div className="text-sm text-blue-600">Total Bookings</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-800">${client.totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-green-600">Total Revenue</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-800">
                  {client.lastBookingDate 
                    ? format(new Date(client.lastBookingDate), 'MMM d')
                    : 'Never'
                  }
                </div>
                <div className="text-sm text-purple-600">Last Booking</div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-800">${client.credit_limit || 0}</div>
                <div className="text-sm text-orange-600">Credit Limit</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Client Details</TabsTrigger>
              <TabsTrigger value="history">Booking History</TabsTrigger>
              <TabsTrigger value="rates">Custom Rates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{client.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{client.address || 'Not provided'}</span>
                    </div>
                    {client.abn && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>ABN: {client.abn}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm text-slate-600">Preferred Pickup:</span>
                      <p className="font-medium">{client.preferred_pickup_location || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-slate-600">Preferred Dropoff:</span>
                      <p className="font-medium">{client.preferred_dropoff_location || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-slate-600">Payment Terms:</span>
                      <p className="font-medium capitalize">{client.payment_terms?.replace('_', ' ')}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {client.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700">{client.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="grid gap-4">
                {client.recentReservations && client.recentReservations.length > 0 ? (
                  client.recentReservations.map(reservation => (
                    <Card key={reservation.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{reservation.vehicle_category}</h4>
                            <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                              <span>{format(new Date(reservation.pickup_date), 'MMM d, yyyy')}</span>
                              <span>{reservation.pickup_location}</span>
                            </div>
                            {reservation.special_requirements && (
                              <div className="text-sm text-blue-600 mt-2">
                                <strong>Requirements:</strong> {reservation.special_requirements}
                              </div>
                            )}
                            {reservation.daily_km_allowance && (
                              <div className="text-sm text-slate-600">
                                <strong>KM Allowance:</strong> {reservation.daily_km_allowance}
                              </div>
                            )}
                            {reservation.insurance_option && (
                              <div className="text-sm text-slate-600">
                                <strong>Insurance:</strong> {reservation.insurance_option}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge variant={reservation.status === 'completed' ? 'default' : 'secondary'}>
                              {reservation.status}
                            </Badge>
                            <p className="text-lg font-bold text-green-600 mt-1">
                              ${reservation.total_amount?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : client.recentQuotes && client.recentQuotes.length > 0 ? (
                  <>
                    <div className="text-sm text-slate-600 mb-4">Showing recent quotes (no completed reservations yet)</div>
                    {client.recentQuotes.map(quote => (
                      <Card key={quote.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">Quote #{quote.quote_number}</h4>
                              <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                                <span>{quote.vehicle_category}</span>
                                {quote.pickup_date && (
                                  <span>{format(new Date(quote.pickup_date), 'MMM d, yyyy')}</span>
                                )}
                                <span>{quote.pickup_location}</span>
                              </div>
                              {quote.special_requirements && (
                                <div className="text-sm text-blue-600 mt-2">
                                  <strong>Requirements:</strong> {quote.special_requirements}
                                </div>
                              )}
                              {quote.daily_km_allowance && (
                                <div className="text-sm text-slate-600">
                                  <strong>KM Allowance:</strong> {quote.daily_km_allowance}
                                </div>
                              )}
                              {quote.insurance_option && (
                                <div className="text-sm text-slate-600">
                                  <strong>Insurance:</strong> {quote.insurance_option}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge variant={quote.status === 'accepted' ? 'default' : quote.status === 'sent' ? 'secondary' : 'outline'}>
                                {quote.status}
                              </Badge>
                              <p className="text-lg font-bold text-blue-600 mt-1">
                                ${quote.total?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <History className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500">No booking history available</p>
                      <p className="text-sm text-slate-400 mt-2">This client hasn't made any bookings yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="rates" className="space-y-4">
              <Card>
                <CardContent className="p-8 text-center">
                  <CreditCard className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">Custom rate information will be displayed here</p>
                  <p className="text-sm text-slate-400 mt-2">Rate overrides and special pricing for this client</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
