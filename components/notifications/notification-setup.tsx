"use client";

import { useEffect } from "react";
import { isNativePlatform } from "../../lib/utils/capacitor-safe";
import { setupNotificationHandlers as setupExpoHandlers } from "../../lib/notifications/expo-notifications";
import { setupNotificationHandlers as setupCapacitorHandlers } from "../../lib/notifications/capacitor-notifications";
import { registerForExpoPushNotifications } from "../../lib/notifications/expo-push-service";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

type ProfileNotificationSettings = {
  expo_push_token?: string | null;
  push_notifications_enabled?: boolean | null;
};

export function NotificationSetup() {
  useEffect(() => {
    const isNative = isNativePlatform();

    if (isNative) {
      // Use Capacitor push notifications for native iOS/Android
      setupCapacitorHandlers();

      // Register Expo push token for native platforms
      const registerToken = async () => {
        try {
          const supabase = createClient() as SupabaseClient;
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) return;

          // Check if token already exists
          const { data: profileData } = await supabase
            .from("profiles")
            .select("expo_push_token, push_notifications_enabled")
            .eq("user_id", user.id)
            .single();

          const profile = (profileData ??
            null) as ProfileNotificationSettings | null;

          // Only register if we don't have a token or notifications are enabled
          if (
            !profile?.expo_push_token &&
            profile?.push_notifications_enabled !== false
          ) {
            const token = await registerForExpoPushNotifications();

            if (token) {
              // Register token with backend
              await fetch("/api/notifications/register-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  expoPushToken: token,
                  enableNotifications: true,
                }),
              });
            }
          }
        } catch (error) {
          console.error("Error registering Expo push token:", error);
        }
      };

      // Register token after a short delay to ensure auth is ready
      setTimeout(registerToken, 1000);
    } else {
      // Use Expo/Web notifications for web
      setupExpoHandlers();
    }
  }, []);

  return null;
}
