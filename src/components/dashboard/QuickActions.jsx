
import React from 'react';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Plus, 
  Search, 
  Car, // Unused in the provided outline but kept for completeness based on original
  ClipboardCheck,
  ArrowRight,
  Sparkles,
  TestTubeDiagonal,
  Wrench,
  ShieldCheck,
  Monitor
} from "lucide-react";

const quickActions = [
  {
    title: "New Checkout",
    description: "Start vehicle checkout process",
    icon: Plus,
    url: createPageUrl("Checkout"),
    color: "var(--wwfh-red)"
  },
  {
    title: "Process Return", 
    description: "Handle vehicle check-in",
    icon: ClipboardCheck,
    url: createPageUrl("Checkin"),
    color: "linear-gradient(135deg, #10b981, #059669)"
  },
  {
    title: "Wash & Visual Check",
    description: "Workshop processing",
    icon: Sparkles,
    url: createPageUrl("WashCheck"),
    color: "linear-gradient(135deg, #8b5cf6, #7c3aed)"
  },
  {
    title: "Driving Checks",
    description: "Vehicle road testing",
    icon: TestTubeDiagonal,
    url: createPageUrl("DrivingCheck"),
    color: "var(--wwfh-navy)"
  },
  {
    title: "Service Vehicle",
    description: "Maintenance & repairs",
    icon: Wrench,
    url: createPageUrl("Service"),
    color: "linear-gradient(135deg, #f59e0b, #d97706)"
  },
  {
    title: "Final Approval",
    description: "Manager sign-off",
    icon: ShieldCheck,
    url: createPageUrl("Approval"),
    color: "linear-gradient(135deg, #06b6d4, #0891b2)"
  },
  {
    title: "Summary Screen",
    description: "Real-time overview",
    icon: Monitor,
    url: createPageUrl("Summary"),
    color: "linear-gradient(135deg, #64748b, #475569)"
  },
  {
    title: "Search Vehicles",
    description: "Find specific vehicles",
    icon: Search,
    url: createPageUrl("Search"),
    color: "linear-gradient(135deg, #ec4899, #db2777)"
  }
];

export default function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle style={{color: 'var(--wwfh-navy)'}}>WWFH Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {quickActions.map((action, index) => (
            <Link key={action.title} to={action.url}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-auto p-3 hover:bg-slate-50 group transition-all duration-200"
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 group-hover:scale-105 transition-transform"
                    style={{background: action.color}}
                  >
                    <action.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm" style={{color: 'var(--wwfh-navy)'}}>{action.title}</div>
                    <div className="text-xs text-slate-600">{action.description}</div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                </Button>
              </motion.div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
