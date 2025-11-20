import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { createMatchRequestSchema } from "../../../lib/zod/api-schemas";
import { rateLimit, apiRateLimiter } from "@/lib/security/rate-limit";
import { assertAuthenticated } from "@/lib/security/auth-guards";
import { validateRequestBody } from "@/lib/security/validation";
import { errorResponse, successResponse, authErrorResponse } from "@/lib/security/api-response";
import { safeLog } from "@/lib/security/auth-guards";
import { withApiErrorHandler } from "@/lib/api/error-handler";

export const POST = withApiErrorHandler(async function POST(request: NextRequest) {
  // Rate limiting
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
  const validation = validateRequestBody(createMatchRequestSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  const { tripId, requestId } = validation.data;

    // Verify user owns the request
    const { data: requestData } = await supabase
      .from("requests")
      .select("user_id, max_reward")
      .eq("id", requestId)
      .single();

    if (!requestData || requestData.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get trip details
    const { data: trip } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single();

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Check if match already exists
    const { data: existingMatch } = await supabase
      .from("matches")
      .select("id")
      .eq("trip_id", tripId)
      .eq("request_id", requestId)
      .single();

    if (existingMatch) {
      return NextResponse.json({ error: "Match already exists" }, { status: 400 });
    }

    // Create match
    const { data: match, error } = await supabase
      .from("matches")
      .insert({
        trip_id: tripId,
        request_id: requestId,
        status: "pending",
        reward_amount: requestData.max_reward,
      })
      .select()
      .single();

    if (error) throw error;

    // Send push notification to trip owner
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://sparecarry.com"}/api/notifications/send-match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          userId: trip.user_id,
          tripType: trip.type,
          rewardAmount: requestData.max_reward,
        }),
      });
    } catch (notifError) {
      console.error("Error sending match notification:", notifError);
    }

    return successResponse({ match });
});

