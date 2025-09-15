
import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Camera, Clock, User, Car as CarIcon, Loader2, Trash2 } from "lucide-react";
import DamageDiagram from '../common/DamageDiagram';
import { VehicleType } from '@/api/entities'; // Added import

export default function CheckinInspectionForm({ car, checkoutReport, onNext, isSubmitting }) {
  const [inspectionData, setInspectionData] = useState({ // Renamed formData to inspectionData
    return_date: new Date().toISOString().slice(0, 16),
    fuel_level_in: 100,
    mileage_in: car?.mileage || checkoutReport?.mileage_out || 0,
    exterior_condition: 'excellent',
    interior_condition: 'excellent',
    damage_detected: false,
    new_damages: [], // Renamed damage_details to new_damages
    fuel_charge: 0,
    cleaning_charge: 0,
    damage_charge: 0,
    customer_signature: '',
    staff_signature: '',
    notes: '',
    completed_by: ''
  });
  const [activeDamageId, setActiveDamageId] = useState(null);
  const damageFormRefs = useRef({});
  const [vehicleType, setVehicleType] = useState(null); // Added vehicleType state

  useEffect(() => {
    const fetchVehicleType = async () => {
      if (car?.category) {
        try {
          const types = await VehicleType.filter({ name: car.category });
          if (types.length > 0) {
            setVehicleType(types[0]);
          }
        } catch (error) {
          console.error("Failed to fetch vehicle type for diagram", error);
        }
      }
    };
    fetchVehicleType();
  }, [car]);

  const handleDamageAdd = (coords) => { // Renamed handleDiagramClick to handleDamageAdd
    // Generate a unique ID for the new damage report
    const newDamageId = `damage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newDamage = {
      id: newDamageId,
      type: '',
      severity: 'minor',
      description: '',
      diagram_coords: coords, // Store the coordinates from the diagram click
      customer_liable: true,
      cost_estimate: 0,
      photo_urls: [],
    };

    setInspectionData(prev => { // Updated setFormData to setInspectionData
      // Ensure damage_detected is true if a damage is being added
      const updatedNewDamages = [...prev.new_damages, newDamage]; // Updated damage_details to new_damages
      return {
        ...prev,
        new_damages: updatedNewDamages, // Updated damage_details to new_damages
        damage_detected: updatedNewDamages.length > 0 // Set to true if any damage exists
      };
    });

    setActiveDamageId(newDamageId);
    // Scroll to the newly added damage form after a short delay
    setTimeout(() => {
      damageFormRefs.current[newDamageId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleDamageChange = (id, field, value) => {
    const updatedNewDamages = inspectionData.new_damages.map(d => // Updated formData.damage_details to inspectionData.new_damages
      d.id === id ? { ...d, [field]: value } : d
    );
    setInspectionData(prev => ({ ...prev, new_damages: updatedNewDamages })); // Updated new_damages
  };

  const removeDamage = (id) => {
    const updatedNewDamages = inspectionData.new_damages.filter((d) => d.id !== id); // Updated inspectionData.new_damages
    setInspectionData(prev => ({
      ...prev,
      new_damages: updatedNewDamages, // Updated new_damages
      damage_detected: updatedNewDamages.length > 0 // Set to false if no damages remain
    }));
    if (activeDamageId === id) {
        setActiveDamageId(null); // Clear active if the removed damage was active
    }
  };

  const handleSubmit = (e) => { // Renamed handleFormSubmit to handleSubmit
    e.preventDefault();
    if (!inspectionData.completed_by) { // Updated formData to inspectionData
      alert('Please enter staff member name');
      return;
    }

    // Calculate total additional charges before submitting to ensure it's part of the payload.
    const totalAdditionalCharges = (
      parseFloat(inspectionData.fuel_charge) + // Updated formData to inspectionData
      parseFloat(inspectionData.cleaning_charge) + // Updated formData to inspectionData
      parseFloat(inspectionData.damage_charge) // Updated formData to inspectionData
    );

    // Prepare the final form data with the calculated additional_charges
    const dataToSubmit = {
      ...inspectionData, // Updated formData to inspectionData
      additional_charges: totalAdditionalCharges,
      // Filter out temporary IDs for submission if any, though diagram-added ones are persistent
      new_damages: inspectionData.new_damages.map(d => { // Updated damage_details to new_damages
        const { id, ...rest } = d;
        return rest; // Remove the temporary client-side ID before submission
      })
    };

    // Trigger the workflow transition with the complete and corrected form data
    onNext(dataToSubmit);
  };

  const damageTypes = ['Scratch', 'Dent', 'Chip', 'Crack', 'Scuff', 'Tear', 'Stain', 'Burn', 'Missing Part', 'Broken'];

  // This variable is no longer needed as existingDamages will pass full objects
  // const checkoutDamages = checkoutReport?.exterior_condition?.damages
  //   ?.map(d => d.diagram_coords)
  //   .filter(Boolean) || [];

  // Determine vehicle type for diagram from fetched vehicleType
  const diagramType = vehicleType?.diagram_type || 'car'; // Renamed and derived from new vehicleType state

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto p-6"> {/* Updated onSubmit handler */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Vehicle Check-in Inspection</h1>
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

      {/* Staff & Timing Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Check-in Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Staff Member (Your Name)</Label>
            <Input
              value={inspectionData.completed_by} // Updated formData to inspectionData
              onChange={(e) => setInspectionData(prev => ({...prev, completed_by: e.target.value}))} // Updated setFormData to setInspectionData
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Return Date & Time</Label>
            <Input
              type="datetime-local"
              value={inspectionData.return_date} // Updated formData to inspectionData
              onChange={(e) => setInspectionData(prev => ({...prev, return_date: e.target.value}))} // Updated setFormData to setInspectionData
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Readings */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Condition on Return</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Current Mileage</Label>
              <Input
                type="number"
                value={inspectionData.mileage_in} // Updated formData to inspectionData
                onChange={(e) => setInspectionData(prev => ({...prev, mileage_in: parseInt(e.target.value) || 0}))} // Updated setFormData to setInspectionData
              />
              {checkoutReport && (
                <p className="text-xs text-slate-600">
                  Distance driven: {inspectionData.mileage_in - (checkoutReport.mileage_out || 0)} km {/* Updated formData to inspectionData */}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Fuel Level (%)</Label>
              <Select
                value={inspectionData.fuel_level_in.toString()} // Updated formData to inspectionData
                onValueChange={(val) => setInspectionData(prev => ({...prev, fuel_level_in: parseInt(val)}))} // Updated setFormData to setInspectionData
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">Full (100%)</SelectItem>
                  <SelectItem value="75">3/4 Tank (75%)</SelectItem>
                  <SelectItem value="50">1/2 Tank (50%)</SelectItem>
                  <SelectItem value="25">1/4 Tank (25%)</SelectItem>
                  <SelectItem value="10">Nearly Empty (10%)</SelectItem>
                </SelectContent>
              </Select>
              {checkoutReport && inspectionData.fuel_level_in < (checkoutReport.fuel_level_out || 100) && ( // Updated formData to inspectionData
                <p className="text-xs text-red-600">
                  Fuel difference: -{(checkoutReport.fuel_level_out || 100) - inspectionData.fuel_level_in}% {/* Updated formData to inspectionData */}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Exterior Condition</Label>
              <RadioGroup
                value={inspectionData.exterior_condition} // Updated formData to inspectionData
                onValueChange={(val) => setInspectionData(prev => ({...prev, exterior_condition: val}))} // Updated setFormData to setInspectionData
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excellent" id="ext-excellent" />
                  <Label htmlFor="ext-excellent">Excellent</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="good" id="ext-good" />
                  <Label htmlFor="ext-good">Good</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fair" id="ext-fair" />
                  <Label htmlFor="ext-fair">Fair</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="poor" id="ext-poor" />
                  <Label htmlFor="ext-poor">Poor</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Interior Condition</Label>
              <RadioGroup
                value={inspectionData.interior_condition} // Updated formData to inspectionData
                onValueChange={(val) => setInspectionData(prev => ({...prev, interior_condition: val}))} // Updated setFormData to setInspectionData
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excellent" id="int-excellent" />
                  <Label htmlFor="int-excellent">Excellent</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="good" id="int-good" />
                  <Label htmlFor="int-good">Good</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fair" id="int-fair" />
                  <Label htmlFor="int-fair">Fair - Minor cleaning needed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="poor" id="int-poor" />
                  <Label htmlFor="int-poor">Poor - Deep clean required</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Damage Assessment (Updated as per outline) */}
      <Card>
        <CardHeader>
          <CardTitle>Damage Inspection (Check-in vs Check-out)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="mb-4 text-sm text-slate-600">
              Check-out damages are marked in <span className="text-amber-600 font-semibold">orange</span>. Add any new damages by clicking on the diagram. New damages will be marked in <span className="text-red-600 font-semibold">red</span>.
            </p>

            <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="damage-detected-toggle"
                  checked={inspectionData.damage_detected} // Updated formData to inspectionData
                  onCheckedChange={(val) => {
                    setInspectionData(prev => ({...prev, damage_detected: val})); // Updated setFormData to setInspectionData
                    if (!val) { // If unchecked, clear all new damages
                      setInspectionData(prev => ({...prev, new_damages: []})); // Updated damage_details to new_damages
                      setActiveDamageId(null);
                    }
                  }}
                />
                <Label htmlFor="damage-detected-toggle">Enable New Damage Detection</Label>
            </div>

            {inspectionData.damage_detected && ( // Updated formData to inspectionData
              <DamageDiagram
                diagramType={diagramType} // Updated from vehicleType
                existingDamages={checkoutReport?.exterior_condition?.damages || []} // Updated existingDamagePoints and passes full damage objects
                damages={inspectionData.new_damages} // Updated newDamagePoints to damages, uses new_damages
                onAddDamage={handleDamageAdd} // Updated onDiagramClick to onAddDamage
                activeDamageId={activeDamageId} // Preserved
                onPointClick={setActiveDamageId} // Preserved
              />
            )}

            <AnimatePresence>
                {inspectionData.new_damages.length > 0 && inspectionData.damage_detected && ( // Updated formData.damage_details and formData.damage_detected
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-4"
                    >
                        {inspectionData.new_damages.map((damage, index) => ( // Updated formData.damage_details to inspectionData.new_damages
                             <motion.div
                                key={damage.id}
                                layout
                                ref={(el) => (damageFormRefs.current[damage.id] = el)}
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
                                        {damageTypes.map(type => (
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
                                <Button variant="outline" className="w-full mt-4">
                                  <Camera className="w-4 h-4 mr-2" />
                                  Take Photos of Damage
                                </Button>
                             </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
          </CardContent>
        </Card>

      {/* Additional Charges */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Charges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Fuel Charge ($)</Label>
              <Input
                type="number"
                value={inspectionData.fuel_charge} // Updated formData to inspectionData
                onChange={(e) => setInspectionData(prev => ({...prev, fuel_charge: parseFloat(e.target.value) || 0}))} // Updated setFormData to setInspectionData
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Cleaning Charge ($)</Label>
              <Input
                type="number"
                value={inspectionData.cleaning_charge} // Updated formData to inspectionData
                onChange={(e) => setInspectionData(prev => ({...prev, cleaning_charge: parseFloat(e.target.value) || 0}))} // Updated setFormData to setInspectionData
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Damage Charge ($)</Label>
              <Input
                type="number"
                value={inspectionData.damage_charge} // Updated formData to inspectionData
                onChange={(e) => setInspectionData(prev => ({...prev, damage_charge: parseFloat(e.target.value) || 0}))} // Updated setFormData to setInspectionData
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-100 rounded-lg">
            <p className="font-semibold">
              Total Additional Charges: ${(inspectionData.fuel_charge + inspectionData.cleaning_charge + inspectionData.damage_charge).toFixed(2)} {/* Updated formData to inspectionData */}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Signatures */}
      <Card>
        <CardHeader>
          <CardTitle>Final Notes & Sign-off</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              value={inspectionData.notes} // Updated formData to inspectionData
              onChange={(e) => setInspectionData(prev => ({...prev, notes: e.target.value}))} // Updated setFormData to setInspectionData
              placeholder="Any additional notes about the return condition, customer interaction, or next steps..."
              className="h-24"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-16" type="button">
              <div className="text-center">
                <Camera className="w-6 h-6 mx-auto mb-1" />
                <p className="text-sm">Customer Signature</p>
              </div>
            </Button>
            <Button variant="outline" className="h-16" type="button">
              <div className="text-center">
                <Camera className="w-6 h-6 mx-auto mb-1" />
                <p className="text-sm">Staff Signature</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button (Updated as per outline) */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting} // Updated disabled logic as per outline
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting... {/* Updated text */}
            </>
          ) : 'Submit & Proceed to Wash'} {/* Updated text */}
        </Button>
      </div>
    </form>
  );
}
