
import React, { useState, useEffect } from 'react';
import { PricingRule } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  DollarSign,
  Shield,
  MapPin,
  Truck,
  Wrench,
  Trash
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ruleTypes = {
  insurance: { icon: Shield, name: "Insurance" },
  location_surcharge: { icon: MapPin, name: "Location Surcharge" },
  km_allowance: { icon: Truck, name: "KM Allowance" },
  additional_service: { icon: Wrench, name: "Additional Service" }
};

export default function PricingRulesTab() {
  const [pricingRules, setPricingRules] = useState([]);
  const [editingRule, setEditingRule] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'insurance',
    daily_rate_adjustment: 0,
    one_time_fee: 0,
    description: '',
    active: true
  });

  useEffect(() => {
    loadPricingRules();
  }, []);

  const loadPricingRules = async () => {
    setIsLoading(true);
    try {
      const rules = await PricingRule.list('-created_date');
      setPricingRules(rules);
    } catch (error) {
      console.error("Error loading pricing rules:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    try {
      if (editingRule) {
        await PricingRule.update(editingRule.id, formData);
      } else {
        await PricingRule.create(formData);
      }
      resetForm();
      loadPricingRules();
    } catch (error) {
      console.error("Error saving pricing rule:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this pricing rule?')) {
      try {
        await PricingRule.delete(id);
        loadPricingRules();
      } catch (error) {
        console.error("Error deleting pricing rule:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', type: 'insurance', daily_rate_adjustment: 0, one_time_fee: 0, description: '', active: true
    });
    setEditingRule(null);
    setShowAddForm(false);
  };

  const startEdit = (rule) => {
    setFormData(rule);
    setEditingRule(rule);
    setShowAddForm(true);
    window.scrollTo(0, 0);
  };

  const cleanDuplicates = async () => {
    if (!window.confirm('This will remove duplicate pricing rules based on name and type, keeping only the most recently created one. Continue?')) {
      return;
    }

    setIsCleaningDuplicates(true);
    try {
      const duplicateMap = new Map();
      const duplicatesToDelete = [];

      pricingRules.forEach(rule => {
        const key = `${rule.name.toLowerCase().trim()}-${rule.type}`;
        
        if (duplicateMap.has(key)) {
          const existing = duplicateMap.get(key);
          const current = rule;
          
          if (new Date(current.created_date) > new Date(existing.created_date)) {
            duplicatesToDelete.push(existing.id);
            duplicateMap.set(key, current);
          } else {
            duplicatesToDelete.push(current.id);
          }
        } else {
          duplicateMap.set(key, rule);
        }
      });

      if (duplicatesToDelete.length > 0) {
        for (const id of duplicatesToDelete) {
          await PricingRule.delete(id);
        }
        alert(`Successfully removed ${duplicatesToDelete.length} duplicate pricing rules.`);
        loadPricingRules();
      } else {
        alert('No duplicates found.');
      }
    } catch (error) {
      console.error("Error cleaning duplicates:", error);
      alert('Error cleaning duplicates. Please try again.');
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  const getRuleTypeColor = (type) => {
    const colors = {
      insurance: 'bg-blue-100 text-blue-800',
      location_surcharge: 'bg-purple-100 text-purple-800',
      km_allowance: 'bg-green-100 text-green-800',
      additional_service: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-slate-100 text-slate-800';
  };
  
  const filteredRules = pricingRules.filter(rule => filterType === 'all' || rule.type === filterType);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <CardTitle className="flex items-center gap-2" style={{color: 'var(--wwfh-navy)'}}>
              <DollarSign className="w-5 h-5" />
              Pricing &amp; Service Rules
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rule Types</SelectItem>
                  {Object.entries(ruleTypes).map(([key, { name }]) => (
                    <SelectItem key={key} value={key}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={cleanDuplicates}
                disabled={isCleaningDuplicates}
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <Trash className="w-4 h-4 mr-2" />
                {isCleaningDuplicates ? 'Cleaning...' : 'Clean Duplicates'}
              </Button>

              <Button 
                onClick={() => { setShowAddForm(true); setEditingRule(null); }}
                className="text-white flex-grow"
                style={{background: 'var(--wwfh-red)'}}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Rule
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: '24px' }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 border rounded-lg bg-slate-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      {editingRule ? 'Edit Rule' : 'Add New Rule'}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={resetForm}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rule Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., $5000 excess insurance"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Rule Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({...formData, type: value})}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(ruleTypes).map(([key, { name }]) => (
                            <SelectItem key={key} value={key}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Daily Rate Adjustment ($)</Label>
                      <Input
                        type="number"
                        value={formData.daily_rate_adjustment}
                        onChange={(e) => setFormData({...formData, daily_rate_adjustment: parseFloat(e.target.value) || 0})}
                        placeholder="4"
                        step="0.01"
                      />
                      <p className="text-xs text-slate-500">Positive for charge, negative for discount.</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>One-time Fee ($)</Label>
                      <Input
                        type="number"
                        value={formData.one_time_fee}
                        onChange={(e) => setFormData({...formData, one_time_fee: parseFloat(e.target.value) || 0})}
                        placeholder="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Optional: description for quotes/invoices..."
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="active-rule"
                        checked={formData.active}
                        onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                      />
                      <Label htmlFor="active-rule">Active Rule</Label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} className="text-white" style={{background: 'var(--wwfh-red)'}}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Rule
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="h-5 bg-slate-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))
            ) : filteredRules.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No pricing rules found for this type. Add a new rule to get started.</p>
              </div>
            ) : (
              filteredRules.map((rule) => {
                const RuleIcon = ruleTypes[rule.type]?.icon || DollarSign;
                return (
                  <motion.div
                    key={rule.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <RuleIcon className="w-5 h-5 text-slate-600 flex-shrink-0" />
                          <h3 className="font-bold text-lg text-slate-900">{rule.name}</h3>
                          <Badge className={getRuleTypeColor(rule.type)}>
                            {ruleTypes[rule.type]?.name || rule.type}
                          </Badge>
                          <Badge variant={rule.active ? "default" : "secondary"}>
                            {rule.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600 mb-3">
                          <div>
                            <span className="font-medium text-slate-900">Daily Charge:</span>
                            <span className={`ml-1 font-bold ${rule.daily_rate_adjustment >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {rule.daily_rate_adjustment >= 0 ? '+' : ''}${rule.daily_rate_adjustment.toFixed(2)}
                            </span>
                          </div>
                          {rule.one_time_fee > 0 && (
                            <div>
                              <span className="font-medium text-slate-900">One-time Fee:</span>
                              <span className="ml-1 font-bold" style={{color: 'var(--wwfh-navy)'}}>
                                ${rule.one_time_fee.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {rule.description && (
                          <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                            {rule.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 sm:ml-4 flex-shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => startEdit(rule)}
                        >
                          <Edit className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(rule.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
