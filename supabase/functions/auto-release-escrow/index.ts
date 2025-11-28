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

        // Automatically apply karma points to the traveler
        try {
          // Get full match details including request
          const { data: fullMatch } = await supabase
            .from("matches")
            .select(`
              id,
              request_id,
              reward_amount,
              platform_fee_percent,
              trips!inner(user_id),
              requests!inner(weight_kg)
            `)
            .eq("id", match.id)
            .single();

          if (fullMatch) {
            const request = (fullMatch as any).requests;
            const trip = (fullMatch as any).trips;
            
            if (request && request.weight_kg && request.weight_kg > 0 && trip) {
              // Calculate platform fee in USD
              const platformFeePercent = fullMatch.platform_fee_percent || 0;
              const platformFee = (fullMatch.reward_amount * platformFeePercent) / 100;

              // Calculate karma points: (weight * 10) + (platformFee * 2)
              const weightPoints = request.weight_kg * 10;
              const feePoints = platformFee * 2;
              const karmaPoints = Math.round(weightPoints + feePoints);

              if (karmaPoints > 0) {
                // Get current karma points
                const { data: currentUser } = await supabase
                  .from("users")
                  .select("karma_points")
                  .eq("id", trip.user_id)
                  .single();

                const currentKarma = (currentUser?.karma_points as number) || 0;
                const newKarma = currentKarma + karmaPoints;

                // Update karma points
                await supabase
                  .from("users")
                  .update({ karma_points: newKarma })
                  .eq("id", trip.user_id);

                console.log(`Applied ${karmaPoints} karma points to traveler ${trip.user_id} (total: ${newKarma})`);
              }
            }
          }
        } catch (karmaError) {
          // Log but don't fail the escrow release if karma application fails
          console.warn(`Error applying karma points for match ${match.id}:`, karmaError);
        }

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

