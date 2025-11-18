"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { setupNotificationHandlers as setupExpoHandlers } from "@/lib/notifications/expo-notifications";
import { setupNotificationHandlers as setupCapacitorHandlers } from "@/lib/notifications/capacitor-notifications";

export function NotificationSetup() {
  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
      // Use Capacitor push notifications for native iOS/Android
      setupCapacitorHandlers();
    } else {
      // Use Expo/Web notifications for web
      setupExpoHandlers();
    }
  }, []);

  return null;
}
