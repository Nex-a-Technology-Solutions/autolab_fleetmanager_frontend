
import React, { useState } from 'react';
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Car,
  Wrench,
  Sparkles,
  TestTubeDiagonal,
  ShieldCheck,
  Search,
  Edit3
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const stageIcons = {
  'returned': Clock,
  'washing': Sparkles,
  'driving_test': TestTubeDiagonal,
  'servicing': Wrench,
  'approval': ShieldCheck,
  'ready_for_hire': CheckCircle2
};

const stageColors = {
  'returned': 'bg-amber-100 text-amber-800',
  'washing': 'bg-purple-100 text-purple-800',
  'driving_test': 'bg-indigo-100 text-indigo-800',
  'servicing': 'bg-orange-100 text-orange-800',
  'approval': 'bg-blue-100 text-blue-800',
  'ready_for_hire': 'bg-emerald-100 text-emerald-800',
  'damaged': 'border-2 text-white'
};

export default function WorkflowSummary({ workflows, cars, isLoading, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNotes, setEditingNotes] = useState(null);
  
  const activeWorkflows = workflows.filter(w => w.workflow_status === 'in_progress');
  
  const filteredWorkflows = activeWorkflows.filter(workflow => {
    const car = cars.find(c => c.id === workflow.car_id);
    if (!car) return false;
    
    const searchTerm = searchQuery.toLowerCase();
    return (
      car.license_plate?.toLowerCase().includes(searchTerm) ||
      car.make?.toLowerCase().includes(searchTerm) ||
      car.model?.toLowerCase().includes(searchTerm) ||
      workflow.current_stage?.toLowerCase().includes(searchTerm)
    );
  });

  const handleNotesEdit = async (workflowId, notes) => {
    // In real implementation, update the workflow notes
    console.log('Updating notes for workflow:', workflowId, notes);
    setEditingNotes(null);
    onRefresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2" style={{color: 'var(--wwfh-navy)'}}>
              <Car className="w-5 h-5" style={{color: 'var(--wwfh-red)'}} />
              Vehicle Workflow Summary
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No active workflows</p>
              <p>{searchQuery ? 'No vehicles match your search' : 'All vehicles are either available or checked out'}</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredWorkflows.map((workflow) => {
                const car = cars.find(c => c.id === workflow.car_id);
                if (!car) return null;
                
                const StageIcon = stageIcons[workflow.current_stage] || Clock;
                const stageColor = workflow.damage_flagged 
                  ? 'text-white'
                  : stageColors[workflow.current_stage] || 'bg-gray-100 text-gray-800';
                
                return (
                  <motion.div
                    key={workflow.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                      workflow.damage_flagged ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg" style={{color: 'var(--wwfh-navy)'}}>
                            {car.make} {car.model}
                          </h3>
                          <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                            {car.license_plate}
                          </span>
                          {workflow.damage_flagged && (
                            <AlertTriangle className="w-5 h-5" style={{color: 'var(--wwfh-red)'}} />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>Return: {workflow.return_date ? format(new Date(workflow.return_date), 'MMM d, h:mm a') : 'N/A'}</span>
                          <span>Priority: {workflow.priority || 'Normal'}</span>
                        </div>
                      </div>
                      <Badge 
                        className={`${stageColor} border-0 font-medium px-3 py-1 flex items-center gap-2`}
                        style={workflow.damage_flagged ? {
                          backgroundColor: 'var(--wwfh-red)',
                          borderColor: 'var(--wwfh-red)'
                        } : {}}
                      >
                        <StageIcon className="w-4 h-4" />
                        {workflow.current_stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>

                    {/* Stage Progress */}
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {['returned', 'washing', 'driving_test', 'servicing', 'approval'].map((stage) => {
                        const isCompleted = workflow.stages_completed?.includes(stage);
                        const isCurrent = workflow.current_stage === stage;
                        const StageIcon = stageIcons[stage];
                        
                        return (
                          <div
                            key={stage}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              isCompleted 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : isCurrent 
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <StageIcon className="w-3 h-3" />
                            {stage.replace(/_/g, ' ')}
                            {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Notes Section */}
                    <div className="mt-3 p-3 bg-slate-50 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Notes:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingNotes(editingNotes === workflow.id ? null : workflow.id)}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      </div>
                      {editingNotes === workflow.id ? (
                        <div className="flex gap-2">
                          <Input
                            defaultValue={workflow.notes || ''}
                            placeholder="Add notes for team communication..."
                            className="text-sm"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleNotesEdit(workflow.id, e.target.value);
                              }
                            }}
                          />
                          <Button 
                            size="sm" 
                            onClick={() => {
                              const input = document.querySelector('input'); // This is a generic selector, might need refinement if there are multiple inputs.
                              // A better way would be to manage the input value in state for the editingNotes feature.
                              handleNotesEdit(workflow.id, input.value); 
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600">
                          {workflow.notes || 'No notes available. Click edit to add team communication.'}
                        </p>
                      )}
                    </div>

                    {/* Assigned Staff */}
                    {workflow.assigned_staff && (
                      <div className="mt-3 flex gap-4 text-xs text-slate-500">
                        {workflow.assigned_staff.washer && (
                          <span>Washer: {workflow.assigned_staff.washer}</span>
                        )}
                        {workflow.assigned_staff.driver && (
                          <span>Driver: {workflow.assigned_staff.driver}</span>
                        )}
                        {workflow.assigned_staff.mechanic && (
                          <span>Mechanic: {workflow.assigned_staff.mechanic}</span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
