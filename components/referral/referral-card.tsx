"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Gift, Copy, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "../../hooks/useUser";
import { ShareButtons } from "./share-buttons";
import { CurrencyDisplay } from "../currency/currency-display";

interface ReferralStats {
  referralCode: string | null;
  totalReferrals: number;
  creditsEarned: number;
  creditsAvailable: number;
}

export function ReferralCard() {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Use shared hook to prevent duplicate queries
  const { user } = useUser();

  // First, get or create the user's referral code
  const isTestMode =
    typeof window !== "undefined" && !!(window as any).__PLAYWRIGHT_TEST_MODE__;

  const {
    data: referralCodeData,
    isLoading: codeLoadingState,
    error: codeError,
    refetch: refetchCode,
  } = useQuery<{ referralCode: string } | null>({
    queryKey: ["user-referral-code", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const response = await fetch("/api/referrals/get-or-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (response.status === 401) {
          return null;
        }

        if (!response.ok) {
          let errorMsg = "Failed to get referral code";
          try {
            const data = await response.json();
            errorMsg = data.error || errorMsg;
          } catch {
            errorMsg = `Server error (${response.status})`;
          }
          console.error(
            "Error getting referral code:",
            errorMsg,
            "Status:",
            response.status
          );
          throw new Error(errorMsg);
        }

        const result = await response.json();
        if (!result.referralCode) {
          throw new Error("No referral code returned");
        }
        return result as { referralCode: string };
      } catch (error) {
        console.error("Exception getting referral code:", error);
        throw error;
      }
    },
    enabled: !!user && !isTestMode,
    retry: 2, // Retry twice on failure
    retryDelay: 1000, // Wait 1 second between retries
    throwOnError: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const fallbackStats = useMemo<ReferralStats>(
    () => ({
      referralCode: "PLAYTEST",
      totalReferrals: 3,
      creditsEarned: 75,
      creditsAvailable: 25,
    }),
    []
  );

  const referralCode = isTestMode
    ? fallbackStats.referralCode
    : referralCodeData?.referralCode;

  // Then get stats
  const { data: statsData, isLoading: statsLoadingState } =
    useQuery<ReferralStats | null>({
      queryKey: ["referral-stats", user?.id],
      queryFn: async () => {
        if (!user) return null;
        try {
          const response = await fetch("/api/referrals/stats", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          });

          if (response.status === 401) {
            return null;
          }

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            console.warn(
              "Error loading referral stats:",
              data.error || "Failed to load referral stats"
            );
            return null;
          }

          return (await response.json()) as ReferralStats;
        } catch (error) {
          console.warn("Exception loading referral stats:", error);
          return null;
        }
      },
      enabled: !!user && !!referralCode && !isTestMode,
      retry: false,
      throwOnError: false,
    });

  const stats = isTestMode ? fallbackStats : statsData;
  const codeLoading = isTestMode ? false : codeLoadingState;

  const handleCopyCode = async () => {
    if (referralCode) {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    if (referralCode && typeof window !== "undefined") {
      const referralLink = `${window.location.origin}/r/${referralCode}`;
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const referralLink =
    referralCode && typeof window !== "undefined"
      ? `${window.location.origin}/r/${referralCode}`
      : referralCode
        ? `/r/${referralCode}`
        : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-teal-600" />
          Referral Program
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {codeLoading ? (
          <p className="text-sm text-slate-500">Loading your referral code…</p>
        ) : referralCode ? (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Your Unique Referral Code
              </label>
              <div className="flex items-center gap-2">
                <Input
                  data-testid="referral-code"
                  value={referralCode}
                  readOnly
                  className="font-mono text-lg font-semibold"
                />
                <Button
                  onClick={handleCopyCode}
                  variant="outline"
                  size="sm"
                  title="Copy referral code"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-xs text-slate-600">
                      <strong>Your referral link:</strong>
                    </p>
                    <p className="break-all font-mono text-xs text-teal-600">
                      {referralLink || `/r/${referralCode}`}
                    </p>
                  </div>
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="sm"
                    title="Copy referral link"
                  >
                    {copiedLink ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Share your code or link — you both get 2,000 Karma Points when
                they complete their first paid delivery
              </p>
            </div>

            {/* Share buttons */}
            <div className="border-t pt-2">
              <p className="mb-3 text-sm font-medium text-slate-700">
                Share on social media:
              </p>
              <ShareButtons referralCode={referralCode} />
            </div>

            {stats && (
              <div className="grid grid-cols-2 gap-4 border-t pt-2">
                <div>
                  <p className="text-xs text-slate-500">Total Referrals</p>
                  <p className="text-lg font-semibold">
                    {stats.totalReferrals || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Available Credits</p>
                  <p className="text-lg font-semibold text-teal-600">
                    <CurrencyDisplay
                      amount={stats.creditsAvailable || 0}
                      showSecondary={false}
                    />
                  </p>
                </div>
              </div>
            )}

            <div className="mt-2 rounded-md border border-teal-200 bg-teal-50 p-3">
              <p className="mb-2 text-xs font-semibold text-teal-800">
                Invite friends – you both get 2,000 Karma Points when they
                complete their first paid delivery
              </p>
              <p className="text-xs text-teal-700">
                <strong>How it works:</strong> Share your referral code or link
                with friends. When they sign up and complete their first paid
                delivery (after their first free delivery), both you and your
                friend get 2,000 Karma Points. Karma points can be used to
                reduce platform fees at checkout. The more points you have, the
                more you can save!
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {codeError ? (
              <>
                <p className="text-sm text-red-600">
                  Error loading referral code:{" "}
                  {codeError instanceof Error
                    ? codeError.message
                    : "Unknown error"}
                </p>
                <Button
                  onClick={() => refetchCode()}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Try Again
                </Button>
              </>
            ) : (
              <p className="text-sm text-slate-600">
                We&apos;re setting up your referral code. Please refresh the
                page in a moment.
              </p>
            )}
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-700">
                <strong>How it works:</strong> Share your referral code with
                friends. Both you and your friend get 2,000 Karma Points after
                their first paid delivery. Karma points can be used to reduce
                platform fees at checkout.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
