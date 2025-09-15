import React, { useState, useEffect, useCallback } from 'react';
import { NavigationSettings } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { AnimatePresence, motion } from "framer-motion";

export default function NavigationTab({ defaultNavItems, onSettingsChange }) {
  const [settings, setSettings] = useState(null);
  const [navItems, setNavItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const existingSettings = await NavigationSettings.list();
      if (existingSettings.length > 0) {
        setSettings(existingSettings[0]);
        // Ensure all default items are present in saved settings for future updates
        const allItems = defaultNavItems.map(defaultItem => {
          const savedItem = existingSettings[0].navItems.find(item => item.id === defaultItem.id);
          return savedItem ? savedItem : defaultItem;
        });
        setNavItems(allItems);
      } else {
        const newSettings = await NavigationSettings.create({ navItems: defaultNavItems });
        setSettings(newSettings);
        setNavItems(defaultNavItems);
      }
    } catch (error) {
      console.error("Error loading navigation settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [defaultNavItems]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;

    setNavItems(prevItems => {
        const reorderedItems = Array.from(prevItems);
        const [movedItem] = reorderedItems.splice(source.index, 1);
        reorderedItems.splice(destination.index, 0, movedItem);

        // Update order property
        return reorderedItems.map((item, index) => ({ ...item, order: index }));
    });
  };

  const toggleVisibility = (id) => {
    setNavItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, isVisible: !item.isVisible } : item
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (settings) {
        const updatedSettings = await NavigationSettings.update(settings.id, { navItems });
        setSettings(updatedSettings);
        onSettingsChange(updatedSettings.navItems);
      }
    } catch (error) {
      console.error("Error saving navigation settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const operationsItems = navItems.filter(item => item.section === 'operations').sort((a, b) => a.order - b.order);
  const adminItems = navItems.filter(item => item.section === 'admin').sort((a, b) => a.order - b.order);

  const DraggableList = ({ items, droppableId }) => (
    <Droppable droppableId={droppableId}>
      {(provided) => (
        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
          <AnimatePresence>
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, snapshot) => (
                  <motion.div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    layoutId={item.id}
                    className={`flex items-center p-3 rounded-lg transition-all ${
                      snapshot.isDragging ? 'bg-blue-100 shadow-lg' : 'bg-white/80'
                    } ${!item.isVisible ? 'opacity-50' : ''}`}
                  >
                    <GripVertical className="w-5 h-5 text-slate-400 mr-3" />
                    <span className="flex-1 font-medium text-slate-800">{item.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {item.isVisible ? 'Visible' : 'Hidden'}
                      </span>
                      <Switch
                        checked={item.isVisible}
                        onCheckedChange={() => toggleVisibility(item.id)}
                        aria-label={`Toggle visibility for ${item.title}`}
                      />
                    </div>
                  </motion.div>
                )}
              </Draggable>
            ))}
          </AnimatePresence>
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Navigation</CardTitle>
        <CardDescription>
          Drag and drop to reorder items in the sidebar. Use the toggles to show or hide items.
          Changes will apply after you save and refresh the page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Operations Menu</h3>
              <DraggableList items={operationsItems} droppableId="operations" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Admin Menu</h3>
              <DraggableList items={adminItems} droppableId="admin" />
            </div>
          </div>
        </DragDropContext>
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}