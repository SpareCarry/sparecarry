"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription } from "../ui/card";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Loader2, CheckCircle2, CreditCard } from "lucide-react";

type StripeVerificationProfile = {
  stripe_identity_verified_at?: string | null;
};

interface OnboardingStep2Props {
  onComplete: () => void;
}

const identityEnabled =
  process.env.NEXT_PUBLIC_ENABLE_STRIPE_IDENTITY !== "false";

export function OnboardingStep2({ onComplete }: OnboardingStep2Props) {
  const [loading, setLoading] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const supabase = createClient() as SupabaseClient;

  useEffect(() => {
    checkVerificationStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("stripe_identity_verified_at")
        .eq("user_id", user.id)
        .single();

      const profile = (profileData ?? null) as StripeVerificationProfile | null;

      if (profile?.stripe_identity_verified_at) {
        setVerified(true);
      }
    } catch (err) {
      console.error("Error checking verification status:", err);
    }
  };

  const handleStartVerification = async () => {
    if (!identityEnabled) {
      setError("Identity verification is disabled. Please contact support.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not found");

      // Create Stripe Identity verification session
      const response = await fetch("/api/stripe/create-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create verification session");
      }

      const data = await response.json();
      if (data.alreadyVerified) {
        setSessionStatus("verified");
        setVerified(true);
        onComplete();
        return;
      }

      const url = data.verificationUrl;
      setSessionStatus(data.status ?? null);
      setVerificationUrl(url);

      // Open verification in new window
      window.open(url, "_blank", "width=600,height=800");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start verification";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not found");

      // Check verification status
      const response = await fetch("/api/stripe/check-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to check verification status");
      }

      const { verified: isVerified, status } = await response.json();
      setSessionStatus(status ?? null);
      if (isVerified) {
        setVerified(true);
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        setError(
          "Verification not yet complete. Please complete the verification process and try again."
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to check verification status";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 className="h-16 w-16 text-teal-600 mx-auto" />
        <h3 className="text-xl font-semibold text-slate-900">Identity Verified!</h3>
        <p className="text-slate-600">Your identity has been successfully verified.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-teal-50 border-teal-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <CreditCard className="h-8 w-8 text-teal-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Stripe Identity Verification</h3>
              <p className="text-sm text-slate-600 mb-2">
                We use Stripe Identity to verify your identity with a passport and selfie. This
                helps keep CarrySpace safe for everyone.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-teal-700">
                <span>Cost: $1.50</span>
                <span className="text-slate-400">•</span>
                <span>Test Mode</span>
              </div>
              {!identityEnabled && (
                <p className="text-sm text-amber-700 mt-3">
                  Identity verification is temporarily unavailable. Please email{" "}
                  <a
                    className="underline"
                    href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@sparecarry.com"}`}
                  >
                    support
                  </a>{" "}
                  so we can verify you manually.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-800 border border-red-200 text-sm">
          {error}
        </div>
      )}
      {sessionStatus && (
        <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-sm">
          Current status: <strong className="uppercase">{sessionStatus}</strong>
        </div>
      )}

      {!verificationUrl ? (
        <Button
          onClick={handleStartVerification}
          className="w-full bg-teal-600 hover:bg-teal-700"
          disabled={loading || !identityEnabled}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting Verification...
            </>
          ) : (
            identityEnabled
              ? "Start Identity Verification"
              : "Identity Verification Unavailable"
          )}
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Verification window opened.</strong> Please complete the verification process
              in the popup window, then click the button below to check your status.
            </p>
          </div>
          <Button
            onClick={handleCheckStatus}
            className="w-full bg-teal-600 hover:bg-teal-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Status...
              </>
            ) : (
              "I've Completed Verification"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

