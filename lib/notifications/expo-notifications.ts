// Expo Push Notifications Setup
// Works on web + future mobile apps
// For native iOS/Android, use Capacitor Push Notifications instead

import { Capacitor } from "@capacitor/core";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const isNative = Capacitor.isNativePlatform();

// Configure notification behavior (only if expo-notifications is available)
if (Notifications && Notifications.setNotificationHandler) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export interface NotificationSound {
  match: "boat_horn" | "airplane_ding";
  message: "foghorn";
  counterOffer: "cash_register";
}

// Sound files (will be loaded from public/sounds/)
const SOUNDS = {
  boat_horn: require("../../public/sounds/boat-horn.mp3"),
  airplane_ding: require("../../public/sounds/airplane-ding.mp3"),
  foghorn: require("../../public/sounds/foghorn.mp3"),
  cash_register: require("../../public/sounds/cash-register.mp3"),
};

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    // Web Notifications API
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        return true;
      }
      if (Notification.permission === "denied") {
        return false;
      }
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    // Expo Notifications (mobile)
    if (Notifications && Notifications.getPermissionsAsync) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: false,
          },
        });
        finalStatus = status;
      }

      return finalStatus === "granted";
    }

    return false;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return null;
    }

    // Web: Generate a unique token (store in localStorage)
    if (typeof window !== "undefined" && Platform.OS === "web") {
      let token = localStorage.getItem("expo_push_token");
      if (!token) {
        token = `web_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem("expo_push_token", token);
      }
      return token;
    }

    // Mobile: Get Expo push token
    if (Notifications && Notifications.getExpoPushTokenAsync) {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID || process.env.NEXT_PUBLIC_EXPO_PROJECT_ID,
      });
      return token.data;
    }

    return null;
  } catch (error) {
    console.error("Error registering for push notifications:", error);
    return null;
  }
}

export async function sendLocalNotification(
  title: string,
  body: string,
  sound: keyof typeof SOUNDS,
  data?: Record<string, any>
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: SOUNDS[sound],
        data,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error("Error sending local notification:", error);
  }
}

export function playNotificationSound(sound: keyof typeof SOUNDS) {
  // For web, use HTML5 Audio API
  if (typeof window !== "undefined") {
    try {
      const soundMap: Record<string, string> = {
        boat_horn: "/sounds/boat-horn.mp3",
        airplane_ding: "/sounds/airplane-ding.mp3",
        foghorn: "/sounds/foghorn.mp3",
        cash_register: "/sounds/cash-register.mp3",
      };
      
      const audio = new Audio(soundMap[sound] || soundMap.boat_horn);
      audio.volume = 0.7;
      audio.play().catch(console.error);
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  }
}

// Notification handlers
export function setupNotificationHandlers() {
  if (typeof window === "undefined") return;

  // Web: Listen for service worker notifications
  if ("serviceWorker" in navigator && "Notification" in window) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      const data = event.data;
      if (data?.type === "notification") {
        const sound = data.sound as keyof typeof SOUNDS;
        if (sound) {
          playNotificationSound(sound);
        }
        
        // Handle navigation
        if (data.notificationType === "match") {
          window.location.href = `/home/messages/${data.matchId}`;
        } else if (data.notificationType === "message") {
          window.location.href = `/home/messages/${data.matchId}`;
        } else if (data.notificationType === "counter_offer") {
          window.location.href = `/home/messages/${data.matchId}`;
        }
      }
    });
  }

  // Expo Notifications (mobile)
  if (Notifications && Notifications.addNotificationReceivedListener) {
    Notifications.addNotificationReceivedListener((notification: any) => {
      const sound = notification.request.content.data?.sound as keyof typeof SOUNDS;
      if (sound) {
        playNotificationSound(sound);
      }
    });

    Notifications.addNotificationResponseReceivedListener((response: any) => {
      const data = response.notification.request.content.data;
      if (data?.type === "match") {
        window.location.href = `/home/messages/${data.matchId}`;
      } else if (data?.type === "message") {
        window.location.href = `/home/messages/${data.matchId}`;
      } else if (data?.type === "counter_offer") {
        window.location.href = `/home/messages/${data.matchId}`;
      }
    });
  }
}

