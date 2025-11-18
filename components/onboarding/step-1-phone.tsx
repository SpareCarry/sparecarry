"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface OnboardingStep1Props {
  onComplete: () => void;
}

export function OnboardingStep1({ onComplete }: OnboardingStep1Props) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Using Supabase's built-in phone verification
      // Note: You'll need to configure this in Supabase Dashboard
      const { error: verifyError } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: "sms",
        },
      });

      if (verifyError) throw verifyError;

      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not found");

      // Verify the code and update profile
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: "sms",
      });

      if (verifyError) throw verifyError;

      // Update profile with phone number
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ phone })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      onComplete();
    } catch (err: any) {
      setError(err.message || "Invalid verification code");
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
            disabled={loading}
            className="bg-white"
          />
          <p className="text-sm text-slate-500">
            We'll send you a verification code via SMS
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 text-red-800 border border-red-200 text-sm">
            {error}
          </div>
        )}

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
            "Send Verification Code"
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

