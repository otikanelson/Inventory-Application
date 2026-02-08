/**
 * Custom hook for Notifications
 * Handles fetching notifications, marking as read, and real-time updates
 */

import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Notification, NotificationPayload } from '../types/ai-predictions';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
const WS_URL = API_URL.replace('/api', '').replace('http', 'ws');

interface UseNotificationsOptions {
  userId?: string;
  enableWebSocket?: boolean;
  autoFetch?: boolean;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const { userId = 'admin', enableWebSocket = true, autoFetch = true } = options;

  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // WebSocket ref
  const socketRef = useRef<Socket | null>(null);

  /**
   * Fetch all notifications
   */
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/analytics/notifications`, {
        params: { userId }
      });
      
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setUnreadCount(response.data.data.unreadCount);
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await axios.patch(
        `${API_URL}/analytics/notifications/${notificationId}/read`
      );
      
      if (response.data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, []);

  /**
   * Dismiss notification
   */
  const dismissNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await axios.patch(
        `${API_URL}/analytics/notifications/${notificationId}/dismiss`
      );
      
      if (response.data.success) {
        // Remove from local state
        setNotifications((prev) =>
          prev.filter((notif) => notif._id !== notificationId)
        );
        
        // Update unread count if it was unread
        const notification = notifications.find((n) => n._id === notificationId);
        if (notification && !notification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error dismissing notification:', err);
      return false;
    }
  }, [notifications]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await axios.patch(
        `${API_URL}/analytics/notifications/read-all`,
        { userId }
      );
      
      if (response.data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error marking all as read:', err);
      return false;
    }
  }, [userId]);

  /**
   * Handle notification tap (navigate to product)
   */
  const handleNotificationTap = useCallback(
    async (notification: Notification, navigation: any) => {
      // Mark as read
      if (!notification.read) {
        await markAsRead(notification._id);
      }

      // Navigate to product if productId exists
      if (notification.productId) {
        navigation.navigate('product/[id]', { id: notification.productId });
      }
    },
    [markAsRead]
  );

  /**
   * Initialize WebSocket connection
   */
  useEffect(() => {
    if (!enableWebSocket) return;

    // Create socket connection
    const socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('Notifications WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Notifications WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Notifications WebSocket connection error:', error);
      setIsConnected(false);
    });

    // New notification handler
    socket.on('notification:new', (payload: NotificationPayload) => {
      console.log('Received new notification:', payload);
      
      // Add to notifications list
      setNotifications((prev) => [payload.notification, ...prev]);
      
      // Increment unread count if not read
      if (!payload.notification.read) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [enableWebSocket]);

  /**
   * Auto-fetch on mount
   */
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();
    }
  }, [autoFetch, fetchNotifications]);

  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    isConnected,

    // Actions
    fetchNotifications,
    markAsRead,
    dismissNotification,
    markAllAsRead,
    handleNotificationTap,

    // Utilities
    refetch: fetchNotifications
  };
};
