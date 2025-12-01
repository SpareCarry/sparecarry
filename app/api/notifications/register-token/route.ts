import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDevMode } from "@/config/devMode";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "token is required" },
        { status: 400 }
      );
    }

    // Get user - handle dev mode
    let user: { id: string } | null = null;

    if (isDevMode()) {
      user = { id: "dev-user-id" };
    } else {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      user = { id: authUser.id };
    }

    const supabase = await createClient();

    // Update user profile with push notification token
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        expo_push_token: token,
        push_notifications_enabled: true,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating push token:", updateError);
      return NextResponse.json(
        { error: "Failed to register token" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error registering push token:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to register push token",
      },
      { status: 500 }
    );
  }
}

