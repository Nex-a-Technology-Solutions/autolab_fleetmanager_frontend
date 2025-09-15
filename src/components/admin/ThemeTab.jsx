import React, { useState, useEffect } from 'react';
import djangoClient from '@/api/djangoClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// Accept settings and onChange handler from parent
export default function ThemeTab({ settings, onSettingsChange }) {
  const [localSettings, setLocalSettings] = useState({
    primary_color: '#1C2945',
    accent_color: '#CE202E',
    primary_light: '#2A3B5C',
    accent_light: '#E63946',
    primary_dark: '#141F35',
    font_family: 'Inter',
    font_size: 14,
    email_header_background: '#F8F8F8',
    email_header_text_color: '#333333',
    email_button_background: '#CE202E',
    email_button_text_color: '#FFFFFF',
    email_accent_color: '#CE202E',
    home_base_latitude: 0,
    home_base_longitude: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Update local settings when parent settings change
  useEffect(() => {
    if (settings) {
      setLocalSettings(prev => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const handleFieldChange = (name, value) => {
    const updatedSettings = { ...localSettings, [name]: value };
    setLocalSettings(updatedSettings);
    // Update parent state immediately for real-time preview
    if (onSettingsChange) {
      onSettingsChange({ ...settings, [name]: value });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Filter out frontend-only fields that don't exist in the backend serializer
      const { 
        primary_light,
        accent_light, 
        primary_dark,
        font_size,
        email_header_background,
        email_header_text_color,
        email_button_background,
        email_button_text_color,
        email_accent_color,
        // Keep only the fields that exist in your ThemeSettingsSerializer
        ...backendFields 
      } = localSettings;

      // Use PUT to update theme settings (backend handles get_or_create)
      const response = await djangoClient.put('/system/settings/theme/', {
        primary_color: localSettings.primary_color,
        accent_color: localSettings.accent_color,
        font_family: localSettings.font_family,
        home_base_latitude: localSettings.home_base_latitude,
        home_base_longitude: localSettings.home_base_longitude,
        // Add other backend fields as needed based on your serializer
      });

      // Update parent state with the response
      if (onSettingsChange) {
        onSettingsChange({ ...localSettings, ...response.data });
      }

      toast.success("Theme settings saved! The page will now reload to apply changes.", {
        duration: 3000,
        onDismiss: () => window.location.reload(),
        onAutoClose: () => window.location.reload(),
      });
    } catch (error) {
      console.error("Failed to save theme settings:", error);
      toast.error("Failed to save settings: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ColorInput component defined inside ThemeTab to access handleFieldChange
  const ColorInput = ({ label, name, value }) => (
    <div className="flex items-center gap-4">
      <Label htmlFor={name} className="w-40">{label}</Label>
      <div className="relative flex-1">
        <Input
          id={name}
          name={name}
          value={value || ''} // Ensure value is not undefined
          onChange={(e) => handleFieldChange(name, e.target.value)}
          className="pl-12"
        />
        <Input
          type="color"
          value={value || '#000000'} // Default to black if value is empty for color picker
          onChange={(e) => handleFieldChange(name, e.target.value)}
          className="absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 p-0 border-0 cursor-pointer"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>
            Control the font family and base size for the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="font_family">Font Family</Label>
              <Select
                value={localSettings.font_family}
                onValueChange={(value) => handleFieldChange('font_family', value)}
              >
                <SelectTrigger id="font_family">
                  <SelectValue placeholder="Select a font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter (Default)</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Lato">Lato</SelectItem>
                  <SelectItem value="Poppins">Poppins</SelectItem>
                  <SelectItem value="system-ui">System Default</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="font_size">Base Font Size (px)</Label>
              <Input
                id="font_size"
                type="number"
                value={localSettings.font_size}
                onChange={(e) => handleFieldChange('font_size', parseInt(e.target.value) || 14)}
                placeholder="e.g., 14"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding & Colors</CardTitle>
          <CardDescription>
            Customize the primary colors of the application interface.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <ColorInput label="Primary Color" name="primary_color" value={localSettings.primary_color} />
            <ColorInput label="Accent Color" name="accent_color" value={localSettings.accent_color} />
            <ColorInput label="Primary Light" name="primary_light" value={localSettings.primary_light} />
            <ColorInput label="Accent Light" name="accent_light" value={localSettings.accent_light} />
            <ColorInput label="Primary Dark" name="primary_dark" value={localSettings.primary_dark} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Colors</CardTitle>
          <CardDescription>Customize colors for automated customer emails.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <ColorInput label="Email Header BG" name="email_header_background" value={localSettings.email_header_background} />
            <ColorInput label="Email Header Text" name="email_header_text_color" value={localSettings.email_header_text_color} />
            <ColorInput label="Email Button BG" name="email_button_background" value={localSettings.email_button_background} />
            <ColorInput label="Email Button Text" name="email_button_text_color" value={localSettings.email_button_text_color} />
            <ColorInput label="Email Accent" name="email_accent_color" value={localSettings.email_accent_color} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GPS Home Base</CardTitle>
          <CardDescription>Set the primary coordinates for your business location.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="home_base_latitude">Latitude</Label>
              <Input
                id="home_base_latitude"
                type="number"
                step="any"
                value={localSettings.home_base_latitude}
                onChange={(e) => handleFieldChange('home_base_latitude', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="home_base_longitude">Longitude</Label>
              <Input
                id="home_base_longitude"
                type="number"
                step="any"
                value={localSettings.home_base_longitude}
                onChange={(e) => handleFieldChange('home_base_longitude', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}