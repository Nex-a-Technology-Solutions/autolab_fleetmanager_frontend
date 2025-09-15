
import React, { useState } from 'react';
import { Reservation, Invoice } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X, Edit, FileText, Plus, Trash2, Calculator, Send } from "lucide-react";
import { format } from "date-fns";

export default function EditReservationModal({ reservation, onClose, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [reservationData, setReservationData] = useState({
    ...reservation,
    // Ensure that special_requirements and other text fields are always strings, even if the source data is null or an array.
    special_requirements: String(reservation.special_requirements || ''),
    daily_km_allowance: String(reservation.daily_km_allowance || '100km/day'),
    insurance_option: String(reservation.insurance_option || 'Standard Liability'),
    notes: String(reservation.notes || '')
  });
  
  const [invoiceData, setInvoiceData] = useState({
    line_items: [
      {
        description: `Vehicle Rental - ${reservation.vehicle_category}`,
        quantity: 1,
        unit_price: reservation.total_amount || 0,
        total: reservation.total_amount || 0,
        category: 'base_rental'
      }
    ],
    actual_km_used: 0,
    fuel_charges: 0,
    damage_charges: 0,
    additional_notes: ''
  });

  const handleUpdateReservation = async () => {
    setIsSubmitting(true);
    try {
      // Ensure all fields are correctly typed before sending
      const dataToUpdate = {
        special_requirements: String(reservationData.special_requirements || ''),
        daily_km_allowance: String(reservationData.daily_km_allowance || ''),
        insurance_option: String(reservationData.insurance_option || ''),
        notes: String(reservationData.notes || ''),
        total_amount: reservationData.total_amount
      };

      await Reservation.update(reservation.id, dataToUpdate);

      onSuccess && onSuccess();
      alert('Reservation updated successfully!');
    } catch (error) {
      console.error('Error updating reservation:', error);
      alert('Failed to update reservation: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLineItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        {
          description: '',
          quantity: 1,
          unit_price: 0,
          total: 0,
          category: 'additional_service'
        }
      ]
    }));
  };

  const updateLineItem = (index, field, value) => {
    setInvoiceData(prev => {
      const newItems = [...prev.line_items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Auto-calculate total
      if (field === 'quantity' || field === 'unit_price') {
        newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
      }
      
      return { ...prev, line_items: newItems };
    });
  };

  const removeLineItem = (index) => {
    if (index === 0) return; // Don't remove base rental
    setInvoiceData(prev => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index)
    }));
  };

  const calculateInvoiceTotals = () => {
    const subtotal = invoiceData.line_items.reduce((sum, item) => sum + item.total, 0) + 
                   invoiceData.fuel_charges + invoiceData.damage_charges;
    const tax = subtotal * 0.1; // 10% GST
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  };

  const handleGenerateInvoice = async () => {
    setIsSubmitting(true);
    try {
      const { subtotal, tax, total } = calculateInvoiceTotals();
      const invoiceNumber = `INV-${Date.now()}`;
      
      const pickupDate = new Date(reservation.pickup_date);
      const dropoffDate = new Date(reservation.dropoff_date);
      const totalDays = Math.ceil((dropoffDate - pickupDate) / (1000 * 60 * 60 * 24)) || 1;

      const invoice = await Invoice.create({
        invoice_number: invoiceNumber,
        reservation_id: reservation.id,
        quote_id: reservation.quote_id || null,
        customer_name: reservation.customer_name,
        customer_email: reservation.customer_email,
        customer_phone: reservation.customer_phone,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        vehicle_details: {
          category: reservation.vehicle_category,
          fleet_id: 'TBD',
          license_plate: 'TBD'
        },
        rental_period: {
          pickup_date: reservation.pickup_date,
          dropoff_date: reservation.dropoff_date,
          total_days: totalDays
        },
        line_items: invoiceData.line_items,
        subtotal: subtotal,
        tax: tax,
        total: total,
        special_requirements: String(reservationData.special_requirements || ''),
        daily_km_allowance: String(reservationData.daily_km_allowance || ''),
        insurance_option: String(reservationData.insurance_option || ''),
        actual_km_used: invoiceData.actual_km_used,
        fuel_charges: invoiceData.fuel_charges,
        damage_charges: invoiceData.damage_charges,
        notes: String(invoiceData.additional_notes || '')
      });

      // Explicitly define the update payload to ensure correct types and prevent sending the whole object
      const reservationUpdatePayload = {
        status: 'completed',
        special_requirements: String(reservationData.special_requirements || ''),
        daily_km_allowance: String(reservationData.daily_km_allowance || ''),
        insurance_option: String(reservationData.insurance_option || ''),
        notes: String(reservationData.notes || ''),
        total_amount: reservationData.total_amount
      };

      await Reservation.update(reservation.id, reservationUpdatePayload);

      onSuccess && onSuccess();
      alert(`Invoice ${invoiceNumber} generated successfully!`);
      setActiveTab("details");
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = calculateInvoiceTotals();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2" style={{color: 'var(--wwfh-navy)'}}>
              <Edit className="w-5 h-5" />
              Edit Reservation - {reservation.customer_name}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-sm text-slate-600">
            <Badge variant={reservation.status === 'confirmed' ? 'default' : 'secondary'}>
              {reservation.status}
            </Badge>
            <span className="ml-2">
              {format(new Date(reservation.pickup_date), 'MMM d')} - {format(new Date(reservation.dropoff_date), 'MMM d, yyyy')}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Reservation Details</TabsTrigger>
              <TabsTrigger value="invoice">Generate Invoice</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Daily KM Allowance</Label>
                  <Select 
                    value={reservationData.daily_km_allowance} 
                    onValueChange={(value) => setReservationData({...reservationData, daily_km_allowance: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100km/day">100km per day</SelectItem>
                      <SelectItem value="200km/day">200km per day</SelectItem>
                      <SelectItem value="Unlimited">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Insurance Option</Label>
                  <Select 
                    value={reservationData.insurance_option} 
                    onValueChange={(value) => setReservationData({...reservationData, insurance_option: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard Liability">Standard Liability</SelectItem>
                      <SelectItem value="Reduced Liability ($35/day)">Reduced Liability ($35/day)</SelectItem>
                      <SelectItem value="No Cover">No Cover</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Special Requirements</Label>
                <Textarea
                  value={reservationData.special_requirements}
                  onChange={(e) => setReservationData({...reservationData, special_requirements: e.target.value})}
                  placeholder="Any special requirements, equipment needs, delivery instructions..."
                />
              </div>

              <div className="space-y-2">
                <Label>Total Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={reservationData.total_amount}
                  onChange={(e) => setReservationData({...reservationData, total_amount: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <Textarea
                  value={reservationData.notes}
                  onChange={(e) => setReservationData({...reservationData, notes: e.target.value})}
                  placeholder="Internal notes about this reservation..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateReservation}
                  disabled={isSubmitting}
                  className="text-white"
                  style={{background: 'var(--wwfh-navy)'}}
                >
                  {isSubmitting ? 'Updating...' : 'Update Reservation'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="invoice" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Invoice Line Items</h3>
                  <Button onClick={addLineItem} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {invoiceData.line_items.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-5">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          disabled={index === 0} // Don't allow editing base rental description
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Unit Price"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Total"
                          value={item.total}
                          readOnly
                          className="bg-slate-50"
                        />
                      </div>
                      <div className="col-span-1">
                        {index > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Actual KMs Used</Label>
                    <Input
                      type="number"
                      value={invoiceData.actual_km_used}
                      onChange={(e) => setInvoiceData({...invoiceData, actual_km_used: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fuel Charges ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={invoiceData.fuel_charges}
                      onChange={(e) => setInvoiceData({...invoiceData, fuel_charges: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Damage Charges ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={invoiceData.damage_charges}
                      onChange={(e) => setInvoiceData({...invoiceData, damage_charges: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={invoiceData.additional_notes}
                    onChange={(e) => setInvoiceData({...invoiceData, additional_notes: e.target.value})}
                    placeholder="Additional notes for the invoice..."
                  />
                </div>

                <Card className="p-4 bg-slate-50">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (10%):</span>
                      <span>${totals.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateInvoice}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Generating...' : 'Generate Invoice'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
