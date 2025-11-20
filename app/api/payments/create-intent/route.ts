import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { stripe } from "../../../lib/stripe/server";
import { calculatePlatformFee } from "../../../lib/pricing/platform-fee";
import { createPaymentIntentRequestSchema } from "../../../lib/zod/api-schemas";
import type { CreatePaymentIntentRequest, CreatePaymentIntentResponse } from "../../../types/api";
import type { MatchWithRelations, User } from "../../../types/supabase";
import { rateLimit, apiRateLimiter } from "@/lib/security/rate-limit";
import { assertAuthenticated } from "@/lib/security/auth-guards";
import { validateRequestBody } from "@/lib/security/validation";
import { errorResponse, successResponse, authErrorResponse, forbiddenResponse } from "@/lib/security/api-response";
import { safeLog } from "@/lib/security/auth-guards";
import { withApiErrorHandler } from "@/lib/api/error-handler";
import { logger } from "@/lib/logger";

export const POST = withApiErrorHandler(async function POST(
  request: NextRequest
): Promise<NextResponse<CreatePaymentIntentResponse>> {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, apiRateLimiter);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { clientSecret: null, paymentIntentId: "", error: rateLimitResult.error },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // Authentication
    const user = await assertAuthenticated(request);

    // Validate request body
    const body = await request.json();
    const validation = validateRequestBody(createPaymentIntentRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { clientSecret: null, paymentIntentId: "", error: validation.error },
        { status: 400 }
      );
    }

    const { matchId, amount, insurance, useCredits } = validation.data;

    // Validate amount is positive and reasonable (server-side validation)
    if (amount <= 0 || amount > 10000000) { // Max $100,000
      return NextResponse.json(
        { clientSecret: null, paymentIntentId: "", error: "Invalid amount" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get match details
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
      .single<MatchWithRelations>();

    if (matchError || !match) {
      safeLog('warn', 'Create payment intent: Match not found', { matchId, userId: user.id });
      return NextResponse.json({ clientSecret: null, paymentIntentId: "", error: "Match not found" }, { status: 404 });
    }

    // Verify user is the requester (RLS check)
    if (match.requests.user_id !== user.id) {
      safeLog('warn', 'Create payment intent: Unauthorized access', { matchId, userId: user.id, requestUserId: match.requests.user_id });
      return forbiddenResponse("Unauthorized");
    }

    // Verify match status is valid for payment
    if (match.status !== 'pending' && match.status !== 'accepted') {
      return NextResponse.json(
        { clientSecret: null, paymentIntentId: "", error: "Match is not in a valid state for payment" },
        { status: 400 }
      );
    }

    // Get requester user data for dynamic fee calculation
    const { data: requesterUser, error: userError } = await supabase
      .from("users")
      .select("subscription_status, completed_deliveries_count, average_rating, supporter_status, referral_credits")
      .eq("id", user.id)
      .single<User>();

    if (userError) {
      safeLog('error', 'Create payment intent: Failed to fetch user data', { userId: user.id });
      return errorResponse(userError, 500);
    }

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
    // IMPORTANT: All price calculations use server-side values only
    const platformFeeAmount = Math.round(amount * platformFeePercent);
    
    // Verify amount matches match reward (server-side validation)
    const expectedAmount = Math.round(match.reward_amount * 100); // Convert to cents
    if (Math.abs(amount - expectedAmount) > 100) { // Allow $1 tolerance for rounding
      safeLog('warn', 'Create payment intent: Amount mismatch', {
        providedAmount: amount,
        expectedAmount,
        matchId,
        userId: user.id,
      });
      return NextResponse.json(
        { clientSecret: null, paymentIntentId: "", error: "Amount does not match match reward" },
        { status: 400 }
      );
    }

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

    const paymentIntentParams: {
      amount: number;
      currency: string;
      transfer_data: { destination: string };
      metadata: Record<string, string>;
      application_fee_amount?: number;
    } = {
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

    return successResponse({
      clientSecret: paymentIntent.client_secret || '',
      paymentIntentId: paymentIntent.id,
    });
  },
  'Failed to create payment intent'
);

