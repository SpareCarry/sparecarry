// Supabase Edge Function: Create Dispute
// POST /functions/v1/create-dispute

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

    const body = await req.json();
    const { match_id, reason } = body;

    if (!match_id || !reason) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: match_id, reason" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user has access to this match
    const { data: match, error: matchError } = await supabaseClient
      .from("matches")
      .select("*")
      .eq("id", match_id)
      .single();

    if (matchError || !match) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is part of this match
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

    // Check if dispute already exists
    const { data: existingDispute } = await supabaseClient
      .from("disputes")
      .select("id")
      .eq("match_id", match_id)
      .eq("status", "open")
      .single();

    if (existingDispute) {
      return new Response(
        JSON.stringify({ error: "Open dispute already exists for this match" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update match status to disputed
    await supabaseClient
      .from("matches")
      .update({ status: "disputed" })
      .eq("id", match_id);

    // Create dispute
    const { data: dispute, error } = await supabaseClient
      .from("disputes")
      .insert({
        match_id,
        opened_by: user.id,
        reason,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data: dispute }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
