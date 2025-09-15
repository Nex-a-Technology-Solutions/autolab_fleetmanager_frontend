import React from 'react';
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, 
  LogIn, 
  Clock,
  User,
  Car
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecentActivity({ checkoutReports, checkinReports, isLoading }) {
  // Combine and sort activities
  const activities = [
    ...checkoutReports.slice(0, 5).map(report => ({
      type: 'checkout',
      data: report,
      timestamp: report.created_date
    })),
    ...checkinReports.slice(0, 5).map(report => ({
      type: 'checkin', 
      data: report,
      timestamp: report.created_date
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <Clock className="w-5 h-5 text-blue-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity to display</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'checkout' 
                      ? 'bg-amber-100 text-amber-600' 
                      : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {activity.type === 'checkout' ? (
                      <LogOut className="w-5 h-5" />
                    ) : (
                      <LogIn className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900">
                        {activity.type === 'checkout' ? 'Vehicle Checkout' : 'Vehicle Return'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {activity.type === 'checkout' ? 'OUT' : 'IN'}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-600 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {activity.type === 'checkout' 
                          ? activity.data.customer_name 
                          : 'Return Processing'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        Car ID: {activity.data.car_id?.slice(0, 8)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}