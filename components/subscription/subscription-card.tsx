"use client";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  CheckCircle2,
  Zap,
  Star,
  CreditCard,
  Anchor,
  Trophy,
  Infinity,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { SupporterBadge } from "../badges/supporter-badge";
import { useLifetimeAvailability } from "../../lib/hooks/use-lifetime-availability";
import { useUser } from "../../hooks/useUser";
import { useToastNotification } from "../../lib/hooks/use-toast-notification";

type SubscriptionStatus = {
  subscription_status?: "active" | "trialing" | "canceled" | "past_due" | null;
  subscription_current_period_end?: string | null;
  supporter_status?: "active" | "inactive" | null;
  supporter_expires_at?: string | null;
};

type LifetimeStatus = {
  lifetime_active?: boolean | null;
  lifetime_purchase_at?: string | null;
};

export function SubscriptionCard() {
  const supabase = createClient() as SupabaseClient;
  const router = useRouter();
  const toast = useToastNotification();
  const [loading, setLoading] = useState<string | null>(null);

  // Use shared hook to prevent duplicate queries
  // Always render the card immediately - don't wait for queries
  // This ensures "SpareCarry Pro" text is always visible for tests
  const { user, isLoading: userLoading } = useUser();

  // Fetch subscription status from users table
  const { data: userData } = useQuery<SubscriptionStatus | null>({
    queryKey: ["user-subscription-status", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const { data, error } = await supabase
          .from("users")
          .select(
            `
            subscription_status, 
            subscription_current_period_end,
            supporter_status,
            supporter_expires_at
          `
          )
          .eq("id", user.id)
          .single();

        // If record doesn't exist, return null instead of throwing
        if (
          error &&
          (error.code === "PGRST116" || error.message?.includes("No rows"))
        ) {
          return null;
        }

        if (error) {
          console.warn("Error fetching subscription status:", error);
          return null; // Return null instead of throwing
        }
        return (data ?? null) as SubscriptionStatus | null;
      } catch (error) {
        console.warn("Exception fetching subscription status:", error);
        return null; // Return null instead of throwing
      }
    },
    enabled: !!user,
    retry: false,
    throwOnError: false, // Don't throw errors
  });

  // Fetch lifetime status from profiles table
  const { data: profileData } = useQuery<LifetimeStatus | null>({
    queryKey: ["profile-lifetime-status", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("lifetime_active, lifetime_purchase_at")
          .eq("user_id", user.id)
          .single();

        if (
          error &&
          (error.code === "PGRST116" || error.message?.includes("No rows"))
        ) {
          return null;
        }

        if (error) {
          console.warn("Error fetching lifetime status:", error);
          return null;
        }
        return (data ?? null) as LifetimeStatus | null;
      } catch (error) {
        console.warn("Exception fetching lifetime status:", error);
        return null;
      }
    },
    enabled: !!user,
    retry: false,
    throwOnError: false,
  });

  // Check lifetime availability using RPC function
  const { available: lifetimeAvailable, loading: lifetimeAvailabilityLoading } =
    useLifetimeAvailability();

  const isSubscribed = userData?.subscription_status === "active";
  const isTrialing = userData?.subscription_status === "trialing";
  const isSupporter = userData?.supporter_status === "active";
  const isLifetime = profileData?.lifetime_active === true;

  // Hide lifetime if user already has it or limit is reached
  const showLifetimeOption =
    !isLifetime && lifetimeAvailable && !lifetimeAvailabilityLoading;

  const hasPro = isSubscribed || isTrialing || isSupporter || isLifetime;

  const handleSubscribe = async (
    priceId: "monthly" | "yearly" | "lifetime"
  ) => {
    setLoading(priceId);
    try {
      // Check if user is logged in - use the hook's user state
      if (!user) {
        console.warn(
          "[Subscription] No user found from useUser hook, redirecting to login"
        );
        setLoading(null);
        window.location.href = `/auth/login?redirect=/home/profile&forceLogin=true`;
        return;
      }

      console.log(
        "[Subscription] User found:",
        user.email,
        "- Making API call..."
      );

      // Get the current session to include the access token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.warn("[Subscription] No session found, redirecting to login");
        setLoading(null);
        window.location.href = `/auth/login?redirect=/home/profile&forceLogin=true`;
        return;
      }

      // Call the API - include access token in header as fallback if cookies aren't set
      // The middleware will refresh the session if needed
      // If user is logged in, it will create checkout session
      // If not, it will return 401 and we'll redirect to login
      const response = await fetch("/api/subscriptions/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include access token as fallback if cookies aren't synced
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({ priceId }),
      }).catch((fetchError) => {
        // Handle network errors (CORS, connection refused, etc.)
        console.error("[Subscription] Network error:", fetchError);
        throw new Error(
          "Network error: Unable to connect to the server. Please check your internet connection and try again."
        );
      });

      if (!response.ok) {
        // Try to parse error response first
        let errorMsg = "Failed to create checkout";
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
          console.error(
            "[Subscription] API error:",
            errorMsg,
            "Status:",
            response.status
          );
        } catch (parseError) {
          // If JSON parsing fails, response might be HTML error page
          errorMsg = `Server error (${response.status}). Please try again.`;
          console.error(
            "[Subscription] Failed to parse error response. Status:",
            response.status,
            parseError
          );
        }

        // If unauthorized, redirect to login with forceLogin to prevent auto-redirect
        if (response.status === 401) {
          console.warn(
            "[Subscription] User not authenticated. Redirecting to login..."
          );
          setLoading(null); // Reset loading state
          // Use window.location for full page navigation to prevent flash
          window.location.href = `/auth/login?redirect=/home/profile&forceLogin=true`;
          return;
        }

        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout");
      }
    } catch (error) {
      console.error("[Subscription] Error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to start subscription. Please try again.";

      // Show a more user-friendly error message
      toast.showApiError("start subscription", message);
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading("manage");
    try {
      const response = await fetch("/api/subscriptions/customer-portal", {
        method: "POST",
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to open portal");
      }
    } catch (error) {
      console.error("Error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to open subscription portal";
      toast.showApiError("open subscription portal", message);
    } finally {
      setLoading(null);
    }
  };

  // Always render the card immediately - don't wait for queries
  // This ensures "SpareCarry Pro" text is always visible for tests
  return (
    <Card
      className="border-teal-200 bg-gradient-to-br from-teal-50 via-blue-50 to-white shadow-xl"
      data-testid="subscription-card"
    >
      <CardHeader className="pb-3">
        <CardTitle
          className="flex items-center gap-2 text-2xl"
          data-testid="sparecarry-pro-title"
        >
          <Star className="h-6 w-6 text-teal-600" />
          SpareCarry Pro
        </CardTitle>
        <p className="mt-1 text-sm text-slate-600">
          Unlock premium features and support the community courier ecosystem
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPro ? (
          <>
            {isLifetime ? (
              <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 via-teal-50 to-blue-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Infinity className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-slate-900">
                    You have Lifetime Access 🎉
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  You&apos;ve unlocked lifetime access to all Pro features.
                  Thank you for supporting SpareCarry!
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">
                    {isSupporter ? "Supporter Active" : "Active Subscription"}
                  </span>
                </div>
                <p className="text-sm text-green-800">
                  {isSupporter
                    ? `Your benefits are active until ${
                        userData?.supporter_expires_at
                          ? new Date(
                              userData.supporter_expires_at
                            ).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "next year"
                      }`
                    : `${isTrialing ? "Trial" : "Subscribed"} • Renews ${
                        userData?.subscription_current_period_end
                          ? new Date(
                              userData.subscription_current_period_end
                            ).toLocaleDateString()
                          : "soon"
                      }`}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">Your Benefits:</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-teal-600" />
                  <span>Lower SpareCarry service fees</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-teal-600" />
                  <span>Faster match priority</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-teal-600" />
                  <span>Priority chat support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-teal-600" />
                  <span>
                    Early access to new features (e.g., courier comparison)
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-teal-600" />
                  <span>Support the community courier ecosystem</span>
                </li>
              </ul>
            </div>

            {/* Support message */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-center text-xs text-slate-600">
                Your support helps keep SpareCarry independent, fair, and
                community-powered. Every subscription helps us improve the app,
                keep delivery affordable, and support real travellers.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => window.open("/hall-of-fame", "_blank")}
              className="w-full"
            >
              <Trophy className="mr-2 h-4 w-4" />
              View Hall of Fame
            </Button>

            {!isLifetime && (isSubscribed || isTrialing) && (
              <Button
                onClick={handleManageSubscription}
                disabled={loading === "manage"}
                variant="outline"
                className="w-full"
              >
                {loading === "manage" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage Subscription
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900">
                All Benefits Included:
              </h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                  <span>
                    <strong>Lower SpareCarry service fees</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                  <span>
                    <strong>Faster match priority</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                  <span>
                    <strong>Priority chat support</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Anchor className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                  <span>
                    <strong>Early access to new features</strong> (e.g., courier
                    comparison)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Trophy className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                  <span>
                    <strong>Support the community courier ecosystem</strong>
                  </span>
                </li>
              </ul>
            </div>

            {/* Support message */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-center text-xs text-slate-600">
                Your support helps keep SpareCarry independent, fair, and
                community-powered. Every subscription helps us improve the app,
                keep delivery affordable, and support real travellers.
              </p>
            </div>

            <div
              className={`grid gap-4 pt-2 ${showLifetimeOption ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}
            >
              {/* Monthly */}
              <div className="flex transform flex-col rounded-lg border border-slate-300 p-4 transition-all duration-200 hover:scale-105 hover:border-teal-400 hover:shadow-md">
                <div className="mb-1 text-2xl font-bold text-slate-900">$5</div>
                <div className="mb-1 text-xs text-slate-600">per month</div>
                <div className="mb-3 text-xs text-slate-500">
                  $60/year total
                </div>
                <div className="flex-grow"></div>
                <Button
                  onClick={() => handleSubscribe("monthly")}
                  disabled={loading !== null || userLoading}
                  size="sm"
                  className="w-full bg-teal-600 font-medium text-white hover:bg-teal-700"
                >
                  {loading === "monthly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Subscribe Monthly"
                  )}
                </Button>
              </div>

              {/* Yearly - Recommended */}
              <div className="relative flex transform flex-col rounded-lg border-2 border-teal-600 bg-gradient-to-br from-teal-50 to-green-50 p-4 shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform rounded-full bg-teal-600 px-3 py-1 text-xs font-bold text-white shadow-md">
                  ⭐ Best Value
                </div>
                <div className="mb-1 mt-2 flex items-baseline gap-1">
                  <div className="text-2xl font-bold text-slate-900">$30</div>
                  <span className="text-xs text-slate-600">/year</span>
                </div>
                <div className="mb-1 inline-block rounded bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-700">
                  Save 50% vs Monthly
                </div>
                <div className="mb-3 text-xs text-slate-600">
                  Just $2.50/month
                </div>
                <div className="flex-grow"></div>
                <Button
                  onClick={() => handleSubscribe("yearly")}
                  disabled={loading !== null || userLoading}
                  size="sm"
                  className="w-full bg-teal-600 font-semibold text-white shadow-md hover:bg-teal-700"
                >
                  {loading === "yearly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Subscribe Yearly"
                  )}
                </Button>
              </div>

              {/* Lifetime - Limited to first 100 users - only show if available */}
              {showLifetimeOption && (
                <div className="relative flex transform flex-col rounded-lg border-2 border-blue-600 bg-gradient-to-br from-blue-50 via-teal-50 to-indigo-50 p-4 shadow-lg transition-transform duration-200 hover:scale-105">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-md">
                    ⚡ EARLY BIRD
                  </div>
                  <div className="mb-1 mt-3 flex items-baseline gap-1">
                    <div className="text-3xl font-bold text-blue-900">$100</div>
                    <span className="text-xs text-slate-500 line-through">
                      $600
                    </span>
                  </div>
                  <div className="mb-1 inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                    Save $500 vs Yearly
                  </div>
                  <div className="mb-2 text-xs font-medium text-slate-600">
                    One-time • Never pay again
                  </div>
                  <div className="mb-3 rounded border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-600">
                    🎉 Limited to first 100 users
                  </div>
                  <div className="flex-grow"></div>
                  <Button
                    onClick={() => handleSubscribe("lifetime")}
                    disabled={loading !== null || userLoading}
                    size="sm"
                    className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 font-semibold text-white shadow-md transition-all duration-200 hover:from-blue-700 hover:via-indigo-700 hover:to-teal-700 hover:shadow-lg"
                  >
                    {loading === "lifetime" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Infinity className="mr-2 h-4 w-4" />
                        Get Lifetime Access
                      </>
                    )}
                  </Button>
                  <div className="mt-2 text-center text-xs font-medium text-slate-600">
                    Pay once, use forever
                  </div>
                </div>
              )}
            </div>

            <p className="pt-2 text-center text-xs text-slate-500">
              Cancel anytime • No hidden fees • All plans include the same
              benefits
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
