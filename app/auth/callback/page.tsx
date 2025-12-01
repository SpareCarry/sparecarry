"use client";

import { useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAppScheme } from "@/lib/supabase/mobile";
import { getUserFriendlyErrorMessage } from "@/lib/utils/auth-errors";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const safePush = useCallback(
    (path: string) => {
      try {
        router.push(path);
      } catch (error) {
        console.error(
          "[AuthCallback] router.push failed, using window.location",
          error
        );
        if (typeof window !== "undefined") {
          window.location.href = path;
        }
        return;
      }
      if (typeof window !== "undefined") {
        window.location.href = path;
      }
    },
    [router]
  );

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Log current URL for debugging
        if (typeof window !== "undefined") {
          console.log("[AuthCallback] Current URL:", window.location.href);
          console.log("[AuthCallback] Origin:", window.location.origin);
          console.log("[AuthCallback] Full URL breakdown:");
          console.log("  - Protocol:", window.location.protocol);
          console.log("  - Host:", window.location.host);
          console.log("  - Hostname:", window.location.hostname);
          console.log("  - Port:", window.location.port);
          console.log("  - Pathname:", window.location.pathname);
          console.log("  - Search:", window.location.search);
          console.log("  - Hash:", window.location.hash);

          // Check if we're on localhost when we shouldn't be
          if (
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1"
          ) {
            console.error(
              "[AuthCallback] ❌ PROBLEM: Callback received on localhost!"
            );
            console.error(
              "[AuthCallback] This means Supabase redirected to localhost instead of your network IP."
            );
            console.error(
              "[AuthCallback] SOLUTION: Check Supabase Dashboard → Authentication → URL Configuration"
            );
            console.error(
              "[AuthCallback]   1. Site URL must be: http://192.168.1.238:3000 (NOT localhost)"
            );
            console.error(
              "[AuthCallback]   2. Redirect URLs must include: http://192.168.1.238:3000/auth/callback"
            );
            console.error(
              "[AuthCallback]   3. Save and wait 30 seconds for changes to propagate"
            );
          }
        }

        // Get the redirect path from query params
        const redirectTo = searchParams.get("redirect") || "/home";

        // Check for errors in both hash and query params
        // Safety check for window.location.hash (should always be available in client component)
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const hashParams = new URLSearchParams(hash.substring(1));
        const queryError = searchParams.get("error");
        const hashError = hashParams.get("error");
        const errorCode =
          hashParams.get("error_code") || searchParams.get("error_code");
        const errorDescription =
          hashParams.get("error_description") ||
          searchParams.get("error_description");

        if (queryError || hashError) {
          // Handle error - redirect to login with error message
          const error = queryError || hashError;
          const errorMessage = getUserFriendlyErrorMessage({
            code: errorCode,
            message: errorDescription || error || "Authentication failed",
          });
          safePush(
            `/auth/login?error=invalid_link&message=${encodeURIComponent(errorMessage)}&redirect=${encodeURIComponent(redirectTo)}`
          );
          return;
        }

        // Try to get code from hash first (PKCE flow)
        let code = hashParams.get("code");
        // If not in hash, check query params (some flows use query params)
        if (!code) {
          code = searchParams.get("code");
        }

        // Try to get access_token and refresh_token directly (implicit flow)
        const accessToken =
          hashParams.get("access_token") || searchParams.get("access_token");
        const refreshToken =
          hashParams.get("refresh_token") || searchParams.get("refresh_token");

        // If we have tokens directly, set the session
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("Error setting session:", sessionError);
            const friendlyMessage = getUserFriendlyErrorMessage(sessionError);
            safePush(
              `/auth/login?error=auth_failed&message=${encodeURIComponent(friendlyMessage)}&redirect=${encodeURIComponent(redirectTo)}`
            );
            return;
          }

          // Check if we should redirect to mobile app
          const appScheme = getAppScheme();
          if (appScheme) {
            // Mobile app detected - redirect to deep link
            const deepLinkUrl = `${appScheme}auth/callback?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}&redirect=${encodeURIComponent(redirectTo)}`;
            if (typeof window !== "undefined") {
              window.location.href = deepLinkUrl;
            }
            return;
          }

          // Success - redirect to the intended destination (web)
          safePush(redirectTo);
          return;
        }

        // If there's a code, exchange it for a session (PKCE flow)
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error("Error exchanging code for session:", exchangeError);
            const friendlyMessage = getUserFriendlyErrorMessage(exchangeError);
            safePush(
              `/auth/login?error=auth_failed&message=${encodeURIComponent(friendlyMessage)}&redirect=${encodeURIComponent(redirectTo)}`
            );
            return;
          }

          // Check if we should redirect to mobile app
          const appScheme = getAppScheme();
          if (appScheme) {
            // Get session tokens for deep link
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session) {
              const deepLinkUrl = `${appScheme}auth/callback?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}&redirect=${encodeURIComponent(redirectTo)}`;
              if (typeof window !== "undefined") {
                window.location.href = deepLinkUrl;
              }
              return;
            }
          }

          // Success - redirect to the intended destination (web)
          safePush(redirectTo);
          return;
        }

        // Check if user is already authenticated (session might have been set automatically)
        // Wait a bit for any automatic session processing to complete
        await new Promise((resolve) => setTimeout(resolve, 500));

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (user && !userError) {
          // Check if we should redirect to mobile app
          const appScheme = getAppScheme();
          if (appScheme) {
            // Get session tokens for deep link
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session) {
              const deepLinkUrl = `${appScheme}auth/callback?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}&redirect=${encodeURIComponent(redirectTo)}`;
              if (typeof window !== "undefined") {
                window.location.href = deepLinkUrl;
              }
              return;
            }
          }

          // User is authenticated, redirect (web)
          safePush(redirectTo);
        } else {
          // No code/tokens and not authenticated - redirect to login
          safePush(
            `/auth/login?error=no_code&message=${encodeURIComponent("No authentication code found. Please request a new magic link.")}&redirect=${encodeURIComponent(redirectTo)}`
          );
        }
      } catch (error: any) {
        console.error("Auth callback error:", error);
        const redirectTo = searchParams.get("redirect") || "/home";
        const friendlyMessage = getUserFriendlyErrorMessage(error);
        safePush(
          `/auth/login?error=auth_failed&message=${encodeURIComponent(friendlyMessage)}&redirect=${encodeURIComponent(redirectTo)}`
        );
      }
    };

    handleCallback();
  }, [router, searchParams, supabase, safePush]);

  // Show loading state while processing
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
