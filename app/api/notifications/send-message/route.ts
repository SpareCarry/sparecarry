import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { sendNotifications } from "@/lib/notifications/push-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { matchId, recipientId, senderName, messagePreview } = body as {
      matchId: string;
      recipientId: string;
      senderName?: string;
      messagePreview?: string;
    };

    const [{ data: profile }, { data: recipientUser }] = await Promise.all([
      supabase
        .from("profiles")
        .select("expo_push_token, push_notifications_enabled")
        .eq("user_id", recipientId)
        .single(),
      supabase
        .from("users")
        .select("email")
        .eq("id", recipientId)
        .single(),
    ]);

    const pushToken =
      profile?.push_notifications_enabled && profile.expo_push_token
        ? profile.expo_push_token
        : null;

    if (!pushToken && !recipientUser?.email) {
      return NextResponse.json({
        success: false,
        error: "No delivery channel configured for user",
      });
    }

    const pushPayload = pushToken
      ? {
          to: pushToken,
          title: "New Message",
          body: `${senderName ?? "Someone"}: ${
            messagePreview || "You have a new message"
          }`,
          data: { matchId, type: "message" },
        }
      : null;

    const emailPayload = recipientUser?.email
      ? {
          to: recipientUser.email,
          subject: "You have a new message on SpareCarry",
          html: `
            <p><strong>${senderName ?? "Someone"}</strong> sent you a new message.</p>
            <p>${messagePreview || "Open the app to read and respond."}</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://sparecarry.com"}/home/messages/${matchId}">Open chat</a></p>
          `,
        }
      : null;

    const results = await sendNotifications({
      push: pushPayload ?? undefined,
      email: emailPayload ?? undefined,
    });

    if (results.push?.success === false || results.email?.success === false) {
      logger.warn("notification_partial_failure", {
        matchId,
        recipientId,
        pushError: results.push?.error,
        emailError: results.email?.error,
      });
    }

    return NextResponse.json({
      success: true,
      delivery: results,
    });
  } catch (error: any) {
    logger.error("send_message_notification_failed", error);
    return NextResponse.json(
      { error: error.message || "Failed to send notification" },
      { status: 500 }
    );
  }
}

