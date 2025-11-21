"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { setupNotificationHandlers as setupExpoHandlers } from "../../lib/notifications/expo-notifications";
import { setupNotificationHandlers as setupCapacitorHandlers } from "../../lib/notifications/capacitor-notifications";
import { registerForExpoPushNotifications } from "../../lib/notifications/expo-push-service";
import { createClient } from "../../lib/supabase/client";

export function NotificationSetup() {
  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
      // Use Capacitor push notifications for native iOS/Android
      setupCapacitorHandlers();
      
      // Register Expo push token for native platforms
      const registerToken = async () => {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) return;
          
          // Check if token already exists
          const { data: profile } = await supabase
            .from("profiles")
            .select("expo_push_token, push_notifications_enabled")
            .eq("user_id", user.id)
            .single();
          
          // Only register if we don't have a token or notifications are enabled
          if (!profile?.expo_push_token && profile?.push_notifications_enabled !== false) {
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
