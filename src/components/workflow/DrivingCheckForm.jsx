import React, { useState } from 'react';
import { DrivingCheck } from '@/api/entities';
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TestTube, Car as CarIcon, AlertTriangle, CheckCircle, X } from "lucide-react";

export default function DrivingCheckForm({ workflow, car, onComplete }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Performance Assessment
    engine_performance: 'good',
    transmission: 'good',
    brakes: 'good',
    steering: 'good',
    suspension: 'good',
    
    // Systems Check
    air_conditioning: true,
    heating: true,
    radio_electronics: true,
    warning_lights: false,
    fuel_system: 'good',
    
    // Test Drive Details
    test_drive_distance: 5,
    
    // Issues Assessment
    issues_found: false,
    issue_details: [],
    
    // Final Assessment
    overall_condition: 'good',
    approved_for_hire: false,
    
    // Completion
    notes: '',
    completed_by: ''
  });

  const handleSubmit = async () => {
    if (!formData.completed_by) {
      alert('Please enter your name');
      return;
    }

    if (formData.test_drive_distance < 2) {
      alert('Minimum test drive distance is 2km for proper assessment');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create driving check record
      const drivingCheck = await DrivingCheck.create({
        car_id: car.id,
        checkin_report_id: workflow.checkin_report_id,
        ...formData,
        completion_date: new Date().toISOString(),
        status: 'completed'
      });

      // Update workflow
      const updatedStages = [...(workflow.stages_completed || [])];
      if (!updatedStages.includes('driving_test')) {
        updatedStages.push('driving_test');
      }

      // Determine next stage
      let nextStage = 'approval';
      if (formData.issues_found || !formData.approved_for_hire) {
        nextStage = 'servicing';
      }

      await VehicleWorkflow.update(workflow.id, {
        driving_check_id: drivingCheck.id,
        current_stage: nextStage,
        stages_completed: updatedStages,
        damage_flagged: formData.issues_found,
        last_updated: new Date().toISOString(),
        updated_by: formData.completed_by,
        notes: `${workflow.notes || ''}\nDriving Check: ${formData.notes}`.trim()
      });

      // Update car status
      await Car.update(car.id, {
        status: nextStage === 'servicing' ? 'maintenance_required' : 'available'
      });

      onComplete && onComplete(drivingCheck);
      alert('Driving check completed successfully!');
    } catch (error) {
      console.error('Error completing driving check:', error);
      alert('Error completing driving check. Please try again.');
    }
    setIsSubmitting(false);
  };

  const addIssue = () => {
    setFormData(prev => ({
      ...prev,
      issue_details: [...prev.issue_details, {
        component: '',
        issue_description: '',
        severity: 'minor',
        requires_service: false
      }],
      issues_found: true,
      approved_for_hire: false
    }));
  };

  const handleIssueChange = (index, field, value) => {
    const newIssues = [...formData.issue_details];
    newIssues[index][field] = value;
    setFormData(prev => ({
      ...prev,
      issue_details: newIssues
    }));
  };

  const removeIssue = (index) => {
    const newIssues = formData.issue_details.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      issue_details: newIssues,
      issues_found: newIssues.length > 0
    }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Road Test & Driving Assessment</h1>
        <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
          <Badge variant="outline" className="flex items-center gap-2">
            <CarIcon className="w-4 h-4" />
            {car.make} {car.model} - Fleet {car.fleet_id}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Road Test
          </Badge>
        </div>
      </div>

      {/* Staff Details */}
      <Card>
        <CardHeader>
          <CardTitle>Test Driver Information</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Test Driver (Your Name)</Label>
            <Input
              value={formData.completed_by}
              onChange={(e) => setFormData(prev => ({...prev, completed_by: e.target.value}))}
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Test Drive Distance (km)</Label>
            <Input
              type="number"
              value={formData.test_drive_distance}
              onChange={(e) => setFormData(prev => ({...prev, test_drive_distance: parseFloat(e.target.value) || 0}))}
              placeholder="5"
              min="2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Engine & Drivetrain Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5 text-indigo-500" />
            Engine & Drivetrain Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Engine Performance</Label>
                <RadioGroup 
                  value={formData.engine_performance}
                  onValueChange={(val) => setFormData(prev => ({...prev, engine_performance: val}))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="excellent" id="engine-excellent" />
                    <Label htmlFor="engine-excellent">Excellent - Smooth power delivery</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="good" id="engine-good" />
                    <Label htmlFor="engine-good">Good - Normal performance</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="needs_attention" id="engine-attention" />
                    <Label htmlFor="engine-attention">Needs Attention - Minor issues</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="poor" id="engine-poor" />
                    <Label htmlFor="engine-poor">Poor - Major concerns</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label>Transmission</Label>
                <RadioGroup 
                  value={formData.transmission}
                  onValueChange={(val) => setFormData(prev => ({...prev, transmission: val}))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="excellent" id="trans-excellent" />
                    <Label htmlFor="trans-excellent">Excellent - Smooth shifts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="good" id="trans-good" />
                    <Label htmlFor="trans-good">Good - Normal operation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="needs_attention" id="trans-attention" />
                    <Label htmlFor="trans-attention">Needs Attention</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="poor" id="trans-poor" />
                    <Label htmlFor="trans-poor">Poor - Service required</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Braking System</Label>
                <RadioGroup 
                  value={formData.brakes}
                  onValueChange={(val) => setFormData(prev => ({...prev, brakes: val}))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="excellent" id="brakes-excellent" />
                    <Label htmlFor="brakes-excellent">Excellent - Strong, smooth</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="good" id="brakes-good" />
                    <Label htmlFor="brakes-good">Good - Adequate stopping</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="needs_attention" id="brakes-attention" />
                    <Label htmlFor="brakes-attention">Needs Attention</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="poor" id="brakes-poor" />
                    <Label htmlFor="brakes-poor">Poor - Safety concern</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label>Steering & Handling</Label>
                <RadioGroup 
                  value={formData.steering}
                  onValueChange={(val) => setFormData(prev => ({...prev, steering: val}))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="excellent" id="steering-excellent" />
                    <Label htmlFor="steering-excellent">Excellent - Precise</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="good" id="steering-good" />
                    <Label htmlFor="steering-good">Good - Responsive</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="needs_attention" id="steering-attention" />
                    <Label htmlFor="steering-attention">Needs Attention</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="poor" id="steering-poor" />
                    <Label htmlFor="steering-poor">Poor - Hard to control</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Systems Check */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Systems Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">Comfort Systems</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ac-working"
                    checked={formData.air_conditioning}
                    onCheckedChange={(val) => setFormData(prev => ({...prev, air_conditioning: val}))}
                  />
                  <Label htmlFor="ac-working">Air conditioning working effectively</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="heating-working"
                    checked={formData.heating}
                    onCheckedChange={(val) => setFormData(prev => ({...prev, heating: val}))}
                  />
                  <Label htmlFor="heating-working">Heating system working</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="radio-working"
                    checked={formData.radio_electronics}
                    onCheckedChange={(val) => setFormData(prev => ({...prev, radio_electronics: val}))}
                  />
                  <Label htmlFor="radio-working">Radio/electronics functioning</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">Warning Indicators</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 bg-yellow-50 p-2 rounded">
                  <Checkbox
                    id="warning-lights"
                    checked={formData.warning_lights}
                    onCheckedChange={(val) => setFormData(prev => ({...prev, warning_lights: val}))}
                  />
                  <Label htmlFor="warning-lights" className="text-orange-700">Dashboard warning lights present</Label>
                </div>
                
                <div className="space-y-2">
                  <Label>Fuel System</Label>
                  <Select 
                    value={formData.fuel_system}
                    onValueChange={(val) => setFormData(prev => ({...prev, fuel_system: val}))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">Good - No issues</SelectItem>
                      <SelectItem value="needs_attention">Needs Attention</SelectItem>
                      <SelectItem value="poor">Poor - Service required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="space-y-2">
              <Label>Suspension & Ride Quality</Label>
              <RadioGroup 
                value={formData.suspension}
                onValueChange={(val) => setFormData(prev => ({...prev, suspension: val}))}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excellent" id="susp-excellent" />
                  <Label htmlFor="susp-excellent">Excellent</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="good" id="susp-good" />
                  <Label htmlFor="susp-good">Good</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="needs_attention" id="susp-attention" />
                  <Label htmlFor="susp-attention">Needs Attention</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="poor" id="susp-poor" />
                  <Label htmlFor="susp-poor">Poor</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Issues & Concerns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="issues-found"
              checked={formData.issues_found}
              onCheckedChange={(val) => setFormData(prev => ({
                ...prev, 
                issues_found: val,
                approved_for_hire: val ? false : prev.approved_for_hire
              }))}
            />
            <Label htmlFor="issues-found">Issues or concerns found during road test</Label>
          </div>

          {formData.issues_found && (
            <div className="space-y-4 border-l-4 border-orange-300 pl-4 bg-orange-50 p-4 rounded">
              {formData.issue_details.map((issue, index) => (
                <Card key={index} className="bg-white">
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h5 className="font-semibold">Issue #{index + 1}</h5>
                      <Button variant="outline" size="sm" onClick={() => removeIssue(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Component/System</Label>
                        <Select 
                          value={issue.component} 
                          onValueChange={(val) => handleIssueChange(index, 'component', val)}
                        >
                          <SelectTrigger><SelectValue placeholder="Select component..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Engine">Engine</SelectItem>
                            <SelectItem value="Transmission">Transmission</SelectItem>
                            <SelectItem value="Brakes">Brakes</SelectItem>
                            <SelectItem value="Steering">Steering</SelectItem>
                            <SelectItem value="Suspension">Suspension</SelectItem>
                            <SelectItem value="Electrical">Electrical</SelectItem>
                            <SelectItem value="Air Conditioning">Air Conditioning</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Severity</Label>
                        <Select 
                          value={issue.severity} 
                          onValueChange={(val) => handleIssueChange(index, 'severity', val)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minor">Minor - Monitor</SelectItem>
                            <SelectItem value="moderate">Moderate - Service soon</SelectItem>
                            <SelectItem value="major">Major - Immediate attention</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Issue Description</Label>
                      <Textarea
                        value={issue.issue_description}
                        onChange={(e) => handleIssueChange(index, 'issue_description', e.target.value)}
                        placeholder="Detailed description of the issue observed..."
                        className="h-20"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`requires-service-${index}`}
                        checked={issue.requires_service}
                        onCheckedChange={(val) => handleIssueChange(index, 'requires_service', val)}
                      />
                      <Label htmlFor={`requires-service-${index}`}>Requires immediate service before hire</Label>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button variant="outline" onClick={addIssue}>
                Add Another Issue
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Final Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Final Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Overall Vehicle Condition</Label>
            <RadioGroup 
              value={formData.overall_condition}
              onValueChange={(val) => setFormData(prev => ({...prev, overall_condition: val}))}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excellent" id="overall-excellent" />
                <Label htmlFor="overall-excellent">Excellent</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="good" id="overall-good" />
                <Label htmlFor="overall-good">Good</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="needs_minor_work" id="overall-minor" />
                <Label htmlFor="overall-minor">Needs Minor Work</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="needs_major_work" id="overall-major" />
                <Label htmlFor="overall-major">Needs Major Work</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="p-4 border rounded-lg bg-green-50">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="approved-for-hire"
                checked={formData.approved_for_hire}
                onCheckedChange={(val) => setFormData(prev => ({...prev, approved_for_hire: val}))}
              />
              <Label htmlFor="approved-for-hire" className="font-semibold text-green-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Vehicle approved for customer hire
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
              placeholder="Any additional observations about performance, handling, or recommendations..."
              className="h-24"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="text-center pt-6">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || !formData.completed_by}
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
        >
          {isSubmitting ? 'Processing...' : 'Complete Road Test Assessment'}
        </Button>
      </div>
    </div>
  );
}