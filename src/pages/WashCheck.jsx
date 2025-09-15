import React, { useState, useEffect } from 'react';
import { Car, WashVisualCheck } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Car as CarIcon, 
  Sparkles, 
  Camera, 
  Plus, 
  Trash2,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { motion } from 'framer-motion';

export default function WashCheck() {
  const [selectedCar, setSelectedCar] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableCars, setAvailableCars] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [washData, setWashData] = useState({
    // Washing Tasks
    exterior_wash: false,
    interior_vacuum: false,
    interior_wipe_down: false,
    windows_cleaned: false,
    wheel_cleaning: false,
    tire_shine: false,
    dashboard_polish: false,
    seat_cleaning: false,
    
    // Visual Inspection
    visual_checks: {
      lights_working: true,
      indicators_working: true,
      hazard_lights_working: true,
      brake_lights_working: true,
      reverse_lights_working: true,
      headlights_working: true,
      mirrors_intact: true,
      mirrors_clean: true,
      windscreen_condition: 'good',
      side_windows_condition: 'good',
      rear_window_condition: 'good',
      tires_condition: 'good',
      tire_pressure: 'good',
      body_condition: 'excellent',
      paint_condition: 'good',
      interior_condition: 'excellent',
      seat_condition: 'good',
      dashboard_condition: 'good',
      carpet_condition: 'good'
    },
    
    // Damage Assessment
    damage_found: false,
    damage_details: [],
    
    // Photos
    photos: [],
    
    // Completion Details
    wash_completed: false,
    quality_standard_met: false,
    ready_for_next_stage: false,
    notes: "",
    completed_by: ""
  });

  useEffect(() => {
    loadAvailableCars();
  }, []);

  const loadAvailableCars = async () => {
    try {
      const cars = await Car.filter({ 
        status: { '$in': ['in_cleaning', 'returned'] }
      });
      setAvailableCars(cars);
    } catch (error) {
      console.error("Error loading cars:", error);
    }
  };

  const handleCarSelect = (car) => {
    setSelectedCar(car);
    setSearchQuery("");
  };

  const handleInputChange = (category, field, value) => {
    if (category) {
      setWashData(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [field]: value,
        }
      }));
    } else {
      setWashData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addDamage = () => {
    const newDamage = {
      location: '',
      description: '',
      severity: 'minor',
      photo_urls: [],
      requires_repair: false
    };
    setWashData(prev => ({
      ...prev,
      damage_details: [...prev.damage_details, newDamage]
    }));
  };

  const updateDamage = (index, field, value) => {
    const newDamages = [...washData.damage_details];
    newDamages[index][field] = value;
    setWashData(prev => ({
      ...prev,
      damage_details: newDamages
    }));
  };

  const removeDamage = (index) => {
    const newDamages = washData.damage_details.filter((_, i) => i !== index);
    setWashData(prev => ({
      ...prev,
      damage_details: newDamages
    }));
  };

  const handleSubmit = async () => {
    if (!selectedCar || !washData.completed_by) {
      alert("Please select a car and enter your name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const recordData = {
        ...washData,
        car_id: selectedCar.id,
        completion_date: new Date().toISOString(),
        wash_completed: washData.exterior_wash && washData.interior_vacuum && washData.interior_wipe_down && washData.windows_cleaned
      };

      await WashVisualCheck.create(recordData);

      // Update car status
      const newStatus = washData.damage_found ? 'maintenance_required' : 'in_driving_check';
      await Car.update(selectedCar.id, { status: newStatus });

      alert(`Wash and visual check completed successfully! Vehicle moved to ${newStatus.replace('_', ' ')}.`);
      
      // Reset form
      setSelectedCar(null);
      setWashData({
        exterior_wash: false,
        interior_vacuum: false,
        interior_wipe_down: false,
        windows_cleaned: false,
        wheel_cleaning: false,
        tire_shine: false,
        dashboard_polish: false,
        seat_cleaning: false,
        visual_checks: {
          lights_working: true,
          indicators_working: true,
          hazard_lights_working: true,
          brake_lights_working: true,
          reverse_lights_working: true,
          headlights_working: true,
          mirrors_intact: true,
          mirrors_clean: true,
          windscreen_condition: 'good',
          side_windows_condition: 'good',
          rear_window_condition: 'good',
          tires_condition: 'good',
          tire_pressure: 'good',
          body_condition: 'excellent',
          paint_condition: 'good',
          interior_condition: 'excellent',
          seat_condition: 'good',
          dashboard_condition: 'good',
          carpet_condition: 'good'
        },
        damage_found: false,
        damage_details: [],
        photos: [],
        wash_completed: false,
        quality_standard_met: false,
        ready_for_next_stage: false,
        notes: "",
        completed_by: ""
      });
      loadAvailableCars();

    } catch (error) {
      console.error("Error submitting wash check:", error);
      alert("Error submitting form. Please try again.");
    }
    setIsSubmitting(false);
  };

  const filteredCars = availableCars.filter(car =>
    car.fleet_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    car.license_plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${car.make} ${car.model}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const vehicleAreas = [
    'Front Bumper', 'Rear Bumper', 'Left Front Door', 'Right Front Door',
    'Left Rear Door', 'Right Rear Door', 'Hood/Bonnet', 'Roof', 'Boot/Tailgate',
    'Left Front Panel', 'Right Front Panel', 'Left Rear Panel', 'Right Rear Panel',
    'Left Mirror', 'Right Mirror', 'Windscreen', 'Rear Window', 
    'Left Front Wheel', 'Right Front Wheel', 'Left Rear Wheel', 'Right Rear Wheel'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Wash & Visual Check
          </h1>
          <p className="text-slate-600 text-lg">Clean vehicles and perform visual inspections</p>
        </motion.div>

        {/* Car Selection */}
        {!selectedCar && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Select Vehicle for Wash & Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by Fleet ID, license plate, or make/model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {filteredCars.map(car => (
                  <div
                    key={car.id}
                    onClick={() => handleCarSelect(car)}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">
                          {car.make} {car.model} ({car.year})
                        </h3>
                        <p className="text-slate-600">Fleet ID: {car.fleet_id} | {car.license_plate}</p>
                      </div>
                      <Badge className={car.status === 'in_cleaning' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                        {car.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wash & Check Form */}
        {selectedCar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Selected Vehicle Info */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-xl text-slate-900">
                      {selectedCar.make} {selectedCar.model} ({selectedCar.year})
                    </h3>
                    <p className="text-slate-600">Fleet ID: {selectedCar.fleet_id} | {selectedCar.license_plate}</p>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedCar(null)}>
                    Change Vehicle
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Washing Tasks */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Cleaning Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { key: 'exterior_wash', label: 'Exterior Wash Completed' },
                    { key: 'interior_vacuum', label: 'Interior Vacuum Completed' },
                    { key: 'interior_wipe_down', label: 'Interior Wipe Down' },
                    { key: 'windows_cleaned', label: 'All Windows Cleaned' },
                    { key: 'wheel_cleaning', label: 'Wheels & Rims Cleaned' },
                    { key: 'tire_shine', label: 'Tire Shine Applied' },
                    { key: 'dashboard_polish', label: 'Dashboard Polished' },
                    { key: 'seat_cleaning', label: 'Seats Cleaned/Conditioned' }
                  ].map(task => (
                    <div key={task.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={task.key}
                        checked={washData[task.key]}
                        onCheckedChange={(checked) => handleInputChange(null, task.key, checked)}
                      />
                      <Label htmlFor={task.key}>{task.label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Visual Checks */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Visual Inspection Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Lights & Electrical */}
                <div>
                  <h4 className="font-semibold mb-3">Lights & Electrical Systems</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { key: 'lights_working', label: 'All Lights Working' },
                      { key: 'indicators_working', label: 'Turn Indicators Working' },
                      { key: 'hazard_lights_working', label: 'Hazard Lights Working' },
                      { key: 'brake_lights_working', label: 'Brake Lights Working' },
                      { key: 'reverse_lights_working', label: 'Reverse Lights Working' },
                      { key: 'headlights_working', label: 'Headlights (High/Low) Working' }
                    ].map(check => (
                      <div key={check.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={check.key}
                          checked={washData.visual_checks[check.key]}
                          onCheckedChange={(checked) => handleInputChange('visual_checks', check.key, checked)}
                        />
                        <Label htmlFor={check.key}>{check.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mirrors & Glass */}
                <div>
                  <h4 className="font-semibold mb-3">Mirrors & Glass</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mirrors_intact"
                        checked={washData.visual_checks.mirrors_intact}
                        onCheckedChange={(checked) => handleInputChange('visual_checks', 'mirrors_intact', checked)}
                      />
                      <Label htmlFor="mirrors_intact">All Mirrors Intact</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mirrors_clean"
                        checked={washData.visual_checks.mirrors_clean}
                        onCheckedChange={(checked) => handleInputChange('visual_checks', 'mirrors_clean', checked)}
                      />
                      <Label htmlFor="mirrors_clean">Mirrors Clean & Clear</Label>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    {[
                      { key: 'windscreen_condition', label: 'Windscreen Condition' },
                      { key: 'side_windows_condition', label: 'Side Windows Condition' },
                      { key: 'rear_window_condition', label: 'Rear Window Condition' }
                    ].map(item => (
                      <div key={item.key} className="space-y-2">
                        <Label>{item.label}</Label>
                        <Select
                          value={washData.visual_checks[item.key]}
                          onValueChange={(value) => handleInputChange('visual_checks', item.key, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair - Minor Issues</SelectItem>
                            <SelectItem value="poor">Poor - Needs Repair</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tires & Wheels */}
                <div>
                  <h4 className="font-semibold mb-3">Tires & Wheels</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tire Condition</Label>
                      <Select
                        value={washData.visual_checks.tires_condition}
                        onValueChange={(value) => handleInputChange('visual_checks', 'tires_condition', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair - Check Soon</SelectItem>
                          <SelectItem value="needs_replacement">Needs Replacement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tire Pressure</Label>
                      <Select
                        value={washData.visual_checks.tire_pressure}
                        onValueChange={(value) => handleInputChange('visual_checks', 'tire_pressure', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Body & Interior Condition */}
                <div>
                  <h4 className="font-semibold mb-3">Vehicle Condition Assessment</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { key: 'body_condition', label: 'Overall Body Condition' },
                      { key: 'paint_condition', label: 'Paint Condition' },
                      { key: 'interior_condition', label: 'Interior Condition' },
                      { key: 'seat_condition', label: 'Seat Condition' },
                      { key: 'dashboard_condition', label: 'Dashboard Condition' },
                      { key: 'carpet_condition', label: 'Carpet/Floor Condition' }
                    ].map(item => (
                      <div key={item.key} className="space-y-2">
                        <Label>{item.label}</Label>
                        <Select
                          value={washData.visual_checks[item.key]}
                          onValueChange={(value) => handleInputChange('visual_checks', item.key, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Damage Assessment */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Damage Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="damage_found"
                    checked={washData.damage_found}
                    onCheckedChange={(checked) => {
                      handleInputChange(null, 'damage_found', checked);
                      if (!checked) {
                        handleInputChange(null, 'damage_details', []);
                      }
                    }}
                  />
                  <Label htmlFor="damage_found">Damage or Issues Found</Label>
                </div>

                {washData.damage_found && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">Damage Details</h4>
                      <Button onClick={addDamage} variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Damage
                      </Button>
                    </div>

                    {washData.damage_details.map((damage, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-4">
                        <div className="flex justify-between items-start">
                          <h5 className="font-medium">Damage #{index + 1}</h5>
                          <Button
                            onClick={() => removeDamage(index)}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Location</Label>
                            <Select
                              value={damage.location}
                              onValueChange={(value) => updateDamage(index, 'location', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select location..." />
                              </SelectTrigger>
                              <SelectContent>
                                {vehicleAreas.map(area => (
                                  <SelectItem key={area} value={area}>{area}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Severity</Label>
                            <Select
                              value={damage.severity}
                              onValueChange={(value) => updateDamage(index, 'severity', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="minor">Minor</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="major">Major</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={damage.description}
                            onChange={(e) => updateDamage(index, 'description', e.target.value)}
                            placeholder="Describe the damage in detail..."
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`requires_repair_${index}`}
                            checked={damage.requires_repair}
                            onCheckedChange={(checked) => updateDamage(index, 'requires_repair', checked)}
                          />
                          <Label htmlFor={`requires_repair_${index}`}>Requires Immediate Repair</Label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completion Details */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Completion & Sign-off</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="quality_standard_met"
                      checked={washData.quality_standard_met}
                      onCheckedChange={(checked) => handleInputChange(null, 'quality_standard_met', checked)}
                    />
                    <Label htmlFor="quality_standard_met">Vehicle meets WWFH quality standards</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ready_for_next_stage"
                      checked={washData.ready_for_next_stage}
                      onCheckedChange={(checked) => handleInputChange(null, 'ready_for_next_stage', checked)}
                    />
                    <Label htmlFor="ready_for_next_stage">Ready for next workflow stage</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={washData.notes}
                    onChange={(e) => handleInputChange(null, 'notes', e.target.value)}
                    placeholder="Any additional observations, issues, or notes..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Completed By *</Label>
                  <Input
                    value={washData.completed_by}
                    onChange={(e) => handleInputChange(null, 'completed_by', e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => setSelectedCar(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isSubmitting ? 'Submitting...' : 'Complete Wash & Check'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}