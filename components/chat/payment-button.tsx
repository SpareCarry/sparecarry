"use client";

import { useState, useEffect } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { DollarSign, AlertCircle, Shield } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useQuery } from "@tanstack/react-query";
import { calculatePlatformFee } from "../../lib/pricing/platform-fee";
import { getInsuranceQuote, purchaseInsurance } from "../../lib/insurance/allianz";
import { EarlySupporterPromoCard } from "../promo/EarlySupporterPromoCard";
import { FirstDeliveryPromoCard } from "../promo/FirstDeliveryPromoCard";
import { CurrencyDisplay } from "../currency/currency-display";
import { getPromoCardToShow } from "../../lib/promo/promo-utils";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useUser } from "../../hooks/useUser";

type UserSubscription = {
  subscription_status?: "active" | "trialing" | "canceled" | "past_due" | null;
};

type UserHistory = {
  completed_deliveries_count?: number | null;
  average_rating?: number | null;
  referral_credit_cents?: number | null;
  supporter_status?: "active" | "inactive" | null;
};

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface PaymentButtonProps {
  match: any;
}

export function PaymentButton({ match }: PaymentButtonProps) {
  const router = useRouter();
  const supabase = createClient() as SupabaseClient;
  const [showDetails, setShowDetails] = useState(false);
  const [insurance, setInsurance] = useState(false);
  const [useCredits, setUseCredits] = useState(false);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Use shared hook to prevent duplicate queries
  const { user } = useUser();

  const { data: userData } = useQuery<UserSubscription | null>({
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("users")
        .select("subscription_status")
        .eq("id", user.id)
        .single();
      return (data ?? null) as UserSubscription | null;
    },
    enabled: !!user,
  });

  const hasActiveSubscription =
    userData?.subscription_status === "active" ||
    userData?.subscription_status === "trialing";

  // Get user history for dynamic fee calculation
  const { data: userHistory } = useQuery<UserHistory | null>({
    queryKey: ["user-history", user?.id],
    queryFn: async () => {
      if (!user) return null;
      // Get data from both users and profiles tables
      const [userResult, profileResult] = await Promise.all([
        supabase
          .from("users")
          .select("completed_deliveries_count, average_rating, supporter_status")
          .eq("id", user.id)
          .single(),
        supabase
          .from("profiles")
          .select("referral_credit_cents")
          .eq("user_id", user.id)
          .single(),
      ]);

      if (userResult.error || profileResult.error) {
        return null;
      }

      return {
        completed_deliveries_count: userResult.data?.completed_deliveries_count || null,
        average_rating: userResult.data?.average_rating || null,
        referral_credit_cents: profileResult.data?.referral_credit_cents || null,
        supporter_status: userResult.data?.supporter_status || null,
      } as UserHistory | null;
    },
    enabled: !!user,
  });

  const isSupporter = userHistory?.supporter_status === "active";
  const userCompletedDeliveries = userHistory?.completed_deliveries_count || 0;
  const isFreeDelivery = userCompletedDeliveries < 3;

  const trip = match.trips;
  const request = match.requests;
  const reward = Number(match.reward_amount ?? 0);
  const itemCost = Number(request.value_usd ?? 0);

  // Calculate dynamic platform fee
  const platformFeePercent = calculatePlatformFee({
    method: trip.type,
    userId: user?.id || "",
    userCompletedDeliveries,
    userRating: userHistory?.average_rating || 5.0,
    isSubscriber: hasActiveSubscription,
    isSupporter,
  });

  const platformFee = reward * platformFeePercent;

  // Insurance quote
  const [insuranceQuote, setInsuranceQuote] = useState<{
    premium: number;
    coverage_amount: number;
    item_value: number;
    route_from: string;
    route_to: string;
  } | null>(null);
  const [insuranceLoading, setInsuranceLoading] = useState(false);

  useEffect(() => {
    if (itemCost > 0 && !insuranceQuote && !insuranceLoading) {
      setInsuranceLoading(true);
      getInsuranceQuote(
        itemCost,
        request.from_location,
        request.to_location
      ).then((quote) => {
        setInsuranceQuote({
          premium: quote.premium,
          coverage_amount: quote.coverage_amount,
          item_value: itemCost,
          route_from: request.from_location,
          route_to: request.to_location,
        });
        setInsuranceLoading(false);
      });
    }
  }, [itemCost, request.from_location, request.to_location, insuranceLoading, insuranceQuote]);

  const insuranceCost = insurance && insuranceQuote ? insuranceQuote.premium : 0;

  const subtotal = reward + itemCost + insuranceCost;
  const totalBeforeCredits = subtotal + platformFee;

  const availableCredits = (userHistory?.referral_credit_cents || 0) / 100; // Convert cents to dollars
  const maxCreditsUsable = Math.min(
    availableCredits,
    platformFee + reward // Credits can only be used on platform fee or reward
  );
  const creditsToUse = useCredits ? maxCreditsUsable : 0;

  const total = Math.max(0, totalBeforeCredits - creditsToUse);
  const creditLimitDisplay = Math.max(0, maxCreditsUsable);
  const canSubmitPayment = total > 0;
  const formattedPlatformFeePercent = `${(platformFeePercent * 100).toFixed(1)}%`;

  // Determine which promo card to show
  const [promoCardType, setPromoCardType] = useState<'early-supporter' | 'first-delivery' | null>(null);
  
  useEffect(() => {
    const checkPromo = async () => {
      if (user?.id) {
        const cardType = await getPromoCardToShow(user.id);
        setPromoCardType(cardType);
      } else {
        // For anonymous users, only show early supporter if active
        const { getDaysLeft } = await import('@/utils/getDaysLeft');
        const daysLeft = getDaysLeft();
        setPromoCardType(daysLeft > 0 ? 'early-supporter' : null);
      }
    };
    checkPromo();
  }, [user?.id]);

  useEffect(() => {
    if (maxCreditsUsable <= 0 && useCredits) {
      setUseCredits(false);
    }
  }, [maxCreditsUsable, useCredits]);

  const handlePayment = async () => {
    setCreatingIntent(true);
    setCheckoutError(null);
    setClientSecret(null);
    try {
      let insurancePolicyNumber = null;
      if (insurance && insuranceQuote) {
        const policy = await purchaseInsurance(insuranceQuote, match.id, user!.id);
        insurancePolicyNumber = policy.policy_number;
      }

      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          useCredits: useCredits && creditsToUse > 0,
          insurance:
            insurance && insuranceQuote
              ? {
                  policy_number: insurancePolicyNumber,
                  premium: insuranceQuote.premium,
                  coverage_amount: insuranceQuote.coverage_amount,
                }
              : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create payment");
      }

      const { clientSecret: secret } = await response.json();
      setClientSecret(secret);
    } catch (error) {
      console.error("Payment error:", error);
      const message = error instanceof Error ? error.message : "Payment failed";
      setCheckoutError(message);
    } finally {
      setCreatingIntent(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    await supabase
      .from("matches")
      .update({ status: "escrow_paid", escrow_payment_intent_id: paymentIntentId })
      .eq("id", match.id);
    setClientSecret(null);
    router.refresh();
  };

  const handleCheckoutClose = () => {
    setClientSecret(null);
    setCheckoutError(null);
  };

  return (
    <div className="bg-white border-t border-slate-200 p-4" data-payment-button>
      {/* Promo Cards */}
      {promoCardType === 'early-supporter' && (
        <div className="mb-4">
          <EarlySupporterPromoCard />
        </div>
      )}
      {promoCardType === 'first-delivery' && (
        <div className="mb-4">
          <FirstDeliveryPromoCard />
        </div>
      )}

      <Button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full bg-teal-600 hover:bg-teal-700 mb-2"
      >
        <DollarSign className="mr-2 h-4 w-4" />
        Proceed to Payment
      </Button>

      {showDetails && (
        <Card className="mt-2">
          <CardHeader>
            <CardTitle className="text-lg">Payment Breakdown</CardTitle>
            <CardDescription>Review before proceeding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Reward</span>
              <span>
                <CurrencyDisplay amount={reward} />
              </span>
            </div>
            {itemCost > 0 && (
              <div className="flex justify-between text-sm">
                <span>Item Cost</span>
                <span>
                  <CurrencyDisplay amount={itemCost} />
                </span>
              </div>
            )}
            {platformFee > 0 && (
              <div className="flex justify-between text-sm">
                <span>
                  Platform Fee ({formattedPlatformFeePercent})
                  {hasActiveSubscription && (
                    <span className="ml-2 text-xs text-green-600 font-medium">
                      (Pro - waived)
                    </span>
                  )}
                  {isSupporter && (
                    <span className="ml-2 text-xs text-blue-600 font-medium">
                      (Supporter perk)
                    </span>
                  )}
                </span>
                <span>
                  <CurrencyDisplay amount={platformFee} />
                </span>
              </div>
            )}
            {isFreeDelivery && platformFee === 0 && (
              <div className="flex justify-between text-sm text-teal-600 font-medium">
                <span>
                  Platform Fee (waived – first 3) 🎉
                </span>
                <span>$0.00</span>
              </div>
            )}
            {itemCost > 0 && (
              <div className="border-t pt-3 mt-3">
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        id="insurance"
                        checked={insurance}
                        onChange={(e) => setInsurance(e.target.checked)}
                        className="h-4 w-4"
                        disabled={insuranceLoading}
                      />
                      <label htmlFor="insurance" className="text-sm font-medium cursor-pointer">
                        Allianz Travel Insurance
                      </label>
                      {insuranceQuote && (
                        <span className="text-sm font-semibold ml-auto">
                          ${insuranceQuote.premium.toFixed(2)}
                        </span>
                      )}
                      {insuranceLoading && (
                        <span className="text-xs text-slate-500 ml-auto">
                          Loading quote...
                        </span>
                      )}
                    </div>
                    {insuranceQuote && (
                      <p className="text-xs text-blue-800">
                        Coverage: <CurrencyDisplay amount={insuranceQuote.coverage_amount} showSecondary={false} className="inline" /> • 
                        Protects against loss, damage, and theft during transport
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Referral Credits */}
            {availableCredits > 0 && !hasActiveSubscription && !isSupporter && (
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useCredits"
                      checked={useCredits}
                      onChange={(e) => setUseCredits(e.target.checked)}
                      className="h-4 w-4"
                      disabled={creditLimitDisplay <= 0}
                    />
                    <label htmlFor="useCredits" className="text-sm font-medium cursor-pointer">
                      Use up to ${creditLimitDisplay.toFixed(2)} referral credit
                    </label>
                  </div>
                  {useCredits && (
                    <span className="text-sm font-semibold text-teal-600">
                      -<CurrencyDisplay amount={creditsToUse} showSecondary={false} />
                    </span>
                  )}
                </div>
                {creditLimitDisplay <= 0 ? (
                  <p className="text-xs text-slate-500">
                    No eligible fees to apply credits to at the moment.
                  </p>
                ) : useCredits ? (
                  <p className="text-xs text-slate-500">
                    Credits can only be used on platform fees or rewards
                  </p>
                ) : null}
              </div>
            )}
            
            {/* Stripe Fee - always shown separately */}
            {total > 0 && (
              <div className="flex justify-between text-sm text-slate-600">
                <span>Stripe payment processing fee</span>
                <span>
                  <CurrencyDisplay amount={total * 0.029 + 0.30} showSecondary={false} />
                </span>
              </div>
            )}
            
            <div className="border-t pt-2 flex justify-between font-semibold text-lg">
              <span>Total {isFreeDelivery && platformFee === 0 ? '🎉' : ''}</span>
              <span className={isFreeDelivery && platformFee === 0 ? 'text-teal-600' : ''}>
                <CurrencyDisplay amount={total} showSecondary={false} />
              </span>
            </div>
            {!canSubmitPayment && (
              <p className="text-xs text-red-600">
                Total must be greater than $0 to continue.
              </p>
            )}
            {checkoutError && (
              <p className="text-xs text-red-600">{checkoutError}</p>
            )}
            {clientSecret ? (
              <div className="space-y-3 border border-slate-200 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Enter payment details</p>
                  <Button variant="ghost" size="sm" onClick={handleCheckoutClose}>
                    Cancel
                  </Button>
                </div>
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
                    },
                  }}
                  key={clientSecret}
                >
                  <CheckoutForm
                    onSuccess={handlePaymentSuccess}
                    onError={(message) => setCheckoutError(message)}
                  />
                </Elements>
              </div>
            ) : (
              <Button
                onClick={handlePayment}
                disabled={creatingIntent || !canSubmitPayment}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {creatingIntent ? (
                  "Preparing checkout..."
                ) : (
                  <>
                    Pay <CurrencyDisplay amount={total} showSecondary={false} className="inline" /> & Lock in Escrow
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CheckoutForm({
  onSuccess,
  onError,
}: {
  onSuccess: (paymentIntentId: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setLocalError(null);
    onError("");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      const message = error.message || "Payment failed";
      setLocalError(message);
      onError(message);
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      await onSuccess(paymentIntent.id);
    } else {
      const message = "Payment did not complete. Please try again.";
      setLocalError(message);
      onError(message);
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <PaymentElement id="payment-element" />
      {localError && <p className="text-xs text-red-600">{localError}</p>}
      <Button
        type="submit"
        className="w-full bg-teal-600 hover:bg-teal-700"
        disabled={!stripe || submitting}
      >
        {submitting ? "Processing..." : "Confirm Payment"}
      </Button>
    </form>
  );
}

