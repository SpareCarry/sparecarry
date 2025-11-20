import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { stripe } from "../../../../lib/stripe/server";
import { calculatePlatformFee, isPromoPeriodActive } from "../../../../lib/pricing/platform-fee";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, amount, insurance, useCredits } = body; // insurance: { policy_number, premium, coverage_amount } | null, useCredits: boolean

    // Get match details
    const { data: match } = await supabase
      .from("matches")
      .select(
        `
        *,
        trips(*, profiles!trips_user_id_fkey(stripe_account_id)),
        requests(*)
      `
      )
      .eq("id", matchId)
      .single();

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Verify user is the requester
    if (match.requests.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get requester user data for dynamic fee calculation
    const { data: requesterUser } = await supabase
      .from("users")
      .select("subscription_status, completed_deliveries_count, average_rating, supporter_status, referral_credits")
      .eq("id", user.id)
      .single();

    const hasActiveSubscription =
      requesterUser?.subscription_status === "active" ||
      requesterUser?.subscription_status === "trialing";

    const trip = match.trips;
    const travelerStripeAccount = trip.profiles?.stripe_account_id;

    if (!travelerStripeAccount) {
      return NextResponse.json(
        { error: "Traveler has not set up Stripe Connect" },
        { status: 400 }
      );
    }

    // Check if this is requester's first delivery
    const isFirstDelivery = (requesterUser?.completed_deliveries_count || 0) === 0;
    const isSupporter = requesterUser?.supporter_status === "active";

    // Calculate dynamic platform fee
    const platformFeePercent = calculatePlatformFee({
      method: trip.type,
      userId: user.id,
      userCompletedDeliveries: requesterUser?.completed_deliveries_count || 0,
      userRating: requesterUser?.average_rating || 5.0,
      isSubscriber: hasActiveSubscription,
      isFirstDelivery,
      isSupporter,
    });

    // Calculate platform fee amount (already 0 if first delivery or promo period)
    const platformFeeAmount = Math.round(amount * platformFeePercent);

    // Apply referral credits if requested and available
    let creditsUsed = 0;
    if (useCredits && requesterUser?.referral_credits) {
      const availableCredits = requesterUser.referral_credits;
      // Credits can only be used on platform fee or reward (not item cost)
      const maxCreditsUsable = Math.min(
        availableCredits,
        platformFeeAmount + Math.round(match.reward_amount * 100) // Convert reward to cents
      );
      creditsUsed = Math.min(maxCreditsUsable, availableCredits);
      
      if (creditsUsed > 0) {
        // Deduct credits
        await supabase.rpc("use_referral_credit", {
          user_id: user.id,
          amount: creditsUsed / 100, // Convert cents to dollars
        });
      }
    }

    // Update match with platform fee percent
    await supabase
      .from("matches")
      .update({ platform_fee_percent: platformFeePercent })
      .eq("id", matchId);

    // Update match with insurance info if provided
    if (insurance) {
      await supabase
        .from("matches")
        .update({
          insurance_policy_number: insurance.policy_number,
          insurance_premium: insurance.premium,
        })
        .eq("id", matchId);
    }

    // Calculate final amount after credits
    const finalAmount = Math.max(0, amount - creditsUsed);
    
    // Create payment intent with application fee (already 0 if first delivery, promo period, or subscriber)
    const applicationFeeAmount = Math.max(0, Math.round(finalAmount * platformFeePercent));

    const paymentIntentParams: any = {
      amount: finalAmount,
      currency: "usd",
      transfer_data: {
        destination: travelerStripeAccount,
      },
      metadata: {
        match_id: matchId,
        user_id: user.id,
        traveler_id: trip.user_id,
        insurance_policy: insurance?.policy_number || "",
        platform_fee_percent: platformFeePercent.toString(),
        credits_used: creditsUsed.toString(),
      },
    };

    // Only add application fee if platform fee applies (not first delivery, not promo period, not subscriber)
    if (applicationFeeAmount > 0) {
      paymentIntentParams.application_fee_amount = applicationFeeAmount;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment intent" },
      { status: 500 }
    );
  }
}

