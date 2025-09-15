import React from 'react';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Car, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Wrench,
  Settings,
  XCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig = [
  {
    title: "Total Fleet",
    key: "total",
    icon: Car,
    bgColor: "linear-gradient(135deg, #1e3a8a, #1e40af)", // Changed to gradient like others
    iconColor: "text-white"
  },
  {
    title: "Available",
    key: "available", 
    icon: CheckCircle,
    bgColor: "linear-gradient(135deg, #10b981, #059669)",
    iconColor: "text-white"
  },
  {
    title: "On Hire",
    key: "checked_out",
    icon: Clock,
    bgColor: "linear-gradient(135deg, #f59e0b, #d97706)", 
    iconColor: "text-white"
  },
  {
    title: "In Process",
    key: "in_process",
    icon: Settings,
    bgColor: "linear-gradient(135deg, #3b82f6, #2563eb)",
    iconColor: "text-white"
  },
  {
    title: "Maintenance",
    key: "maintenance",
    icon: Wrench,
    bgColor: "linear-gradient(135deg, #ef4444, #dc2626)", // Changed to gradient for consistency
    iconColor: "text-white"
  },
  {
    title: "Out of Service",
    key: "out_of_service",
    icon: XCircle,
    bgColor: "linear-gradient(135deg, #6b7280, #4b5563)",
    iconColor: "text-white"
  }
];

export default function FleetStatusCards({ stats, isLoading }) {
  // Log the stats to debug
  console.log('FleetStatusCards received stats:', stats);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
      {statusConfig.map((config, index) => {
        const value = stats?.[config.key] ?? 0;
        
        return (
          <motion.div
            key={config.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <div 
                className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 transform translate-x-3 md:translate-x-6 -translate-y-3 md:-translate-y-6 rounded-full opacity-10"
                style={{background: config.bgColor}}
              />
              <CardHeader className="pb-2 md:pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xs md:text-sm font-medium text-slate-600 mb-1 md:mb-2 truncate">
                      {config.title}
                    </CardTitle>
                    {isLoading ? (
                      <Skeleton className="h-6 md:h-8 w-12 md:w-16" />
                    ) : (
                      <div className="text-xl md:text-3xl font-bold truncate" style={{color: 'var(--wwfh-navy)'}}>
                        {value}
                      </div>
                    )}
                  </div>
                  <div 
                    className="p-2 md:p-3 rounded-lg md:rounded-xl shadow-lg flex-shrink-0"
                    style={{background: config.bgColor}}
                  >
                    <config.icon className={`w-4 h-4 md:w-6 md:h-6 ${config.iconColor}`} />
                  </div>
                </div>
              </CardHeader>
              
              {/* Utilization for On Hire */}
              {config.key === 'checked_out' && stats?.total > 0 && !isLoading && (
                <CardContent className="pt-0 pb-3">
                  <div className="flex items-center text-xs md:text-sm font-medium" style={{color: 'var(--wwfh-red)'}}>
                    <span>{Math.round((value / stats.total) * 100)}% utilization</span>
                  </div>
                </CardContent>
              )}
              
              {/* Alert for Maintenance */}
              {config.key === 'maintenance' && value > 0 && !isLoading && (
                <CardContent className="pt-0 pb-3">
                  <div className="flex items-center text-xs md:text-sm font-medium text-red-600">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    <span>Needs attention</span>
                  </div>
                </CardContent>
              )}
              
              {/* Alert for Out of Service */}
              {config.key === 'out_of_service' && value > 0 && !isLoading && (
                <CardContent className="pt-0 pb-3">
                  <div className="flex items-center text-xs md:text-sm font-medium text-red-600">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    <span>Service required</span>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}