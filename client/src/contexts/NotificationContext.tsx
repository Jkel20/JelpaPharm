import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';
import api from '../config/api';
import { API_ENDPOINTS } from '../config/api';

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'low_stock' | 'expiry' | 'sale' | 'system' | 'prescription' | 'customer' | 'supplier';
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  data?: {
    itemId?: string;
    itemName?: string;
    quantity?: number;
    expiryDate?: Date;
    saleId?: string;
    customerId?: string;
    prescriptionId?: string;
    supplierId?: string;
  };
  createdAt: string;
  readAt?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  registerForPushNotifications: () => Promise<string | null>;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      registerForPushNotifications();
    }
  }, [isAuthenticated, user]);

  // Set up notification listeners
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      // Handle received notification
      console.log('Notification received:', notification);
      fetchNotifications(); // Refresh notifications
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      // Handle notification tap
      console.log('Notification tapped:', response);
      const notificationId = response.notification.request.content.data?.notificationId;
      if (notificationId) {
        markAsRead(notificationId);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  const registerForPushNotifications = async (): Promise<string | null> => {
    let token: string | null = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    // Send token to backend
    if (token && user) {
      try {
        await api.put(`/api/users/${user._id}/push-token`, { expoPushToken: token });
        console.log('Push token registered with backend');
      } catch (error) {
        console.error('Failed to register push token with backend:', error);
      }
    }

    return token;
  };

  const fetchNotifications = async (): Promise<void> => {
    if (!isAuthenticated || !user) return;

    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.LIST);
      const { notifications: fetchedNotifications, unreadCount: count } = response.data.data;
      
      setNotifications(fetchedNotifications || []);
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string): Promise<void> => {
    if (!isAuthenticated || !user) return;

    try {
      await api.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId));
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    if (!isAuthenticated || !user) return;

    try {
      await api.put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString()
        }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const refreshNotifications = async (): Promise<void> => {
    await fetchNotifications();
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    registerForPushNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
