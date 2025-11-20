import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { stripe } from "../../../../lib/stripe/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { matchId, stripeAccountId, amount } = body;

    if (!matchId || !stripeAccountId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get match details
    const { data: match } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Create Stripe transfer
    const transfer = await stripe.transfers.create({
      amount,
      currency: "usd",
      destination: stripeAccountId,
      metadata: {
        match_id: matchId,
        admin_user_id: user.id,
        type: "manual_payout",
      },
    });

    // Update match to mark payout as processed
    // You might want to add a payout_processed_at field to track this
    await supabase
      .from("matches")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchId);

    return NextResponse.json({
      success: true,
      transferId: transfer.id,
      amount: amount / 100, // Convert back to dollars
    });
  } catch (error: any) {
    console.error("Error processing payout:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payout" },
      { status: 500 }
    );
  }
}

