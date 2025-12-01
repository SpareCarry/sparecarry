// Add aggressive logging at module level (using console.log for debug info)
import "../lib/debug-mode"; // Initialize debug mode first

console.log("");
console.log("========================================");
console.log("📱 APP MODULE LOADING");
console.log("========================================");
console.log("");

import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { checkARCapability } from "../lib/utils/arChecker";

// Wrap all imports in try-catch to catch module-level errors
let createClient: any;
let RealtimeManager: any;
let isDevMode: any;
let useAuth: any;
let mobileLogger: any;

try {
  console.log("[MODULE] Importing createClient...");
  createClient = require("@sparecarry/lib/supabase").createClient;
  console.log("[MODULE] ✅ createClient imported");
} catch (e) {
  console.error("[MODULE] ❌ Failed to import createClient:", e);
  throw e;
}

try {
  console.log("[MODULE] Importing RealtimeManager...");
  RealtimeManager = require("@sparecarry/lib/realtime").RealtimeManager;
  console.log("[MODULE] ✅ RealtimeManager imported");
} catch (e) {
  console.error("[MODULE] ❌ Failed to import RealtimeManager:", e);
  throw e;
}

try {
  console.log("[MODULE] Importing isDevMode...");
  isDevMode = require("../config/devMode").isDevMode;
  console.log("[MODULE] ✅ isDevMode imported");
} catch (e) {
  console.warn("[MODULE] ⚠️ Failed to import isDevMode:", e);
  // Don't throw - isDevMode is optional
  isDevMode = () => false;
}

try {
  console.log("[MODULE] Importing useAuth...");
  useAuth = require("@sparecarry/hooks/useAuth").useAuth;
  console.log("[MODULE] ✅ useAuth imported");
} catch (e) {
  console.error("[MODULE] ❌ Failed to import useAuth:", e);
  throw e;
}

try {
  console.log("[MODULE] Importing mobileLogger...");
  mobileLogger = require("../lib/logger").mobileLogger;
  console.log("[MODULE] ✅ mobileLogger imported");
} catch (e) {
  console.warn("[MODULE] ⚠️ Failed to import mobileLogger:", e);
  // Don't throw - logger is optional, create a fallback
  mobileLogger = {
    error: (msg: string, opts?: any) => console.error("[LOGGER]", msg, opts),
    warn: (msg: string, opts?: any) => console.warn("[LOGGER]", msg, opts),
    info: (msg: string, opts?: any) => console.log("[LOGGER]", msg, opts),
    debug: (msg: string, opts?: any) => console.log("[LOGGER]", msg, opts),
  };
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function NavigationHandler() {
  // useAuth must be called at top level - it handles errors internally
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
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

    // Dev mode: Skip authentication
    if (isDevMode()) {
      const inAuthGroup = segments[0] === "auth";
      if (inAuthGroup) {
        mobileLogger.info("Dev mode: Redirecting from auth to tabs");
        router.replace("/(tabs)");
      }
      return;
    }

    // Production: Require authentication
    const inAuthGroup = segments[0] === "auth";
    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      mobileLogger.warn("Not authenticated, redirecting to login", {
        route: currentRoute,
      });
      router.replace("/auth/login");
    } else if (user && inAuthGroup) {
      // Redirect to home if authenticated and on auth screen
      mobileLogger.info("Authenticated, redirecting to tabs", {
        route: currentRoute,
      });
      router.replace("/(tabs)");
    }
  }, [user, loading, segments, router]);

  return null;
}

export default function RootLayout() {
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

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationHandler />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
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
