
import React, { useState, useEffect } from 'react';
import { FormConfiguration } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Eye, 
  GripVertical,
  FileText,
  Car as CarIcon,
  Sparkles,
  TestTube,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  Copy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const formTypeIcons = {
  checkout: CarIcon,
  checkin: FileText,
  wash_check: Sparkles,
  driving_test: TestTube
};

const fieldTypes = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number Input' },
  { value: 'select', label: 'Dropdown Select' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date Picker' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'rating', label: 'Rating Scale' }
];

export default function FormBuilderTab({ defaultConfigs }) {
  const [formConfigs, setFormConfigs] = useState([]);
  const [activeForm, setActiveForm] = useState("checkout");
  const [editingSection, setEditingSection] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadFormConfigurations = async () => {
      setIsLoading(true);
      try {
        const configs = await FormConfiguration.list();
        
        // If no configs exist, create defaults
        if (configs.length === 0) {
          const createdConfigs = [];
          for (const [formType, config] of Object.entries(defaultConfigs)) {
            const created = await FormConfiguration.create(config);
            createdConfigs.push(created);
          }
          setFormConfigs(createdConfigs);
        } else {
          setFormConfigs(configs);
        }
      } catch (error) {
        console.error("Error loading form configurations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFormConfigurations();
  }, [defaultConfigs]); // Added defaultConfigs to dependency array

  const getCurrentFormConfig = () => {
    return formConfigs.find(config => config.form_type === activeForm);
  };

  const saveFormConfig = async () => {
    setIsSaving(true);
    try {
      const currentConfig = getCurrentFormConfig();
      if (currentConfig) {
        await FormConfiguration.update(currentConfig.id, currentConfig);
        alert('Form configuration saved successfully!');
      }
    } catch (error) {
      console.error("Error saving form configuration:", error);
      alert('Failed to save form configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormConfig = (updates) => {
    setFormConfigs(prev => prev.map(config => 
      config.form_type === activeForm 
        ? { ...config, ...updates }
        : config
    ));
  };

  const addSection = () => {
    const currentConfig = getCurrentFormConfig();
    const newSection = {
      id: `section_${Date.now()}`,
      title: "New Section",
      description: "",
      order: currentConfig.sections.length,
      enabled: true,
      fields: []
    };
    
    updateFormConfig({
      sections: [...currentConfig.sections, newSection]
    });
  };

  const updateSection = (sectionId, updates) => {
    const currentConfig = getCurrentFormConfig();
    const updatedSections = currentConfig.sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    );
    updateFormConfig({ sections: updatedSections });
  };

  const deleteSection = (sectionId) => {
    const currentConfig = getCurrentFormConfig();
    const updatedSections = currentConfig.sections.filter(section => section.id !== sectionId);
    updateFormConfig({ sections: updatedSections });
  };

  const addField = (sectionId) => {
    const currentConfig = getCurrentFormConfig();
    const section = currentConfig.sections.find(s => s.id === sectionId);
    const newField = {
      id: `field_${Date.now()}`,
      label: "New Field",
      field_type: "text",
      required: false,
      order: section.fields.length,
      enabled: true,
      placeholder: "",
      options: [],
      help_text: ""
    };

    const updatedSections = currentConfig.sections.map(s =>
      s.id === sectionId 
        ? { ...s, fields: [...s.fields, newField] }
        : s
    );
    updateFormConfig({ sections: updatedSections });
  };

  const updateField = (sectionId, fieldId, updates) => {
    const currentConfig = getCurrentFormConfig();
    const updatedSections = currentConfig.sections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            fields: section.fields.map(field =>
              field.id === fieldId ? { ...field, ...updates } : field
            )
          }
        : section
    );
    updateFormConfig({ sections: updatedSections });
  };

  const deleteField = (sectionId, fieldId) => {
    const currentConfig = getCurrentFormConfig();
    const updatedSections = currentConfig.sections.map(section =>
      section.id === sectionId
        ? { ...section, fields: section.fields.filter(field => field.id !== fieldId) }
        : section
    );
    updateFormConfig({ sections: updatedSections });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'sections') {
      const currentConfig = getCurrentFormConfig();
      const newSections = Array.from(currentConfig.sections);
      const [reorderedSection] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, reorderedSection);
      
      // Update order values
      newSections.forEach((section, index) => {
        section.order = index;
      });
      
      updateFormConfig({ sections: newSections });
    } else if (type === 'fields') {
      const sectionId = source.droppableId.replace('fields-', '');
      const currentConfig = getCurrentFormConfig();
      const section = currentConfig.sections.find(s => s.id === sectionId);
      const newFields = Array.from(section.fields);
      const [reorderedField] = newFields.splice(source.index, 1);
      newFields.splice(destination.index, 0, reorderedField);
      
      // Update order values
      newFields.forEach((field, index) => {
        field.order = index;
      });
      
      updateSection(sectionId, { fields: newFields });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading form configurations...</p>
        </div>
      </div>
    );
  }

  const currentFormConfig = getCurrentFormConfig();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Form Builder</h2>
          <p className="text-slate-600">Customize checkout and check-in forms to match your workflow</p>
        </div>
        <Button onClick={saveFormConfig} disabled={isSaving}>
          {isSaving ? (
            <>
              <Save className="w-4 h-4 mr-2 animate-pulse" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeForm} onValueChange={setActiveForm}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 h-auto p-2 bg-white/60 backdrop-blur-sm">
          {Object.keys(defaultConfigs).map((formType) => {
            const IconComponent = formTypeIcons[formType] || FileText;
            return (
              <TabsTrigger
                key={formType}
                value={formType}
                className="flex items-center gap-2 p-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <IconComponent className="w-4 h-4" />
                <span className="hidden md:block">
                  {formType === 'checkout' && 'Checkout'}
                  {formType === 'checkin' && 'Check-in'}
                  {formType === 'wash_check' && 'Wash Check'}
                  {formType === 'driving_test' && 'Driving Test'}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.keys(defaultConfigs).map((formType) => (
          <TabsContent key={formType} value={formType}>
            {currentFormConfig && (
              <div className="space-y-6">
                {/* Form Header */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit className="w-5 h-5" />
                      {currentFormConfig.form_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Form Name</Label>
                        <Input
                          value={currentFormConfig.form_name}
                          onChange={(e) => updateFormConfig({ form_name: e.target.value })}
                          placeholder="Form display name"
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Checkbox
                          id="form-active"
                          checked={currentFormConfig.active}
                          onCheckedChange={(checked) => updateFormConfig({ active: checked })}
                        />
                        <Label htmlFor="form-active">Form is active</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Form Sections */}
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="sections" type="sections">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                        <AnimatePresence>
                          {currentFormConfig.sections
                            .sort((a, b) => a.order - b.order)
                            .map((section, index) => (
                            <Draggable key={section.id} draggableId={section.id} index={index}>
                              {(provided, snapshot) => (
                                <motion.div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                  className={`transition-shadow ${snapshot.isDragging ? 'shadow-xl' : ''}`}
                                >
                                  <Card className={`${!section.enabled ? 'opacity-60' : ''}`}>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div {...provided.dragHandleProps} className="cursor-grab hover:text-blue-600">
                                          <GripVertical className="w-5 h-5" />
                                        </div>
                                        <div>
                                          <CardTitle className="text-lg">{section.title}</CardTitle>
                                          {section.description && (
                                            <p className="text-sm text-slate-600 mt-1">{section.description}</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant={section.enabled ? "default" : "secondary"}>
                                          {section.enabled ? "Enabled" : "Disabled"}
                                        </Badge>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => deleteSection(section.id)}
                                        >
                                          <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                      </div>
                                    </CardHeader>

                                    <AnimatePresence>
                                      {editingSection === section.id && (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                        >
                                          <CardContent className="border-t bg-slate-50">
                                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                              <div className="space-y-2">
                                                <Label>Section Title</Label>
                                                <Input
                                                  value={section.title}
                                                  onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                                />
                                              </div>
                                              <div className="flex items-center space-x-2 pt-6">
                                                <Checkbox
                                                  checked={section.enabled}
                                                  onCheckedChange={(checked) => updateSection(section.id, { enabled: checked })}
                                                />
                                                <Label>Section enabled</Label>
                                              </div>
                                            </div>
                                            <div className="space-y-2 mb-4">
                                              <Label>Section Description</Label>
                                              <Textarea
                                                value={section.description}
                                                onChange={(e) => updateSection(section.id, { description: e.target.value })}
                                                placeholder="Optional description for this section"
                                              />
                                            </div>
                                          </CardContent>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>

                                    <CardContent>
                                      {/* Fields */}
                                      <Droppable droppableId={`fields-${section.id}`} type="fields">
                                        {(provided) => (
                                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                            {section.fields
                                              .sort((a, b) => a.order - b.order)
                                              .map((field, fieldIndex) => (
                                              <Draggable key={field.id} draggableId={field.id} index={fieldIndex}>
                                                {(provided, snapshot) => (
                                                  <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`border rounded-lg p-3 bg-white transition-shadow ${
                                                      snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-sm'
                                                    } ${!field.enabled ? 'opacity-60' : ''}`}
                                                  >
                                                    <div className="flex items-center justify-between">
                                                      <div className="flex items-center gap-3">
                                                        <div {...provided.dragHandleProps} className="cursor-grab">
                                                          <GripVertical className="w-4 h-4 text-slate-400" />
                                                        </div>
                                                        <div>
                                                          <p className="font-medium">{field.label}</p>
                                                          <div className="flex items-center gap-2 mt-1">
                                                              <Badge variant="outline" className="text-xs">
                                                                {fieldTypes.find(t => t.value === field.field_type)?.label}
                                                              </Badge>
                                                              {field.required && (
                                                                <Badge variant="destructive" className="text-xs">Required</Badge>
                                                              )}
                                                          </div>
                                                        </div>
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() => setEditingField(editingField === field.id ? null : field.id)}
                                                        >
                                                          <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() => deleteField(section.id, field.id)}
                                                        >
                                                          <Trash2 className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                      </div>
                                                    </div>

                                                    <AnimatePresence>
                                                      {editingField === field.id && (
                                                        <motion.div
                                                          initial={{ opacity: 0, height: 0 }}
                                                          animate={{ opacity: 1, height: 'auto' }}
                                                          exit={{ opacity: 0, height: 0 }}
                                                          className="mt-4 p-4 bg-slate-50 rounded-lg space-y-4"
                                                        >
                                                          <div className="grid md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                              <Label>Field Label</Label>
                                                              <Input
                                                                value={field.label}
                                                                onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                                                              />
                                                            </div>
                                                            <div className="space-y-2">
                                                              <Label>Field Type</Label>
                                                              <Select
                                                                value={field.field_type}
                                                                onValueChange={(value) => updateField(section.id, field.id, { field_type: value })}
                                                              >
                                                                <SelectTrigger>
                                                                  <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                  {fieldTypes.map(type => (
                                                                    <SelectItem key={type.value} value={type.value}>
                                                                      {type.label}
                                                                    </SelectItem>
                                                                  ))}
                                                                </SelectContent>
                                                              </Select>
                                                            </div>
                                                          </div>

                                                          <div className="grid md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                              <Label>Placeholder Text</Label>
                                                              <Input
                                                                value={field.placeholder || ''}
                                                                onChange={(e) => updateField(section.id, field.id, { placeholder: e.target.value })}
                                                                placeholder="Optional placeholder text"
                                                              />
                                                            </div>
                                                            <div className="space-y-2">
                                                              <Label>Help Text</Label>
                                                              <Input
                                                                value={field.help_text || ''}
                                                                onChange={(e) => updateField(section.id, field.id, { help_text: e.target.value })}
                                                                placeholder="Optional help text"
                                                              />
                                                            </div>
                                                          </div>

                                                          {(field.field_type === 'select' || field.field_type === 'radio') && (
                                                            <div className="space-y-2">
                                                              <Label>Options (one per line)</Label>
                                                              <Textarea
                                                                value={field.options?.join('\n') || ''}
                                                                onChange={(e) => updateField(section.id, field.id, { 
                                                                  options: e.target.value.split('\n').filter(Boolean) 
                                                                })}
                                                                placeholder="Option 1&#10;Option 2&#10;Option 3"
                                                                className="h-24"
                                                              />
                                                            </div>
                                                          )}

                                                          <div className="flex items-center gap-4">
                                                            <div className="flex items-center space-x-2">
                                                              <Checkbox
                                                                checked={field.required}
                                                                onCheckedChange={(checked) => updateField(section.id, field.id, { required: checked })}
                                                              />
                                                              <Label>Required field</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                              <Checkbox
                                                                checked={field.enabled}
                                                                onCheckedChange={(checked) => updateField(section.id, field.id, { enabled: checked })}
                                                              />
                                                              <Label>Field enabled</Label>
                                                            </div>
                                                          </div>
                                                        </motion.div>
                                                      )}
                                                    </AnimatePresence>
                                                  </div>
                                                )}
                                              </Draggable>
                                            ))}
                                            {provided.placeholder}
                                          </div>
                                        )}
                                      </Droppable>

                                      <Button
                                        variant="outline"
                                        onClick={() => addField(section.id)}
                                        className="w-full mt-4"
                                      >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Field
                                      </Button>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              )}
                            </Draggable>
                          ))}
                        </AnimatePresence>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                <Button onClick={addSection} variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Section
                </Button>

                {/* Damage Types Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle>Damage Types</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Available Damage Types (one per line)</Label>
                      <Textarea
                        value={currentFormConfig.damage_types?.join('\n') || ''}
                        onChange={(e) => updateFormConfig({ 
                          damage_types: e.target.value.split('\n').filter(Boolean) 
                        })}
                        placeholder="Scratch&#10;Dent&#10;Chip&#10;Crack"
                        className="h-32"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Condition Rating Options (one per line)</Label>
                      <Textarea
                        value={currentFormConfig.condition_ratings?.join('\n') || ''}
                        onChange={(e) => updateFormConfig({ 
                          condition_ratings: e.target.value.split('\n').filter(Boolean) 
                        })}
                        placeholder="excellent&#10;good&#10;fair&#10;poor"
                        className="h-24"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Form Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6 p-4 bg-slate-50 rounded-lg">
                      {currentFormConfig.sections
                        .filter(section => section.enabled)
                        .sort((a, b) => a.order - b.order)
                        .map(section => (
                        <div key={section.id} className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-slate-900">{section.title}</h4>
                            {section.description && (
                              <p className="text-sm text-slate-600">{section.description}</p>
                            )}
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            {section.fields
                              .filter(field => field.enabled)
                              .sort((a, b) => a.order - b.order)
                              .map(field => (
                              <div key={field.id} className="space-y-2">
                                <Label className="flex items-center gap-1">
                                  {field.label}
                                  {field.required && <span className="text-red-500">*</span>}
                                </Label>
                                {field.field_type === 'text' && (
                                  <Input placeholder={field.placeholder} disabled />
                                )}
                                {field.field_type === 'textarea' && (
                                  <Textarea placeholder={field.placeholder} disabled className="h-20" />
                                )}
                                {field.field_type === 'number' && (
                                  <Input type="number" placeholder={field.placeholder} disabled />
                                )}
                                {field.field_type === 'select' && (
                                  <Select disabled>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select option..." />
                                    </SelectTrigger>
                                  </Select>
                                )}
                                {field.field_type === 'checkbox' && (
                                  <div className="flex items-center space-x-2">
                                    <Checkbox disabled />
                                    <Label>{field.label}</Label>
                                  </div>
                                )}
                                {field.help_text && (
                                  <p className="text-xs text-slate-500">{field.help_text}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
