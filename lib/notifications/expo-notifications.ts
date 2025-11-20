// Web Push Notifications Setup
// Works on web
// For native iOS/Android, use Capacitor Push Notifications instead

import { isNativePlatform } from "@/lib/utils/capacitor-safe";

const isNative = typeof window !== 'undefined' ? isNativePlatform() : false;

export interface NotificationSound {
  match: "boat_horn" | "airplane_ding";
  message: "foghorn";
  counterOffer: "cash_register";
}

// Sound files (will be loaded from public/sounds/)
const SOUNDS = {
  boat_horn: "boat_horn",
  airplane_ding: "airplane_ding",
  foghorn: "foghorn",
  cash_register: "cash_register",
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

    // Native platforms should use Capacitor notifications
    if (isNative) {
      return false;
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
    if (typeof window !== "undefined" && !isNative) {
      let token = localStorage.getItem("expo_push_token");
      if (!token) {
        token = `web_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem("expo_push_token", token);
      }
      return token;
    }

    // Native platforms should use Capacitor notifications
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
    // Web: Use browser Notification API
    if (typeof window !== "undefined" && !isNative && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: data?.matchId || "sparecarry",
          data,
        });
        // Play sound
        playNotificationSound(sound);
      }
    }
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

  // Web: Listen for browser notification clicks
  if (typeof window !== "undefined" && "Notification" in window) {
    // Handle notification clicks (if supported)
    // Note: Browser notifications don't have a built-in click handler
    // This would typically be handled by a service worker
  }
}

