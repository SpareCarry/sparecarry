// Supabase Edge Function for accepting idea suggestions and granting lifetime Pro rewards
// Called by admins when accepting a user's idea suggestion

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_ACCESS_TOKEN = Deno.env.get("EXPO_ACCESS_TOKEN");

interface RequestBody {
  idea_id: string;
}

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          headers: { "Content-Type": "application/json" },
          status: 405,
        }
      );
    }

    // Parse request body
    const { idea_id }: RequestBody = await req.json();

    if (!idea_id) {
      return new Response(
        JSON.stringify({ error: "idea_id is required" }),
        {
          headers: { "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the idea
    const { data: idea, error: ideaError } = await supabase
      .from("idea_suggestions")
      .select("*")
      .eq("id", idea_id)
      .single();

    if (ideaError || !idea) {
      return new Response(
        JSON.stringify({ error: "Idea not found" }),
        {
          headers: { "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Check if already accepted
    if (idea.status === "accepted") {
      return new Response(
        JSON.stringify({ error: "Idea already accepted" }),
        {
          headers: { "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Update idea status to accepted
    const { error: updateError } = await supabase
      .from("idea_suggestions")
      .update({
        status: "accepted",
        reward_granted: true,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", idea_id);

    if (updateError) {
      throw updateError;
    }

    // Grant lifetime Pro subscription
    const { error: lifetimeError } = await supabase
      .from("users")
      .update({
        lifetime_pro: true,
        lifetime_pro_purchased_at: new Date().toISOString(),
      })
      .eq("id", idea.user_id);

    if (lifetimeError) {
      // Log error but don't fail - we can retry
      console.error("Error granting lifetime Pro:", lifetimeError);
    }

    // Get user's profile for push token
    const { data: profile } = await supabase
      .from("profiles")
      .select("expo_push_token")
      .eq("user_id", idea.user_id)
      .single();

    // Get user email from public.users table
    const { data: userData } = await supabase
      .from("users")
      .select("email")
      .eq("id", idea.user_id)
      .single();
    
    const userEmail = userData?.email || idea.user_id;

    // Send push notification if token exists
    if (profile?.expo_push_token && EXPO_ACCESS_TOKEN) {
      try {
        const pushResponse = await fetch(EXPO_PUSH_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            Authorization: `Bearer ${EXPO_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            to: profile.expo_push_token,
            title: "Your Idea Was Accepted! 🎉",
            body: "Your idea has been accepted! You now have free lifetime SpareCarry Pro.",
            sound: "default",
            data: {
              type: "idea_accepted",
              idea_id: idea_id,
            },
          }),
        });

        if (!pushResponse.ok) {
          console.warn("Failed to send push notification:", await pushResponse.text());
        }
      } catch (pushError) {
        console.error("Error sending push notification:", pushError);
        // Don't fail the request if push fails
      }
    }

    // Send email notification (fallback)
    // You can integrate with Resend or your email service here
    // For now, we'll just log it
    console.log(`Would send email to ${userEmail} about accepted idea ${idea_id}`);

    // Log analytics event
    try {
      await supabase.from("analytics_events").insert({
        event: "idea_accepted",
        data: {
          idea_id: idea_id,
          user_id: idea.user_id,
          reward_granted: true,
        },
        user_id: idea.user_id,
        platform: "web",
      });
    } catch (analyticsError) {
      console.error("Error logging analytics:", analyticsError);
      // Don't fail if analytics fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Idea accepted and lifetime Pro granted",
        idea_id: idea_id,
        user_id: idea.user_id,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in accept-idea-and-grant-reward:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to accept idea and grant reward" 
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

