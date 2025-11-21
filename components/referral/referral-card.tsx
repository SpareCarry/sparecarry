"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Gift, Copy, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import { getReferralStats, applyReferralCode } from "../../lib/referrals/referral-system";

export function ReferralCard() {
  const t = useTranslations("referral");
  const supabase = createClient();
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [applying, setApplying] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: stats, refetch } = useQuery({
    queryKey: ["referral-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      return getReferralStats(user.id);
    },
    enabled: !!user,
  });

  const handleCopyCode = async () => {
    if (stats?.referralCode) {
      await navigator.clipboard.writeText(stats.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApplyCode = async () => {
    if (!referralCodeInput.trim() || !user) return;

    setApplying(true);
    try {
      const result = await applyReferralCode(user.id, referralCodeInput.trim());
      if (result.success) {
        alert("Referral code applied! You'll both earn $35 credit after your first completed delivery.");
        setReferralCodeInput("");
        refetch();
      } else {
        alert(result.error || "Failed to apply referral code");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to apply referral code";
      alert(message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-teal-600" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats?.referralCode ? (
          <>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                {t("code")}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={stats.referralCode}
                  readOnly
                  className="font-mono"
                />
                <Button
                  onClick={handleCopyCode}
                  variant="outline"
                  size="sm"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Share & earn $35 credit after each delivery
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-xs text-slate-500">Total Referrals</p>
                <p className="text-lg font-semibold">
                  {stats.totalReferrals}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t("available")}</p>
                <p className="text-lg font-semibold text-teal-600">
                  ${stats.creditsAvailable.toFixed(0)}
                </p>
              </div>
            </div>

            <div className="p-3 bg-teal-50 border border-teal-200 rounded-md mt-2">
              <p className="text-xs text-teal-800">
                <strong>How it works:</strong> Both you and your friend get $35 credit after their first delivery. Credits can only be used on platform fees or rewards (never expire, never cash out).
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              {t("enterCode")}
            </p>
            <div className="flex gap-2">
              <Input
                value={referralCodeInput}
                onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                placeholder="ABC-1234"
                className="flex-1"
              />
              <Button
                onClick={handleApplyCode}
                disabled={applying || !referralCodeInput.trim()}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {applying ? t("loading") : t("apply")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

