// Add aggressive logging at module level (using console.log for debug info)
import "../lib/debug-mode"; // Initialize debug mode first

console.log("");
console.log("========================================");
console.log("📱 APP MODULE LOADING");
console.log("========================================");
console.log("");

import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { checkARCapability } from "../lib/utils/arChecker";
import { configureGoogleSignIn } from "../lib/auth/googleSignIn";
import { createClient } from "@sparecarry/lib/supabase";
import { RealtimeManager } from "@sparecarry/lib/realtime";
import { useAuth } from "@sparecarry/hooks/useAuth";

console.log("[MODULE] Importing createClient...");
console.log("[MODULE] ✅ createClient imported");
console.log("[MODULE] Importing RealtimeManager...");
console.log("[MODULE] ✅ RealtimeManager imported");
console.log("[MODULE] Importing useAuth...");
console.log("[MODULE] ✅ useAuth imported");

// Import optional modules with fallbacks
let isDevMode: () => boolean = () => false;
let mobileLogger: any = {
  error: (msg: string, opts?: any) => console.error("[LOGGER]", msg, opts),
  warn: (msg: string, opts?: any) => console.warn("[LOGGER]", msg, opts),
  info: (msg: string, opts?: any) => console.log("[LOGGER]", msg, opts),
  debug: (msg: string, opts?: any) => console.log("[LOGGER]", msg, opts),
};

try {
  console.log("[MODULE] Importing isDevMode...");
  const devModeModule = require("../config/devMode");
  isDevMode = devModeModule.isDevMode;
  console.log("[MODULE] ✅ isDevMode imported");
} catch (e) {
  console.warn("[MODULE] ⚠️ Failed to import isDevMode:", e);
}

try {
  console.log("[MODULE] Importing mobileLogger...");
  const loggerModule = require("../lib/logger");
  mobileLogger = loggerModule.mobileLogger;
  console.log("[MODULE] ✅ mobileLogger imported");
} catch (e) {
  console.warn("[MODULE] ⚠️ Failed to import mobileLogger:", e);
}

console.log("[MODULE] ✅ All imports successful");
console.log("");

// Initialize Supabase client with error handling
// Move initialization to useEffect to avoid module-level errors
let supabase: ReturnType<typeof createClient> | null = null;
let supabaseInitError: Error | null = null;

function initializeSupabase() {
  if (supabase !== null) return supabase; // Already initialized or failed

  try {
    console.log("[MODULE] Initializing Supabase client...");
    console.log("[MODULE] Environment check:");
    console.log(
      `  - EXPO_PUBLIC_SUPABASE_URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL ? "SET" : "MISSING"}`
    );
    console.log(
      `  - EXPO_PUBLIC_SUPABASE_ANON_KEY: ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING"}`
    );

    supabase = createClient();
    console.log("[MODULE] ✅ createClient() succeeded");

    if (supabase) {
      try {
        console.log("[MODULE] Setting RealtimeManager client...");
        RealtimeManager.setSupabaseClient(supabase);
        console.log("[MODULE] ✅ RealtimeManager client set");
        console.log("✅ Supabase client initialized");
      } catch (realtimeError) {
        console.error("❌ Failed to set RealtimeManager:", realtimeError);
        supabaseInitError =
          realtimeError instanceof Error
            ? realtimeError
            : new Error(String(realtimeError));
        // Continue - RealtimeManager is optional
      }
    } else {
      console.warn("[MODULE] ⚠️ createClient() returned null");
      supabaseInitError = new Error("createClient returned null");
    }
  } catch (error) {
    console.error("");
    console.error(
      "❌❌❌ CRITICAL: Failed to initialize Supabase client ❌❌❌"
    );
    console.error("Error:", error);
    console.error("");
    supabaseInitError =
      error instanceof Error ? error : new Error(String(error));
    supabase = null; // Mark as failed
  }

  return supabase;
}

// Import shared QueryClient instance
import { queryClient } from "../lib/queryClient";

// TEMPORARY: Set to true to skip authentication on MOBILE ONLY (for testing)
// This only affects the mobile app, web app still requires authentication
const SKIP_AUTH_MOBILE = true;

