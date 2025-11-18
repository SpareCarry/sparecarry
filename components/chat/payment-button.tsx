"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, AlertCircle, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loadStripe } from "@stripe/stripe-js";
import { useQuery } from "@tanstack/react-query";
import { calculatePlatformFee, isPromoPeriodActive } from "@/lib/pricing/platform-fee";
import { getInsuranceQuote, purchaseInsurance } from "@/lib/insurance/allianz";
import { TrustBanner } from "@/components/banners/trust-banner";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface PaymentButtonProps {
  match: any;
}

export function PaymentButton({ match }: PaymentButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [insurance, setInsurance] = useState(false);
  const [useCredits, setUseCredits] = useState(false);

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
  const reward = match.reward_amount;
  const itemCost = request.value_usd || 0;

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
        });
        setInsuranceLoading(false);
      });
    }
  }, [itemCost, request.from_location, request.to_location]);

  const insuranceCost = insurance && insuranceQuote ? insuranceQuote.premium : 0;
  
  // Calculate credits available to use
  const availableCredits = userHistory?.referral_credits || 0;
  const maxCreditsUsable = Math.min(
    availableCredits,
    platformFee + reward // Credits can only be used on platform fee or reward
  );
  const creditsToUse = useCredits ? maxCreditsUsable : 0;
  
  const total = Math.max(0, reward + itemCost + platformFee + insuranceCost - creditsToUse);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Purchase insurance if selected
      let insurancePolicyNumber = null;
      if (insurance && insuranceQuote) {
        const policy = await purchaseInsurance(
          insuranceQuote,
          match.id,
          user!.id
        );
        insurancePolicyNumber = policy.policy_number;
      }

      // Create payment intent
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          amount: Math.round((reward + itemCost + platformFee + insuranceCost) * 100), // Original amount before credits
          useCredits: useCredits && availableCredits > 0,
          insurance: insurance && insuranceQuote ? {
            policy_number: insurancePolicyNumber,
            premium: insuranceQuote.premium,
            coverage_amount: insuranceQuote.coverage_amount,
          } : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to create payment");

      const { clientSecret, paymentIntentId } = await response.json();

      // Update match with payment intent ID
      await supabase
        .from("matches")
        .update({
          escrow_payment_intent_id: paymentIntentId,
          status: "escrow_paid",
        })
        .eq("id", match.id);

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe not loaded");

      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: { token: "tok_visa" }, // In production, use actual card element
        },
      });

      if (error) throw error;

      router.refresh();
    } catch (error: any) {
      console.error("Payment error:", error);
      alert(error.message || "Payment failed");
    } finally {
      setLoading(false);
    }
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
                Platform Fee ({platformFeePercent * 100}%)
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
              </span>
              <span>
                {platformFeePercent === 0 ? (
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
            {availableCredits > 0 && !hasActiveSubscription && (
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useCredits"
                      checked={useCredits}
                      onChange={(e) => setUseCredits(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="useCredits" className="text-sm font-medium cursor-pointer">
                      Use ${availableCredits.toFixed(0)} referral credit
                    </label>
                  </div>
                  {useCredits && (
                    <span className="text-sm font-semibold text-teal-600">
                      -${creditsToUse.toFixed(2)}
                    </span>
                  )}
                </div>
                {useCredits && (
                  <p className="text-xs text-slate-500">
                    Credits can only be used on platform fees or rewards
                  </p>
                )}
              </div>
            )}
            
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <Button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {loading ? "Processing..." : "Pay & Lock in Escrow"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

