// Capacitor Push Notifications for Native iOS/Android
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();

export interface NotificationSound {
  match: "boat_horn" | "airplane_ding";
  message: "foghorn";
  counterOffer: "cash_register";
}

// Sound file mapping for native platforms
const NATIVE_SOUNDS = {
  boat_horn: "boat_horn.wav",
  airplane_ding: "airplane_ding.wav",
  foghorn: "foghorn.wav",
  cash_register: "cash_register.wav",
};

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNative) {
    // Fallback to web notifications
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  }

  try {
    // Request permission
    const permResult = await PushNotifications.requestPermissions();
    return permResult.receive === "granted";
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!isNative) {
    // Web fallback
    return null;
  }

  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return null;
    }

    // Register for push notifications
    await PushNotifications.register();

    // Listen for registration
    return new Promise((resolve) => {
      PushNotifications.addListener("registration", (token) => {
        console.log("Push registration success, token: " + token.value);
        resolve(token.value);
      });

      PushNotifications.addListener("registrationError", (error) => {
        console.error("Error on registration: " + JSON.stringify(error));
        resolve(null);
      });
    });
  } catch (error) {
    console.error("Error registering for push notifications:", error);
    return null;
  }
}

export async function sendLocalNotification(
  title: string,
  body: string,
  sound: keyof typeof NATIVE_SOUNDS,
  data?: Record<string, any>
) {
  if (!isNative) {
    // Fallback to web notifications
    if (typeof window !== "undefined" && "Notification" in window) {
      new Notification(title, {
        body,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: data?.matchId || "sparecarry",
        data,
      });
    }
    return;
  }

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Date.now(),
          sound: NATIVE_SOUNDS[sound],
          extra: data,
          attachments: undefined,
          actionTypeId: "",
          summaryText: undefined,
        },
      ],
    });
  } catch (error) {
    console.error("Error sending local notification:", error);
  }
}

export function setupNotificationHandlers() {
  if (!isNative) {
    return;
  }

  // Handle push notification received
  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("Push notification received: ", notification);
    
    // Play sound based on notification data
    const sound = notification.data?.sound as keyof typeof NATIVE_SOUNDS;
    if (sound && NATIVE_SOUNDS[sound]) {
      // Sound will be played automatically by the system
      // But we can trigger haptic feedback
      import("@capacitor/haptics").then(({ Haptics }) => {
        Haptics.impact({ style: "medium" });
      });
    }
  });

  // Handle push notification action
  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    console.log("Push notification action performed", action);
    const data = action.notification.data;
    
    // Navigate based on notification type
    if (data?.matchId) {
      import("@capacitor/app").then(({ App }) => {
        // Navigation will be handled by the app router
        window.location.href = `/home/messages/${data.matchId}`;
      });
    }
  });

  // Handle local notification action
  LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
    console.log("Local notification action performed", action);
    const data = action.notification.extra;
    
    if (data?.matchId) {
      window.location.href = `/home/messages/${data.matchId}`;
    }
  });
}

// Initialize notification handlers when module loads
if (isNative && typeof window !== "undefined") {
  setupNotificationHandlers();
}

