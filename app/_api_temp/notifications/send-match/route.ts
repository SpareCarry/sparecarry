import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

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

    // Send push notification via notification service
    // TODO: requires backend push notification service setup (FCM, OneSignal, etc.)
    // For MVP, notifications are handled client-side via Capacitor PushNotifications plugin
    const { sendPushNotification } = await import("../../../../lib/notifications/push-service");
    await sendPushNotification({
      to: profile.expo_push_token,
      title: "New Match Found!",
      body: `A ${tripType} trip matches your request. Reward: $${rewardAmount}`,
      data: { matchId, type: "match" },
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

