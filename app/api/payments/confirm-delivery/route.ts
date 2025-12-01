import { NextRequest, NextResponse } from "next/server";
import { getStripeInstance } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { isDevMode } from "@/config/devMode";

export async function POST(request: NextRequest) {
  try {
    const body: { matchId?: string } = await request.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json(
        { error: "matchId is required" },
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

    // Get match and delivery details
    const supabase = await createClient();
    const { data: match, error: matchError }: { data: any; error: any } = await supabase
      .from("matches")
      .select(
        `
        *,
        trips!inner(user_id),
        requests!inner(user_id),
        deliveries(id, delivered_at, confirmed_at)
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

    const requestData = (match as any).requests;
    const deliveries = (match as any).deliveries || [];

    // Verify user is the requester
    if (!isDevMode() && requestData.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - not the requester" },
        { status: 403 }
      );
    }

    // Check if delivery exists and is not already confirmed
    const delivery = deliveries[0];
    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    if (delivery.confirmed_at) {
      return NextResponse.json(
        { error: "Delivery already confirmed" },
        { status: 400 }
      );
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      if (isDevMode()) {
        // In dev mode, just update the database
        await supabase
          .from("deliveries")
          .update({
            confirmed_at: new Date().toISOString(),
          })
          .eq("id", delivery.id);

        await supabase
          .from("matches")
          .update({ status: "completed" })
          .eq("id", matchId);

        return NextResponse.json({ success: true });
      }
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    // Confirm payment intent to release funds
    if (match.escrow_payment_intent_id) {
      const stripe = getStripeInstance();
      await stripe.paymentIntents.confirm(match.escrow_payment_intent_id);
    }

    // Update delivery with confirmation timestamp
    await supabase
      .from("deliveries")
      .update({
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", delivery.id);

    // Update match status to completed
    await supabase
      .from("matches")
      .update({ status: "completed" })
      .eq("id", matchId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error confirming delivery:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to confirm delivery",
      },
      { status: 500 }
    );
  }
}

