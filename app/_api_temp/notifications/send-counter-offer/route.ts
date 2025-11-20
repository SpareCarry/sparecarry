import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { matchId, recipientId, newRewardAmount } = body;

    // Get recipient's push token
    const { data: profile } = await supabase
      .from("profiles")
      .select("expo_push_token, push_notifications_enabled")
      .eq("user_id", recipientId)
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
      title: "Counter Offer Received",
      body: `New counter offer: $${newRewardAmount}`,
      data: { matchId, type: "counter-offer" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending counter-offer notification:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send notification" },
      { status: 500 }
    );
  }
}

