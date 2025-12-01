"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { createClient } from "../../../../lib/supabase/client";
import { getUserFriendlyErrorMessage } from "../../../../lib/utils/auth-errors";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";

function ResetPasswordConfirmPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMatchError, setPasswordMatchError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  // Real-time password match validation
  useEffect(() => {
    if (confirmPassword && password && confirmPassword !== password) {
      setPasswordMatchError("Passwords don't match");
    } else {
      setPasswordMatchError(null);
    }
  }, [password, confirmPassword]);

  // Check if we have a valid reset token in the URL
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const hashParams = new URLSearchParams(hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");

    // If we have a token and it's a recovery type, set the session
    if (accessToken && type === "recovery") {
      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: hashParams.get("refresh_token") || "",
        })
        .then(({ error }) => {
          if (error) {
            setMessage({
              type: "error",
              text: getUserFriendlyErrorMessage(error),
            });
          }
        });
    } else if (!accessToken && !searchParams.get("code")) {
      // No token or code found - redirect to reset request page
      setMessage({
        type: "error",
        text: "Invalid or expired reset link. Please request a new password reset.",
      });
    }
  }, [searchParams, supabase]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setPasswordMatchError(null);

    if (password !== confirmPassword) {
      setPasswordMatchError("Passwords don't match");
      setMessage({
        type: "error",
        text: "Passwords don't match. Please check and try again.",
      });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      setMessage({
        type: "success",
        text: "Password reset successfully! Redirecting to sign in...",
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/login?message=Password reset successfully. Please sign in with your new password.");
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: getUserFriendlyErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-200 via-teal-300 to-slate-900 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <h2 className="text-2xl font-bold text-slate-900">Password Reset Successful!</h2>
            <p className="text-center text-slate-600">
              Your password has been reset. Redirecting to sign in...
            </p>
            <Link href="/auth/login">
              <Button className="w-full bg-teal-600 hover:bg-teal-700">
                Go to Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-200 via-teal-300 to-slate-900 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-slate-900">
            Set New Password
          </CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter new password (min. 6 characters)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setMessage(null);
                    setPasswordMatchError(null);
                  }}
                  required
                  disabled={loading}
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500">Minimum 6 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setMessage(null);
                  }}
                  required
                  disabled={loading}
                  minLength={6}
                  className={`pr-10 ${passwordMatchError ? "border-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordMatchError && (
                <p className="text-xs text-red-600">{passwordMatchError}</p>
              )}
              {confirmPassword && !passwordMatchError && password === confirmPassword && (
                <p className="text-xs text-green-600">✓ Passwords match</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={loading || !!passwordMatchError}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Reset Password
                </>
              )}
            </Button>
          </form>

          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                message.type === "success"
                  ? "border border-teal-200 bg-teal-50 text-teal-800"
                  : "border border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          <p className="text-center text-sm text-slate-600">
            Remember your password?{" "}
            <Link href="/auth/login" className="text-teal-600 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-200 via-teal-300 to-slate-900 px-4 py-12">
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <ResetPasswordConfirmPageContent />
    </Suspense>
  );
}

