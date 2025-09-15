
import React, { useState, useEffect } from 'react';
import { Notification } from '@/api/entities';
import { Reservation } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  X,
  Calendar,
  Car
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from 'date-fns';

export default function NotificationPanel({ onNotificationRead }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true); // Set loading to true when starting to load
    try {
      const data = await Notification.list('-created_date');
      setNotifications(data.filter(n => !n.read).slice(0, 10)); // Show only unread, limit 10
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
    setIsLoading(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      await Notification.update(notificationId, { read: true });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if(onNotificationRead) onNotificationRead(); // Call the callback if provided
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const confirmReservation = async (reservationId) => {
    try {
      await Reservation.update(reservationId, { 
        status: 'confirmed',
        confirmation_date: new Date().toISOString()
      });
      
      // Mark related notification as read
      const relatedNotification = notifications.find(n => n.related_entity_id === reservationId);
      if (relatedNotification) {
        markAsRead(relatedNotification.id);
      }
    } catch (error) {
      console.error("Error confirming reservation:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'reservation_pending': return Calendar;
      case 'quote_accepted': return CheckCircle;
      case 'vehicle_returned': return Car;
      case 'maintenance_required': return AlertTriangle;
      case 'damage_reported': return AlertTriangle;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm">
      <div className="p-4 border-b">
        <h3 className="flex items-center justify-between text-lg font-semibold">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
            {notifications.length > 0 && (
              <Badge className="bg-red-500 text-white">
                {notifications.length}
              </Badge>
            )}
          </div>
        </h3>
      </div>
      <div className="p-2">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No new notifications</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`p-3 rounded-lg border ${getPriorityColor(notification.priority)} relative`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    
                    <div className="flex items-start gap-3 pr-6">
                      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
                        <p className="text-xs text-slate-600 mb-2">{notification.message}</p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {format(new Date(notification.created_date), 'MMM d, h:mm a')}
                          </span>
                          
                          {notification.action_required && notification.type === 'reservation_pending' && (
                            <Button
                              size="sm"
                              onClick={() => confirmReservation(notification.related_entity_id)}
                              className="text-white text-xs h-6"
                              style={{background: 'var(--wwfh-red)'}}
                            >
                              Confirm
                            </Button>
                          )}
                        </div>
                        
                        {notification.expires_at && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-orange-500" />
                            <span className="text-xs text-orange-600">
                              Expires: {format(new Date(notification.expires_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
