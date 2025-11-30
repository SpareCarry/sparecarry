/**
 * Network utilities for mobile app
 * Handles LAN IP detection and API endpoint configuration
 */

import { Platform } from "react-native";

/**
 * Get the local network IP address for development
 * This is used to replace localhost when testing on mobile devices
 */
export async function getLocalIP(): Promise<string | null> {
  try {
    // On mobile, we can't easily detect the laptop's IP
    // So we'll use environment variable or default to localhost
    const lanIP =
      process.env.EXPO_PUBLIC_LAN_IP || process.env.NEXT_PUBLIC_LAN_IP;
    if (lanIP) {
      return lanIP;
    }

    // Note: On mobile, we can't easily detect the laptop's IP
    // Users should set EXPO_PUBLIC_LAN_IP in .env.local
    // Run: pnpm get-lan-ip to find your IP

    // Fallback: return null to use default Supabase URL
    return null;
  } catch (error) {
    console.error("[Network] Error getting local IP:", error);
    return null;
  }
}

/**
 * Replace localhost with LAN IP in URLs for mobile testing
 */
export function replaceLocalhost(url: string, lanIP?: string | null): string {
  if (!url) return url;

  // If no LAN IP provided, try to get it from env
  if (!lanIP) {
    lanIP =
      process.env.EXPO_PUBLIC_LAN_IP || process.env.NEXT_PUBLIC_LAN_IP || null;
  }

  // Replace localhost or 127.0.0.1 with LAN IP
  if (lanIP) {
    return url.replace(/localhost/g, lanIP).replace(/127\.0\.0\.1/g, lanIP);
  }

  return url;
}

/**
 * Check if we're in development mode and should use LAN IP
 */
export function shouldUseLANIP(): boolean {
  return __DEV__ && (Platform.OS === "ios" || Platform.OS === "android");
}
