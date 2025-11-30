// Supabase Edge Function: Get Payment Status
// GET /functions/v1/get-payment?id={paymentId}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const paymentId = url.searchParams.get("id");

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get payment
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      return new Response(JSON.stringify({ error: "Payment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user has access to this payment
    const { data: match } = await supabaseClient
      .from("matches")
      .select("*")
      .eq("id", payment.match_id)
      .single();

    if (match) {
      if (match.traveler_id !== user.id) {
        const { data: request } = await supabaseClient
          .from("requests")
          .select("trip_id")
          .eq("id", match.request_id)
          .single();

        if (request) {
          const { data: trip } = await supabaseClient
            .from("trips")
            .select("user_id")
            .eq("id", request.trip_id)
            .single();

          if (trip?.user_id !== user.id) {
            return new Response(JSON.stringify({ error: "Forbidden" }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ data: payment }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
