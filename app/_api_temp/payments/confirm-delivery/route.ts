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

    const body = await request.json() as { matchId: string };
    const { matchId } = body;

    // Get match details
    const { data: matchData } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (!matchData) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Verify user is the requester
    const { data: requestData } = await supabase
      .from("requests")
      .select("user_id")
      .eq("id", matchData.request_id)
      .single();

    if (requestData?.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (matchData.status !== "delivered") {
      return NextResponse.json(
        { error: "Match is not in delivered status" },
        { status: 400 }
      );
    }

    // Release payment from escrow
    if (matchData.escrow_payment_intent_id) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        matchData.escrow_payment_intent_id
      );

      // Confirm the payment intent (release from escrow)
      await stripe.paymentIntents.confirm(matchData.escrow_payment_intent_id);

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
      const { data: matchWithRelations } = await supabase
        .from("matches")
        .select(`
          requests(user_id),
          trips(user_id)
        `)
        .eq("id", matchId)
        .single();

      if (matchWithRelations) {
        // Process credits for requester
        const requests = Array.isArray(matchWithRelations.requests) ? matchWithRelations.requests[0] : matchWithRelations.requests;
        if (requests?.user_id) {
          const { processReferralCredits } = await import("../../../../lib/referrals/referral-system");
          await processReferralCredits(requests.user_id, matchId).catch(console.error);
        }

        // Process credits for traveler
        const trips = Array.isArray(matchWithRelations.trips) ? matchWithRelations.trips[0] : matchWithRelations.trips;
        if (trips?.user_id) {
          const { processReferralCredits } = await import("../../../../lib/referrals/referral-system");
          await processReferralCredits(trips.user_id, matchId).catch(console.error);
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

