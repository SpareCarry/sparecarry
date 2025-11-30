// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Use edge-specific env var names because Supabase CLI blocks secrets
// that start with SUPABASE_. Set these via `supabase secrets set`.
const supabaseAdmin = createClient(
  Deno.env.get("EDGE_SUPABASE_URL") ?? "",
  Deno.env.get("EDGE_SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface RequestPayload {
  request_id: string;
  from_location: string;
  to_location: string;
  departure_lat?: number;
  departure_lon?: number;
  arrival_lat?: number;
  arrival_lon?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: RequestPayload = await req.json();

    // Find users with notify_route_matches enabled who have trips matching this route
    const { data: matchingUsers, error: matchError } = await supabaseAdmin
      .from("profiles")
      .select(
        `
        user_id,
        expo_push_token,
        notify_route_matches,
        users!inner(
          id,
          trips!inner(
            id,
            from_location,
            to_location,
            departure_lat,
            departure_lon,
            arrival_lat,
            arrival_lon,
            status
          )
        )
      `
      )
      .eq("notify_route_matches", true)
      .not("expo_push_token", "is", null);

    if (matchError) {
      throw matchError;
    }

    // Filter for actual route matches (simplified - in production, use proper geospatial matching)
    const notifications: {
      token: string;
      userId: string;
      tripId: string;
    }[] = [];
    for (const profile of matchingUsers || []) {
      const trips = profile.users?.trips || [];
      for (const trip of trips) {
        if (
          trip.status === "active" &&
          (trip.from_location === payload.from_location ||
            trip.to_location === payload.to_location ||
            trip.to_location === payload.from_location ||
            trip.from_location === payload.to_location)
        ) {
          notifications.push({
            token: profile.expo_push_token,
            userId: profile.user_id,
            tripId: trip.id,
          });
          break; // Only one notification per user
        }
      }
    }

    // Send push notifications via Expo
    if (notifications.length > 0) {
      const expoPushMessages = notifications.map((notif) => ({
        to: notif.token,
        sound: "default",
        title: "New Route Match! 🎯",
        body: `Someone needs something from ${payload.from_location} to ${payload.to_location}`,
        data: {
          type: "route_match",
          request_id: payload.request_id,
          trip_id: notif.tripId,
          deep_link: `/home/requests/${payload.request_id}`,
        },
      }));

      const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(expoPushMessages),
      });

      if (!expoResponse.ok) {
        console.error(
          "Failed to send Expo push notifications:",
          await expoResponse.text()
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: notifications.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in notify-route-matches:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
