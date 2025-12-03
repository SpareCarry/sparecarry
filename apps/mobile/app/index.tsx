/**
 * Root index route - redirects to login or tabs based on auth state
 * This handles the initial "/" route
 * 
 * TEMPORARY: Set SKIP_AUTH_MOBILE to true to bypass login on MOBILE ONLY (for testing)
 * Web app will still require authentication
 */

import { Redirect } from "expo-router";

// TEMPORARY: Change this to true to skip authentication on mobile app only
// Web app at app/auth/login/page.tsx still requires authentication
const SKIP_AUTH_MOBILE = true;

export default function Index() {
  // Check if auth bypass is enabled (MOBILE ONLY)
  // Use both environment variable checks and hardcoded option
  // This file is mobile-only, so bypass only affects mobile app
  const bypassAuth = 
    SKIP_AUTH_MOBILE || // Hardcoded bypass (mobile only)
    process.env.EXPO_PUBLIC_DEV_MODE === "true" || 
    process.env.EXPO_PUBLIC_BYPASS_AUTH === "true";
  
  console.log("🔍 [Index] Auth bypass check (mobile only):", {
    SKIP_AUTH_MOBILE,
    EXPO_PUBLIC_DEV_MODE: process.env.EXPO_PUBLIC_DEV_MODE,
    EXPO_PUBLIC_BYPASS_AUTH: process.env.EXPO_PUBLIC_BYPASS_AUTH,
    bypassAuth,
  });
  
  if (bypassAuth) {
    // Skip login, go straight to app
    console.log("🔓 [Index] Auth bypass enabled - redirecting to tabs");
    return <Redirect href="/(tabs)" />;
  }
  
  // Normal flow: redirect to login
  console.log("🔒 [Index] Auth bypass disabled - redirecting to login");
  return <Redirect href="/auth/login" />;
}
