import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

import { sendPushNotification } from "@/lib/notifications/push-service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { requestId, fromLocation, toLocation, reward, deadline } = body;

    // Find all verified flyers (users with verified identity) who have:
    // 1. Active plane trips on matching route
    // 2. Push notifications enabled
    // 3. Valid Expo push tokens

    // First get matching trips
    const { data: matchingTrips, error: tripsError } = await supabase
      .from("trips")
      .select("id, user_id, from_location, to_location, departure_date, eta_window_start, eta_window_end")
      .eq("type", "plane")
      .eq("status", "active")
      .eq("from_location", fromLocation)
      .eq("to_location", toLocation)
      .gte("departure_date", new Date().toISOString().split("T")[0])
      .lte("departure_date", deadline);

    if (tripsError) throw tripsError;

    if (!matchingTrips || matchingTrips.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No matching trips found",
        notified: 0,
      });
    }

    // Get user IDs from matching trips
    const userIds = matchingTrips.map((trip) => trip.user_id);

    // Get profiles for these users
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, expo_push_token, push_notifications_enabled, stripe_identity_verified_at")
      .in("user_id", userIds)
      .not("expo_push_token", "is", null)
      .eq("push_notifications_enabled", true)
      .not("stripe_identity_verified_at", "is", null);

    if (profilesError) throw profilesError;

    // Create a map of user_id to profile
    const profilesMap = new Map(
      (profiles || []).map((p) => [p.user_id, p])
    );

    // Filter to only verified users with push tokens
    const verifiedTravelers = matchingTrips
      .map((trip) => {
        const profile = profilesMap.get(trip.user_id);
        return {
          tripId: trip.id,
          userId: trip.user_id,
          pushToken: profile?.expo_push_token,
          notificationsEnabled: profile?.push_notifications_enabled !== false,
          verified: !!profile?.stripe_identity_verified_at,
        };
      })
      .filter(
        (traveler) =>
          traveler.verified &&
          traveler.notificationsEnabled &&
          traveler.pushToken
      );

    if (verifiedTravelers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No verified travelers with push notifications found",
        notified: 0,
      });
    }

    const tokens = verifiedTravelers
      .map((traveler) => traveler.pushToken)
      .filter((token): token is string => Boolean(token));

    const result = await sendPushNotification({
      to: tokens,
      sound: "foghorn",
      title: "🚨 Emergency Delivery Request",
      body: `$${reward.toLocaleString()} reward: ${fromLocation} → ${toLocation}. Need by ${new Date(
        deadline
      ).toLocaleDateString()}`,
      data: {
        type: "emergency_request",
        requestId,
        fromLocation,
        toLocation,
        reward,
        deadline,
      },
      priority: "high",
      channelId: "emergency",
    });

    return NextResponse.json({
      success: result.success,
      notified: result.success ? tokens.length : 0,
      error: result.error,
    });
  } catch (error: any) {
    console.error("Error sending emergency notifications:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send notifications" },
      { status: 500 }
    );
  }
}