function NavigationHandler() {
  // useAuth must be called at top level - it handles errors internally
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Check bypass at component level (before useEffect)
  // This is mobile-only code, so bypass only affects mobile app
  const bypassAuth = 
    SKIP_AUTH_MOBILE || // Hardcoded bypass (mobile only)
    isDevMode() || 
    process.env.EXPO_PUBLIC_BYPASS_AUTH === "true" ||
    process.env.EXPO_PUBLIC_DEV_MODE === "true";

  useEffect(() => {
    // If bypass is enabled, skip all navigation checks
    if (bypassAuth) {
      console.log("🔓 [NavigationHandler] Auth bypass enabled - skipping all auth checks");
      return; // Allow access to all pages
    }

    if (loading) return;

    const currentRoute = segments.join("/") || "(index)";

    // Explicit console log for every navigation (appears in Metro terminal)
    console.log(`📍 Navigation: ${currentRoute}`, {
      segments: segments.join("/"),
      hasUser: !!user,
    });

    mobileLogger.debug(`Navigation: ${currentRoute}`, {
      route: currentRoute,
      metadata: {
        segments: segments.join("/"),
        hasUser: !!user,
        loading,
      },
    });

    // Always allow access to auth pages for testing (both dev and production)
    const inAuthGroup = segments[0] === "auth";
    if (inAuthGroup) {
      mobileLogger.info("Allowing access to auth pages for testing");
      return; // Don't redirect, allow user to test auth pages
    }

    // Production: Require authentication for non-auth pages
    if (!user) {
      // Redirect to login if not authenticated and not on auth page
      mobileLogger.warn("Not authenticated, redirecting to login", {
        route: currentRoute,
      });
      router.replace("/auth/login");
    }
  }, [user, loading, segments, router, bypassAuth]);

  return null;
}

export default function RootLayout() {
  // QueryClient is created at module level, so it's always available
  // This ensures components can use useQuery immediately, even during initial render

  useEffect(() => {
    // Explicit console logs that ALWAYS appear in Metro terminal
    console.log("");
    console.log("========================================");
    console.log("🚀 MOBILE APP STARTED");
    console.log("========================================");
    console.log("📱 Expo Go - Console logs appear here!");
    console.log("📋 Check this terminal for all errors");
    console.log("========================================");
    console.log("");

    // Initialize Supabase lazily in useEffect
    try {
      const client = initializeSupabase();
      if (!client) {
        console.warn("⚠️ Supabase client is null!");
        console.warn("   This might cause authentication issues.");
        console.warn("   Check your environment variables:");
        console.warn("   - EXPO_PUBLIC_SUPABASE_URL");
        console.warn("   - EXPO_PUBLIC_SUPABASE_ANON_KEY");
        console.warn("   Create apps/mobile/.env.local with these variables");
      } else {
        console.log("✅ Supabase client ready");
      }
    } catch (error) {
      console.error("❌ Failed to initialize Supabase:", error);
      console.warn("   App will continue but authentication may not work");
    }

    // Check AR capability on app start
    checkARCapability()
      .then((isARCapable) => {
        console.log(`📷 AR Capability: ${isARCapable ? "✅ Supported" : "❌ Not Supported"}`);
        mobileLogger.info("AR capability checked", { isARCapable });
      })
      .catch((error) => {
        console.error("❌ Failed to check AR capability:", error);
        mobileLogger.error("Failed to check AR capability", { error });
      });

    // Configure native Google Sign-In for Android (one-tap)
    try {
      configureGoogleSignIn();
      console.log("✅ Google Sign-In configured for native one-tap");
    } catch (error) {
      console.warn("⚠️ Failed to configure Google Sign-In:", error);
      // Non-critical - browser OAuth will work as fallback
    }


    mobileLogger.info("Mobile app started");

    // Cleanup on app exit
    return () => {
      console.log("🛑 Mobile app shutting down");
      mobileLogger.info(
        "Mobile app shutting down, cleaning up RealtimeManager"
      );
      try {
        RealtimeManager.destroyAll();
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    };
  }, []);

  // Ensure QueryClient is available before rendering
  if (!queryClient) {
    console.error("❌ QueryClient not initialized - cannot render app");
    return null;
  }

  console.log("✅ QueryClientProvider rendering with client:", !!queryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationHandler />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* QueryClientProvider wraps Stack to ensure all screens have context */}
        {/* Root index route ("/") → handled by app/index.tsx */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
          listeners={{
            focus: () => mobileLogger.debug("Screen focused: (tabs)"),
          }}
        />
        <Stack.Screen
          name="auth"
          options={{ headerShown: false }}
          listeners={{
            focus: () => mobileLogger.debug("Screen focused: auth"),
          }}
        />
        <Stack.Screen
          name="(mobile-only)"
          options={{ headerShown: false }}
          listeners={{
            focus: () => mobileLogger.debug("Screen focused: (mobile-only)"),
          }}
        />
        <Stack.Screen
          name="auto-measure"
          options={{
            headerShown: true,
            title: "Auto-Measure",
            presentation: "modal",
          }}
          listeners={{
            focus: () => mobileLogger.debug("Screen focused: auto-measure"),
          }}
        />
        <Stack.Screen
          name="(modals)/ARMeasurementScreen"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
          }}
          listeners={{
            focus: () => mobileLogger.debug("Screen focused: ARMeasurementScreen"),
          }}
        />
        <Stack.Screen
          name="(modals)/ReferencePhotoScreen"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
          }}
          listeners={{
            focus: () => mobileLogger.debug("Screen focused: ReferencePhotoScreen"),
          }}
        />
        <Stack.Screen
          name="feed-detail"
          options={{
            headerShown: false,
            presentation: "card",
          }}
          listeners={{
            focus: () => mobileLogger.debug("Screen focused: feed-detail"),
          }}
        />
        <Stack.Screen
          name="messages/[matchId]"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="subscription"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="support"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
