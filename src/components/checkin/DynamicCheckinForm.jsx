
import React, { useState, useEffect } from 'react';
import { FormConfiguration } from '@/api/entities';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Clock, User, Car as CarIcon, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import DamageDiagram from '../common/DamageDiagram';

export default function DynamicCheckinForm({ car, checkoutReport, onNext, isSubmitting }) {
  const [formConfig, setFormConfig] = useState(null);
  const [formData, setFormData] = useState({});
  const [newDamages, setNewDamages] = useState([]);
  const [activeDamageId, setActiveDamageId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFormConfiguration = async () => {
      try {
        const configs = await FormConfiguration.filter({ form_type: 'checkin', active: true });
        if (configs.length > 0) {
          setFormConfig(configs[0]);
          initializeFormData(configs[0]);
        }
      } catch (error) {
        console.error("Error loading form configuration:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFormConfiguration();
  }, []);

  const initializeFormData = (config) => {
    const initialData = {
      return_date: new Date().toISOString().slice(0, 16),
      fuel_level_in: 100,
      mileage_in: car?.mileage || checkoutReport?.mileage_out || 0,
      damage_detected: false,
      additional_charges: 0
    };

    // Initialize all form fields with default values
    config.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.enabled) {
          switch (field.field_type) {
            case 'checkbox':
              initialData[field.id] = false;
              break;
            case 'number':
              initialData[field.id] = 0;
              break;
            case 'select':
            case 'radio':
              initialData[field.id] = field.options?.[0] || '';
              break;
            default:
              initialData[field.id] = '';
          }
        }
      });
    });

    setFormData(initialData);
  };

  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleDamageAdd = (coords) => {
    const newDamageId = `damage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newDamage = {
      id: newDamageId,
      type: '',
      severity: 'minor',
      description: '',
      diagram_coords: coords,
      customer_liable: true,
      cost_estimate: 0
    };

    setNewDamages(prev => [...prev, newDamage]);
    setFormData(prev => ({ ...prev, damage_detected: true }));
    setActiveDamageId(newDamageId);
  };

  const handleDamageChange = (id, field, value) => {
    setNewDamages(prev => prev.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  const removeDamage = (id) => {
    setNewDamages(prev => prev.filter(d => d.id !== id));
    if (activeDamageId === id) {
      setActiveDamageId(null);
    }
    // If no damages remain, set damage_detected to false
    if (newDamages.length <= 1) {
      setFormData(prev => ({ ...prev, damage_detected: false }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = [];
    formConfig.sections.forEach(section => {
      if (section.enabled) {
        section.fields.forEach(field => {
          if (field.enabled && field.required && (!formData[field.id] || formData[field.id] === '')) {
            requiredFields.push(field.label);
          }
        });
      }
    });

    if (requiredFields.length > 0) {
      alert(`Please fill in the following required fields: ${requiredFields.join(', ')}`);
      return;
    }

    // Calculate total additional charges
    const totalAdditionalCharges = (
      parseFloat(formData.fuel_charge || 0) + 
      parseFloat(formData.cleaning_charge || 0) + 
      parseFloat(formData.damage_charge || 0)
    );

    // Prepare submission data
    const dataToSubmit = {
      ...formData,
      additional_charges: totalAdditionalCharges,
      new_damages: newDamages.map(d => {
        const { id, ...rest } = d;
        return rest;
      })
    };

    onNext(dataToSubmit);
  };

  const renderField = (field, sectionId) => {
    if (!field.enabled) return null;

    const fieldValue = formData[field.id];

    switch (field.field_type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
            {field.help_text && (
              <p className="text-xs text-slate-500">{field.help_text}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="h-24"
            />
            {field.help_text && (
              <p className="text-xs text-slate-500">{field.help_text}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              type="number"
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
              placeholder={field.placeholder}
              required={field.required}
            />
            {field.help_text && (
              <p className="text-xs text-slate-500">{field.help_text}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Select
              value={fieldValue || ''}
              onValueChange={(value) => handleFieldChange(field.id, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Select option...'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.help_text && (
              <p className="text-xs text-slate-500">{field.help_text}</p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <RadioGroup
              value={fieldValue || ''}
              onValueChange={(value) => handleFieldChange(field.id, value)}
            >
              {field.options?.map(option => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                  <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {field.help_text && (
              <p className="text-xs text-slate-500">{field.help_text}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={fieldValue || false}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
            <Label htmlFor={field.id} className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            {field.help_text && (
              <p className="text-xs text-slate-500 ml-6">{field.help_text}</p>
            )}
          </div>
        );

      case 'datetime':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              type="datetime-local"
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
            />
            {field.help_text && (
              <p className="text-xs text-slate-500">{field.help_text}</p>
            )}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              type="date"
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
            />
            {field.help_text && (
              <p className="text-xs text-slate-500">{field.help_text}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Form Configuration Found</h3>
        <p className="text-slate-600">Please configure the check-in form in the admin panel.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{formConfig.form_name}</h1>
        <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
          <Badge variant="outline" className="flex items-center gap-2">
            <CarIcon className="w-4 h-4" />
            {car.make} {car.model} - Fleet {car.fleet_id}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleDateString()}
          </Badge>
        </div>
      </div>

      {/* Render Dynamic Sections */}
      {formConfig.sections
        .filter(section => section.enabled)
        .sort((a, b) => a.order - b.order)
        .map(section => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            {section.description && (
              <p className="text-sm text-slate-600">{section.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {section.fields
                .filter(field => field.enabled)
                .sort((a, b) => a.order - b.order)
                .map(field => renderField(field, section.id))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Damage Assessment (Special Section) */}
      <Card>
        <CardHeader>
          <CardTitle>Damage Inspection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="mb-4 text-sm text-slate-600">
            Check-out damages are marked in <span className="text-amber-600 font-semibold">orange</span>. 
            Add any new damages by clicking on the diagram. New damages will be marked in <span className="text-red-600 font-semibold">red</span>.
          </p>

          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="damage-detected-toggle"
              checked={formData.damage_detected || false}
              onCheckedChange={(val) => {
                handleFieldChange('damage_detected', val);
                if (!val) {
                  setNewDamages([]);
                  setActiveDamageId(null);
                }
              }}
            />
            <Label htmlFor="damage-detected-toggle">Enable New Damage Detection</Label>
          </div>

          {formData.damage_detected && (
            <DamageDiagram
              diagramType="car"
              existingDamages={checkoutReport?.exterior_condition?.damages || []}
              damages={newDamages}
              onAddDamage={handleDamageAdd}
              activeDamageId={activeDamageId}
              onPointClick={setActiveDamageId}
            />
          )}

          {newDamages.length > 0 && formData.damage_detected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-4"
            >
              {newDamages.map((damage, index) => (
                <motion.div
                  key={damage.id}
                  className={`border rounded-lg p-4 bg-slate-50 transition-all duration-300 ${
                    activeDamageId === damage.id ? 'ring-2 ring-red-500 shadow-md' : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      New Damage Report #{index + 1}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeDamage(damage.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Damage Type</Label>
                      <Select
                        value={damage.type}
                        onValueChange={(val) => handleDamageChange(damage.id, 'type', val)}
                      >
                        <SelectTrigger><SelectValue placeholder="Type..." /></SelectTrigger>
                        <SelectContent>
                          {formConfig.damage_types?.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <Select
                        value={damage.severity}
                        onValueChange={(val) => handleDamageChange(damage.id, 'severity', val)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minor">Minor</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="major">Major</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label>Detailed Description</Label>
                    <Textarea
                      value={damage.description}
                      onChange={(e) => handleDamageChange(damage.id, 'description', e.target.value)}
                      placeholder="Describe the damage in detail..."
                      className="h-20 bg-white"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>Estimated Repair Cost ($)</Label>
                      <Input
                        type="number"
                        value={damage.cost_estimate}
                        onChange={(e) => handleDamageChange(damage.id, 'cost_estimate', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2 flex items-center pt-6">
                      <Checkbox
                        id={`customer-liable-${damage.id}`}
                        checked={damage.customer_liable}
                        onCheckedChange={(val) => handleDamageChange(damage.id, 'customer_liable', val)}
                        className="mr-2"
                      />
                      <Label htmlFor={`customer-liable-${damage.id}`}>Customer liable</Label>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit & Proceed to Next Stage'
          )}
        </Button>
      </div>
    </form>
  );
}
