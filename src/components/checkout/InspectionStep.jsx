import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, ClipboardList, Car, Settings, Fuel, Trash2 } from "lucide-react";
import DamageDiagram from "../common/DamageDiagram";
import { motion, AnimatePresence } from 'framer-motion';

export default function InspectionStep({ onNext, onBack, initialData }) {
  const [inspectionData, setInspectionData] = useState({
    exterior_condition: initialData.exterior_condition || { overall_rating: 'good', damages: [] },
    interior_condition: initialData.interior_condition || { cleanliness: 'good', damages: [] },
    mechanical_check: initialData.mechanical_check || { 
        engine_status: 'good', fluid_levels: 'good', tire_condition: 'good', 
        lights_working: true, air_conditioning: true 
    },
    fuel_level_out: initialData.fuel_level_out || 100,
    mileage_out: initialData.mileage_out || 0,
    additional_notes: initialData.additional_notes || "",
  });

  const handleChange = (section, field, value) => {
    setInspectionData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSimpleChange = (field, value) => {
    setInspectionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDamageAdd = (point) => {
    const newDamage = {
      type: 'dent',
      severity: 'minor',
      description: '',
      diagram_coords: point,
    };
    handleChange('exterior_condition', 'damages', [...inspectionData.exterior_condition.damages, newDamage]);
  };
  
  const handleDamageUpdate = (index, field, value) => {
    const updatedDamages = [...inspectionData.exterior_condition.damages];
    updatedDamages[index][field] = value;
    handleChange('exterior_condition', 'damages', updatedDamages);
  };

  const handleDamageRemove = (index) => {
    const updatedDamages = inspectionData.exterior_condition.damages.filter((_, i) => i !== index);
    handleChange('exterior_condition', 'damages', updatedDamages);
  };
  
  const diagramType = initialData.vehicle_type_details?.diagram_type || 'car';

  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Exterior & Damage Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Overall Exterior Rating</Label>
              <Select
                value={inspectionData.exterior_condition.overall_rating}
                onValueChange={(val) => handleChange('exterior_condition', 'overall_rating', val)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair (Minor cosmetic issues)</SelectItem>
                  <SelectItem value="poor">Poor (Significant wear/damage)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DamageDiagram 
              damages={inspectionData.exterior_condition.damages}
              onAddDamage={handleDamageAdd}
              diagramType={diagramType}
              newDamagePoints={inspectionData.exterior_condition.damages}
              onDiagramClick={handleDamageAdd}
              interactive={true}
            />
            <AnimatePresence>
              {inspectionData.exterior_condition.damages.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-4"
                >
                  {inspectionData.exterior_condition.damages.map((damage, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 border rounded-lg bg-slate-50"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-slate-800">Damage Point #{index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDamageRemove(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Damage Type</Label>
                          <Input value={damage.type} onChange={(e) => handleDamageUpdate(index, 'type', e.target.value)} placeholder="e.g. Scratch, Dent"/>
                        </div>
                        <div className="space-y-2">
                          <Label>Severity</Label>
                          <Select
                            value={damage.severity}
                            onValueChange={(val) => handleDamageUpdate(index, 'severity', val)}
                          >
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minor">Minor</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="major">Major</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label>Description</Label>
                        <Textarea value={damage.description} onChange={(e) => handleDamageUpdate(index, 'description', e.target.value)} placeholder="Describe the damage..." />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
        
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5"/>Mechanical & Interior</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Interior Cleanliness</Label>
                        <Select value={inspectionData.interior_condition.cleanliness} onValueChange={(val) => handleChange('interior_condition', 'cleanliness', val)}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="excellent">Excellent</SelectItem>
                                <SelectItem value="good">Good</SelectItem>
                                <SelectItem value="fair">Fair - Needs light cleaning</SelectItem>
                                <SelectItem value="poor">Poor - Needs deep cleaning</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="lights_working" checked={inspectionData.mechanical_check.lights_working} onCheckedChange={(val) => handleChange('mechanical_check', 'lights_working', val)} />
                            <Label htmlFor="lights_working">All lights functional</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="air_conditioning" checked={inspectionData.mechanical_check.air_conditioning} onCheckedChange={(val) => handleChange('mechanical_check', 'air_conditioning', val)} />
                            <Label htmlFor="air_conditioning">Air Conditioning / Heating functional</Label>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Tire Condition</Label>
                        <RadioGroup value={inspectionData.mechanical_check.tire_condition} onValueChange={(val) => handleChange('mechanical_check', 'tire_condition', val)} className="flex gap-4">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="good" id="tire-good"/><Label htmlFor="tire-good">Good</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="fair" id="tire-fair"/><Label htmlFor="tire-fair">Fair</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="needs_replacement" id="tire-poor"/><Label htmlFor="tire-poor">Needs Replacement</Label></div>
                        </RadioGroup>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Fuel className="w-5 h-5"/>Readings & Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Mileage Out</Label>
                            <Input type="number" value={inspectionData.mileage_out} onChange={(e) => handleSimpleChange('mileage_out', parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Fuel Level Out (%)</Label>
                            <Input type="number" min="0" max="100" value={inspectionData.fuel_level_out} onChange={(e) => handleSimpleChange('fuel_level_out', parseInt(e.target.value) || 0)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Additional Notes</Label>
                        <Textarea value={inspectionData.additional_notes} onChange={(e) => handleSimpleChange('additional_notes', e.target.value)} placeholder="Note any other issues, items left in vehicle, etc." />
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button onClick={() => onNext(inspectionData)}>
            Next <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}