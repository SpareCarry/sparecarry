/**
 * Mobile-specific Supabase client for Capacitor
 * Handles deep linking, AsyncStorage-equivalent storage, and proper auth configuration
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Capacitor-compatible storage adapter using Capacitor Preferences
 * Equivalent to AsyncStorage for React Native
 */
function createCapacitorStorage() {
  // Check if we're in a Capacitor environment
  if (typeof window === "undefined") {
    // Server-side: return no-op storage
    return {
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.resolve(),
      removeItem: () => Promise.resolve(),
    };
  }

  // Check if Capacitor is available
  const isCapacitor = (window as any).Capacitor;
  
  if (isCapacitor) {
    // Use Capacitor Preferences API (similar to AsyncStorage)
    try {
      // Dynamically import Capacitor Preferences
      return {
        async getItem(key: string): Promise<string | null> {
          try {
            const { Preferences } = await import("@capacitor/preferences");
            const { value } = await Preferences.get({ key });
            return value;
          } catch (error) {
            console.error("Error getting preference:", error);
            // Fallback to localStorage
            return localStorage.getItem(key);
          }
        },
        async setItem(key: string, value: string): Promise<void> {
          try {
            const { Preferences } = await import("@capacitor/preferences");
            await Preferences.set({ key, value });
          } catch (error) {
            console.error("Error setting preference:", error);
            // Fallback to localStorage
            localStorage.setItem(key, value);
          }
        },
        async removeItem(key: string): Promise<void> {
          try {
            const { Preferences } = await import("@capacitor/preferences");
            // Capacitor Preferences uses remove() method
            await (Preferences as any).remove({ key });
          } catch (error) {
            console.error("Error removing preference:", error);
            // Fallback to localStorage
            try {
              localStorage.removeItem(key);
            } catch (e) {
              // Ignore localStorage errors
            }
          }
        },
      };
    } catch (error) {
      console.warn("Capacitor Preferences not available, falling back to localStorage");
      // Fallback to localStorage if Capacitor is not available
      return {
        getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
        setItem: (key: string, value: string) => {
          localStorage.setItem(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          localStorage.removeItem(key);
          return Promise.resolve();
        },
      };
    }
  }

  // Fallback to localStorage for web
  return {
    getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key: string, value: string) => {
      localStorage.setItem(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      localStorage.removeItem(key);
      return Promise.resolve();
    },
  };
}

/**
 * Get the app scheme for deep linking
 * Returns "carryspace://" for mobile, undefined for web
 */
export function getAppScheme(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  // Check if we're in Capacitor
  const isCapacitor = (window as any).Capacitor;
  
  if (isCapacitor) {
    // Return the app scheme - matches Capacitor config
    return "carryspace://";
  }

  return undefined;
}

/**
 * Get the callback URL for auth redirects
 * IMPORTANT: Always returns web URL for Supabase magic links
 * The web callback route will detect mobile and redirect to deep link if needed
 * This is because email links open in browsers first, which can't handle custom schemes directly
 */
export function getAuthCallbackUrl(redirectPath: string = "/home"): string {
  if (typeof window === "undefined") {
    // Server-side: return web URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
  }

  // Always return web URL - the callback route will handle mobile redirect
  // This is necessary because email links open in browsers first
  return `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
}

/**
 * Create a mobile-optimized Supabase client
 * Uses Capacitor storage (Preferences API) instead of localStorage
 * Disables PKCE for native apps (not needed in mobile)
 */
export function createMobileClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  const storage = createCapacitorStorage();

  // For mobile, use implicit flow (not PKCE) as PKCE is browser-specific
  // Mobile apps don't need PKCE since they use app-specific deep links
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: storage as any, // Supabase accepts async storage interface
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // We handle deep links manually
      flowType: "implicit", // Use implicit flow for mobile (not PKCE)
    },
  });
}

/**
 * Check if we're running in a mobile Capacitor environment
 */
export function isMobile(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return !!(window as any).Capacitor;
}

