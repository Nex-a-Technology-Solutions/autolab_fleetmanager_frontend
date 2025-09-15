import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle } from "lucide-react";

export default function RoleGuard({ 
  children, 
  requiredRole = 'admin', 
  userRole = 'user',
  fallback = null 
}) {
  // Check if user has required role
  const hasAccess = () => {
    if (requiredRole === 'admin') {
      return userRole === 'admin';
    }
    if (requiredRole === 'operations') {
      return userRole === 'admin' || userRole === 'operations';
    }
    return true; // Default allow
  };

  if (!hasAccess()) {
    if (fallback) {
      return fallback;
    }
    
    return (
      <Card className="shadow-lg border-2 border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Shield className="w-5 h-5" />
            Access Restricted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
            <div>
              <p className="text-red-700 font-semibold mb-2">
                Administrator Access Required
              </p>
              <p className="text-red-600 text-sm">
                This feature is restricted to administrators only. Please contact your system administrator if you need access to this functionality.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return children;
}