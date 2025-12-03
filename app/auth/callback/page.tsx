"use client";

import { useEffect, Suspense, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAppScheme } from "@/lib/supabase/mobile";
import { getUserFriendlyErrorMessage } from "@/lib/utils/auth-errors";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [debugInfo, setDebugInfo] = useState<string>("Initializing...");
  const [mounted, setMounted] = useState(false);
  
  const safePush = useCallback(
    (path: string) => {
      console.log("[AuthCallback] Redirecting to:", path);
      // Always use window.location for reliable navigation
      if (typeof window !== "undefined") {
        window.location.href = path;
      } else {
        // Fallback to router if window not available
        try {
          router.push(path);
        } catch (error) {
          console.error("[AuthCallback] router.push failed:", error);
        }
      }
    },
    [router]
  );
  
  // Force client-side only rendering
  useEffect(() => {
    setMounted(true);
    setDebugInfo("Client mounted, processing...");
    console.log("[AuthCallback] Component mounted on client");
  }, []);
  
  // Process callback - MUST be called before any conditional returns (Rules of Hooks)
  useEffect(() => {
    // Only run after component is mounted on client
    if (!mounted || typeof window === "undefined") {
      console.log("[AuthCallback] Not ready yet - mounted:", mounted);
      return;
    }
    
    // Log that useEffect is running immediately
    console.log("[AuthCallback] ====== useEffect triggered (CLIENT) ======");
    console.log("[AuthCallback] Component mounted, starting callback processing");
    console.log("[AuthCallback] window available:", typeof window !== "undefined");
    console.log("[AuthCallback] Current URL:", window.location.href);
    
    setDebugInfo("Processing callback...");
    
    const handleCallback = async () => {
      try {
        setDebugInfo("Processing OAuth callback...");
        console.log("========================================");
        console.log("[AuthCallback] Processing OAuth callback");
        console.log("========================================");
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

        // Note: localhost is fine for local development
        // The OAuth callback URL can be localhost as long as it matches what's configured

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

        // Check for magic link token (type=magiclink)
        const type = hashParams.get("type") || searchParams.get("type");
        const token = hashParams.get("token") || searchParams.get("token");
        const tokenHash = hashParams.get("token_hash") || searchParams.get("token_hash");
        
        console.log("[AuthCallback] Checking for auth tokens/code...");
        console.log("  - Code in hash:", hashParams.get("code"));
        console.log("  - Code in query:", searchParams.get("code"));
        console.log("  - Type:", type);
        console.log("  - Token:", !!token);
        console.log("  - Token hash:", !!tokenHash);
        console.log("  - Access token in hash:", !!hashParams.get("access_token"));
        console.log("  - Access token in query:", !!searchParams.get("access_token"));
        console.log("  - Refresh token in hash:", !!hashParams.get("refresh_token"));
        console.log("  - Refresh token in query:", !!searchParams.get("refresh_token"));

        // Try to get access_token and refresh_token directly (implicit flow)
        const accessToken =
          hashParams.get("access_token") || searchParams.get("access_token");
        const refreshToken =
          hashParams.get("refresh_token") || searchParams.get("refresh_token");

        // If we have tokens directly, set the session
        if (accessToken && refreshToken) {
          setDebugInfo("Setting session with tokens...");
          console.log("[AuthCallback] Found tokens, setting session...");
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("[AuthCallback] Error setting session:", {
              code: sessionError.status,
              message: sessionError.message,
              name: sessionError.name,
              stack: sessionError.stack,
              timestamp: new Date().toISOString(),
            });
            const friendlyMessage = getUserFriendlyErrorMessage(sessionError);
            safePush(
              `/auth/login?error=auth_failed&message=${encodeURIComponent(friendlyMessage)}&redirect=${encodeURIComponent(redirectTo)}`
            );
            return;
          }

          // Check if we should redirect to mobile app
          // Try to detect if this is from a mobile OAuth flow
          const appScheme = getAppScheme();
          const isMobileDevice = typeof window !== "undefined" && 
            /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          if (appScheme || (isMobileDevice && typeof window !== "undefined")) {
            // Mobile app detected - redirect to deep link
            const scheme = appScheme || "sparecarry://";
            const deepLinkUrl = `${scheme}auth/callback?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}&redirect=${encodeURIComponent(redirectTo)}`;
            if (typeof window !== "undefined") {
              // Try deep link first, fallback to web if app not installed
              window.location.href = deepLinkUrl;
              // Fallback: if deep link doesn't work, redirect to web after timeout
              setTimeout(() => {
                if (document.visibilityState === 'visible') {
                  // Deep link didn't work, user is still on page - redirect to web
                  safePush(redirectTo);
                }
              }, 2000);
            }
            return;
          }

          // Success - redirect to the intended destination (web)
          safePush(redirectTo);
          return;
        }

        // If there's a code, wait for Supabase's automatic exchange first
        // Supabase automatically exchanges codes in _initialize, so we wait a bit
        if (code) {
          setDebugInfo("Waiting for automatic code exchange...");
          console.log("[AuthCallback] Found code, waiting for Supabase automatic exchange...");
          
          // DEBUG: Check localStorage for code_verifier
          if (typeof window !== "undefined" && window.localStorage) {
            console.log("[AuthCallback] DEBUG: Checking localStorage for code_verifier...");
            const allKeys = Object.keys(localStorage);
            console.log("[AuthCallback] DEBUG: All localStorage keys:", allKeys);
            const supabaseKeys = allKeys.filter(k => 
              k.includes("supabase") || 
              k.includes("auth") || 
              k.includes("pkce") || 
              k.includes("code") ||
              k.includes("verifier")
            );
            console.log("[AuthCallback] DEBUG: Supabase/auth-related keys:", supabaseKeys);
            supabaseKeys.forEach(key => {
              console.log(`[AuthCallback] DEBUG: ${key}:`, localStorage.getItem(key)?.substring(0, 50) + "...");
            });
          }
          
          // Wait for Supabase's automatic code exchange to complete
          // The client automatically processes codes in _initialize
          await new Promise((resolve) => setTimeout(resolve, 1000));
          
          // Check if session was automatically set
          const {
            data: { session: autoSession },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (autoSession) {
            console.log("[AuthCallback] ✅ Session automatically set by Supabase");
            // Check if we should redirect to mobile app
            const appScheme = getAppScheme();
            if (appScheme) {
              const deepLinkUrl = `${appScheme}auth/callback?access_token=${encodeURIComponent(autoSession.access_token)}&refresh_token=${encodeURIComponent(autoSession.refresh_token)}&redirect=${encodeURIComponent(redirectTo)}`;
              if (typeof window !== "undefined") {
                window.location.href = deepLinkUrl;
              }
              return;
            }
            // Success - redirect to the intended destination (web)
            safePush(redirectTo);
            return;
          }

          // If automatic exchange didn't work, try manual exchange
          // But only if there's no session error suggesting the code_verifier is missing
          if (sessionError && sessionError.message.includes("code verifier")) {
            console.error("[AuthCallback] ❌ Code verifier not found in localStorage");
            console.error("[AuthCallback] This usually means:");
            console.error("  1. OAuth was initiated from a different origin");
            console.error("  2. localStorage was cleared between OAuth start and callback");
            console.error("  3. The callback is on a different domain/subdomain");
            const friendlyMessage = "Authentication session expired. Please try signing in again.";
            safePush(
              `/auth/login?error=auth_failed&message=${encodeURIComponent(friendlyMessage)}&redirect=${encodeURIComponent(redirectTo)}`
            );
            return;
          }

          // Try manual exchange as fallback
          setDebugInfo("Attempting manual code exchange...");
          console.log("[AuthCallback] Automatic exchange didn't work, trying manual exchange...");
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error("[AuthCallback] Error exchanging code for session:", {
              code: exchangeError.status,
              message: exchangeError.message,
              name: exchangeError.name,
              stack: exchangeError.stack,
              timestamp: new Date().toISOString(),
            });
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

        // Handle magic link tokens (type=magiclink)
        if ((type === "magiclink" || type === "signup") && (token || tokenHash)) {
          setDebugInfo("Processing magic link token...");
          console.log("[AuthCallback] Magic link detected, waiting for Supabase to process token...");
          
          // Supabase automatically processes magic link tokens
          // Wait for session to be established
          await new Promise((resolve) => setTimeout(resolve, 1500));
          
          // Check if session was created
          const {
            data: { session: magicSession },
            error: magicError,
          } = await supabase.auth.getSession();
          
          if (magicSession) {
            console.log("[AuthCallback] ✅ Magic link session established");
            
            // Check if we should redirect to mobile app
            const appScheme = getAppScheme();
            const isMobileDevice = typeof window !== "undefined" && 
              /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (appScheme || isMobileDevice) {
              const scheme = appScheme || "sparecarry://";
              const deepLinkUrl = `${scheme}auth/callback?access_token=${encodeURIComponent(magicSession.access_token)}&refresh_token=${encodeURIComponent(magicSession.refresh_token)}&redirect=${encodeURIComponent(redirectTo)}`;
              console.log("[AuthCallback] Redirecting to mobile app with magic link session");
              if (typeof window !== "undefined") {
                window.location.href = deepLinkUrl;
                setTimeout(() => {
                  if (document.visibilityState === 'visible') {
                    safePush(redirectTo);
                  }
                }, 2000);
              }
              return;
            }
            
            // Success - redirect to intended destination (web)
            safePush(redirectTo);
            return;
          } else if (magicError) {
            console.error("[AuthCallback] Magic link processing error:", magicError);
            const friendlyMessage = getUserFriendlyErrorMessage(magicError);
            safePush(
              `/auth/login?error=auth_failed&message=${encodeURIComponent(friendlyMessage)}&redirect=${encodeURIComponent(redirectTo)}`
            );
            return;
          }
        }
        
        // If no tokens or code found, log warning
        if (!code && !accessToken && !refreshToken && !token && !tokenHash) {
          console.warn("[AuthCallback] ⚠️ No auth code or tokens found in URL");
          console.warn("[AuthCallback] Hash params:", Object.fromEntries(hashParams));
          console.warn("[AuthCallback] Query params:", Object.fromEntries(searchParams));
          console.warn("[AuthCallback] This might mean:");
          console.warn("  1. OAuth flow didn't complete properly");
          console.warn("  2. Supabase redirect URL is incorrect");
          console.warn("  3. Tokens are in a different format");
          console.warn("  4. Magic link token not detected");
        }

        // Check if user is already authenticated (session might have been set automatically)
        // Wait a bit for any automatic session processing to complete
        console.log("[AuthCallback] Checking if session already exists...");
        await new Promise((resolve) => setTimeout(resolve, 500));

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        
        console.log("[AuthCallback] User check result:", {
          hasUser: !!user,
          hasError: !!userError,
          error: userError?.message,
        });

        if (user && !userError) {
          // Check if this is a new user (from OAuth/magic link signup)
          // Try to save terms acceptance if not already saved
          // This handles the case where user accepted terms before OAuth/magic link redirect
          try {
            const { data: userData, error: userFetchError } = await supabase
              .from("users")
              .select("terms_accepted_at")
              .eq("id", user.id)
              .single();

            // If user doesn't have terms accepted yet, check if we should save it
            // For new signups via OAuth/magic link, we assume terms were accepted on signup page
            if (!userFetchError && userData && !(userData as { terms_accepted_at?: string | null })?.terms_accepted_at) {
              // Check if this looks like a new user (recently created)
              const userCreatedAt = new Date(user.created_at || user.user_metadata?.created_at);
              const isNewUser = Date.now() - userCreatedAt.getTime() < 5 * 60 * 1000; // Created in last 5 minutes

              if (isNewUser) {
                // Save terms acceptance for new user
                const termsVersion = new Date().toISOString().split("T")[0];
                const { error: updateError } = await (supabase
                  .from("users") as any)
                  .update({
                    terms_accepted_at: new Date().toISOString(),
                    terms_version: termsVersion,
                  })
                  .eq("id", user.id);

                if (updateError) {
                  console.warn("[AuthCallback] Failed to save terms acceptance:", updateError);
                } else {
                  console.log("[AuthCallback] Terms acceptance saved for new user");
                }
              }
            }
          } catch (termsError) {
            console.warn("[AuthCallback] Error checking/saving terms acceptance:", termsError);
            // Don't block authentication if terms saving fails
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

          // User is authenticated, redirect (web)
          safePush(redirectTo);
        } else {
          // No code/tokens and not authenticated - redirect to login
          safePush(
            `/auth/login?error=no_code&message=${encodeURIComponent("No authentication code found. Please request a new magic link.")}&redirect=${encodeURIComponent(redirectTo)}`
          );
        }
      } catch (error: any) {
        const errorDetails = {
          message: error?.message || String(error),
          code: error?.code || error?.status,
          name: error?.name,
          stack: error?.stack,
          url: typeof window !== "undefined" ? window.location.href : undefined,
          timestamp: new Date().toISOString(),
        };
        console.error("========================================");
        console.error("[AuthCallback] ❌ ERROR occurred!");
        console.error("========================================");
        console.error("[AuthCallback] Error details:", errorDetails);
        console.error("[AuthCallback] Full error object:", error);
        
        // Also show error in alert for debugging
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          alert(`Auth Callback Error: ${error?.message || String(error)}\n\nCheck console for details.`);
        }
        
        const redirectTo = searchParams.get("redirect") || "/home";
        const friendlyMessage = getUserFriendlyErrorMessage(error);
        safePush(
          `/auth/login?error=auth_failed&message=${encodeURIComponent(friendlyMessage)}&redirect=${encodeURIComponent(redirectTo)}`
        );
      }
    };

    // Add a timeout to detect if callback is stuck
    const timeout = setTimeout(() => {
      setDebugInfo("Still processing... (taking longer than expected)");
      console.warn("[AuthCallback] ⚠️ Callback processing taking too long (>10s)");
      console.warn("[AuthCallback] This might indicate the callback is stuck");
      console.warn("[AuthCallback] Current URL:", typeof window !== "undefined" ? window.location.href : "N/A");
    }, 10000);

    // Actually call handleCallback
    console.log("[AuthCallback] Starting handleCallback...");
    handleCallback().catch((error) => {
      console.error("[AuthCallback] Unhandled error in handleCallback:", error);
      setDebugInfo(`Error: ${error?.message || String(error)}`);
    }).finally(() => {
      clearTimeout(timeout);
      console.log("[AuthCallback] handleCallback completed");
    });
  }, [router, searchParams, supabase, safePush, mounted]);

  // Show loading state while processing
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="text-gray-700 font-medium mb-2">Completing authentication...</p>
        <p className="text-sm text-gray-500 mb-4">{debugInfo}</p>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-left text-xs text-blue-800">
          <p className="font-semibold mb-1">Debug Info:</p>
          <p>Status: {debugInfo}</p>
          <p className="mt-1">If stuck, open browser console (F12) and look for [AuthCallback] logs</p>
          <p className="mt-2 break-all">URL: {typeof window !== "undefined" ? window.location.href : "Loading..."}</p>
          <p className="mt-2">Hash: {typeof window !== "undefined" ? window.location.hash || "(empty)" : "Loading..."}</p>
          <p className="mt-1">Search: {typeof window !== "undefined" ? window.location.search || "(empty)" : "Loading..."}</p>
          <p className="mt-1 text-xs">Code from URL: {searchParams.get("code") || "(not found)"}</p>
          <p className="mt-1 text-xs">Is Client: {typeof window !== "undefined" ? "Yes" : "No"}</p>
          <p className="mt-1 text-xs">Component rendered at: {typeof window !== "undefined" ? new Date().toISOString() : "Server-side"}</p>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <>
      {/* Inline script to process OAuth callback immediately, before React loads */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (typeof window === 'undefined') return;
              
              // Check if we're on HTTPS when we shouldn't be (protocol mismatch)
              if (window.location.protocol === 'https:' && window.location.hostname === '192.168.1.238') {
                console.error('[AuthCallback] ⚠️ Protocol mismatch detected!');
                console.error('[AuthCallback] Page loaded over HTTPS but server is HTTP only.');
                console.error('[AuthCallback] Solution: Clear browser HSTS cache or use localhost instead of IP.');
              }
              
              try {
                const urlParams = new URLSearchParams(window.location.search);
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const code = urlParams.get('code') || hashParams.get('code');
                const redirectTo = urlParams.get('redirect') || '/home';
                const error = urlParams.get('error') || hashParams.get('error');
                
                if (error) {
                  console.error('[AuthCallback] OAuth error detected:', error);
                  window.location.href = '/auth/login?error=auth_failed&message=' + encodeURIComponent(error) + '&redirect=' + encodeURIComponent(redirectTo);
                  return;
                }
                
                if (code) {
                  console.log('[AuthCallback] ✅ Code detected:', code);
                  console.log('[AuthCallback] Waiting for React component to process...');
                  console.log('[AuthCallback] If React fails to load, check browser console for HTTPS/HTTP errors.');
                } else {
                  console.warn('[AuthCallback] ⚠️ No code found in URL');
                }
              } catch (e) {
                console.error('[AuthCallback] Inline script error:', e);
              }
            })();
          `,
        }}
      />
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
    </>
  );
}
