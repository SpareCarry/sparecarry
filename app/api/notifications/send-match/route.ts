import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { sendMatchNotificationRequestSchema } from "../../../lib/zod/api-schemas";
import type { SendMatchNotificationRequest, NotificationResponse } from "../../../types/api";
import type { Profile } from "../../../types/supabase";
import { rateLimit, apiRateLimiter } from "@/lib/security/rate-limit";
import { assertAuthenticated } from "@/lib/security/auth-guards";
import { validateRequestBody } from "@/lib/security/validation";
import { errorResponse, successResponse } from "@/lib/security/api-response";
import { safeLog } from "@/lib/security/auth-guards";

export async function POST(request: NextRequest): Promise<NextResponse<NotificationResponse>> {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, apiRateLimiter);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: rateLimitResult.error },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // Authentication
    const user = await assertAuthenticated(request);

    // Validate request body
    const body = await request.json();
    const validation = validateRequestBody(sendMatchNotificationRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const parsedBody = validation.data;
    const supabase = await createClient();
    const { matchId, userId, tripType, rewardAmount } = parsedBody;

    // Get user's push token
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("expo_push_token, push_notifications_enabled")
      .eq("user_id", userId)
      .single<Pick<Profile, "expo_push_token" | "push_notifications_enabled">>();

    if (!profile?.expo_push_token || !profile.push_notifications_enabled) {
      return NextResponse.json({ success: false, error: "No push token" });
    }

    // Send push notification via notification service
    // TODO: requires backend push notification service setup (FCM, OneSignal, etc.)
    // For MVP, notifications are handled client-side via Capacitor PushNotifications plugin
    const { sendPushNotification } = await import("../../../lib/notifications/push-service");
    await sendPushNotification({
      to: profile.expo_push_token,
      title: "New Match Found!",
      body: `A ${tripType} trip matches your request. Reward: $${rewardAmount}`,
      data: { matchId, type: "match" },
    });

    return successResponse({ success: true });
  } catch (error) {
    safeLog('error', 'Send match notification: Unexpected error', {});
    return errorResponse(error, 500);
  }
}

