import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as Notifications from "expo-notifications";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { matchId, userId, tripType, rewardAmount } = body;

    // Get user's push token
    const { data: profile } = await supabase
      .from("profiles")
      .select("expo_push_token, push_notifications_enabled")
      .eq("user_id", userId)
      .single();

    if (!profile?.expo_push_token || !profile.push_notifications_enabled) {
      return NextResponse.json({ success: false, error: "No push token" });
    }

    // Determine sound based on trip type
    const sound = tripType === "boat" ? "boat_horn" : "airplane_ding";
    const emoji = tripType === "boat" ? "⚓" : "✈";

    // Send push notification
    await Notifications.sendPushNotificationAsync({
      to: profile.expo_push_token,
      sound: sound === "boat_horn" ? "boat-horn.mp3" : "airplane-ding.mp3",
      title: `${emoji} New Match Found!`,
      body: `Match worth $${rewardAmount.toFixed(0)} – tap to view`,
      data: {
        type: "match",
        matchId,
        tripType,
        rewardAmount,
        sound,
      },
      priority: "high",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending match notification:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send notification" },
      { status: 500 }
    );
  }
}

