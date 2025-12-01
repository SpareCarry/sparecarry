import { NextRequest, NextResponse } from "next/server";
import { getStripeInstance } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { isDevMode } from "@/config/devMode";

export async function POST(request: NextRequest) {
  try {
    const body: { matchId?: string; amount?: number; insurance?: boolean; useCredits?: boolean } = await request.json();
    const { matchId, amount, insurance, useCredits } = body;

    if (!matchId || !amount) {
      return NextResponse.json(
        { error: "matchId and amount are required" },
        { status: 400 }
      );
    }

    // Get user - handle dev mode
    let user: { id: string } | null = null;

    if (isDevMode()) {
      user = { id: "dev-user-id" };
    } else {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      user = { id: authUser.id };
    }

    // Get match details
    const supabase = await createClient();
    const { data: match, error: matchError }: { data: any; error: any } = await supabase
      .from("matches")
      .select(
        `
        *,
        trips!inner(user_id, profiles!trips_user_id_fkey(stripe_account_id)),
        requests!inner(user_id)
      `
      )
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Verify user is the requester
    const trip = (match as any).trips;
    const requestData = (match as any).requests;

    if (!isDevMode() && requestData.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - not the requester" },
        { status: 403 }
      );
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      if (isDevMode()) {
        // Return mock payment intent in dev mode
        return NextResponse.json({
          clientSecret: "pi_test_mock_secret",
          paymentIntentId: "pi_test_mock",
        });
      }
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const stripe = getStripeInstance();

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: "usd",
      metadata: {
        matchId,
        userId: user.id,
      },
      // If traveler has Stripe account, use connected account
      ...(trip.profiles?.stripe_account_id
        ? {
            application_fee_amount: Math.round(
              (amount * (match.platform_fee_percent || 0)) / 100
            ),
            transfer_data: {
              destination: trip.profiles.stripe_account_id,
            },
          }
        : {}),
    });

    // Update match with payment intent ID
    await supabase
      .from("matches")
      .update({
        escrow_payment_intent_id: paymentIntent.id,
      })
      .eq("id", matchId);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create payment intent",
      },
      { status: 500 }
    );
  }
}

