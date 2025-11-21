"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { DollarSign, AlertCircle, Shield } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useQuery } from "@tanstack/react-query";
import { calculatePlatformFee, isPromoPeriodActive } from "../../lib/pricing/platform-fee";
import { getInsuranceQuote, purchaseInsurance } from "../../lib/insurance/allianz";
import { TrustBanner } from "../banners/trust-banner";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface PaymentButtonProps {
  match: any;
}

export function PaymentButton({ match }: PaymentButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showDetails, setShowDetails] = useState(false);
  const [insurance, setInsurance] = useState(false);
  const [useCredits, setUseCredits] = useState(false);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Check if user has active subscription
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
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("users")
        .select("subscription_status")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const hasActiveSubscription =
    userData?.subscription_status === "active" ||
    userData?.subscription_status === "trialing";

  // Get user history for dynamic fee calculation
  const { data: userHistory } = useQuery({
    queryKey: ["user-history", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("users")
        .select("completed_deliveries_count, average_rating, referral_credits, supporter_status")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Check if this is user's first delivery
  const isFirstDelivery = (userHistory?.completed_deliveries_count || 0) === 0;
  const isSupporter = userHistory?.supporter_status === "active";

  const trip = match.trips;
  const request = match.requests;
  const reward = Number(match.reward_amount ?? 0);
  const itemCost = Number(request.value_usd ?? 0);

  // Calculate dynamic platform fee
  const platformFeePercent = calculatePlatformFee({
    method: trip.type,
    userId: user?.id || "",
    userCompletedDeliveries: userHistory?.completed_deliveries_count || 0,
    userRating: userHistory?.average_rating || 5.0,
    isSubscriber: hasActiveSubscription,
    isFirstDelivery,
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

  const availableCredits = userHistory?.referral_credits || 0;
  const maxCreditsUsable = Math.min(
    availableCredits,
    platformFee + reward // Credits can only be used on platform fee or reward
  );
  const creditsToUse = useCredits ? maxCreditsUsable : 0;

  const total = Math.max(0, totalBeforeCredits - creditsToUse);
  const creditLimitDisplay = Math.max(0, maxCreditsUsable);
  const canSubmitPayment = total > 0;
  const formattedPlatformFeePercent = `${(platformFeePercent * 100).toFixed(1)}%`;

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
      {/* Trust Banners */}
      <div className="mb-4 space-y-3">
        {isFirstDelivery && <TrustBanner variant="first-delivery" />}
        {isPromoPeriodActive() && <TrustBanner variant="promo-period" />}
      </div>

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
              <span>${reward.toLocaleString()}</span>
            </div>
            {itemCost > 0 && (
              <div className="flex justify-between text-sm">
                <span>Item Cost</span>
                <span>${itemCost.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>
                Platform Fee ({formattedPlatformFeePercent})
                {hasActiveSubscription && (
                  <span className="ml-2 text-xs text-green-600 font-medium">
                    (Pro - waived)
                  </span>
                )}
                {isFirstDelivery && (
                  <span className="ml-2 text-xs text-teal-600 font-medium">
                    (First delivery - free!)
                  </span>
                )}
                {!isFirstDelivery && isPromoPeriodActive() && (
                  <span className="ml-2 text-xs text-blue-600 font-medium">
                    (Promo - waived)
                  </span>
                )}
                {isSupporter && (
                  <span className="ml-2 text-xs text-blue-600 font-medium">
                    (Supporter perk)
                  </span>
                )}
              </span>
              <span>
                {platformFee <= 0 ? (
                  <span className="text-green-600 font-medium">$0.00</span>
                ) : (
                  `$${platformFee.toFixed(2)}`
                )}
              </span>
            </div>
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
                        Coverage: ${insuranceQuote.coverage_amount.toLocaleString()} • 
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
                      -${creditsToUse.toFixed(2)}
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
            
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
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
                {creatingIntent
                  ? "Preparing checkout..."
                  : `Pay $${total.toFixed(2)} & Lock in Escrow`}
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

