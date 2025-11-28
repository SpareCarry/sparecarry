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

  // Check if Capacitor is available (global, to avoid bundler imports)
  const capacitor = (window as any).Capacitor;
  const preferences =
    capacitor && (capacitor.Preferences || capacitor.Plugins?.Preferences);

  if (preferences) {
    // Use Capacitor Preferences API (similar to AsyncStorage)
    return {
      async getItem(key: string): Promise<string | null> {
        try {
          const { value } = await preferences.get({ key });
          return value ?? null;
        } catch (error) {
          console.error("Error getting preference:", error);
          // Fallback to localStorage
          try {
            return localStorage.getItem(key);
          } catch {
            return null;
          }
        }
      },
      async setItem(key: string, value: string): Promise<void> {
        try {
          await preferences.set({ key, value });
        } catch (error) {
          console.error("Error setting preference:", error);
          // Fallback to localStorage
          try {
            localStorage.setItem(key, value);
          } catch {
            // Ignore localStorage errors
          }
        }
      },
      async removeItem(key: string): Promise<void> {
        try {
          // Capacitor Preferences uses remove() method
          await preferences.remove({ key });
        } catch (error) {
          console.error("Error removing preference:", error);
          // Fallback to localStorage
          try {
            localStorage.removeItem(key);
          } catch {
            // Ignore localStorage errors
          }
        }
      },
    };
  }

  // Fallback to localStorage for web / non-Capacitor environments
  try {
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
  } catch {
    // If localStorage is not available (very rare), use in-memory no-op storage
    const memoryStore = new Map<string, string>();
    return {
      getItem: (key: string) => Promise.resolve(memoryStore.get(key) ?? null),
      setItem: (key: string, value: string) => {
        memoryStore.set(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        memoryStore.delete(key);
        return Promise.resolve();
      },
    };
  }
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

