import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { sendNotifications } from "@/lib/notifications/push-service";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { matchId, userId, tripType, rewardAmount } = body as {
      matchId: string;
      userId: string;
      tripType: string;
      rewardAmount: number;
    };

    const [{ data: profile }, { data: user }] = await Promise.all([
      supabase
        .from("profiles")
        .select("expo_push_token, push_notifications_enabled")
        .eq("user_id", userId)
        .single(),
      supabase
        .from("users")
        .select("email")
        .eq("id", userId)
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
          title: "New Match Found!",
          body: `A ${tripType} trip matches your request. Reward: $${rewardAmount}`,
          data: { matchId, type: "match" },
        }
      : null;

    const emailPayload = user?.email
      ? {
          to: user.email,
          subject: "You have a new SpareCarry match",
          html: `
            <p>A ${tripType} trip matches your request.</p>
            <p>Reward: <strong>$${rewardAmount}</strong></p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://sparecarry.com"}/home">Review match</a></p>
          `,
        }
      : null;

    const results = await sendNotifications({
      push: pushPayload ?? undefined,
      email: emailPayload ?? undefined,
    });

    if (results.push?.success === false || results.email?.success === false) {
      logger.warn("match_notification_partial_failure", {
        matchId,
        userId,
        pushError: results.push?.error,
        emailError: results.email?.error,
      });
    }

    return NextResponse.json({ success: true, delivery: results });
  } catch (error: any) {
    logger.error("send_match_notification_failed", error);
    return NextResponse.json(
      { error: error.message || "Failed to send notification" },
      { status: 500 }
    );
  }
}

