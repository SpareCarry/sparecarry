import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";

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
    const { matchId } = body;

    // Get match details
    const { data: match } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Verify user is the requester
    const { data: request } = await supabase
      .from("requests")
      .select("user_id")
      .eq("id", match.request_id)
      .single();

    if (request?.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (match.status !== "delivered") {
      return NextResponse.json(
        { error: "Match is not in delivered status" },
        { status: 400 }
      );
    }

    // Release payment from escrow
    if (match.escrow_payment_intent_id) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        match.escrow_payment_intent_id
      );

      // Confirm the payment intent (release from escrow)
      await stripe.paymentIntents.confirm(match.escrow_payment_intent_id);

      // Update match status to completed
      await supabase
        .from("matches")
        .update({ status: "completed" })
        .eq("id", matchId);

      // Update delivery confirmed_at
      await supabase
        .from("deliveries")
        .update({ confirmed_at: new Date().toISOString() })
        .eq("match_id", matchId);

      // Process referral credits if this is user's first completed delivery
      const { data: matchData } = await supabase
        .from("matches")
        .select(`
          requests(user_id),
          trips(user_id)
        `)
        .eq("id", matchId)
        .single();

      if (matchData) {
        // Process credits for requester
        if (matchData.requests?.user_id) {
          const { processReferralCredits } = await import("@/lib/referrals/referral-system");
          await processReferralCredits(matchData.requests.user_id, matchId).catch(console.error);
        }

        // Process credits for traveler
        if (matchData.trips?.user_id) {
          const { processReferralCredits } = await import("@/lib/referrals/referral-system");
          await processReferralCredits(matchData.trips.user_id, matchId).catch(console.error);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error confirming delivery:", error);
    return NextResponse.json(
      { error: error.message || "Failed to confirm delivery" },
      { status: 500 }
    );
  }
}

