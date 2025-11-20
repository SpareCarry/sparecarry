import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { checkMatchRequestSchema, checkMatchResponseSchema } from "../../../lib/zod/api-schemas";
import type { CheckMatchRequest, CheckMatchResponse } from "../../../types/api";
import type { Trip, Request as RequestType } from "../../../types/supabase";
import { rateLimit, apiRateLimiter } from "@/lib/security/rate-limit";
import { validateRequestBody } from "@/lib/security/validation";
import { errorResponse, successResponse } from "@/lib/security/api-response";
import { withApiErrorHandler } from "@/lib/api/error-handler";

export const POST = withApiErrorHandler(async function POST(
  request: NextRequest
): Promise<NextResponse<CheckMatchResponse>> {
  // Rate limiting
  const rateLimitResult = await rateLimit(request, apiRateLimiter);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { 
        isMatch: false, 
        routeMatch: false, 
        dateOverlap: false, 
        capacityFit: false, 
        methodMatch: false,
        error: rateLimitResult.error 
      },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  // Validate request body
  const body = await request.json();
  const validation = validateRequestBody(checkMatchRequestSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { 
        isMatch: false, 
        routeMatch: false, 
        dateOverlap: false, 
        capacityFit: false, 
        methodMatch: false,
        error: validation.error 
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { tripId, requestId } = validation.data;

    // Get trip and request details
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single<Trip>();

    const { data: requestData, error: requestError } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single<RequestType>();

    if (tripError || requestError || !trip || !requestData) {
      return NextResponse.json({ 
        isMatch: false, 
        routeMatch: false, 
        dateOverlap: false, 
        capacityFit: false, 
        methodMatch: false,
        error: "Trip or request not found" 
      }, { status: 404 });
    }

    // Check route match
    const routeMatch =
      trip.from_location.toLowerCase() === requestData.from_location.toLowerCase() &&
      trip.to_location.toLowerCase() === requestData.to_location.toLowerCase();

    // Check date overlap
    let dateOverlap = false;
    if (trip.type === "plane" && trip.departure_date) {
      const tripDate = new Date(trip.departure_date);
      const requestDeadline = new Date(requestData.deadline_latest);
      dateOverlap = tripDate <= requestDeadline;
    } else if (trip.type === "boat") {
      const tripStart = new Date(trip.eta_window_start);
      const tripEnd = new Date(trip.eta_window_end);
      const requestDeadline = new Date(requestData.deadline_latest);
      dateOverlap = tripEnd >= new Date(requestData.deadline_earliest || 0) && tripStart <= requestDeadline;
    }

    // Check capacity fit
    const capacityFit = trip.spare_kg >= requestData.weight_kg;

    // Check preferred method
    const methodMatch =
      requestData.preferred_method === "any" ||
      requestData.preferred_method === trip.type;

    const isMatch = routeMatch && dateOverlap && capacityFit && methodMatch;

    return successResponse({
      isMatch,
      routeMatch,
      dateOverlap,
      capacityFit,
      methodMatch,
    });
});

