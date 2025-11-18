// Supabase Edge Function for auto-releasing escrow
// Schedule this to run every hour using Supabase Cron or external scheduler

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      .is("confirmed_at", null)
      .is("dispute_opened_at", null)
      .lte("delivered_at", twentyFourHoursAgo.toISOString())
      .eq("matches.status", "delivered");

    if (fetchError) throw fetchError;

    const results = [];

    for (const delivery of deliveries || []) {
      const match = delivery.matches;

      if (!match.escrow_payment_intent_id) {
        continue;
      }

      try {
        // Call Stripe API to confirm payment intent
        const stripeResponse = await fetch(
          `https://api.stripe.com/v1/payment_intents/${match.escrow_payment_intent_id}/confirm`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${stripeSecretKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        if (!stripeResponse.ok) {
          throw new Error(`Stripe API error: ${await stripeResponse.text()}`);
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

    return new Response(
      JSON.stringify({
        processed: results.length,
        results,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to auto-release escrow" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

