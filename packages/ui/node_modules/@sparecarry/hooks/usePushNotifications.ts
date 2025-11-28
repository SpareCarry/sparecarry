/**
 * usePushNotifications - Universal push notification hook
 * Handles Expo push notifications for mobile
 * 
 * NOTE: Lazy-loads expo-notifications to avoid Expo Go warnings
 */

import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { createClient } from '@sparecarry/lib/supabase';

type ExpoNotificationsModule = typeof import('expo-notifications');
type ExpoDeviceModule = typeof import('expo-device');
type ExpoNotification = import('expo-notifications').Notification;
type ExpoNotificationResponse = import('expo-notifications').NotificationResponse;

// Lazy-load expo-notifications to avoid auto-loading in Expo Go
let Notifications: ExpoNotificationsModule | null = null;
let Device: ExpoDeviceModule | null = null;

async function loadNotificationsModule() {
  if (Notifications && Device) return { Notifications, Device };
  
  try {
    Notifications = await import('expo-notifications');
    Device = await import('expo-device');
    
    // Configure notification behavior (only if module loaded)
    if (Notifications) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
    
    return { Notifications, Device };
  } catch (error) {
    console.warn('[usePushNotifications] Failed to load expo-notifications:', error);
    return { Notifications: null, Device: null };
  }
}

export interface PushNotificationToken {
  token: string;
  type: 'expo' | 'fcm';
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<ExpoNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const notificationListener = useRef<ReturnType<
    NonNullable<ExpoNotificationsModule>['addNotificationReceivedListener']
  > | null>(null);
  const responseListener = useRef<ReturnType<
    NonNullable<ExpoNotificationsModule>['addNotificationResponseReceivedListener']
  > | null>(null);

  useEffect(() => {
    let mounted = true;
    
    loadNotificationsModule()
      .then(({ Notifications: Notifs, Device: Dev }) => {
        if (!mounted) return;
        
        if (!Notifs || !Dev) {
          console.warn('[usePushNotifications] expo-notifications not available (Expo Go limitation)');
          setLoading(false);
          return;
        }
        
        registerForPushNotificationsAsync(Notifs, Dev)
          .then((token) => {
            if (mounted) {
              setExpoPushToken(token);
              setLoading(false);
            }
          })
          .catch((err) => {
            if (mounted) {
              setError(err);
              setLoading(false);
            }
          });

        // Listen for notifications received while app is foregrounded
        notificationListener.current = Notifs.addNotificationReceivedListener((notif: ExpoNotification) => {
          if (mounted) setNotification(notif);
        });

        // Listen for user tapping on notifications
        responseListener.current = Notifs.addNotificationResponseReceivedListener((response: ExpoNotificationResponse) => {
          console.log('Notification tapped:', response);
          handleNotificationTap(response, Notifs);
        });
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
        notificationListener.current = null;
      }
      if (responseListener.current) {
        responseListener.current.remove();
        responseListener.current = null;
      }
    };
  }, []);

  const registerToken = async (userId: string) => {
    if (!expoPushToken) {
      throw new Error('No push token available');
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        expo_push_token: expoPushToken,
        push_notifications_enabled: true,
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }
  };

  return {
    expoPushToken,
    notification,
    loading,
    error,
    registerToken,
  };
}

async function registerForPushNotificationsAsync(
  Notifications: NonNullable<ExpoNotificationsModule>,
  Device: NonNullable<ExpoDeviceModule>
): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#14b8a6',
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
      console.warn('Failed to get push token for push notification!');
      return null;
    }
    
            try {
              const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || process.env.EAS_PROJECT_ID;
              if (!projectId || projectId === 'your-project-id') {
                console.warn('[usePushNotifications] EAS_PROJECT_ID not set. Push notifications will not work.');
                console.warn('   Set EXPO_PUBLIC_EAS_PROJECT_ID in apps/mobile/.env.local');
                return null;
              }
              const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId,
              });
              token = tokenData.data;
            } catch (e) {
              console.error('Error getting Expo push token:', e);
              // Don't throw - just return null so app continues to work
              return null;
            }
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  return token;
}

function handleNotificationTap(
  response: ExpoNotificationResponse,
  Notifications: NonNullable<ExpoNotificationsModule>
) {
  const data = response.notification.request.content.data;
  
  // Handle navigation based on notification type
  if (data?.type === 'match') {
    // Navigate to match/message screen
    // This would use your navigation system
    console.log('Navigate to match:', data.matchId);
  } else if (data?.type === 'message') {
    // Navigate to message screen
    console.log('Navigate to message:', data.matchId);
  }
}

