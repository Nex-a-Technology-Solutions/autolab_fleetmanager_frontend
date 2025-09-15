import React, { useState } from 'react';
import { VehicleWorkflow } from '@/api/entities';
import { Car } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Camera, CheckCircle, AlertTriangle, Car as CarIcon } from "lucide-react";

export default function WashCheckForm({ workflow, car, onComplete }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Washing Tasks
    wash_completed: false,
    exterior_wash: false,
    interior_vacuum: false,
    interior_wipe_down: false,
    windows_cleaned: false,
    
    // Visual Checks
    visual_checks: {
      lights_working: true,
      indicators_working: true,
      mirrors_intact: true,
      tires_condition: 'good',
      body_condition: 'good',
      interior_condition: 'good'
    },
    
    // Damage Assessment
    damage_found: false,
    damage_details: [],
    
    // Completion
    photos: [],
    notes: '',
    completed_by: ''
  });

  const handleSubmit = async () => {
    if (!formData.completed_by) {
      alert('Please enter your name');
      return;
    }

    if (!formData.wash_completed) {
      alert('Please mark washing as completed before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create wash & visual check record
      const washCheck = await WashVisualCheck.create({
        car_id: car.id,
        checkin_report_id: workflow.checkin_report_id,
        ...formData,
        completion_date: new Date().toISOString(),
        status: 'completed'
      });

      // Update workflow
      const updatedStages = [...(workflow.stages_completed || [])];
      if (!updatedStages.includes('washing')) {
        updatedStages.push('washing');
      }

      await VehicleWorkflow.update(workflow.id, {
        wash_check_id: washCheck.id,
        current_stage: formData.damage_found ? 'damaged' : 'driving_test',
        stages_completed: updatedStages,
        damage_flagged: formData.damage_found,
        last_updated: new Date().toISOString(),
        updated_by: formData.completed_by,
        notes: `${workflow.notes || ''}\nWash Check: ${formData.notes}`.trim()
      });

      // Update car status
      await Car.update(car.id, {
        status: formData.damage_found ? 'maintenance_required' : 'in_driving_check'
      });

      onComplete && onComplete(washCheck);
      alert('Wash & visual check completed successfully!');
    } catch (error) {
      console.error('Error completing wash check:', error);
      alert('Error completing wash check. Please try again.');
    }
    setIsSubmitting(false);
  };

  const addDamage = () => {
    setFormData(prev => ({
      ...prev,
      damage_details: [...prev.damage_details, {
        location: '',
        description: '',
        severity: 'minor',
        photo_urls: []
      }],
      damage_found: true
    }));
  };

  const handleDamageChange = (index, field, value) => {
    const newDamages = [...formData.damage_details];
    newDamages[index][field] = value;
    setFormData(prev => ({
      ...prev,
      damage_details: newDamages
    }));
  };

  const removeDamage = (index) => {
    const newDamages = formData.damage_details.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      damage_details: newDamages,
      damage_found: newDamages.length > 0
    }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Vehicle Wash & Visual Check</h1>
        <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
          <Badge variant="outline" className="flex items-center gap-2">
            <CarIcon className="w-4 h-4" />
            {car.make} {car.model} - Fleet {car.fleet_id}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Wash & Clean
          </Badge>
        </div>
      </div>

      {/* Staff Details */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Completed by (Your Name)</Label>
            <Input
              value={formData.completed_by}
              onChange={(e) => setFormData(prev => ({...prev, completed_by: e.target.value}))}
              placeholder="Enter your full name"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Washing Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Washing & Cleaning Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">Exterior Cleaning</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="exterior-wash"
                    checked={formData.exterior_wash}
                    onCheckedChange={(val) => setFormData(prev => ({...prev, exterior_wash: val}))}
                  />
                  <Label htmlFor="exterior-wash">Full exterior wash completed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="windows-cleaned"
                    checked={formData.windows_cleaned}
                    onCheckedChange={(val) => setFormData(prev => ({...prev, windows_cleaned: val}))}
                  />
                  <Label htmlFor="windows-cleaned">All windows cleaned (inside & outside)</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">Interior Cleaning</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="interior-vacuum"
                    checked={formData.interior_vacuum}
                    onCheckedChange={(val) => setFormData(prev => ({...prev, interior_vacuum: val}))}
                  />
                  <Label htmlFor="interior-vacuum">Interior vacuumed thoroughly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="interior-wipe"
                    checked={formData.interior_wipe_down}
                    onCheckedChange={(val) => setFormData(prev => ({...prev, interior_wipe_down: val}))}
                  />
                  <Label htmlFor="interior-wipe">Dashboard & surfaces wiped down</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 border rounded-lg bg-green-50">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wash-completed"
                checked={formData.wash_completed}
                onCheckedChange={(val) => setFormData(prev => ({...prev, wash_completed: val}))}
              />
              <Label htmlFor="wash-completed" className="font-semibold text-green-800">
                All washing & cleaning tasks completed to standard
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Inspection Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-500" />
            Visual Safety Inspection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">Lights & Electrical</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lights-working"
                    checked={formData.visual_checks.lights_working}
                    onCheckedChange={(val) => setFormData(prev => ({
                      ...prev, 
                      visual_checks: {...prev.visual_checks, lights_working: val}
                    }))}
                  />
                  <Label htmlFor="lights-working">Headlights & taillights working</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="indicators-working"
                    checked={formData.visual_checks.indicators_working}
                    onCheckedChange={(val) => setFormData(prev => ({
                      ...prev, 
                      visual_checks: {...prev.visual_checks, indicators_working: val}
                    }))}
                  />
                  <Label htmlFor="indicators-working">All indicators working</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">Body & Components</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mirrors-intact"
                    checked={formData.visual_checks.mirrors_intact}
                    onCheckedChange={(val) => setFormData(prev => ({
                      ...prev, 
                      visual_checks: {...prev.visual_checks, mirrors_intact: val}
                    }))}
                  />
                  <Label htmlFor="mirrors-intact">All mirrors intact & clean</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="space-y-2">
              <Label>Tire Condition</Label>
              <Select 
                value={formData.visual_checks.tires_condition}
                onValueChange={(val) => setFormData(prev => ({
                  ...prev, 
                  visual_checks: {...prev.visual_checks, tires_condition: val}
                }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair - Monitor</SelectItem>
                  <SelectItem value="needs_replacement">Needs Replacement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Body Condition</Label>
              <Select 
                value={formData.visual_checks.body_condition}
                onValueChange={(val) => setFormData(prev => ({
                  ...prev, 
                  visual_checks: {...prev.visual_checks, body_condition: val}
                }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Interior Condition</Label>
              <Select 
                value={formData.visual_checks.interior_condition}
                onValueChange={(val) => setFormData(prev => ({
                  ...prev, 
                  visual_checks: {...prev.visual_checks, interior_condition: val}
                }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Damage Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Damage Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="damage-found"
              checked={formData.damage_found}
              onCheckedChange={(val) => setFormData(prev => ({...prev, damage_found: val}))}
            />
            <Label htmlFor="damage-found">New damage or issues discovered during wash/inspection</Label>
          </div>

          {formData.damage_found && (
            <div className="space-y-4 border-l-4 border-orange-300 pl-4 bg-orange-50 p-4 rounded">
              {formData.damage_details.map((damage, index) => (
                <Card key={index} className="bg-white">
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h5 className="font-semibold">Issue #{index + 1}</h5>
                      <Button variant="outline" size="sm" onClick={() => removeDamage(index)}>
                        Remove
                      </Button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Location/Area</Label>
                        <Input
                          value={damage.location}
                          onChange={(e) => handleDamageChange(index, 'location', e.target.value)}
                          placeholder="e.g., Front bumper, Interior seat"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Severity</Label>
                        <Select 
                          value={damage.severity} 
                          onValueChange={(val) => handleDamageChange(index, 'severity', val)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minor">Minor - Cosmetic</SelectItem>
                            <SelectItem value="moderate">Moderate - Affects function</SelectItem>
                            <SelectItem value="major">Major - Safety concern</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={damage.description}
                        onChange={(e) => handleDamageChange(index, 'description', e.target.value)}
                        placeholder="Detailed description of the issue found..."
                        className="h-20"
                      />
                    </div>

                    <Button variant="outline" className="w-full">
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photos of Issue
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              <Button variant="outline" onClick={addDamage}>
                Add Another Issue
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photos & Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Documentation & Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full h-16">
            <div className="text-center">
              <Camera className="w-6 h-6 mx-auto mb-1" />
              <p>Take Before/After Photos</p>
            </div>
          </Button>
          
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
              placeholder="Any additional observations, cleaning notes, or recommendations for the next stage..."
              className="h-24"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="text-center pt-6">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !formData.completed_by || !formData.wash_completed}
          size="lg"
          className="bg-purple-600 hover:bg-purple-700 text-white px-8"
        >
          {isSubmitting ? 'Processing...' : 'Complete Wash & Visual Check'}
        </Button>
      </div>
    </div>
  );
}