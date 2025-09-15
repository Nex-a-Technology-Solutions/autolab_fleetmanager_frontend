import React, { useState, useEffect } from 'react';
import { Notification } from '@/api/entities';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import NotificationPanel from '../dashboard/NotificationPanel';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      // This is a simplified fetch; a dedicated count endpoint would be more efficient
      const data = await Notification.filter({ read: false });
      setUnreadCount(data.length);
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);
  
  const onNotificationRead = () => {
    // When a notification is marked as read inside the panel, refresh the count.
    fetchUnreadCount();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-slate-900 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs"
              style={{backgroundColor: 'var(--wwfh-red)'}}
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <NotificationPanel onNotificationRead={onNotificationRead} />
      </PopoverContent>
    </Popover>
  );
}