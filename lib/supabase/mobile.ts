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
 * Returns "sparecarry://" for mobile, undefined for web
 * Must match the scheme in apps/mobile/app.config.ts
 */
export function getAppScheme(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  // Check if we're in Expo/React Native environment
  const isExpo = !!(window as any).__expo || !!(window as any).Expo;
  const isReactNative =
    typeof (window as any).navigator !== "undefined" &&
    (window as any).navigator.product === "ReactNative";

  if (isExpo || isReactNative) {
    // Return the app scheme - matches app.config.ts
    return "sparecarry://";
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
  console.log("[getAuthCallbackUrl] Constructing callback URL:", {
    redirectPath,
    hasWindow: typeof window !== "undefined",
    timestamp: new Date().toISOString(),
  });

  // Check if we're on mobile
  const isMobile =
    typeof window !== "undefined" &&
    (!!(window as any).__expo ||
      !!(window as any).Expo ||
      (typeof (window as any).navigator !== "undefined" &&
        (window as any).navigator.product === "ReactNative"));

  // Priority 1: Use EXPO_PUBLIC_APP_URL if set (should point to accessible web server)
  // For mobile OAuth to work, this must be an accessible HTTP/HTTPS URL
  // Either: 1) Start Next.js server on port 3000, OR 2) Use production URL
  const expoAppUrl = process.env.EXPO_PUBLIC_APP_URL;
  if (expoAppUrl) {
    // Verify it's a valid HTTP/HTTPS URL (Supabase requires this)
    if (expoAppUrl.startsWith("http://") || expoAppUrl.startsWith("https://")) {
      const url = `${expoAppUrl}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
      console.log("[getAuthCallbackUrl] Using EXPO_PUBLIC_APP_URL:", url);
      console.log("[getAuthCallbackUrl] ⚠️ Make sure this URL is accessible and Next.js server is running!");
      return url;
    } else {
      console.warn(
        "[getAuthCallbackUrl] EXPO_PUBLIC_APP_URL must be HTTP/HTTPS for Supabase OAuth:",
        expoAppUrl
      );
    }
  }

  // Priority 2: Client-side - Use current page origin to match what user is actually on
  // This handles both localhost (desktop) and IP address (mobile) dynamically
  if (typeof window !== "undefined" && window.location && window.location.origin) {
    const origin = window.location.origin;
    const url = `${origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
    console.log("[getAuthCallbackUrl] Using current page origin (client-side):", url);
    console.log("[getAuthCallbackUrl] This ensures callback URL matches the actual URL the user is accessing");
    return url;
  }

  // Priority 3: Use NEXT_PUBLIC_APP_URL if set (fallback for server-side rendering)
  const nextAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (nextAppUrl) {
    const url = `${nextAppUrl}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
    console.log("[getAuthCallbackUrl] Using NEXT_PUBLIC_APP_URL (server-side fallback):", url);
    return url;
  }

  // Final fallback: should rarely be reached

  // Fallback for server-side or when window is not available
  const fallbackUrl = "http://localhost:3000";
  const finalUrl = `${fallbackUrl}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
  
  // Validate the constructed URL
  try {
    new URL(finalUrl);
    console.log("[getAuthCallbackUrl] Final callback URL (fallback):", finalUrl);
  } catch (error) {
    console.error("[getAuthCallbackUrl] Invalid URL constructed:", finalUrl, error);
  }

  return finalUrl;
}

/**
 * Create a mobile-optimized Supabase client
 * Uses Capacitor storage (Preferences API) instead of localStorage
 * Disables PKCE for native apps (not needed in mobile)
 */
export function createMobileClient(): SupabaseClient {
  const supabaseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_* equivalents)."
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
