import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

// This runs when a new trip or request is created
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json() as { type: "trip" | "request"; id: string };
    const { type, id } = body; // type: "trip" | "request", id: trip_id or request_id

    if (type === "trip") {
      // Find matching requests
      const { data: trip } = await supabase
        .from("trips")
        .select("*")
        .eq("id", id)
        .single();

      if (!trip) {
        return NextResponse.json({ error: "Trip not found" }, { status: 404 });
      }

      // Find matching requests
      const { data: requests } = await supabase
        .from("requests")
        .select("*")
        .eq("status", "open")
        .eq("from_location", trip.from_location)
        .eq("to_location", trip.to_location)
        .gte("deadline_latest", trip.eta_window_start)
        .lte("deadline_earliest", trip.eta_window_end)
        .lte("weight_kg", trip.spare_kg)
        .or(
          `preferred_method.eq.${trip.type},preferred_method.eq.any`
        );

      // Create matches for each matching request
      for (const req of requests || []) {
        // Check if match already exists
        const { data: existing } = await supabase
          .from("matches")
          .select("id")
          .eq("trip_id", id)
          .eq("request_id", req.id)
          .single();

        if (!existing) {
          await supabase.from("matches").insert({
            trip_id: id,
            request_id: req.id,
            status: "pending",
            reward_amount: req.max_reward,
          });

          // Send notification and email (stubbed for MVP)
          // TODO: requires backend push notification service setup
          // For MVP, notifications are handled client-side via Capacitor PushNotifications plugin
          const { sendNotifications } = await import("../../../../lib/notifications/push-service");
          // Get requester's profile for notifications
          const [{ data: requesterProfile }, { data: requesterUser }] = await Promise.all([
            supabase
              .from("profiles")
              .select("expo_push_token, push_notifications_enabled")
              .eq("user_id", req.user_id)
              .single(),
            supabase
              .from("users")
              .select("email")
              .eq("id", req.user_id)
              .single(),
          ]);
          
          if (requesterProfile?.expo_push_token && requesterProfile.push_notifications_enabled) {
            await sendNotifications({
              push: {
                to: requesterProfile.expo_push_token,
                title: "New Match Found!",
                body: `A trip matches your request from ${req.from_location} to ${req.to_location}`,
                data: { matchId: req.id, type: "match" },
              },
              email: requesterUser?.email ? {
                to: requesterUser.email,
                subject: "New Match Found on SpareCarry",
                html: `<p>A trip matches your request from ${req.from_location} to ${req.to_location}.</p>`,
              } : null,
            });
          }
        }
      }
    } else if (type === "request") {
      // Find matching trips
      const { data: requestData } = await supabase
        .from("requests")
        .select("*")
        .eq("id", id)
        .single();

      if (!requestData) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 });
      }

      // Find matching trips
      const { data: trips } = await supabase
        .from("trips")
        .select("*")
        .eq("status", "active")
        .eq("from_location", requestData.from_location)
        .eq("to_location", requestData.to_location)
        .gte("eta_window_start", requestData.deadline_earliest || "1970-01-01")
        .lte("eta_window_end", requestData.deadline_latest)
        .gte("spare_kg", requestData.weight_kg)
        .or(
          `type.eq.${requestData.preferred_method},preferred_method.eq.any`
        );

      // Create matches for each matching trip
      for (const trip of trips || []) {
        // Check if match already exists
        const { data: existing } = await supabase
          .from("matches")
          .select("id")
          .eq("trip_id", trip.id)
          .eq("request_id", id)
          .single();

        if (!existing) {
          await supabase.from("matches").insert({
            trip_id: trip.id,
            request_id: id,
            status: "pending",
            reward_amount: requestData.max_reward,
          });

          // Send notification and email (stubbed for MVP)
          // TODO: requires backend push notification service setup
          // For MVP, notifications are handled client-side via Capacitor PushNotifications plugin
          const { sendNotifications } = await import("../../../../lib/notifications/push-service");
          // Get requester's profile and email for notifications
          const [{ data: requesterProfile }, { data: requesterUser }] = await Promise.all([
            supabase
              .from("profiles")
              .select("expo_push_token, push_notifications_enabled")
              .eq("user_id", requestData.user_id)
              .single(),
            supabase
              .from("users")
              .select("email")
              .eq("id", requestData.user_id)
              .single(),
          ]);
          
          if (requesterProfile?.expo_push_token && requesterProfile.push_notifications_enabled) {
            await sendNotifications({
              push: {
                to: requesterProfile.expo_push_token,
                title: "New Match Found!",
                body: `A trip matches your request from ${requestData.from_location} to ${requestData.to_location}`,
                data: { matchId: requestData.id, type: "match" },
              },
              email: requesterUser?.email ? {
                to: requesterUser.email,
                subject: "New Match Found on SpareCarry",
                html: `<p>A trip matches your request from ${requestData.from_location} to ${requestData.to_location}.</p>`,
              } : null,
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error auto-matching:", error);
    return NextResponse.json(
      { error: error.message || "Failed to auto-match" },
      { status: 500 }
    );
  }
}

