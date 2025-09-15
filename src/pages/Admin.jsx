import React, { useState, useEffect } from 'react';
import djangoClient from '@/api/djangoClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Palette, Car, Tag, MapPin, Settings2, Compass, Download, Users } from "lucide-react";
import { motion } from "framer-motion";

// Import tab components
import ThemeTab from '../components/admin/ThemeTab';
import VehicleTypesTab from '../components/admin/VehicleTypesTab';
import PricingRulesTab from '../components/admin/PricingRulesTab';
import LocationsTab from '../components/admin/LocationsTab';
import NavigationTab from '../components/admin/NavigationTab';
import FleetManagementTab from '../components/admin/FleetManagementTab';
import DatabaseExportTab from '../components/admin/DatabaseExportTab';

const defaultNavItems = [
    { id: 'dashboard', title: 'Dashboard', url: '/Dashboard', icon: 'LayoutDashboard', order: 0, isVisible: true, section: 'operations' },
    { id: 'fleet', title: 'Fleet Management', url: '/Fleet', icon: 'CarIcon', order: 1, isVisible: true, section: 'operations' },
    { id: 'calendar', title: 'Fleet Calendar', url: '/Calendar', icon: 'Calendar', order: 2, isVisible: true, section: 'operations' },
    { id: 'summary', title: 'Summary', url: '/Summary', icon: 'FileCheck', order: 3, isVisible: true, section: 'operations' },
    { id: 'quoting', title: 'Quoting', url: '/Quoting', icon: 'FileBarChart', order: 4, isVisible: true, section: 'operations' },
    { id: 'reservations', title: 'Reservations', url: '/Reservations', icon: 'Bookmark', order: 5, isVisible: true, section: 'operations' },
    { id: 'clients', title: 'Client Management', url: '/Clients', icon: 'Users', order: 6, isVisible: true, section: 'operations' },
    { id: 'checkout', title: 'Checkout Process', url: '/Checkout', icon: 'LogOut', order: 7, isVisible: true, section: 'operations' },
    { id: 'checkin', title: 'Check-in Process', url: '/Checkin', icon: 'LogIn', order: 8, isVisible: true, section: 'operations' },
    { id: 'service', title: 'Service Department', url: '/ServiceDepartment', icon: 'Wrench', order: 9, isVisible: true, section: 'operations', requiredRole: 'operations' },
    { id: 'search', title: 'Vehicle Search', url: '/Search', icon: 'Search', order: 10, isVisible: true, section: 'operations' },
    { id: 'gpstracking', title: 'GPS Tracking', url: '/GpsTracking', icon: 'Map', order: 11, isVisible: true, section: 'operations' },
    
    { id: 'admin', title: 'System Configuration', url: '/Admin', icon: 'Settings', order: 0, isVisible: true, section: 'admin', requiredRole: 'admin' },
    { id: 'integrations', title: 'Business Integrations', url: '/Integrations', icon: 'Zap', order: 1, isVisible: true, section: 'admin', requiredRole: 'admin' },
    { id: 'gpssync', title: 'GPS Data Sync', url: '/GpsSync', icon: 'Map', order: 2, isVisible: true, section: 'admin', requiredRole: 'admin' },
    { id: 'dataseeder', title: 'Dev Reference', url: '/DataSeeder', icon: 'FileCode', order: 3, isVisible: true, section: 'admin', requiredRole: 'admin' }
];

const defaultTheme = {
  primary_color: '#1C2945', 
  accent_color: '#CE202E', 
  primary_light: '#2A3B5C',
  accent_light: '#E63946', 
  primary_dark: '#141F35',
  font_family: 'Inter', 
  font_size: 14,
  organization_name: '',
  logo: null,
  email_header_background: '#1C2945', 
  email_header_text_color: '#FFFFFF',
  email_button_background: '#CE202E', 
  email_button_text_color: '#FFFFFF',
  email_accent_color: '#1C2945', 
  home_base_latitude: -31.9523, 
  home_base_longitude: 115.8613,
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState("theme");
  const [themeSettings, setThemeSettings] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        // GET request to retrieve or auto-create theme settings
        const response = await djangoClient.get('/system/settings/theme/');
        
        // The backend returns a single object (not an array)
        if (response.data) {
          console.log("Loaded theme settings:", response.data);
          // Merge backend data with defaults to ensure all frontend fields exist
          setThemeSettings({ ...defaultTheme, ...response.data });
        } else {
          console.warn('No theme data in response, using defaults');
          setThemeSettings(defaultTheme);
        }
      } catch (error) {
        console.error("Error loading theme settings:", error);
        // Fallback to default theme settings
        setThemeSettings(defaultTheme);
      }
      setIsLoading(false);
    };

    loadSettings();
  }, []); 
  
  const handleSaveTheme = async () => {
    if (!themeSettings) return;
    setIsSaving(true);
    try {
      // Extract only the fields that should be sent to the backend
      const { 
        id, 
        created_date, 
        updated_date, 
        created_by, 
        organization_name, 
        organization_logo,
        // Remove frontend-only fields that don't exist in the serializer
        primary_light,
        accent_light, 
        primary_dark,
        font_size,
        email_header_background,
        email_header_text_color,
        email_button_background,
        email_button_text_color,
        email_accent_color,
        ...updateData 
      } = themeSettings;
      
      // Use PUT to update the theme settings (works whether it was just created or already existed)
      const response = await djangoClient.put('/system/settings/theme/', updateData);
      
      // Update state with the response data merged with defaults
      setThemeSettings({ ...defaultTheme, ...response.data });
      alert("Theme settings saved successfully! Refresh the page to see changes applied globally.");
      
    } catch (error) {
      console.error("Error saving theme settings:", error);
      alert("Failed to save theme settings. Please try again.");
    }
    setIsSaving(false);
  };

  const tabs = [
    { value: "vehicle_types", label: "Vehicle Types", icon: Car, component: <VehicleTypesTab /> },
    { value: "pricing", label: "Pricing Rules", icon: Tag, component: <PricingRulesTab /> },
    { value: "locations", label: "Locations", icon: MapPin, component: <LocationsTab /> },
    { value: "fleet", label: "Fleet", icon: Settings2, component: <FleetManagementTab /> },
    { value: "theme", label: "Theme & Location", icon: Palette, component: <ThemeTab settings={themeSettings} onSettingsChange={setThemeSettings} /> },
    { value: "navigation", label: "Navigation", icon: Compass, component: <NavigationTab defaultNavItems={defaultNavItems} /> },
    { value: "database", label: "Database Export", icon: Download, component: <DatabaseExportTab /> },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">System Configuration</h1>
          <p className="text-slate-600 text-lg">Manage fleet settings, pricing, and system preferences</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex justify-end mb-4">
            {activeTab === 'theme' && (
              <Button 
                onClick={handleSaveTheme} 
                disabled={isSaving || isLoading}
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Theme Settings</>
                )}
              </Button>
            )}
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 lg:grid-cols-7">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-6">
                {tab.component}
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}