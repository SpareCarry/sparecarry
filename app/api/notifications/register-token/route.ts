import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { registerPushTokenRequestSchema } from "../../../lib/zod/api-schemas";
import { rateLimit, apiRateLimiter } from "@/lib/security/rate-limit";
import { assertAuthenticated } from "@/lib/security/auth-guards";
import { validateRequestBody } from "@/lib/security/validation";
import { errorResponse, successResponse } from "@/lib/security/api-response";
import { safeLog } from "@/lib/security/auth-guards";
import { withApiErrorHandler } from "@/lib/api/error-handler";

export const POST = withApiErrorHandler(async function POST(request: NextRequest) {
  // Rate limiting (stricter for token registration)
  const rateLimitResult = await rateLimit(request, apiRateLimiter);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: rateLimitResult.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  // Authentication
  const user = await assertAuthenticated(request);

  // Validate request body
  const body = await request.json();
  const validation = validateRequestBody(registerPushTokenRequestSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { expoPushToken, enableNotifications } = validation.data;

    // Update user's profile with push token
    const { error } = await supabase
      .from("profiles")
      .update({
        expo_push_token: expoPushToken,
        push_notifications_enabled: enableNotifications,
      })
      .eq("user_id", user.id);

    if (error) throw error;

    return successResponse({
      success: true,
      message: "Push token registered successfully",
    });
});

