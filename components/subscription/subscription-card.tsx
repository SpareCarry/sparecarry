"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Zap, Star, CreditCard } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export function SubscriptionCard() {
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["current-user-subscription"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: userData } = useQuery({
    queryKey: ["user-subscription-status", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("users")
        .select("subscription_status, subscription_current_period_end")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isSubscribed = userData?.subscription_status === "active";
  const isTrialing = userData?.subscription_status === "trialing";

  const handleSubscribe = async (priceId: "monthly" | "yearly") => {
    setLoading(priceId);
    try {
      const response = await fetch("/api/subscriptions/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout");
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Failed to start subscription");
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
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Failed to open subscription portal");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-teal-600" />
          SpareCarry Pro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSubscribed || isTrialing ? (
          <>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900">
                  Active Subscription
                </span>
              </div>
              <p className="text-sm text-green-800">
                {isTrialing ? "Trial" : "Subscribed"} • Renews{" "}
                {userData?.subscription_current_period_end
                  ? new Date(
                      userData.subscription_current_period_end
                    ).toLocaleDateString()
                  : "soon"}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">Your Benefits:</h4>
              <ul className="space-y-1 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  0% platform fee (save 15-18%)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  Priority in feed
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  Blue check verification badge
                </li>
              </ul>
            </div>

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
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">Benefits:</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-teal-600" />
                  <span>
                    <strong>0% platform fee</strong> (save 15-18% on every
                    delivery)
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-teal-600" />
                  <span>
                    <strong>Priority in feed</strong> (appear first in search
                    results)
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  <span>
                    <strong>Blue check badge</strong> (verified status)
                  </span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="border border-slate-200 rounded-lg p-3">
                <div className="text-2xl font-bold text-slate-900">$6.99</div>
                <div className="text-xs text-slate-500">per month</div>
                <Button
                  onClick={() => handleSubscribe("monthly")}
                  disabled={loading !== null}
                  size="sm"
                  className="w-full mt-2 bg-teal-600 hover:bg-teal-700"
                >
                  {loading === "monthly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </div>
              <div className="border-2 border-teal-600 rounded-lg p-3 bg-teal-50">
                <div className="flex items-center gap-1 mb-1">
                  <div className="text-2xl font-bold text-slate-900">$59</div>
                  <span className="text-xs text-slate-500">/year</span>
                </div>
                <div className="text-xs text-teal-600 font-medium mb-1">
                  Save 30%
                </div>
                <Button
                  onClick={() => handleSubscribe("yearly")}
                  disabled={loading !== null}
                  size="sm"
                  className="w-full mt-1 bg-teal-600 hover:bg-teal-700"
                >
                  {loading === "yearly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

