"use client";

import { useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const safePush = useCallback(
    (path: string) => {
      try {
        router.push(path);
      } catch (error) {
        console.error("[AuthCallback] router.push failed, using window.location", error);
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
        // Get the redirect path from query params
        const redirectTo = searchParams.get("redirect") || "/home";

        // Check for errors in both hash and query params
        // Safety check for window.location.hash (should always be available in client component)
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const hashParams = new URLSearchParams(hash.substring(1));
        const queryError = searchParams.get("error");
        const hashError = hashParams.get("error");
        const errorCode = hashParams.get("error_code") || searchParams.get("error_code");
        const errorDescription = hashParams.get("error_description") || searchParams.get("error_description");

        if (queryError || hashError) {
          // Handle error - redirect to login with error message
          const error = queryError || hashError;
          const errorMessage = errorDescription || error || "Authentication failed";
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
        const accessToken = hashParams.get("access_token") || searchParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token") || searchParams.get("refresh_token");

        // If we have tokens directly, set the session
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("Error setting session:", sessionError);
            safePush(
              `/auth/login?error=auth_failed&message=${encodeURIComponent(sessionError.message)}&redirect=${encodeURIComponent(redirectTo)}`
            );
            return;
          }

          // Success - redirect to the intended destination
          safePush(redirectTo);
          return;
        }

        // If there's a code, exchange it for a session (PKCE flow)
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error("Error exchanging code for session:", exchangeError);
            safePush(
              `/auth/login?error=auth_failed&message=${encodeURIComponent(exchangeError.message)}&redirect=${encodeURIComponent(redirectTo)}`
            );
            return;
          }

          // Success - redirect to the intended destination
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
          // User is authenticated, redirect
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
        safePush(
          `/auth/login?error=auth_failed&message=${encodeURIComponent(error.message || "An unexpected error occurred")}&redirect=${encodeURIComponent(redirectTo)}`
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

