import { NextRequest, NextResponse } from "next/server";
import { getStripeInstance } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Verify CRON_SECRET authentication
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - missing Bearer token" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    if (token !== cronSecret) {
      return NextResponse.json(
        { error: "Unauthorized - invalid token" },
        { status: 401 }
      );
    }

    // Find deliveries that are 24+ hours old, not confirmed, and not disputed
    const supabase = await createClient();
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
          reward_amount
        )
      `
      )
      .is("confirmed_at", null)
      .is("dispute_opened_at", null)
      .lte("delivered_at", twentyFourHoursAgo.toISOString())
      .eq("matches.status", "delivered");

    if (fetchError) {
      console.error("Error fetching deliveries:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch deliveries" },
        { status: 500 }
      );
    }

    if (!deliveries || deliveries.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No deliveries to auto-release",
        processed: 0,
      });
    }

    const results = [];
    const stripe = process.env.STRIPE_SECRET_KEY
      ? getStripeInstance()
      : null;

    for (const delivery of deliveries) {
      const match = (delivery as any).matches;

      if (!match.escrow_payment_intent_id) {
        continue;
      }

      try {
        // Confirm payment intent to release funds
        if (stripe) {
          await stripe.paymentIntents.confirm(match.escrow_payment_intent_id);
        }

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
          deliveryId: delivery.id,
          matchId: match.id,
          status: "released",
        });
      } catch (error) {
        console.error(
          `Error auto-releasing delivery ${delivery.id}:`,
          error
        );
        results.push({
          deliveryId: delivery.id,
          matchId: match.id,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Error in auto-release cron:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process auto-release",
      },
      { status: 500 }
    );
  }
}

