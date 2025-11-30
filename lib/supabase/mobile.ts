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
  // Priority 1: Use EXPO_PUBLIC_APP_URL if set (for mobile development/production)
  const expoAppUrl = process.env.EXPO_PUBLIC_APP_URL;
  if (expoAppUrl) {
    return `${expoAppUrl}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
  }

  // Priority 2: Use NEXT_PUBLIC_APP_URL if set
  const nextAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (nextAppUrl && !nextAppUrl.includes("localhost")) {
    return `${nextAppUrl}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
  }

  // Server-side: return web URL (use NEXT_PUBLIC_APP_URL or localhost)
  if (typeof window === "undefined") {
    const baseUrl = nextAppUrl || "http://localhost:3000";
    return `${baseUrl}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
  }

  // Client-side: Check if we're on mobile
  const isMobile =
    typeof window !== "undefined" &&
    (!!(window as any).__expo ||
      !!(window as any).Expo ||
      (typeof (window as any).navigator !== "undefined" &&
        (window as any).navigator.product === "ReactNative"));

  if (isMobile) {
    // On mobile, localhost won't work - need network IP or production URL
    // Try to get from window.location if available (webview)
    const origin = (window as any).location?.origin;
    if (
      origin &&
      !origin.includes("localhost") &&
      !origin.includes("127.0.0.1")
    ) {
      return `${origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
    }

    // If we're on mobile and no proper URL is set, warn and use production URL
    if (process.env.NODE_ENV === "production" || nextAppUrl) {
      const fallbackUrl = nextAppUrl || "https://sparecarry.com";
      console.warn(
        "[getAuthCallbackUrl] Using fallback URL for mobile:",
        fallbackUrl
      );
      return `${fallbackUrl}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
    }

    // Development: Try to use Expo dev server URL
    // Expo dev server typically runs on the network IP
    // User should set EXPO_PUBLIC_APP_URL to their network IP (e.g., http://192.168.1.100:3000)
    console.warn(
      "[getAuthCallbackUrl] ⚠️ Mobile app needs EXPO_PUBLIC_APP_URL set to your network IP.\n" +
        "📝 Add this to your .env.local file:\n" +
        "   EXPO_PUBLIC_APP_URL=http://YOUR_IP:3000\n" +
        '🔍 Find your IP: Run "node apps/mobile/scripts/get-network-ip.js"\n' +
        "💡 Using localhost fallback (won't work on mobile - OAuth will fail)"
    );

    // Last resort: return localhost (won't work but prevents crash)
    // This will cause OAuth to fail, but at least the app won't crash
    return `http://localhost:3000/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
  }

  // Web: Use window.location or fallback
  const origin =
    (typeof window !== "undefined" &&
      (window as any).location &&
      (window as any).location.origin) ||
    nextAppUrl ||
    "http://localhost:3000";

  return `${origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
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
