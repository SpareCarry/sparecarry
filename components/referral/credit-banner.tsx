"use client";

import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Gift, Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useState } from "react";
import { CurrencyDisplay } from "../currency/currency-display";
import { ShareButtons } from "./share-buttons";
import { useUser } from "../../hooks/useUser";

export function CreditBanner() {
  const supabase = createClient() as SupabaseClient;
  const [showShare, setShowShare] = useState(false);

  // Use shared hook to prevent duplicate queries
  const { user } = useUser();

  type UserCredits = {
    referral_credit_cents?: number | null;
    referral_code?: string | null;
  };

  const { data: userData } = useQuery<UserCredits | null>({
    queryKey: ["user-credits", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        // Get referral_code from users and referral_credit_cents from profiles
        const [userResult, profileResult] = await Promise.all([
          supabase
            .from("users")
            .select("referral_code")
            .eq("id", user.id)
            .single(),
          supabase
            .from("profiles")
            .select("referral_credit_cents")
            .eq("user_id", user.id)
            .single(),
        ]);

        if (userResult.error && userResult.error.code !== "PGRST116") {
          console.warn("Error fetching user referral code:", userResult.error);
        }

        if (profileResult.error && profileResult.error.code !== "PGRST116") {
          console.warn("Error fetching profile credits:", profileResult.error);
        }

        return {
          referral_code: userResult.data?.referral_code || null,
          referral_credit_cents: profileResult.data?.referral_credit_cents || 0,
        } as UserCredits | null;
      } catch (error) {
        console.warn("Exception fetching user credits:", error);
        return null;
      }
    },
    enabled: !!user,
    retry: false,
    throwOnError: false,
  });

  const credits = (userData?.referral_credit_cents || 0) / 100; // Convert cents to dollars
  const referralCode = userData?.referral_code;

  if (credits === 0 && !referralCode) {
    return null; // Don't show banner if no credits and no code
  }

  return (
    <Card className="mb-4 border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
              <Gift className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                You have{" "}
                <CurrencyDisplay
                  amount={credits}
                  showSecondary={false}
                  className="inline"
                />{" "}
                in credit 🔥
              </div>
              <p className="mt-0.5 text-sm text-slate-600">
                Use on platform fees or rewards • Never expires
              </p>
            </div>
          </div>
          {referralCode && (
            <Button
              onClick={() => setShowShare(!showShare)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share & Earn More
            </Button>
          )}
        </div>

        {showShare && referralCode && (
          <div className="mt-4 border-t border-teal-200 pt-4">
            <ShareButtons referralCode={referralCode} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
