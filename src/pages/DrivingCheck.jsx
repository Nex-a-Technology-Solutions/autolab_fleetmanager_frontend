
import React, { useState, useEffect } from 'react';
import { Car, DrivingCheck as DrivingCheckEntity } from '@/api/entities';
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
  TestTubeDiagonal, 
  Plus, 
  Trash2,
  CheckCircle2,
  AlertTriangle,
  MapPin
} from "lucide-react";
import { motion } from 'framer-motion';

export default function DrivingCheckPage() {
  const [selectedCar, setSelectedCar] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableCars, setAvailableCars] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [drivingData, setDrivingData] = useState({
    // Pre-Drive Checks
    pre_drive_checks: {
      seat_adjustment: true,
      mirror_adjustment: true,
      seatbelt_check: true,
      handbrake_engaged: true,
      gear_in_neutral_park: true,
      fuel_level_adequate: true
    },
    
    // Engine & Starting
    engine_starts_easily: true,
    engine_idle_smooth: true,
    engine_performance: 'excellent',
    engine_noise_normal: true,
    warning_lights_off: true,
    
    // Transmission & Drivetrain
    transmission_shifts: 'smooth',
    clutch_operation: 'smooth', // for manual vehicles
    gear_changes_smooth: true,
    reverse_gear_works: true,
    park_brake_holds: true,
    
    // Steering & Handling
    steering_responsive: true,
    steering_alignment: 'straight',
    power_steering_working: true,
    turning_radius_normal: true,
    
    // Braking System
    brake_pedal_feel: 'firm',
    brakes_working: true,
    brake_performance: 'excellent',
    abs_working: true,
    handbrake_working: true,
    brake_noise: false,
    
    // Suspension & Ride
    suspension_comfort: 'good',
    shock_absorber_performance: 'good',
    ride_quality: 'smooth',
    vehicle_stability: 'stable',
    
    // Electrical Systems
    lights_all_working: true,
    indicators_working: true,
    hazard_lights_working: true,
    horn_working: true,
    windscreen_wipers: true,
    windscreen_washers: true,
    
    // Climate Control
    air_conditioning: true,
    heating: true,
    ventilation_working: true,
    climate_controls_responsive: true,
    
    // Electronics & Accessories
    radio_working: true,
    power_windows: true,
    central_locking: true,
    dashboard_display: true,
    instrument_cluster: true,
    
    // Drive Test Details
    test_drive_distance: 0,
    test_drive_duration: 0, // in minutes
    test_route_description: '',
    max_speed_tested: 0,
    
    // Fuel System
    fuel_consumption_normal: true,
    fuel_gauge_accurate: true,
    
    // Issues Found
    issues_found: false,
    issue_details: [],
    
    // Overall Assessment
    overall_condition: 'excellent',
    approved_for_hire: false,
    requires_service: false,
    
    // Completion Details
    notes: "",
    completed_by: ""
  });

  useEffect(() => {
    loadAvailableCars();
  }, []);

  const loadAvailableCars = async () => {
    try {
      const cars = await Car.filter({ 
        status: { '$in': ['in_driving_check'] }
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
      setDrivingData(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [field]: value,
        }
      }));
    } else {
      setDrivingData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addIssue = () => {
    const newIssue = {
      component: '',
      issue_description: '',
      severity: 'minor',
      requires_service: false,
      safety_concern: false
    };
    setDrivingData(prev => ({
      ...prev,
      issue_details: [...prev.issue_details, newIssue]
    }));
  };

  const updateIssue = (index, field, value) => {
    const newIssues = [...drivingData.issue_details];
    newIssues[index][field] = value;
    setDrivingData(prev => ({
      ...prev,
      issue_details: newIssues
    }));
  };

  const removeIssue = (index) => {
    const newIssues = drivingData.issue_details.filter((_, i) => i !== index);
    setDrivingData(prev => ({
      ...prev,
      issue_details: newIssues
    }));
  };

  const handleSubmit = async () => {
    if (!selectedCar || !drivingData.completed_by) {
      alert("Please select a car and enter your name.");
      return;
    }

    if (!drivingData.test_drive_distance || drivingData.test_drive_distance <= 0) {
      alert("Please enter the test drive distance.");
      return;
    }

    setIsSubmitting(true);
    try {
      const recordData = {
        ...drivingData,
        car_id: selectedCar.id,
        completion_date: new Date().toISOString()
      };

      await DrivingCheckEntity.create(recordData);

      // Update car status based on results
      let newStatus = 'available';
      if (drivingData.requires_service || drivingData.issues_found) {
        newStatus = 'maintenance_required';
      } else if (drivingData.approved_for_hire) {
        newStatus = 'available';
      } else {
        newStatus = 'in_service'; // Needs approval
      }

      await Car.update(selectedCar.id, { status: newStatus });

      alert(`Driving check completed successfully! Vehicle status updated to ${newStatus.replace('_', ' ')}.`);
      
      // Reset form
      setSelectedCar(null);
      setDrivingData({
        pre_drive_checks: {
          seat_adjustment: true,
          mirror_adjustment: true,
          seatbelt_check: true,
          handbrake_engaged: true,
          gear_in_neutral_park: true,
          fuel_level_adequate: true
        },
        engine_starts_easily: true,
        engine_idle_smooth: true,
        engine_performance: 'excellent',
        engine_noise_normal: true,
        warning_lights_off: true,
        transmission_shifts: 'smooth',
        clutch_operation: 'smooth',
        gear_changes_smooth: true,
        reverse_gear_works: true,
        park_brake_holds: true,
        steering_responsive: true,
        steering_alignment: 'straight',
        power_steering_working: true,
        turning_radius_normal: true,
        brake_pedal_feel: 'firm',
        brakes_working: true,
        brake_performance: 'excellent',
        abs_working: true,
        handbrake_working: true,
        brake_noise: false,
        suspension_comfort: 'good',
        shock_absorber_performance: 'good',
        ride_quality: 'smooth',
        vehicle_stability: 'stable',
        lights_all_working: true,
        indicators_working: true,
        hazard_lights_working: true,
        horn_working: true,
        windscreen_wipers: true,
        windscreen_washers: true,
        air_conditioning: true,
        heating: true,
        ventilation_working: true,
        climate_controls_responsive: true,
        radio_working: true,
        power_windows: true,
        central_locking: true,
        dashboard_display: true,
        instrument_cluster: true,
        test_drive_distance: 0,
        test_drive_duration: 0,
        test_route_description: '',
        max_speed_tested: 0,
        fuel_consumption_normal: true,
        fuel_gauge_accurate: true,
        issues_found: false,
        issue_details: [],
        overall_condition: 'excellent',
        approved_for_hire: false,
        requires_service: false,
        notes: "",
        completed_by: ""
      });
      loadAvailableCars();

    } catch (error) {
      console.error("Error submitting driving check:", error);
      alert("Error submitting form. Please try again.");
    }
    setIsSubmitting(false);
  };

  const filteredCars = availableCars.filter(car =>
    car.fleet_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    car.license_plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${car.make} ${car.model}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const components = [
    'Engine', 'Transmission', 'Brakes', 'Steering', 'Suspension', 'Electrical',
    'Air Conditioning', 'Heating', 'Lights', 'Indicators', 'Wipers', 'Horn',
    'Radio', 'Power Windows', 'Central Locking', 'Dashboard', 'Fuel System', 'Other'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Driving Check & Road Test
          </h1>
          <p className="text-slate-600 text-lg">Comprehensive road testing and mechanical validation</p>
        </motion.div>

        {/* Car Selection */}
        {!selectedCar && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Select Vehicle for Driving Check
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
                      <Badge className="bg-indigo-100 text-indigo-800">
                        READY FOR DRIVING CHECK
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Driving Check Form */}
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

            {/* Pre-Drive Checks */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Pre-Drive Safety Checks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { key: 'seat_adjustment', label: 'Seat Adjusted Properly' },
                    { key: 'mirror_adjustment', label: 'All Mirrors Adjusted' },
                    { key: 'seatbelt_check', label: 'Seatbelt Functions Correctly' },
                    { key: 'handbrake_engaged', label: 'Handbrake Engaged' },
                    { key: 'gear_in_neutral_park', label: 'Gear in Neutral/Park' },
                    { key: 'fuel_level_adequate', label: 'Adequate Fuel for Test' }
                  ].map(check => (
                    <div key={check.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={check.key}
                        checked={drivingData.pre_drive_checks[check.key]}
                        onCheckedChange={(checked) => handleInputChange('pre_drive_checks', check.key, checked)}
                      />
                      <Label htmlFor={check.key}>{check.label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Engine Performance */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Engine & Starting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { key: 'engine_starts_easily', label: 'Engine Starts Easily' },
                    { key: 'engine_idle_smooth', label: 'Engine Idles Smoothly' },
                    { key: 'engine_noise_normal', label: 'Engine Noise Normal' },
                    { key: 'warning_lights_off', label: 'No Warning Lights' }
                  ].map(check => (
                    <div key={check.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={check.key}
                        checked={drivingData[check.key]}
                        onCheckedChange={(checked) => handleInputChange(null, check.key, checked)}
                      />
                      <Label htmlFor={check.key}>{check.label}</Label>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Engine Performance</Label>
                  <RadioGroup
                    value={drivingData.engine_performance}
                    onValueChange={(value) => handleInputChange(null, 'engine_performance', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="excellent" id="engine_excellent" />
                      <Label htmlFor="engine_excellent">Excellent</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="good" id="engine_good" />
                      <Label htmlFor="engine_good">Good</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="needs_attention" id="engine_attention" />
                      <Label htmlFor="engine_attention">Needs Attention</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="poor" id="engine_poor" />
                      <Label htmlFor="engine_poor">Poor</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Transmission & Drivetrain */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Transmission & Drivetrain</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { key: 'gear_changes_smooth', label: 'Gear Changes Smooth' },
                    { key: 'reverse_gear_works', label: 'Reverse Gear Works' },
                    { key: 'park_brake_holds', label: 'Park Brake Holds Vehicle' }
                  ].map(check => (
                    <div key={check.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={check.key}
                        checked={drivingData[check.key]}
                        onCheckedChange={(checked) => handleInputChange(null, check.key, checked)}
                      />
                      <Label htmlFor={check.key}>{check.label}</Label>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Transmission Shifts</Label>
                    <Select
                      value={drivingData.transmission_shifts}
                      onValueChange={(value) => handleInputChange(null, 'transmission_shifts', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smooth">Smooth</SelectItem>
                        <SelectItem value="rough">Rough</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                        <SelectItem value="jerky">Jerky</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Clutch Operation (Manual)</Label>
                    <Select
                      value={drivingData.clutch_operation}
                      onValueChange={(value) => handleInputChange(null, 'clutch_operation', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smooth">Smooth</SelectItem>
                        <SelectItem value="heavy">Heavy</SelectItem>
                        <SelectItem value="slipping">Slipping</SelectItem>
                        <SelectItem value="not_applicable">N/A (Auto)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Steering & Handling */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Steering & Handling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { key: 'steering_responsive', label: 'Steering Responsive' },
                    { key: 'power_steering_working', label: 'Power Steering Working' },
                    { key: 'turning_radius_normal', label: 'Turning Radius Normal' }
                  ].map(check => (
                    <div key={check.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={check.key}
                        checked={drivingData[check.key]}
                        onCheckedChange={(checked) => handleInputChange(null, check.key, checked)}
                      />
                      <Label htmlFor={check.key}>{check.label}</Label>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Steering Alignment</Label>
                  <RadioGroup
                    value={drivingData.steering_alignment}
                    onValueChange={(value) => handleInputChange(null, 'steering_alignment', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="straight" id="steering_straight" />
                      <Label htmlFor="steering_straight">Tracks Straight</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pulls_left" id="steering_left" />
                      <Label htmlFor="steering_left">Pulls Left</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pulls_right" id="steering_right" />
                      <Label htmlFor="steering_right">Pulls Right</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Braking System */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Braking System</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { key: 'brakes_working', label: 'Brakes Working Effectively' },
                    { key: 'abs_working', label: 'ABS System Working' },
                    { key: 'handbrake_working', label: 'Handbrake Working' },
                    { key: 'brake_noise', label: 'Brake Noise Present', inverse: true }
                  ].map(check => (
                    <div key={check.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={check.key}
                        checked={check.inverse ? !drivingData[check.key] : drivingData[check.key]}
                        onCheckedChange={(checked) => handleInputChange(null, check.key, check.inverse ? !checked : checked)}
                      />
                      <Label htmlFor={check.key}>{check.label}</Label>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Brake Pedal Feel</Label>
                    <Select
                      value={drivingData.brake_pedal_feel}
                      onValueChange={(value) => handleInputChange(null, 'brake_pedal_feel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="firm">Firm</SelectItem>
                        <SelectItem value="soft">Soft</SelectItem>
                        <SelectItem value="spongy">Spongy</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Brake Performance</Label>
                    <Select
                      value={drivingData.brake_performance}
                      onValueChange={(value) => handleInputChange(null, 'brake_performance', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="adequate">Adequate</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Drive Details */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Test Drive Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Test Drive Distance (km) *</Label>
                    <Input
                      type="number"
                      value={drivingData.test_drive_distance}
                      onChange={(e) => handleInputChange(null, 'test_drive_distance', parseFloat(e.target.value) || 0)}
                      placeholder="5"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Test Drive Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={drivingData.test_drive_duration}
                      onChange={(e) => handleInputChange(null, 'test_drive_duration', parseFloat(e.target.value) || 0)}
                      placeholder="15"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Speed Tested (km/h)</Label>
                    <Input
                      type="number"
                      value={drivingData.max_speed_tested}
                      onChange={(e) => handleInputChange(null, 'max_speed_tested', parseFloat(e.target.value) || 0)}
                      placeholder="80"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Test Route Description</Label>
                  <Textarea
                    value={drivingData.test_route_description}
                    onChange={(e) => handleInputChange(null, 'test_route_description', e.target.value)}
                    placeholder="Describe the route taken (e.g., city streets, highway, parking lot maneuvers)..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* All Other Systems */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>All Systems Check</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Electrical Systems */}
                <div>
                  <h4 className="font-semibold mb-3">Electrical Systems</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { key: 'lights_all_working', label: 'All Lights Working' },
                      { key: 'indicators_working', label: 'Indicators Working' },
                      { key: 'hazard_lights_working', label: 'Hazard Lights Working' },
                      { key: 'horn_working', label: 'Horn Working' },
                      { key: 'windscreen_wipers', label: 'Windscreen Wipers Working' },
                      { key: 'windscreen_washers', label: 'Windscreen Washers Working' }
                    ].map(check => (
                      <div key={check.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={check.key}
                          checked={drivingData[check.key]}
                          onCheckedChange={(checked) => handleInputChange(null, check.key, checked)}
                        />
                        <Label htmlFor={check.key}>{check.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Climate Control */}
                <div>
                  <h4 className="font-semibold mb-3">Climate Control</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { key: 'air_conditioning', label: 'Air Conditioning Working' },
                      { key: 'heating', label: 'Heating Working' },
                      { key: 'ventilation_working', label: 'Ventilation System Working' },
                      { key: 'climate_controls_responsive', label: 'Climate Controls Responsive' }
                    ].map(check => (
                      <div key={check.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={check.key}
                          checked={drivingData[check.key]}
                          onCheckedChange={(checked) => handleInputChange(null, check.key, checked)}
                        />
                        <Label htmlFor={check.key}>{check.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Electronics & Accessories */}
                <div>
                  <h4 className="font-semibold mb-3">Electronics & Accessories</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { key: 'radio_working', label: 'Radio/Audio System Working' },
                      { key: 'power_windows', label: 'Power Windows Working' },
                      { key: 'central_locking', label: 'Central Locking Working' },
                      { key: 'dashboard_display', label: 'Dashboard Display Working' },
                      { key: 'instrument_cluster', label: 'Instrument Cluster Working' }
                    ].map(check => (
                      <div key={check.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={check.key}
                          checked={drivingData[check.key]}
                          onCheckedChange={(checked) => handleInputChange(null, check.key, checked)}
                        />
                        <Label htmlFor={check.key}>{check.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fuel System */}
                <div>
                  <h4 className="font-semibold mb-3">Fuel System</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fuel_consumption_normal"
                        checked={drivingData.fuel_consumption_normal}
                        onCheckedChange={(checked) => handleInputChange(null, 'fuel_consumption_normal', checked)}
                      />
                      <Label htmlFor="fuel_consumption_normal">Fuel Consumption Normal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fuel_gauge_accurate"
                        checked={drivingData.fuel_gauge_accurate}
                        onCheckedChange={(checked) => handleInputChange(null, 'fuel_gauge_accurate', checked)}
                      />
                      <Label htmlFor="fuel_gauge_accurate">Fuel Gauge Accurate</Label>
                    </div>
                  </div>
                </div>

                {/* Ride Quality */}
                <div>
                  <h4 className="font-semibold mb-3">Ride Quality</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { key: 'suspension_comfort', label: 'Suspension Comfort' },
                      { key: 'shock_absorber_performance', label: 'Shock Absorber Performance' }
                    ].map(item => (
                      <div key={item.key} className="space-y-2">
                        <Label>{item.label}</Label>
                        <Select
                          value={drivingData[item.key]}
                          onValueChange={(value) => handleInputChange(null, item.key, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="adequate">Adequate</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    {[
                      { key: 'ride_quality', label: 'Overall Ride Quality' },
                      { key: 'vehicle_stability', label: 'Vehicle Stability' }
                    ].map(item => (
                      <div key={item.key} className="space-y-2">
                        <Label>{item.label}</Label>
                        <Select
                          value={drivingData[item.key]}
                          onValueChange={(value) => handleInputChange(null, item.key, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="smooth">Smooth</SelectItem>
                            <SelectItem value="acceptable">Acceptable</SelectItem>
                            <SelectItem value="rough">Rough</SelectItem>
                            <SelectItem value="unstable">Unstable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Issues Found */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Issues Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="issues_found"
                    checked={drivingData.issues_found}
                    onCheckedChange={(checked) => {
                      handleInputChange(null, 'issues_found', checked);
                      if (!checked) {
                        handleInputChange(null, 'issue_details', []);
                      }
                    }}
                  />
                  <Label htmlFor="issues_found">Issues or Concerns Found During Test</Label>
                </div>

                {drivingData.issues_found && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">Issue Details</h4>
                      <Button onClick={addIssue} variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Issue
                      </Button>
                    </div>

                    {drivingData.issue_details.map((issue, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-4">
                        <div className="flex justify-between items-start">
                          <h5 className="font-medium">Issue #{index + 1}</h5>
                          <Button
                            onClick={() => removeIssue(index)}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Component</Label>
                            <Select
                              value={issue.component}
                              onValueChange={(value) => updateIssue(index, 'component', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select component..." />
                              </SelectTrigger>
                              <SelectContent>
                                {components.map(comp => (
                                  <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Severity</Label>
                            <Select
                              value={issue.severity}
                              onValueChange={(value) => updateIssue(index, 'severity', value)}
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
                          <Label>Issue Description</Label>
                          <Textarea
                            value={issue.issue_description}
                            onChange={(e) => updateIssue(index, 'issue_description', e.target.value)}
                            placeholder="Describe the issue in detail..."
                          />
                        </div>

                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`requires_service_${index}`}
                              checked={issue.requires_service}
                              onCheckedChange={(checked) => updateIssue(index, 'requires_service', checked)}
                            />
                            <Label htmlFor={`requires_service_${index}`}>Requires Service</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`safety_concern_${index}`}
                              checked={issue.safety_concern}
                              onCheckedChange={(checked) => updateIssue(index, 'safety_concern', checked)}
                            />
                            <Label htmlFor={`safety_concern_${index}`}>Safety Concern</Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Overall Assessment */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Overall Assessment & Approval</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Overall Vehicle Condition</Label>
                  <RadioGroup
                    value={drivingData.overall_condition}
                    onValueChange={(value) => handleInputChange(null, 'overall_condition', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="excellent" id="overall_excellent" />
                      <Label htmlFor="overall_excellent">Excellent - Ready for hire</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="good" id="overall_good" />
                      <Label htmlFor="overall_good">Good - Ready with minor notes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="needs_minor_work" id="overall_minor" />
                      <Label htmlFor="overall_minor">Needs Minor Work</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="needs_major_work" id="overall_major" />
                      <Label htmlFor="overall_major">Needs Major Work</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="approved_for_hire"
                      checked={drivingData.approved_for_hire}
                      onCheckedChange={(checked) => handleInputChange(null, 'approved_for_hire', checked)}
                    />
                    <Label htmlFor="approved_for_hire">Approved for Hire</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requires_service"
                      checked={drivingData.requires_service}
                      onCheckedChange={(checked) => handleInputChange(null, 'requires_service', checked)}
                    />
                    <Label htmlFor="requires_service">Requires Service Before Hire</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    value={drivingData.notes}
                    onChange={(e) => handleInputChange(null, 'notes', e.target.value)}
                    placeholder="Any additional observations, recommendations, or notes..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Completed By *</Label>
                  <Input
                    value={drivingData.completed_by}
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
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                  >
                    {isSubmitting ? 'Submitting...' : 'Complete Driving Check'}
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
