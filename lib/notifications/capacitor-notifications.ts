// Capacitor Push Notifications for Native iOS/Android
import { isNativePlatform } from "@/lib/utils/capacitor-safe";

// Lazy load Capacitor plugins only on native platforms
let PushNotifications: any = null;
let LocalNotifications: any = null;

const isNative = typeof window !== "undefined" ? isNativePlatform() : false;

// Helper to create dynamic import paths that webpack can't statically analyze
function getCapacitorModulePath(moduleName: string): string {
  // Use string concatenation to prevent webpack static analysis
  const base = "@capacitor";
  return base + "/" + moduleName;
}

// Lazy load Capacitor plugins
async function loadCapacitorPlugins() {
  if (typeof window === "undefined" || !isNative) {
    return;
  }

  if (!PushNotifications || !LocalNotifications) {
    try {
      // Use dynamic path construction to prevent webpack from statically analyzing
      const pushPath = getCapacitorModulePath("push-notifications");
      const localPath = getCapacitorModulePath("local-notifications");
      const pushModule = await import(
        /* @vite-ignore */ /* webpackIgnore: true */ pushPath
      );
      const localModule = await import(
        /* @vite-ignore */ /* webpackIgnore: true */ localPath
      );
      PushNotifications = pushModule.PushNotifications;
      LocalNotifications = localModule.LocalNotifications;
    } catch (error) {
      // Silently fail - these modules don't exist in web builds
      console.warn("[Notifications] Failed to load Capacitor plugins:", error);
    }
  }
}

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
  if (typeof window === "undefined") {
    return false;
  }

  if (!isNative) {
    // Fallback to web notifications
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  }

  try {
    await loadCapacitorPlugins();
    if (!PushNotifications) {
      return false;
    }
    // Request permission
    const permResult = await PushNotifications.requestPermissions();
    return permResult.receive === "granted";
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (typeof window === "undefined" || !isNative) {
    // Web fallback
    return null;
  }

  try {
    await loadCapacitorPlugins();
    if (!PushNotifications) {
      return null;
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return null;
    }

    // Register for push notifications
    await PushNotifications.register();

    // Listen for registration
    return new Promise((resolve) => {
      PushNotifications.addListener(
        "registration",
        (token: { value: string }) => {
          console.log("Push registration success, token: " + token.value);
          resolve(token.value);
        }
      );

      PushNotifications.addListener("registrationError", (error: unknown) => {
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
  if (typeof window === "undefined") {
    return;
  }

  if (!isNative) {
    // Fallback to web notifications
    if ("Notification" in window) {
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
    await loadCapacitorPlugins();
    if (!LocalNotifications) {
      return;
    }
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

export async function setupNotificationHandlers() {
  if (typeof window === "undefined" || !isNative) {
    return;
  }

  try {
    await loadCapacitorPlugins();
    if (!PushNotifications || !LocalNotifications) {
      return;
    }

    // Handle push notification received
    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification: { data?: Record<string, unknown> }) => {
        console.log("Push notification received: ", notification);

        // Play sound based on notification data
        const sound = notification.data?.sound as keyof typeof NATIVE_SOUNDS;
        if (sound && NATIVE_SOUNDS[sound]) {
          // Sound will be played automatically by the system
          // But we can trigger haptic feedback
          const hapticsPath = getCapacitorModulePath("haptics");
          import(/* @vite-ignore */ /* webpackIgnore: true */ hapticsPath)
            .then(({ Haptics, ImpactStyle }) => {
              Haptics.impact({ style: ImpactStyle.Medium });
            })
            .catch(() => {
              // Ignore if haptics not available
            });
        }
      }
    );

    // Handle push notification action
    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action: { notification: { data?: Record<string, unknown> } }) => {
        console.log("Push notification action performed", action);
        const data = action.notification.data;

        // Navigate based on notification type
        if (data?.matchId) {
          const appPath = getCapacitorModulePath("app");
          import(/* @vite-ignore */ /* webpackIgnore: true */ appPath)
            .then(({ App }) => {
              // Navigation will be handled by the app router
              window.location.href = `/home/messages/${data.matchId}`;
            })
            .catch(() => {
              // Fallback navigation if Capacitor app not available
              window.location.href = `/home/messages/${data.matchId}`;
            });
        }
      }
    );

    // Handle local notification action
    LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (action: { notification: { extra?: Record<string, unknown> } }) => {
        console.log("Local notification action performed", action);
        const data = action.notification.extra;

        if (data?.matchId) {
          window.location.href = `/home/messages/${data.matchId}`;
        }
      }
    );
  } catch (error) {
    console.error("Failed to setup notification handlers:", error);
  }
}

// Initialize notification handlers when module loads (client-side only)
if (typeof window !== "undefined" && isNative) {
  setupNotificationHandlers().catch(console.error);
}
