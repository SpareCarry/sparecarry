import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { createGroupBuyRequestSchema } from "../../../lib/zod/api-schemas";
import { rateLimit, apiRateLimiter } from "@/lib/security/rate-limit";
import { assertAuthenticated } from "@/lib/security/auth-guards";
import { validateRequestBody } from "@/lib/security/validation";
import { errorResponse, successResponse } from "@/lib/security/api-response";
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
  const validation = validateRequestBody(createGroupBuyRequestSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { tripId, maxParticipants, discountPercent } = validation.data;
  
  // Get trip to extract from/to locations
  const { data: trip } = await supabase
    .from("trips")
    .select("from_location, to_location")
    .eq("id", tripId)
    .single();

  if (!trip) {
    return NextResponse.json(
      { error: "Trip not found" },
      { status: 404 }
    );
  }

  const fromLocation = trip.from_location;
  const toLocation = trip.to_location;

    const { data: groupBuy, error } = await supabase
      .from("group_buys")
      .insert({
        trip_id: tripId,
        from_location: fromLocation,
        to_location: toLocation,
        organizer_id: user.id,
        max_participants: maxParticipants || 10,
        current_participants: 1,
        discount_percent: discountPercent || 0,
        status: "open",
      })
      .select()
      .single();

    if (error) throw error;

    return successResponse({ success: true, groupBuy });
});

