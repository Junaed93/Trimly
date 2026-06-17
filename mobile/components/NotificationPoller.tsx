import React, { useEffect, useRef } from 'react';
import { getNotifications } from '../services/api';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const POLL_INTERVAL = 5000;

export default function NotificationPoller() {
  const lastIdRef = useRef<number>(-1);

  useEffect(() => {
    // Initial fetch to get the baseline ID so we don't spam old notifications
    const initFetch = async () => {
      try {
        const res = await getNotifications();
        const notifs = res.data || [];
        if (notifs.length > 0) {
          lastIdRef.current = Math.max(...notifs.map((n: any) => n.id));
        } else {
          lastIdRef.current = 0;
        }
      } catch (e) {
        // Ignore, maybe not logged in
      }
    };
    initFetch();

    const interval = setInterval(async () => {
      try {
        const res = await getNotifications();
        const notifs = res.data || [];
        
        // Find new unread notifications that we haven't seen yet
        const newNotifs = notifs.filter((n: any) => n.id > lastIdRef.current && !n.is_read);
        
        if (newNotifs.length > 0) {
          // Update last seen ID
          lastIdRef.current = Math.max(...notifs.map((n: any) => n.id));
          
          // Schedule a system notification for each new award/notification
          for (const notif of newNotifs) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: notif.title,
                body: notif.message,
                data: { id: notif.id, type: notif.type },
                sound: true,
              },
              trigger: null, // trigger immediately
            });
          }
        }
      } catch (e) {
        // Ignore
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Silent background poller, renders nothing
  return null;
}
