/**
 * useAuth - Universal auth hook for web and mobile
 * Provides auth state and methods across platforms
 */

import { useState, useEffect } from "react";
import { createClient } from "@sparecarry/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import { getAuthCallbackUrl } from "@root-lib/supabase/mobile";
import { getUserFriendlyErrorMessage } from "../../lib/utils/auth-errors";

// Check dev mode via environment variable.
// NOTE: For mobile we now require EXPO_PUBLIC_DEV_MODE=true explicitly to avoid
// accidentally skipping authentication.
function isDevModeEnabled(): boolean {
  if (typeof process === "undefined" || !process.env) return false;
  if (process.env.NODE_ENV === "production") return false;
  return (
    process.env.NEXT_PUBLIC_DEV_MODE === "true" ||
    process.env.EXPO_PUBLIC_DEV_MODE === "true"
  );
}

function getDevModeUser(): User {
  const now = new Date().toISOString();
  return {
    id: "dev-user-id",
    aud: "authenticated",
    role: "authenticated",
    email: "dev@sparecarry.com",
    email_confirmed_at: now,
    phone: "",
    app_metadata: {
      provider: "email",
      providers: ["email"],
    },
    user_metadata: {
      name: "Dev User",
    },
    created_at: now,
    updated_at: now,
    confirmed_at: now,
    last_sign_in_at: now,
    identities: [],
    factors: [],
    is_anonymous: false,
  };
}

