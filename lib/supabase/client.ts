/**
 * Unified Supabase client that works for both web and mobile
 * Automatically detects the environment and uses the appropriate client
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createMobileClient, isMobile } from "./mobile";
import { isTestMode, getTestUser } from "../test/testAuthBypass";
import type { Database } from "@/types/supabase";

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Create a browser-safe storage adapter
 * For client-side components, use localStorage (default browser behavior)
 * For SSR compatibility with PKCE, Supabase SSR handles cookies automatically
 */
function getBrowserStorage() {
  // Server-side: return no-op storage
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  // Client-side: use localStorage (default browser storage)
  // Supabase SSR will also set cookies automatically for PKCE when needed
  return window.localStorage;
}

/**
 * Create the appropriate Supabase client based on the environment
 * - Mobile (Capacitor): Uses mobile client with Capacitor Preferences storage
 * - Web: Uses browser client with localStorage and PKCE flow
 */
function withTestModeAuth(client: TypedSupabaseClient) {
  if (!isTestMode()) {
    return client;
  }

  const testUser = getTestUser();

  // Override auth helpers to always return the test user so screens can render without network calls
  const fakeUserResponse = { data: { user: testUser }, error: null };

  client.auth.getUser = async () => {
    console.log("[SUPABASE][TEST_MODE] Returning mocked user for auth.getUser()");
    return fakeUserResponse as any;
  };

  client.auth.getSession = async () => {
    console.log("[SUPABASE][TEST_MODE] Returning mocked session for auth.getSession()");
    return {
      data: {
        session: {
          user: testUser,
          access_token: "test-token",
          refresh_token: "test-refresh-token",
          expires_in: 3600,
          token_type: "bearer",
          expires_at: Date.now() / 1000 + 3600,
        },
      },
      error: null,
    } as any;
  };

  // Immediately invoke callbacks with a signed-in event so components listening for auth state don't hang
  client.auth.onAuthStateChange = (callback) => {
    console.log("[SUPABASE][TEST_MODE] Triggering immediate SIGNED_IN event for onAuthStateChange");
    const handler = {
      data: {
        subscription: {
          unsubscribe: () => undefined,
        },
      },
      error: null,
    } as any;
    callback("SIGNED_IN", {
      session: {
        user: testUser,
      },
    } as any);
    return handler;
  };

  return client;
}

// Client-side singleton to prevent creating multiple instances
let browserClientInstance: TypedSupabaseClient | null = null;
let mobileClientInstance: TypedSupabaseClient | null = null;

export function createClient(): TypedSupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // During static export build, env vars may not be set
  // Return a client with placeholder values that will fail gracefully at runtime
  if (!supabaseUrl || !supabaseAnonKey) {
    // Still check if mobile to return appropriate client type
    if (typeof window !== "undefined" && isMobile()) {
      if (!mobileClientInstance) {
        try {
          mobileClientInstance = createMobileClient() as TypedSupabaseClient;
        } catch (error) {
          // Fallback to browser client if mobile client creation fails
          mobileClientInstance = createBrowserClient<Database>(
            "https://placeholder.supabase.co",
            "placeholder-key"
          ) as TypedSupabaseClient;
        }
      }
      return mobileClientInstance;
    }
    if (!browserClientInstance) {
      browserClientInstance = withTestModeAuth(createBrowserClient<Database>(
        "https://placeholder.supabase.co",
        "placeholder-key"
      ));
    }
    return browserClientInstance;
  }
  
  // Check if we're in a mobile Capacitor environment
  if (typeof window !== "undefined" && isMobile()) {
    if (!mobileClientInstance) {
      mobileClientInstance = createMobileClient() as TypedSupabaseClient;
      mobileClientInstance = withTestModeAuth(mobileClientInstance);
    }
    return mobileClientInstance;
  }
  
  // Browser client - use singleton
  if (!browserClientInstance) {
    browserClientInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
    browserClientInstance = withTestModeAuth(browserClientInstance);
  }
  return browserClientInstance;
}
