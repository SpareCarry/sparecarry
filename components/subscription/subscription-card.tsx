"use client";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CheckCircle2, Zap, Star, CreditCard, Anchor, Trophy, Infinity } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { SupporterBadge } from "../badges/supporter-badge";
import { useLifetimeAvailability } from "../../lib/hooks/use-lifetime-availability";
import { useUser } from "../../hooks/useUser";

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
          .select(`
            subscription_status, 
            subscription_current_period_end,
            supporter_status,
            supporter_expires_at
          `)
          .eq("id", user.id)
          .single();
        
        // If record doesn't exist, return null instead of throwing
        if (error && (error.code === 'PGRST116' || error.message?.includes('No rows'))) {
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
        
        if (error && (error.code === 'PGRST116' || error.message?.includes('No rows'))) {
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
  const { available: lifetimeAvailable, loading: lifetimeAvailabilityLoading } = useLifetimeAvailability();
  
  const isSubscribed = userData?.subscription_status === "active";
  const isTrialing = userData?.subscription_status === "trialing";
  const isSupporter = userData?.supporter_status === "active";
  const isLifetime = profileData?.lifetime_active === true;
  
  // Hide lifetime if user already has it or limit is reached
  const showLifetimeOption = !isLifetime && lifetimeAvailable && !lifetimeAvailabilityLoading;

  const hasPro = isSubscribed || isTrialing || isSupporter || isLifetime;

  const handleSubscribe = async (priceId: "monthly" | "yearly" | "lifetime") => {
    setLoading(priceId);
    try {
      // Check if user is logged in - use the hook's user state
      if (!user) {
        console.warn("[Subscription] No user found from useUser hook, redirecting to login");
        setLoading(null);
        window.location.href = `/auth/login?redirect=/home/profile&forceLogin=true`;
        return;
      }

      console.log("[Subscription] User found:", user.email, "- Making API call...");
      
      // Get the current session to include the access token
      const { data: { session } } = await supabase.auth.getSession();
      
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
          "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({ priceId }),
      }).catch((fetchError) => {
        // Handle network errors (CORS, connection refused, etc.)
        console.error("[Subscription] Network error:", fetchError);
        throw new Error("Network error: Unable to connect to the server. Please check your internet connection and try again.");
      });

      if (!response.ok) {
        // Try to parse error response first
        let errorMsg = "Failed to create checkout";
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
          console.error("[Subscription] API error:", errorMsg, "Status:", response.status);
        } catch (parseError) {
          // If JSON parsing fails, response might be HTML error page
          errorMsg = `Server error (${response.status}). Please try again.`;
          console.error("[Subscription] Failed to parse error response. Status:", response.status, parseError);
        }
        
        // If unauthorized, redirect to login with forceLogin to prevent auto-redirect
        if (response.status === 401) {
          console.warn("[Subscription] User not authenticated. Redirecting to login...");
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
      alert(message);
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
      alert(message);
    } finally {
      setLoading(null);
    }
  };

  // Always render the card immediately - don't wait for queries
  // This ensures "SpareCarry Pro" text is always visible for tests
  return (
    <Card className="border-teal-200 bg-gradient-to-br from-teal-50 via-blue-50 to-white shadow-xl" data-testid="subscription-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-2xl" data-testid="sparecarry-pro-title">
          <Star className="h-6 w-6 text-teal-600" />
          SpareCarry Pro
        </CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          Unlock premium features and support the community courier ecosystem
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPro ? (
          <>
            {isLifetime ? (
              <div className="p-4 bg-gradient-to-r from-blue-50 via-teal-50 to-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Infinity className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-slate-900">You have Lifetime Access 🎉</span>
                </div>
                <p className="text-sm text-slate-600">
                  You&apos;ve unlocked lifetime access to all Pro features. Thank you for supporting SpareCarry!
                </p>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">
                    {isSupporter
                      ? "Supporter Active"
                      : "Active Subscription"}
                  </span>
                </div>
                <p className="text-sm text-green-800">
                  {isSupporter
                    ? `Your benefits are active until ${
                        userData?.supporter_expires_at
                          ? new Date(userData.supporter_expires_at).toLocaleDateString("en-US", {
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
                  <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
                  <span>Lower SpareCarry service fees</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
                  <span>Faster match priority</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
                  <span>Priority chat support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
                  <span>Early access to new features (e.g., courier comparison)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
                  <span>Support the community courier ecosystem</span>
                </li>
              </ul>
            </div>
            
            {/* Support message */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 text-center">
                Your support helps keep SpareCarry independent, fair, and community-powered. 
                Every subscription helps us improve the app, keep delivery affordable, and support real travellers.
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
              <h4 className="font-semibold text-slate-900">All Benefits Included:</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Lower SpareCarry service fees</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Faster match priority</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Priority chat support</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Anchor className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Early access to new features</strong> (e.g., courier comparison)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Trophy className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Support the community courier ecosystem</strong>
                  </span>
                </li>
              </ul>
            </div>
            
            {/* Support message */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 text-center">
                Your support helps keep SpareCarry independent, fair, and community-powered. 
                Every subscription helps us improve the app, keep delivery affordable, and support real travellers.
              </p>
            </div>

            <div className={`grid gap-4 pt-2 ${showLifetimeOption ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {/* Monthly */}
              <div className="border border-slate-300 rounded-lg p-4 flex flex-col hover:border-teal-400 hover:shadow-md transform hover:scale-105 transition-all duration-200">
                <div className="text-2xl font-bold text-slate-900 mb-1">$5</div>
                <div className="text-xs text-slate-600 mb-1">per month</div>
                <div className="text-xs text-slate-500 mb-3">$60/year total</div>
                <div className="flex-grow"></div>
                <Button
                  onClick={() => handleSubscribe("monthly")}
                  disabled={loading !== null || userLoading}
                  size="sm"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium"
                >
                  {loading === "monthly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Subscribe Monthly"
                  )}
                </Button>
              </div>

              {/* Yearly - Recommended */}
              <div className="border-2 border-teal-600 rounded-lg p-4 bg-gradient-to-br from-teal-50 to-green-50 flex flex-col relative shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-teal-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">
                  ⭐ Best Value
                </div>
                <div className="flex items-baseline gap-1 mb-1 mt-2">
                  <div className="text-2xl font-bold text-slate-900">$30</div>
                  <span className="text-xs text-slate-600">/year</span>
                </div>
                <div className="text-xs text-teal-700 font-bold mb-1 bg-teal-100 px-2 py-0.5 rounded inline-block">
                  Save 50% vs Monthly
                </div>
                <div className="text-xs text-slate-600 mb-3">Just $2.50/month</div>
                <div className="flex-grow"></div>
                <Button
                  onClick={() => handleSubscribe("yearly")}
                  disabled={loading !== null || userLoading}
                  size="sm"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md"
                >
                  {loading === "yearly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Subscribe Yearly"
                  )}
                </Button>
              </div>

              {/* Lifetime - Limited to first 1000 users - only show if available */}
              {showLifetimeOption && (
                <div className="border-2 border-blue-600 rounded-lg p-4 bg-gradient-to-br from-blue-50 via-teal-50 to-indigo-50 flex flex-col relative shadow-lg transform hover:scale-105 transition-transform duration-200">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">
                    ⚡ EARLY BIRD
                  </div>
                  <div className="flex items-baseline gap-1 mb-1 mt-3">
                    <div className="text-3xl font-bold text-blue-900">$100</div>
                    <span className="text-xs text-slate-500 line-through">$600</span>
                  </div>
                  <div className="text-xs text-blue-700 font-bold mb-1 bg-blue-100 px-2 py-0.5 rounded inline-block">
                    Save $500 vs Yearly
                  </div>
                  <div className="text-xs text-slate-600 font-medium mb-2">
                    One-time • Never pay again
                  </div>
                  <div className="text-xs text-orange-600 font-semibold mb-3 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                    🎉 Limited to first 1,000 users
                  </div>
                  <div className="flex-grow"></div>
                  <Button
                    onClick={() => handleSubscribe("lifetime")}
                    disabled={loading !== null || userLoading}
                    size="sm"
                    className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 hover:from-blue-700 hover:via-indigo-700 hover:to-teal-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
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
                  <div className="text-xs text-center text-slate-600 mt-2 font-medium">
                    Pay once, use forever
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-center text-slate-500 pt-2">
              Cancel anytime • No hidden fees • All plans include the same benefits
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
