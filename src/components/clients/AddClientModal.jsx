import React, { useState } from 'react';
import { Client } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, User, Building, Mail, Phone, MapPin } from "lucide-react";

export default function AddClientModal({ onClose, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    abn: '',
    address: '',
    client_type: 'individual',
    preferred_pickup_location: '',
    preferred_dropoff_location: '',
    payment_terms: 'immediate',
    credit_limit: 0,
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientData.name || !clientData.email) {
      alert('Name and email are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await Client.create(clientData);
      onSuccess && onSuccess();
      onClose();
      alert('Client added successfully!');
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Failed to add client: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2" style={{color: 'var(--wwfh-navy)'}}>
              <User className="w-5 h-5" />
              Add New Client
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={clientData.name}
                  onChange={(e) => setClientData({...clientData, name: e.target.value})}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={clientData.email}
                  onChange={(e) => setClientData({...clientData, email: e.target.value})}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={clientData.phone}
                  onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                  placeholder="0412 345 678"
                />
              </div>
              <div className="space-y-2">
                <Label>Client Type</Label>
                <Select value={clientData.client_type} onValueChange={(value) => setClientData({...clientData, client_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={clientData.company}
                  onChange={(e) => setClientData({...clientData, company: e.target.value})}
                  placeholder="ABC Construction"
                />
              </div>
              <div className="space-y-2">
                <Label>ABN</Label>
                <Input
                  value={clientData.abn}
                  onChange={(e) => setClientData({...clientData, abn: e.target.value})}
                  placeholder="12 345 678 901"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={clientData.address}
                onChange={(e) => setClientData({...clientData, address: e.target.value})}
                placeholder="123 Main St, Perth WA 6000"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preferred Pickup Location</Label>
                <Input
                  value={clientData.preferred_pickup_location}
                  onChange={(e) => setClientData({...clientData, preferred_pickup_location: e.target.value})}
                  placeholder="Perth CBD"
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred Dropoff Location</Label>
                <Input
                  value={clientData.preferred_dropoff_location}
                  onChange={(e) => setClientData({...clientData, preferred_dropoff_location: e.target.value})}
                  placeholder="Perth CBD"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Select value={clientData.payment_terms} onValueChange={(value) => setClientData({...clientData, payment_terms: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="7_days">7 Days</SelectItem>
                    <SelectItem value="14_days">14 Days</SelectItem>
                    <SelectItem value="30_days">30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Credit Limit ($)</Label>
                <Input
                  type="number"
                  value={clientData.credit_limit}
                  onChange={(e) => setClientData({...clientData, credit_limit: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={clientData.notes}
                onChange={(e) => setClientData({...clientData, notes: e.target.value})}
                placeholder="Any additional notes about this client..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="text-white"
                style={{background: 'var(--wwfh-navy)'}}
              >
                {isSubmitting ? 'Adding...' : 'Add Client'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}