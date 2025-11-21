import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { sendNotifications } from "@/lib/notifications/push-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { matchId, recipientId, newRewardAmount } = body as {
      matchId: string;
      recipientId: string;
      newRewardAmount: number;
    };

    const [{ data: profile }, { data: user }] = await Promise.all([
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

    if (!pushToken && !user?.email) {
      return NextResponse.json({
        success: false,
        error: "No delivery channel configured for user",
      });
    }

    const pushPayload = pushToken
      ? {
          to: pushToken,
          title: "Counter Offer Received",
          body: `New counter offer: $${newRewardAmount}`,
          data: { matchId, type: "counter-offer" },
        }
      : null;

    const emailPayload = user?.email
      ? {
          to: user.email,
          subject: "New counter offer on SpareCarry",
          html: `
            <p>You just received a counter offer for $${newRewardAmount}.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://sparecarry.com"}/home/messages/${matchId}">Review and respond</a></p>
          `,
        }
      : null;

    const results = await sendNotifications({
      push: pushPayload ?? undefined,
      email: emailPayload ?? undefined,
    });

    if (results.push?.success === false || results.email?.success === false) {
      logger.warn("counter_offer_notification_partial_failure", {
        matchId,
        recipientId,
        pushError: results.push?.error,
        emailError: results.email?.error,
      });
    }

    return NextResponse.json({ success: true, delivery: results });
  } catch (error: any) {
    logger.error("send_counter_offer_notification_failed", error);
    return NextResponse.json(
      { error: error.message || "Failed to send notification" },
      { status: 500 }
    );
  }
}

