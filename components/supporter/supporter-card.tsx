"use client";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Anchor, CheckCircle2, Star, Moon, Sun, Trophy } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { SupporterBadge } from "../badges/supporter-badge";
import { useUser } from "../../hooks/useUser";

type SupporterStatus = {
  supporter_status?: "active" | "inactive" | null;
  supporter_purchased_at?: string | null;
  supporter_expires_at?: string | null;
};

export function SupporterCard() {
  const supabase = createClient() as SupabaseClient;
  const [loading, setLoading] = useState(false);

  // Use shared hook to prevent duplicate queries
  const { user } = useUser();

  const { data: userData } = useQuery<SupporterStatus | null>({
    queryKey: ["user-supporter-status", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const { data, error } = await supabase
          .from("users")
          .select("supporter_status, supporter_purchased_at, supporter_expires_at")
          .eq("id", user.id)
          .single();
        
        // If record doesn't exist, return null instead of throwing
        if (error && (error.code === 'PGRST116' || error.message?.includes('No rows'))) {
          return null;
        }
        
        if (error) {
          console.warn("Error fetching supporter status:", error);
          return null; // Return null instead of throwing
        }
        return (data ?? null) as SupporterStatus | null;
      } catch (error) {
        console.warn("Exception fetching supporter status:", error);
        return null; // Return null instead of throwing
      }
    },
    enabled: !!user,
    retry: false,
    throwOnError: false, // Don't throw errors
  });

  const isSupporter = userData?.supporter_status === "active";

  const handleBecomeSupporter = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/supporter/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to create checkout");

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 via-teal-50 to-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Anchor className="h-5 w-5 text-blue-600" />
          SpareCarry Supporter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSupporter ? (
          <>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">
                  You&apos;re a Supporter!
                </span>
              </div>
              <p className="text-sm text-blue-800">
                Thank you for supporting SpareCarry! Your benefits are active until{" "}
                {userData?.supporter_expires_at
                  ? new Date(userData.supporter_expires_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "next year"}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">Your Exclusive Benefits:</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span>0% platform fees forever</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span>
                    <SupporterBadge size="sm" /> Blue anchor badge + &quot;Supporter&quot; title
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span>Priority listing (appear first in match feed)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span>Dark mode / light mode toggle (early access)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span>Name in &quot;Hall of Fame&quot; page</span>
                </li>
              </ul>
            </div>

            <Button
              variant="outline"
              onClick={() => window.open("/hall-of-fame", "_blank")}
              className="w-full"
            >
              <Trophy className="mr-2 h-4 w-4" />
              View Hall of Fame
            </Button>
          </>
        ) : (
          <>
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center mb-3">
                <SupporterBadge size="lg" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Become a Supporter
              </h3>
              <p className="text-slate-600 mb-4">
                Join the early backers who are building SpareCarry with us
              </p>
              <div className="text-3xl font-bold text-blue-600 mb-1">$39</div>
              <p className="text-sm text-slate-500 mb-6">per year • one-time payment</p>
            </div>

            <div className="space-y-2 mb-6">
              <h4 className="font-semibold text-slate-900">Exclusive Benefits:</h4>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>0% platform fees forever</strong> – save 15–18% on every delivery
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <SupporterBadge size="sm" /> Blue anchor badge + &quot;Supporter&quot; title
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Priority listing</strong> – appear first in match feed
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Dark mode toggle</strong> – early access to theme switching
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Hall of Fame</strong> – your name on the supporters page
                  </span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleBecomeSupporter}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold h-12 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Star className="mr-2 h-4 w-4" />
                  Become a Supporter – $39/year
                </>
              )}
            </Button>

            <p className="text-xs text-center text-slate-500">
              One-time payment • No recurring charges • Cancel anytime
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

