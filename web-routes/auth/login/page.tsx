"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { createClient } from "../../../lib/supabase/client";
import { getAuthCallbackUrl } from "../../../lib/supabase/mobile";
import { Mail, Loader2, Lock } from "lucide-react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMethod, setLoginMethod] = useState<"magic" | "password">("magic");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    // Load preference from localStorage if available
    if (typeof window !== "undefined") {
      return localStorage.getItem("rememberMe") === "true";
    }
    return false;
  });
  const supabase = createClient();

  // Get redirect URL from query params
  const redirectTo = searchParams.get("redirect") || "/home";
  const forceLogin = searchParams.get("forceLogin") === "true";

  // Check for auth errors in URL params immediately (synchronous, doesn't block render)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    const errorMessage = searchParams.get("message");
    if (errorParam) {
      if (errorParam === "auth_failed") {
        setMessage({
          type: "error",
          text: errorMessage 
            ? decodeURIComponent(errorMessage)
            : "Authentication failed. Please try again.",
        });
      } else if (errorParam === "no_code" || errorParam === "invalid_link") {
        setMessage({
          type: "error",
          text: errorMessage 
            ? decodeURIComponent(errorMessage)
            : "This magic link is invalid or expired. Please request a new one.",
        });
      }
    }
  }, [searchParams]);

  // Check if user is already authenticated (async, doesn't block render)
  useEffect(() => {
    // If forceLogin is true, skip the auth check and show login form
    if (forceLogin) {
      setAuthChecked(true);
      return;
    }

    let cancelled = false;

    const checkAuth = async () => {
      try {
        // Add timeout to prevent hanging if Supabase is unreachable
        const getUserPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 3000)
        );

        const {
          data: { user },
          error,
        } = await Promise.race([getUserPromise, timeoutPromise]) as any;

        if (cancelled) return;

        // Only redirect if user is authenticated and forceLogin is not set
        if (user && !error && !forceLogin) {
          // User is already logged in, redirect them
          router.push(redirectTo);
          return;
        }

        setAuthChecked(true);
      } catch (error) {
        if (cancelled) return;
        
        // If getUser() fails or times out, just continue - user can still login
        console.warn("Auth check failed or timed out:", error);
        setAuthChecked(true);
      }
    };

    // Don't block render - check auth in background
    checkAuth();
    
    return () => {
      cancelled = true;
    };
  }, [router, redirectTo, supabase, forceLogin]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Store remember me preference
      if (typeof window !== "undefined") {
        localStorage.setItem("rememberMe", rememberMe ? "true" : "false");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Wait for session to be established
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Session not established after login");
      }

      // Sync session to cookies by sending tokens to server
      // This ensures server-side API routes can read the session
      try {
        const syncResponse = await fetch("/api/auth/sync-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies
          body: JSON.stringify({
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
          }),
        });
        
        if (!syncResponse.ok) {
          console.warn("[Login] Session sync failed, but continuing with redirect");
        } else {
          console.log("[Login] Session synced to cookies successfully");
        }
      } catch (syncError) {
        console.error("[Login] Error syncing session:", syncError);
        // Continue anyway - the middleware will handle it on next request
      }

      // Force a full page reload to ensure middleware can establish session cookies
      // This is critical for server-side API routes to read the session
      window.location.href = redirectTo;
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Invalid email or password",
      });
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Get the appropriate callback URL (always web URL for magic links)
      // Magic links must use web URLs because email links open in browsers first
      const callbackUrl = getAuthCallbackUrl(redirectTo);
      console.log("Sending magic link to:", email);
      console.log("Callback URL:", callbackUrl);
      console.log("Platform:", typeof window !== "undefined" && (window as any).Capacitor ? "mobile" : "web");
      
      // Verify callback URL is a web URL (not a deep link)
      if (!callbackUrl.startsWith("http://") && !callbackUrl.startsWith("https://")) {
        throw new Error("Invalid callback URL. Magic links must use web URLs.");
      }
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
          shouldCreateUser: true, // Create user if doesn't exist
        },
      });

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Check your email for the magic link!",
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to send magic link",
      });
    } finally {
      setLoading(false);
    }
  };

  // TODO: Add Apple Sign-In support in the future (requires $99/year Apple Developer Account)
  // See docs/OAUTH_SETUP.md for setup instructions
  const handleOAuth = async (provider: "google") => {
    setLoading(true);
    setMessage(null);
    try {
      // Get the appropriate callback URL (mobile deep link or web URL)
      const callbackUrl = getAuthCallbackUrl(redirectTo);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (error) throw error;
      // If successful, OAuth will redirect - loading state will reset on redirect
      // But we still reset it here in case redirect doesn't happen immediately
      // The finally block ensures it's always reset
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || `Failed to sign in with ${provider}`,
      });
    } finally {
      // Always reset loading state, even if OAuth redirects (for edge cases)
      // Note: If redirect happens, this component will unmount, so this is safe
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-200 via-teal-300 to-slate-900 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-slate-900">Welcome to CarrySpace</CardTitle>
          <CardDescription>Sign in to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Login Method Toggle */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setLoginMethod("password");
                setMessage(null);
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMethod === "password"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod("magic");
                setMessage(null);
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMethod === "magic"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Magic Link
            </button>
          </div>

          {loginMethod === "password" ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 focus:ring-2"
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm font-normal text-slate-600 cursor-pointer"
                >
                  Remember me
                </Label>
              </div>

              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                <p>
                  <strong>Signed up with magic link?</strong> Use magic link or Google OAuth to log in. 
                  Password login is only available if you created a password during signup.
                </p>
              </div>

              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Magic Link
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* TODO: Add Apple Sign-In button here in the future (requires $99/year Apple Developer Account) */}
          {/* See docs/OAUTH_SETUP.md for setup instructions */}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuth("google")}
            disabled={loading}
            className="w-full"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>

          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.type === "success"
                  ? "bg-teal-50 text-teal-800 border border-teal-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <p className="text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup?forceSignup=true" className="text-teal-600 hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-200 via-teal-300 to-slate-900 px-4 py-12">
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

