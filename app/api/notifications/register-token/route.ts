import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { expoPushToken, enableNotifications = true } = body;

    if (!expoPushToken) {
      return NextResponse.json(
        { error: "Expo push token is required" },
        { status: 400 }
      );
    }

    // Update user's profile with push token
    const { error } = await supabase
      .from("profiles")
      .update({
        expo_push_token: expoPushToken,
        push_notifications_enabled: enableNotifications,
      })
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Push token registered successfully",
    });
  } catch (error: any) {
    console.error("Error registering push token:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register push token" },
      { status: 500 }
    );
  }
}

