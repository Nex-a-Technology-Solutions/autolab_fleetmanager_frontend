import React, { useState } from 'react';
import { ClientRateOverride } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Percent, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function RateOverrideModal({ client, vehicleTypes, existingOverrides, onClose, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [overrideData, setOverrideData] = useState({
    vehicle_type_id: '',
    vehicle_type_name: '',
    override_type: 'percentage_discount',
    discount_percentage: 0,
    fixed_discount_amount: 0,
    fixed_daily_rate: 0,
    applies_to_tiers: ['tier_1_14_days'],
    valid_from: '',
    valid_until: '',
    reason: '',
    approved_by: ''
  });

  const handleAddOverride = async (e) => {
    e.preventDefault();
    if (!overrideData.vehicle_type_id || !overrideData.reason) {
      alert('Vehicle type and reason are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedVehicleType = vehicleTypes.find(vt => vt.id === overrideData.vehicle_type_id);
      
      await ClientRateOverride.create({
        ...overrideData,
        client_id: client.id,
        vehicle_type_name: selectedVehicleType?.name || '',
        approved_by: 'System Admin' // In real app, this would be the current user
      });

      onSuccess && onSuccess();
      setShowAddForm(false);
      setOverrideData({
        vehicle_type_id: '',
        vehicle_type_name: '',
        override_type: 'percentage_discount',
        discount_percentage: 0,
        fixed_discount_amount: 0,
        fixed_daily_rate: 0,
        applies_to_tiers: ['tier_1_14_days'],
        valid_from: '',
        valid_until: '',
        reason: '',
        approved_by: ''
      });
      alert('Rate override added successfully!');
    } catch (error) {
      console.error('Error adding rate override:', error);
      alert('Failed to add rate override: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateOverride = async (overrideId) => {
    try {
      await ClientRateOverride.update(overrideId, { active: false });
      onSuccess && onSuccess();
      alert('Rate override deactivated successfully!');
    } catch (error) {
      console.error('Error deactivating override:', error);
      alert('Failed to deactivate override: ' + error.message);
    }
  };

  const formatOverrideValue = (override) => {
    switch (override.override_type) {
      case 'percentage_discount':
        return `${override.discount_percentage}% off`;
      case 'fixed_discount':
        return `$${override.fixed_discount_amount}/day off`;
      case 'fixed_rate':
        return `$${override.fixed_daily_rate}/day fixed`;
      default:
        return 'Unknown';
    }
  };

  const activeOverrides = existingOverrides.filter(o => o.active);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2" style={{color: 'var(--wwfh-navy)'}}>
              <Percent className="w-5 h-5" />
              Rate Overrides for {client.name}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Overrides */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Current Rate Overrides</h3>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Override
              </Button>
            </div>
            
            {activeOverrides.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-slate-500">No rate overrides set for this client</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeOverrides.map(override => (
                  <Card key={override.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{override.vehicle_type_name}</h4>
                          <p className="text-lg font-bold text-green-600 mt-1">
                            {formatOverrideValue(override)}
                          </p>
                          <div className="flex gap-2 mt-2">
                            {override.applies_to_tiers?.map(tier => (
                              <Badge key={tier} variant="outline" className="text-xs">
                                {tier.replace('tier_', '').replace('_', '-')} days
                              </Badge>
                            ))}
                          </div>
                          {override.reason && (
                            <p className="text-sm text-slate-600 mt-2">
                              <strong>Reason:</strong> {override.reason}
                            </p>
                          )}
                          {override.valid_until && (
                            <p className="text-sm text-slate-600">
                              <strong>Expires:</strong> {format(new Date(override.valid_until), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivateOverride(override.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Add New Override Form */}
          {showAddForm && (
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Add New Rate Override</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddOverride} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Vehicle Type *</Label>
                      <Select 
                        value={overrideData.vehicle_type_id} 
                        onValueChange={(value) => setOverrideData({...overrideData, vehicle_type_id: value})}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleTypes.map(vt => (
                            <SelectItem key={vt.id} value={vt.id}>
                              {vt.name} (${vt.daily_rate}/day)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Override Type *</Label>
                      <Select 
                        value={overrideData.override_type} 
                        onValueChange={(value) => setOverrideData({...overrideData, override_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage_discount">Percentage Discount</SelectItem>
                          <SelectItem value="fixed_discount">Fixed Discount per Day</SelectItem>
                          <SelectItem value="fixed_rate">Fixed Daily Rate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Override Value Input */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {overrideData.override_type === 'percentage_discount' && (
                      <div className="space-y-2">
                        <Label>Discount Percentage</Label>
                        <Input
                          type="number"
                          value={overrideData.discount_percentage}
                          onChange={(e) => setOverrideData({...overrideData, discount_percentage: parseFloat(e.target.value) || 0})}
                          placeholder="15"
                          min="0"
                          max="100"
                        />
                      </div>
                    )}
                    {overrideData.override_type === 'fixed_discount' && (
                      <div className="space-y-2">
                        <Label>Discount Amount per Day ($)</Label>
                        <Input
                          type="number"
                          value={overrideData.fixed_discount_amount}
                          onChange={(e) => setOverrideData({...overrideData, fixed_discount_amount: parseFloat(e.target.value) || 0})}
                          placeholder="25"
                          min="0"
                        />
                      </div>
                    )}
                    {overrideData.override_type === 'fixed_rate' && (
                      <div className="space-y-2">
                        <Label>Fixed Daily Rate ($)</Label>
                        <Input
                          type="number"
                          value={overrideData.fixed_daily_rate}
                          onChange={(e) => setOverrideData({...overrideData, fixed_daily_rate: parseFloat(e.target.value) || 0})}
                          placeholder="120"
                          min="0"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Valid From</Label>
                      <Input
                        type="date"
                        value={overrideData.valid_from}
                        onChange={(e) => setOverrideData({...overrideData, valid_from: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valid Until</Label>
                      <Input
                        type="date"
                        value={overrideData.valid_until}
                        onChange={(e) => setOverrideData({...overrideData, valid_until: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Reason for Override *</Label>
                    <Textarea
                      value={overrideData.reason}
                      onChange={(e) => setOverrideData({...overrideData, reason: e.target.value})}
                      placeholder="e.g., Long-term client discount, Volume booking agreement..."
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowAddForm(false)} type="button">
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSubmitting ? 'Adding...' : 'Add Override'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}