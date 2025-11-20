"use client";

import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Gift, Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import { useState } from "react";
import { ShareButtons } from "./share-buttons";

export function CreditBanner() {
  const supabase = createClient();
  const [showShare, setShowShare] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: userData } = useQuery({
    queryKey: ["user-credits", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("users")
        .select("referral_credits, referral_code")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const credits = userData?.referral_credits || 0;
  const referralCode = userData?.referral_code;

  if (credits === 0 && !referralCode) {
    return null; // Don't show banner if no credits and no code
  }

  return (
    <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50 mb-4">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <Gift className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                You have ${credits.toFixed(0)} in credit 🔥
              </div>
              <p className="text-sm text-slate-600 mt-0.5">
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
          <div className="mt-4 pt-4 border-t border-teal-200">
            <ShareButtons referralCode={referralCode} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

