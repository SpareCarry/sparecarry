/**
 * Lifetime Offer Screen - shown after signup if:
 * - User is new
 * - User doesn't have lifetime_active
 * - Global lifetime count < 100
 *
 * Optional screen that allows users to purchase lifetime access
 * or skip to continue to the main app
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Infinity, Loader2, X } from "lucide-react";
import { useLifetimeAvailability } from "../../lib/hooks/use-lifetime-availability";
import { createClient } from "../../lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToastNotification } from "../../lib/hooks/use-toast-notification";

interface LifetimeOfferScreenProps {
  onSkip: () => void;
  onComplete: () => void;
}

export function LifetimeOfferScreen({
  onSkip,
  onComplete,
}: LifetimeOfferScreenProps) {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToastNotification();
  const [loading, setLoading] = useState(false);
  const { available, loading: availabilityLoading } = useLifetimeAvailability();

  // Get remaining spots count
  const { data: remainingSpots } = useQuery({
    queryKey: ["lifetime-remaining-spots"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc(
          "get_lifetime_purchase_count"
        );

        if (error) {
          console.warn("Error fetching lifetime count:", error);
          return null;
        }

        // Handle both single result and array result
        const result = Array.isArray(data) ? data[0] : data;
        const currentCount = (result as { total?: number })?.total || 0;
        return Math.max(0, 100 - currentCount);
      } catch (error) {
        console.warn("Exception fetching lifetime count:", error);
        return null;
      }
    },
    enabled: available,
    retry: false,
    throwOnError: false,
  });

  // Don't show screen if availability is not loading and not available
  // But wait for loading to finish first
  if (availabilityLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // If lifetime is not available (limit reached), skip to main app
  if (!available) {
    onSkip();
    return null;
  }

  const handleGetLifetime = async () => {
    setLoading(true);
    try {
      // Create checkout session for lifetime purchase
      const response = await fetch("/api/subscriptions/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: "lifetime" }),
      });

      const data = await response.json();
      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout");
      }
    } catch (error) {
      console.error("Error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to start checkout";
      toast.showApiError("start checkout", message);
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md border-teal-200 bg-gradient-to-br from-teal-50 via-blue-50 to-white shadow-lg">
        <CardHeader className="pb-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-teal-600">
            <Infinity className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Support SpareCarry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main message */}
          <div className="space-y-3 text-center">
            <p className="text-lg leading-relaxed text-slate-700">
              Thanks for joining SpareCarry! To help keep the app fair,
              affordable, and community-powered, the first 100 supporters can
              unlock Lifetime Access for a one-time $100.
            </p>
            {remainingSpots !== null &&
              remainingSpots !== undefined &&
              remainingSpots > 0 && (
                <p className="text-sm font-semibold text-blue-600">
                  Only {remainingSpots}{" "}
                  {remainingSpots === 1 ? "spot" : "spots"} left!
                </p>
              )}
          </div>

          {/* Support message */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-center text-xs leading-relaxed text-slate-600">
              Your support helps keep SpareCarry fair, affordable, and
              community-powered.
            </p>
          </div>

          {/* Benefits preview */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">
              All Pro benefits included:
            </p>
            <ul className="space-y-1 text-xs text-slate-600">
              <li>• Lower SpareCarry service fees</li>
              <li>• Faster match priority</li>
              <li>• Priority chat support</li>
              <li>• Early access to new features</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleGetLifetime}
              disabled={loading}
              className="h-12 w-full bg-gradient-to-r from-blue-600 to-teal-600 text-base font-semibold text-white hover:from-blue-700 hover:to-teal-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Infinity className="mr-2 h-5 w-5" />
                  Get Lifetime Access
                </>
              )}
            </Button>

            <Button
              onClick={handleSkip}
              disabled={loading}
              variant="outline"
              className="h-12 w-full text-base"
            >
              <X className="mr-2 h-4 w-4" />
              Skip for now
            </Button>
          </div>

          <p className="pt-2 text-center text-xs text-slate-500">
            No pressure. You can always upgrade later from your profile.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
