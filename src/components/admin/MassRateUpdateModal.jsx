import React, { useState } from 'react';
import { VehicleType } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calculator,
  X,
  Save,
  Percent,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";

export default function MassRateUpdateModal({ vehicleTypes, onClose, onComplete }) {
  const [updateMethod, setUpdateMethod] = useState('percentage'); // 'percentage' or 'fixed'
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [adjustments, setAdjustments] = useState({
    tier_1_14_days: 0,
    tier_15_29_days: 0,
    tier_30_178_days: 0,
    tier_179_363_days: 0,
    tier_364_plus_days: 0
  });

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedTypes(vehicleTypes.map(vt => vt.id));
    } else {
      setSelectedTypes([]);
    }
  };

  const handleSelectType = (typeId, checked) => {
    if (checked) {
      setSelectedTypes(prev => [...prev, typeId]);
    } else {
      setSelectedTypes(prev => prev.filter(id => id !== typeId));
      setSelectAll(false);
    }
  };

  const calculateNewRate = (currentRate, adjustment) => {
    if (updateMethod === 'percentage') {
      return Math.round((currentRate * (1 + adjustment / 100)) * 100) / 100;
    } else {
      return Math.round((currentRate + adjustment) * 100) / 100;
    }
  };

  const handleMassUpdate = async () => {
    if (selectedTypes.length === 0) {
      alert('Please select at least one vehicle type to update.');
      return;
    }

    setIsUpdating(true);
    try {
      const updates = vehicleTypes
        .filter(vt => selectedTypes.includes(vt.id))
        .map(async (type) => {
          const currentTiers = type.pricing_tiers || {
            tier_1_14_days: type.daily_rate || 0,
            tier_15_29_days: type.daily_rate || 0,
            tier_30_178_days: type.daily_rate || 0,
            tier_179_363_days: type.daily_rate || 0,
            tier_364_plus_days: type.daily_rate || 0
          };

          const newTiers = {
            tier_1_14_days: Math.max(0, calculateNewRate(currentTiers.tier_1_14_days, adjustments.tier_1_14_days)),
            tier_15_29_days: Math.max(0, calculateNewRate(currentTiers.tier_15_29_days, adjustments.tier_15_29_days)),
            tier_30_178_days: Math.max(0, calculateNewRate(currentTiers.tier_30_178_days, adjustments.tier_30_178_days)),
            tier_179_363_days: Math.max(0, calculateNewRate(currentTiers.tier_179_363_days, adjustments.tier_179_363_days)),
            tier_364_plus_days: Math.max(0, calculateNewRate(currentTiers.tier_364_plus_days, adjustments.tier_364_plus_days))
          };

          return VehicleType.update(type.id, {
            pricing_tiers: newTiers,
            daily_rate: newTiers.tier_1_14_days // Keep daily_rate in sync
          });
        });

      await Promise.all(updates);
      onComplete();
    } catch (error) {
      console.error('Error updating rates:', error);
      alert('Failed to update rates. Please try again.');
    }
    setIsUpdating(false);
  };

  const previewChanges = () => {
    return vehicleTypes
      .filter(vt => selectedTypes.includes(vt.id))
      .map(type => {
        const currentTiers = type.pricing_tiers || {
          tier_1_14_days: type.daily_rate || 0,
          tier_15_29_days: type.daily_rate || 0,
          tier_30_178_days: type.daily_rate || 0,
          tier_179_363_days: type.daily_rate || 0,
          tier_364_plus_days: type.daily_rate || 0
        };

        return {
          ...type,
          newTiers: {
            tier_1_14_days: calculateNewRate(currentTiers.tier_1_14_days, adjustments.tier_1_14_days),
            tier_15_29_days: calculateNewRate(currentTiers.tier_15_29_days, adjustments.tier_15_29_days),
            tier_30_178_days: calculateNewRate(currentTiers.tier_30_178_days, adjustments.tier_30_178_days),
            tier_179_363_days: calculateNewRate(currentTiers.tier_179_363_days, adjustments.tier_179_363_days),
            tier_364_plus_days: calculateNewRate(currentTiers.tier_364_plus_days, adjustments.tier_364_plus_days)
          },
          currentTiers
        };
      });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-6xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="shadow-2xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2" style={{color: 'var(--wwfh-navy)'}}>
                <Calculator className="w-5 h-5" />
                Mass Rate Update
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Update Method Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Update Method</h3>
              <Select value={updateMethod} onValueChange={setUpdateMethod}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage Adjustment</SelectItem>
                  <SelectItem value="fixed">Fixed Amount Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rate Adjustments */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">
                Rate Adjustments {updateMethod === 'percentage' ? '(%)' : '($)'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { key: 'tier_1_14_days', label: '1-14 Days' },
                  { key: 'tier_15_29_days', label: '15-29 Days' },
                  { key: 'tier_30_178_days', label: '30-178 Days' },
                  { key: 'tier_179_363_days', label: '179-363 Days' },
                  { key: 'tier_364_plus_days', label: '364+ Days' }
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-sm">{label}</Label>
                    <div className="relative">
                      {updateMethod === 'percentage' ? (
                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      ) : (
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      )}
                      <Input
                        type="number"
                        step={updateMethod === 'percentage' ? '0.1' : '0.01'}
                        value={adjustments[key]}
                        onChange={(e) => setAdjustments({
                          ...adjustments,
                          [key]: parseFloat(e.target.value) || 0
                        })}
                        placeholder={updateMethod === 'percentage' ? '10' : '15.00'}
                        className="pl-10"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle Type Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Select Vehicle Types</h3>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all">Select All</Label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto border rounded p-3">
                {vehicleTypes.map(type => (
                  <div key={type.id} className="flex items-center gap-2">
                    <Checkbox
                      id={type.id}
                      checked={selectedTypes.includes(type.id)}
                      onCheckedChange={(checked) => handleSelectType(type.id, checked)}
                    />
                    <Label htmlFor={type.id} className="text-sm cursor-pointer">
                      {type.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Changes */}
            {selectedTypes.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Preview Changes</h3>
                <div className="max-h-64 overflow-y-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="text-left p-2 border-b">Vehicle Type</th>
                        <th className="text-center p-2 border-b">1-14 Days</th>
                        <th className="text-center p-2 border-b">15-29 Days</th>
                        <th className="text-center p-2 border-b">30-178 Days</th>
                        <th className="text-center p-2 border-b">179-363 Days</th>
                        <th className="text-center p-2 border-b">364+ Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewChanges().map(type => (
                        <tr key={type.id} className="border-b">
                          <td className="p-2 font-medium">{type.name}</td>
                          {[
                            'tier_1_14_days',
                            'tier_15_29_days', 
                            'tier_30_178_days',
                            'tier_179_363_days',
                            'tier_364_plus_days'
                          ].map(tier => (
                            <td key={tier} className="p-2 text-center">
                              <div className="space-y-1">
                                <div className="text-slate-500 line-through">
                                  ${type.currentTiers[tier].toFixed(2)}
                                </div>
                                <div className="font-semibold text-green-600">
                                  ${type.newTiers[tier].toFixed(2)}
                                </div>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleMassUpdate}
                disabled={isUpdating || selectedTypes.length === 0}
                className="text-white"
                style={{background: 'var(--wwfh-red)'}}
              >
                <Save className="w-4 h-4 mr-2" />
                {isUpdating ? 'Updating...' : `Update ${selectedTypes.length} Vehicle Types`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}