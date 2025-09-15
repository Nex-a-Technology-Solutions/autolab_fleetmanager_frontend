import React from 'react';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  Wrench,
  Sparkles,
  TestTubeDiagonal
} from "lucide-react";

export default function RealtimeUpdates({ workflows }) {
  // Get recent updates (last 24 hours)
  const recentUpdates = workflows
    .filter(w => {
      const lastUpdate = new Date(w.last_updated || w.created_date);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return lastUpdate > twentyFourHoursAgo;
    })
    .sort((a, b) => new Date(b.last_updated || b.created_date) - new Date(a.last_updated || a.created_date))
    .slice(0, 8);

  const getUpdateIcon = (stage, damageFlag) => {
    if (damageFlag) return AlertTriangle;
    switch (stage) {
      case 'washing': return Sparkles;
      case 'driving_test': return TestTubeDiagonal;
      case 'servicing': return Wrench;
      case 'ready_for_hire': return CheckCircle2;
      default: return Clock;
    }
  };

  const getUpdateColor = (stage, damageFlag) => {
    if (damageFlag) return 'text-red-500';
    switch (stage) {
      case 'washing': return 'text-purple-500';
      case 'driving_test': return 'text-indigo-500';
      case 'servicing': return 'text-orange-500';
      case 'ready_for_hire': return 'text-emerald-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            Live Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentUpdates.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent updates</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentUpdates.map((workflow, index) => {
                const UpdateIcon = getUpdateIcon(workflow.current_stage, workflow.damage_flagged);
                const iconColor = getUpdateColor(workflow.current_stage, workflow.damage_flagged);
                
                return (
                  <motion.div
                    key={workflow.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0`}>
                      <UpdateIcon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900 text-sm">
                          Vehicle {workflow.car_id?.slice(0, 8)}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${workflow.damage_flagged ? 'border-red-200 text-red-700' : ''}`}
                        >
                          {workflow.current_stage?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">
                        {workflow.damage_flagged 
                          ? 'Damage reported - Manager alerted' 
                          : `Stage updated by ${workflow.updated_by || 'System'}`
                        }
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(workflow.last_updated || workflow.created_date).toLocaleTimeString()}
                      </p>
                    </div>
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