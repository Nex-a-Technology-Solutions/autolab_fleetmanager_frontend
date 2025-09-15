import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Edit3, X, EyeOff, Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function BulkActionsBar({ selectedCars, onBulkUpdate, onBulkDelete, onBulkDeactivate, onBulkActivate, onClearSelection, vehicleTypes }) {
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    category: ''
  });

  const handleBulkUpdate = async () => {
    const updates = {};
    if (updateData.status) updates.status = updateData.status;
    if (updateData.category) updates.category = updateData.category;
    
    if (Object.keys(updates).length > 0) {
      await onBulkUpdate(selectedCars, updates);
      setShowBulkUpdateDialog(false);
      setUpdateData({ status: '', category: '' });
    }
  };

  const activeCount = selectedCars.filter(car => car.active !== false).length;
  const inactiveCount = selectedCars.filter(car => car.active === false).length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-blue-900">
              {selectedCars.length} vehicle{selectedCars.length !== 1 ? 's' : ''} selected
            </span>
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkUpdateDialog(true)}
              className="flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Bulk Update
            </Button>
            
            {activeCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeactivateConfirm(true)}
                className="flex items-center gap-2 text-orange-700 hover:text-orange-800"
              >
                <EyeOff className="w-4 h-4" />
                Deactivate ({activeCount})
              </Button>
            )}
            
            {inactiveCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowActivateConfirm(true)}
                className="flex items-center gap-2 text-green-700 hover:text-green-800"
              >
                <Eye className="w-4 h-4" />
                Activate ({inactiveCount})
              </Button>
            )}
            
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Bulk Update Dialog */}
      <Dialog open={showBulkUpdateDialog} onOpenChange={setShowBulkUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Vehicles</DialogTitle>
            <DialogDescription>
              Update {selectedCars.length} selected vehicle{selectedCars.length !== 1 ? 's' : ''}. Leave fields empty to keep current values.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={updateData.status} onValueChange={(value) => setUpdateData(prev => ({...prev, status: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No Change</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="checked_out">Checked Out</SelectItem>
                  <SelectItem value="in_inspection">In Inspection</SelectItem>
                  <SelectItem value="in_cleaning">In Cleaning</SelectItem>
                  <SelectItem value="in_driving_check">Driving Check</SelectItem>
                  <SelectItem value="maintenance_required">Maintenance Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select value={updateData.category} onValueChange={(value) => setUpdateData(prev => ({...prev, category: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new vehicle type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No Change</SelectItem>
                  {vehicleTypes.map(type => (
                    <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkUpdateDialog(false)}>Cancel</Button>
            <Button onClick={handleBulkUpdate}>Update Vehicles</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vehicles</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete {selectedCars.length} vehicle{selectedCars.length !== 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              onBulkDelete(selectedCars);
              setShowDeleteConfirm(false);
            }}>Delete Vehicles</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <Dialog open={showDeactivateConfirm} onOpenChange={setShowDeactivateConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Vehicles</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {activeCount} vehicle{activeCount !== 1 ? 's' : ''}? They will be hidden from most views but can be reactivated later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateConfirm(false)}>Cancel</Button>
            <Button onClick={() => {
              onBulkDeactivate(selectedCars.filter(car => car.active !== false));
              setShowDeactivateConfirm(false);
            }}>Deactivate Vehicles</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Confirmation */}
      <Dialog open={showActivateConfirm} onOpenChange={setShowActivateConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Vehicles</DialogTitle>
            <DialogDescription>
              Are you sure you want to activate {inactiveCount} vehicle{inactiveCount !== 1 ? 's' : ''}? They will become visible and available for operations again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivateConfirm(false)}>Cancel</Button>
            <Button onClick={() => {
              onBulkActivate(selectedCars.filter(car => car.active === false));
              setShowActivateConfirm(false);
            }}>Activate Vehicles</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}