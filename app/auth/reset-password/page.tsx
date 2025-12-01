"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { createClient } from "../../../lib/supabase/client";
import { getUserFriendlyErrorMessage } from "../../../lib/utils/auth-errors";
import { Mail, Loader2, ArrowLeft } from "lucide-react";

function ResetPasswordPageContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const supabase = createClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
      });

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Check your email for a password reset link. Click the link to reset your password. The link will expire in 1 hour.",
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: getUserFriendlyErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-200 via-teal-300 to-slate-900 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-slate-900">
            Reset Password
          </CardTitle>
          <CardDescription>
            Enter your email address and we&apos;ll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setMessage(null);
                }}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Reset Link
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
              {message.type === "success" ? (
                <div>
                  <p className="font-medium mb-2">{message.text}</p>
                  <ul className="list-disc list-inside space-y-1 text-teal-700">
                    <li>Check your spam folder if you don&apos;t see it</li>
                    <li>The link expires in 1 hour</li>
                    <li>You can only use the link once</li>
                  </ul>
                </div>
              ) : (
                message.text
              )}
            </div>
          )}

          <div className="space-y-2">
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 text-sm text-teal-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
            <p className="text-center text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup?forceSignup=true"
                className="text-teal-600 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordPageContent />
    </Suspense>
  );
}

