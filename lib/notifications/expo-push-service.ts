/**
 * Expo Push Notification Service Integration
 * 
 * This service integrates Capacitor push notifications with Expo's Push Notification Service.
 * Capacitor handles device registration and receiving notifications, while Expo's service
 * handles sending notifications from your backend.
 * 
 * Setup:
 * 1. Create an Expo account at https://expo.dev
 * 2. Get your Expo Access Token from https://expo.dev/accounts/[account]/settings/access-tokens
 * 3. Set EXPO_ACCESS_TOKEN in your backend environment variables
 * 4. Use this service to send push notifications via Expo's API
 */

import { isNativePlatform } from "@/lib/utils/capacitor-safe";

// Lazy load Capacitor plugins only on native platforms
let PushNotifications: any = null;

async function loadPushNotifications() {
  if (typeof window === 'undefined' || !isNativePlatform()) {
    return null;
  }
  
  if (!PushNotifications) {
    try {
      const pushModule = await import("@capacitor/push-notifications");
      PushNotifications = pushModule.PushNotifications;
    } catch (error) {
      console.warn('[Expo Push] Failed to load Capacitor plugin:', error);
    }
  }
  
  return PushNotifications;
}

export interface ExpoPushToken {
  type: "expo";
  data: string;
}

export interface ExpoPushMessage {
  to: string | string[]; // Expo push token(s)
  sound?: "default" | "foghorn" | "boat_horn" | "airplane_ding" | "cash_register";
  title?: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  priority?: "default" | "normal" | "high";
  channelId?: string; // Android channel ID
}

/**
 * Register device for push notifications and get Expo-compatible token
 * This uses Capacitor's push notification plugin but formats the token
 * to work with Expo's push notification service
 */
export async function registerForExpoPushNotifications(): Promise<string | null> {
  if (typeof window === 'undefined' || !isNativePlatform()) {
    console.warn("Expo push notifications only work on native platforms");
    return null;
  }

  try {
    const PushNotificationsPlugin = await loadPushNotifications();
    if (!PushNotificationsPlugin) {
      return null;
    }

    // Request permission
    const permission = await PushNotificationsPlugin.requestPermissions();
    
    if (permission.receive !== "granted") {
      console.warn("Push notification permission denied");
      return null;
    }

    // Register for push notifications
    await PushNotificationsPlugin.register();

    // Return a promise that resolves when we get the token
    return new Promise((resolve) => {
      const tokenListener = PushNotificationsPlugin.addListener(
        "registration",
        (token: { value: string }) => {
        // Format token for Expo (Expo expects tokens in format: ExponentPushToken[...])
        // Capacitor tokens are already in the correct format for FCM/APNS
        // We'll need to convert them to Expo format on the backend
        resolve(token.value);
        tokenListener.remove();
        }
      );

      const errorListener = PushNotificationsPlugin.addListener("registrationError", (error: unknown) => {
        console.error("Push notification registration error:", error);
        resolve(null);
        errorListener.remove();
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        tokenListener.remove();
        errorListener.remove();
        resolve(null);
      }, 10000);
    });
  } catch (error) {
    console.error("Error registering for push notifications:", error);
    return null;
  }
}

/**
 * Send push notification via Expo's API
 * Call this from your backend server, not from the client
 * 
 * Example backend usage:
 * ```typescript
 * import { sendExpoPushNotification } from './expo-push-service';
 * 
 * await sendExpoPushNotification({
 *   to: userExpoPushToken,
 *   title: "New Match!",
 *   body: "You have a new delivery match",
 *   sound: "foghorn",
 *   data: { matchId: "123" }
 * });
 * ```
 */
export async function sendExpoPushNotification(message: ExpoPushMessage): Promise<void> {
  // This should only be called from your backend server
  // Client-side code should call your API endpoint instead
  if (typeof window !== "undefined") {
    throw new Error("sendExpoPushNotification must be called from server-side code");
  }

  const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
  const EXPO_ACCESS_TOKEN = process.env.EXPO_ACCESS_TOKEN;

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
      ...(EXPO_ACCESS_TOKEN && {
        Authorization: `Bearer ${EXPO_ACCESS_TOKEN}`,
      }),
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Expo push notification failed: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  
  // Check for errors in the response
  if (result.data && result.data.status === "error") {
    throw new Error(`Expo push notification error: ${result.data.message}`);
  }
}

/**
 * Setup push notification listeners
 * Call this when your app starts
 */
export async function setupExpoPushNotificationListeners() {
  if (typeof window === 'undefined' || !isNativePlatform()) {
    return;
  }

  try {
    const PushNotificationsPlugin = await loadPushNotifications();
    if (!PushNotificationsPlugin) {
      return;
    }

    // Handle notification received while app is in foreground
    PushNotificationsPlugin.addListener(
      "pushNotificationReceived",
      (notification: { data?: Record<string, unknown> }) => {
      console.log("Push notification received:", notification);
      // You can show a custom in-app notification here
      }
    );

    // Handle notification tapped
    PushNotificationsPlugin.addListener(
      "pushNotificationActionPerformed",
      (action: { notification: { data?: Record<string, unknown> } }) => {
        console.log("Push notification action performed:", action);
        const data = action.notification.data;
        
        // Navigate based on notification data
        if (data?.matchId) {
          window.location.href = `/home/messages/${data.matchId}`;
        }
      }
    );
  } catch (error) {
    console.warn('[Expo Push] Failed to setup listeners:', error);
  }
}

