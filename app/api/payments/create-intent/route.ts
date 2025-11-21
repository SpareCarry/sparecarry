import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { stripe } from "../../../../lib/stripe/server";
import { calculatePlatformFee } from "../../../../lib/pricing/platform-fee";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw authError;
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, insurance, useCredits } = body as {
      matchId?: string;
      insurance?: {
        policy_number: string;
        premium: number;
        coverage_amount: number;
      } | null;
      useCredits?: boolean;
    };

    if (!matchId) {
      return NextResponse.json(
        { error: "matchId is required" },
        { status: 400 }
      );
    }

    const { data: match, error: matchError } = await supabase
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

    if (matchError) {
      throw matchError;
    }

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const tripRecord = Array.isArray(match.trips)
      ? match.trips[0]
      : match.trips;
    const requestRecord = Array.isArray(match.requests)
      ? match.requests[0]
      : match.requests;
    const tripProfile = Array.isArray(tripRecord?.profiles)
      ? tripRecord.profiles[0]
      : tripRecord?.profiles;

    if (!tripRecord || !requestRecord) {
      return NextResponse.json(
        { error: "Related trip/request not found for match" },
        { status: 400 }
      );
    }

    if (requestRecord.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!tripProfile?.stripe_account_id) {
      return NextResponse.json(
        { error: "Traveler has not set up Stripe Connect" },
        { status: 400 }
      );
    }

    const { data: requesterUser, error: requesterError } = await supabase
      .from("users")
      .select(
        "subscription_status, completed_deliveries_count, average_rating, supporter_status, referral_credits"
      )
      .eq("id", user.id)
      .single();

    if (requesterError) {
      throw requesterError;
    }

    const hasActiveSubscription =
      requesterUser?.subscription_status === "active" ||
      requesterUser?.subscription_status === "trialing";
    const isFirstDelivery =
      (requesterUser?.completed_deliveries_count || 0) === 0;
    const isSupporter = requesterUser?.supporter_status === "active";

    const platformFeePercent = calculatePlatformFee({
      method: tripRecord.type,
      userId: user.id,
      userCompletedDeliveries: requesterUser?.completed_deliveries_count || 0,
      userRating: requesterUser?.average_rating || 5.0,
      isSubscriber: hasActiveSubscription,
      isFirstDelivery,
      isSupporter,
    });

    const rewardCents = Math.round(Number(match.reward_amount ?? 0) * 100);
    const itemCostCents = Math.round(
      Number(requestRecord.value_usd ?? 0) * 100
    );
    const insurancePremiumCents = Math.round(
      Number(insurance?.premium ?? 0) * 100
    );
    const platformFeeCents = Math.round(rewardCents * platformFeePercent);

    let creditsUsedCents = 0;
    if (useCredits && requesterUser?.referral_credits) {
      const availableCreditsCents = Math.round(
        requesterUser.referral_credits * 100
      );
      const maxCreditsUsableCents = Math.min(
        availableCreditsCents,
        platformFeeCents + rewardCents
      );
      creditsUsedCents = Math.max(0, maxCreditsUsableCents);

      if (creditsUsedCents > 0) {
        const { data: creditResult, error: creditError } = await supabase.rpc(
          "use_referral_credit",
          {
            user_id: user.id,
            amount: creditsUsedCents / 100,
          }
        );

        if (creditError) {
          throw creditError;
        }

        if (creditResult === false) {
          return NextResponse.json(
            { error: "Insufficient referral credits" },
            { status: 400 }
          );
        }
      }
    }

    const platformCreditsApplied = Math.min(
      creditsUsedCents,
      platformFeeCents
    );
    const totalBeforeCreditsCents =
      rewardCents + itemCostCents + insurancePremiumCents + platformFeeCents;
    const amountCents = Math.max(
      0,
      totalBeforeCreditsCents - creditsUsedCents
    );
    const applicationFeeAmount = Math.max(
      0,
      platformFeeCents - platformCreditsApplied
    );

    if (amountCents <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      transfer_data: {
        destination: tripProfile.stripe_account_id,
      },
      application_fee_amount: applicationFeeAmount > 0 ? applicationFeeAmount : undefined,
      metadata: {
        match_id: matchId,
        user_id: user.id,
        traveler_id: tripRecord.user_id,
        platform_fee_percent: platformFeePercent.toString(),
        platform_fee_cents: platformFeeCents.toString(),
        credits_used_cents: creditsUsedCents.toString(),
        insurance_policy: insurance?.policy_number ?? "",
      },
    });

    await supabase
      .from("matches")
      .update({
        platform_fee_percent: platformFeePercent,
        insurance_policy_number: insurance?.policy_number ?? null,
        insurance_premium: insurance?.premium ?? null,
        escrow_payment_intent_id: paymentIntent.id,
      })
      .eq("id", matchId);

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

