import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { stripe } from "../../../../lib/stripe/server";

// This endpoint should be called by a cron job or scheduled function
// Checks for deliveries that are 24+ hours old and haven't been confirmed
// Auto-releases escrow payment to traveler

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify this is called from a trusted source (cron job, etc.)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find deliveries that are 24+ hours old, not confirmed, and not disputed
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: deliveries, error: fetchError } = await supabase
      .from("deliveries")
      .select(
        `
        *,
        matches!inner(
          id,
          status,
          escrow_payment_intent_id,
          reward_amount,
          trips!inner(user_id, profiles!trips_user_id_fkey(stripe_account_id))
        )
      `
      )
      .is("confirmed_at", null) // Not yet confirmed
      .is("dispute_opened_at", null) // No dispute
      .lte("delivered_at", twentyFourHoursAgo.toISOString())
      .eq("matches.status", "delivered");

    if (fetchError) throw fetchError;

    const results = [];

    for (const delivery of deliveries || []) {
      const match = delivery.matches;
      
      if (!match.escrow_payment_intent_id) {
        console.log(`Match ${match.id} has no payment intent, skipping`);
        continue;
      }

      try {
        // Retrieve payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(
          match.escrow_payment_intent_id
        );

        // Confirm the payment intent (release from escrow)
        await stripe.paymentIntents.confirm(match.escrow_payment_intent_id);

        // Update delivery with auto-release timestamp
        await supabase
          .from("deliveries")
          .update({
            confirmed_at: new Date().toISOString(),
            auto_release_at: new Date().toISOString(),
          })
          .eq("id", delivery.id);

        // Update match status to completed
        await supabase
          .from("matches")
          .update({ status: "completed" })
          .eq("id", match.id);

        results.push({
          matchId: match.id,
          deliveryId: delivery.id,
          status: "released",
        });
      } catch (error: any) {
        console.error(`Error auto-releasing match ${match.id}:`, error);
        results.push({
          matchId: match.id,
          deliveryId: delivery.id,
          status: "error",
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error("Error in auto-release:", error);
    return NextResponse.json(
      { error: error.message || "Failed to auto-release escrow" },
      { status: 500 }
    );
  }
}