function createDevSession(user: User): Session {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  return {
    user,
    access_token: "dev-token",
    refresh_token: "dev-refresh-token",
    expires_in: 3600,
    expires_at: expiresAt,
    token_type: "bearer",
  };
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  // Wrap createClient in try-catch to prevent crashes
  let supabase;
  try {
    supabase = createClient();
  } catch (error) {
    console.error("❌ [useAuth] Failed to create Supabase client:", error);
    // Return early with error state
    return {
      user: null,
      session: null,
      loading: false,
      error: error instanceof Error ? error : new Error(String(error)),
      signIn: async () => ({
        error: new Error("Supabase client not available"),
      }),
      signUp: async () => ({
        error: new Error("Supabase client not available"),
      }),
      signOut: async () => ({
        error: new Error("Supabase client not available"),
      }),
      signInWithOAuth: async () => ({
        error: new Error("Supabase client not available"),
      }),
      signInWithMagicLink: async () => ({
        error: new Error("Supabase client not available"),
      }),
      resetPassword: async () => ({
        error: new Error("Supabase client not available"),
      }),
    };
  }

  useEffect(() => {
    if (!supabase) {
      setState({
        user: null,
        session: null,
        loading: false,
        error: new Error("Supabase client not available"),
      });
      return;
    }

    // Dev mode: Return mock user immediately
    if (isDevModeEnabled()) {
      const devUser = getDevModeUser();
      const devSession = createDevSession(devUser);
      setState({
        user: devUser,
        session: devSession,
        loading: false,
        error: null,
      });
      return;
    }

    // Production: Get real session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: error ? new Error(error.message) : null,
        });
      })
      .catch((err) => {
        console.error("❌ [useAuth] getSession error:", err);
        setState({
          user: null,
          session: null,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      });

    // Listen for auth changes
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
        });
      });
      subscription = sub;
    } catch (err) {
      console.error("❌ [useAuth] onAuthStateChange error:", err);
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (err) {
          console.error("❌ [useAuth] unsubscribe error:", err);
        }
      }
    };
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    // Dev mode: Skip actual sign in
    if (isDevModeEnabled()) {
      const devUser = getDevModeUser();
      const devSession = createDevSession(devUser);
      setState({
        user: devUser,
        session: devSession,
        loading: false,
        error: null,
      });
      return { data: { user: devUser, session: null }, error: null };
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: new Error(error.message),
      }));
      return { error };
    }

    return { data, error: null };
  };

  const signInWithMagicLink = async (email: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Use the shared callback URL helper so mobile and web behave the same.
      const callbackUrl = getAuthCallbackUrl("/home");

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
          shouldCreateUser: true,
        },
      });

      if (error) {
        const friendlyMessage = getUserFriendlyErrorMessage(error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: new Error(friendlyMessage),
        }));
        return { error: { ...error, message: friendlyMessage } };
      }

      // Magic link flow continues in the browser/app after email click.
      setState((prev) => ({ ...prev, loading: false }));
      return { data, error: null };
    } catch (err: any) {
      const friendlyMessage = getUserFriendlyErrorMessage(err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: new Error(friendlyMessage),
      }));
      return { error: { ...err, message: friendlyMessage } };
    }
  };

  const signUp = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      const friendlyMessage = getUserFriendlyErrorMessage(error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: new Error(friendlyMessage),
      }));
      return { error: { ...error, message: friendlyMessage } };
    }

    return { data, error: null };
  };

  const signOut = async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const { error } = await supabase.auth.signOut();
    if (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: new Error(error.message),
      }));
      return { error };
    }
    setState({
      user: null,
      session: null,
      loading: false,
      error: null,
    });
    return { error: null };
  };

  const signInWithOAuth = async (provider: "google" | "apple" | "github") => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    // Get redirect URL based on platform (web/mobile), shared with web login.
    // This uses web URLs for magic links and deep links for native where needed.
    const redirectUrl = getAuthCallbackUrl("/home");

    // Log for debugging
    console.log("[useAuth] OAuth redirect URL:", redirectUrl);
    console.log(
      "[useAuth] EXPO_PUBLIC_APP_URL:",
      process.env.EXPO_PUBLIC_APP_URL
    );
    console.log(
      "[useAuth] NEXT_PUBLIC_APP_URL:",
      process.env.NEXT_PUBLIC_APP_URL
    );

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false, // Ensure browser redirect happens
      },
    });

    // Log the actual URL Supabase returned
    if (data?.url) {
      console.log("[useAuth] Supabase OAuth URL:", data.url);

      // Parse the redirect_to parameter from the OAuth URL
      try {
        const urlObj = new URL(data.url);
        const redirectToParam = urlObj.searchParams.get("redirect_to");
        console.log("[useAuth] Redirect_to in OAuth URL:", redirectToParam);
        console.log("[useAuth] Expected redirect_to:", redirectUrl);

        if (redirectToParam !== redirectUrl) {
          console.error(
            "[useAuth] ❌ MISMATCH: Supabase is not using our redirect URL!"
          );
          console.error("[useAuth] Expected:", redirectUrl);
          console.error("[useAuth] Got:", redirectToParam);
          console.error(
            "[useAuth] This means Supabase is ignoring your redirectTo parameter."
          );
          console.error(
            "[useAuth] SOLUTION: Add this URL to Supabase Dashboard:"
          );
          console.error(
            "[useAuth]   1. Go to: https://supabase.com/dashboard → Your Project → Authentication → URL Configuration"
          );
          console.error('[useAuth]   2. Add to "Redirect URLs":', redirectUrl);
          console.error(
            '[useAuth]   3. Set "Site URL" to:',
            redirectUrl.replace("/auth/callback?redirect=%2Fhome", "")
          );
          console.error("[useAuth]   4. Save and wait 10 seconds");
          console.error("[useAuth]   5. Restart your app");
        } else {
          console.log("[useAuth] ✅ Redirect URL matches!");
        }
      } catch (e) {
        console.warn("[useAuth] Could not parse OAuth URL:", e);
      }
    }

    if (error) {
      const friendlyMessage = getUserFriendlyErrorMessage(error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: new Error(friendlyMessage),
      }));
      return { error: { ...error, message: friendlyMessage } };
    }

    // On React Native / mobile, supabase-js may return a URL instead of navigating.
    // Try to open it manually via Linking if available.
    if (data?.url) {
      console.log("[useAuth] Opening OAuth URL:", data.url);

      // Verify the URL contains our callback URL
      const hasNetworkIp = data.url.includes("192.168.1.238");
      const hasProduction = data.url.includes("sparecarry.com");
      const hasLocalhost = data.url.includes("localhost:3000");

      if (hasLocalhost && !hasNetworkIp && !hasProduction) {
        console.error(
          "[useAuth] ❌ PROBLEM DETECTED: OAuth URL contains localhost instead of network IP!"
        );
        console.error("[useAuth] This will fail on mobile devices.");
        console.error("[useAuth] Expected callback:", redirectUrl);
        console.error("[useAuth] Actual OAuth URL:", data.url);
        console.error(
          "[useAuth] SOLUTION: Add this to Supabase Dashboard → Authentication → URL Configuration:"
        );
        console.error("[useAuth]   Redirect URL:", redirectUrl);
        console.error(
          "[useAuth]   Site URL:",
          redirectUrl.replace("/auth/callback?redirect=%2Fhome", "")
        );
      } else if (!hasNetworkIp && !hasProduction) {
        console.warn(
          "[useAuth] ⚠️ OAuth URL does not contain expected callback URL!"
        );
        console.warn("[useAuth] Expected callback:", redirectUrl);
        console.warn("[useAuth] Actual OAuth URL:", data.url);
      }

      try {
        // Try expo-linking first (for Expo apps), then fall back to react-native Linking
        let Linking: any;
        try {
          Linking = require("expo-linking");
        } catch {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          Linking = require("react-native").Linking;
        }

        if (Linking && typeof Linking.openURL === "function") {
          console.log("[useAuth] Opening URL with Linking...");
          await Linking.openURL(data.url);
          console.log("[useAuth] URL opened successfully");
        } else {
          console.error("[useAuth] Linking.openURL is not available");
        }
      } catch (e) {
        console.error("[useAuth] Failed to open OAuth URL", e);
        // If we can't open the URL, set an error
        setState((prev) => ({
          ...prev,
          loading: false,
          error: new Error(
            "Failed to open browser for OAuth. Please try again."
          ),
        }));
        return { error: new Error("Failed to open OAuth URL") };
      }
    } else {
      console.warn("[useAuth] No URL returned from Supabase OAuth");
    }

    // Reset loading; further navigation happens via browser/deep link.
    setState((prev) => ({ ...prev, loading: false }));
    return { data, error: null };
  };

  const resetPassword = async (email: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthCallbackUrl("/auth/reset-password/confirm"),
      });

      if (error) {
        const friendlyMessage = getUserFriendlyErrorMessage(error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: new Error(friendlyMessage),
        }));
        return { error: { ...error, message: friendlyMessage } };
      }

      setState((prev) => ({ ...prev, loading: false }));
      return { data: { message: "Password reset email sent" }, error: null };
    } catch (err: any) {
      const friendlyMessage = getUserFriendlyErrorMessage(err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: new Error(friendlyMessage),
      }));
      return { error: { ...err, message: friendlyMessage } };
    }
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    signInWithMagicLink,
    resetPassword,
  };
}
