"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { createClient } from "../../lib/supabase/client";
import { Loader2 } from "lucide-react";

interface OnboardingStep1Props {
  onComplete: () => void;
}

const phoneAuthEnabled =
  process.env.NEXT_PUBLIC_ENABLE_PHONE_AUTH !== "false";
const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@sparecarry.com";

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export function OnboardingStep1({ onComplete }: OnboardingStep1Props) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneAuthEnabled) {
      setError(
        "Phone verification is temporarily disabled. Please contact support if you need access."
      );
      return;
    }

    const normalizedPhone = phone.startsWith("+")
      ? phone
      : `+${phone.replace(/\D/g, "")}`;

    if (!E164_REGEX.test(normalizedPhone)) {
      setError(
        "Please enter a valid phone number in international format (e.g., +15551234567)."
      );
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      // Using Supabase's built-in phone verification
      // Note: You'll need to configure this in Supabase Dashboard
      const { error: verifyError } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: {
          channel: "sms",
        },
      });

      if (verifyError) throw verifyError;

      setPhone(normalizedPhone);
      setStep("verify");
      setStatusMessage(
        "Verification code sent! It may take up to a minute to arrive."
      );
      setCooldown(60);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send verification code";

      if (message.toLowerCase().includes("sms is not enabled")) {
        setError(
          "SMS delivery is not enabled on this project. Please contact support so we can enable phone verification."
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatusMessage(null);

    if (!phoneAuthEnabled) {
      setError("Phone verification is disabled.");
      setLoading(false);
      return;
    }

    try {
    const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not found");

      // Verify the code and update profile
      const normalizedPhone =
        phone.startsWith("+") || phone === ""
          ? phone
          : `+${phone.replace(/\D/g, "")}`;

      if (!normalizedPhone) {
        throw new Error("Missing phone number. Please restart verification.");
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: code,
        type: "sms",
      });

      if (verifyError) throw verifyError;

      // Update profile with phone number
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ phone: normalizedPhone })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setStatusMessage("Phone number verified successfully!");
      onComplete();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid verification code";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (step === "phone") {
    return (
    <form onSubmit={handleSendCode} className="space-y-4">
        <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          disabled={loading || !phoneAuthEnabled}
            className="bg-white"
          />
          <p className="text-sm text-slate-500">
          Enter your number in international format. Standard carrier rates apply.
          </p>
        {!phoneAuthEnabled && (
          <p className="text-sm text-amber-600">
            Phone verification is currently disabled. Please email{" "}
            <a className="underline" href={`mailto:${supportEmail}`}>
              {supportEmail}
            </a>{" "}
            if you need access.
          </p>
        )}
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 text-red-800 border border-red-200 text-sm">
            {error}
          </div>
        )}
      {statusMessage && !error && (
        <div className="p-3 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-sm">
          {statusMessage}
        </div>
      )}

        <Button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700"
        disabled={loading || !phoneAuthEnabled || cooldown > 0}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
          <>
            Send Verification Code
            {cooldown > 0 && (
              <span className="ml-2 text-xs font-semibold">
                ({cooldown}s)
              </span>
            )}
          </>
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyCode} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Verification Code</Label>
        <Input
          id="code"
          type="text"
          placeholder="Enter 6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required
          disabled={loading}
          className="bg-white text-center text-2xl tracking-widest"
          maxLength={6}
        />
        <p className="text-sm text-slate-500">
          Enter the code sent to {phone}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-800 border border-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep("phone")}
          className="flex-1"
          disabled={loading}
        >
          Change Number
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-teal-600 hover:bg-teal-700"
          disabled={loading || code.length !== 6}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Code"
          )}
        </Button>
      </div>
    </form>
  );
}

