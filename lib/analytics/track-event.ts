/**
 * Simple analytics event tracking helper
 * Directly inserts events into analytics_events table
 */

import { createClient } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface TrackEventOptions {
  event: string;
  data?: Record<string, any>;
  user_id?: string;
  platform?: "web" | "ios" | "android";
}

/**
 * Track an analytics event
 * This is a simpler, more direct function for tracking events
 */
export async function trackAnalyticsEvent(
  event: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    const supabase = createClient() as SupabaseClient;

    // Get current user if not provided
    let userId: string | undefined;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id;
    } catch (error) {
      // Ignore auth errors
    }

    // Determine platform
    let platform: "web" | "ios" | "android" = "web";
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      if (ua.includes("iphone") || ua.includes("ipad")) {
        platform = "ios";
      } else if (ua.includes("android")) {
        platform = "android";
      }
    }

    // Insert event into analytics_events table
    await supabase.from("analytics_events").insert({
      event,
      data: data || {},
      user_id: userId || null,
      platform,
      user_agent:
        typeof window !== "undefined" ? window.navigator.userAgent : null,
    });

    // Also send to Google Analytics if available
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", event, data || {});
    }

    // Also send to Meta Pixel if available
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("trackCustom", event, data || {});
    }
  } catch (error) {
    // Silently fail - don't break the app if analytics fails
    console.error("Error tracking analytics event:", error);
  }
}
