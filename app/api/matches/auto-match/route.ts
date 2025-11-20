import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { autoMatchRequestSchema } from "../../../lib/zod/api-schemas";
import type { AutoMatchRequest, AutoMatchResponse } from "../../../types/api";
import type { Trip, Request as RequestType } from "../../../types/supabase";
import { rateLimit, apiRateLimiter } from "@/lib/security/rate-limit";
import { assertAuthenticated } from "@/lib/security/auth-guards";
import { validateRequestBody } from "@/lib/security/validation";
import { errorResponse, successResponse } from "@/lib/security/api-response";
import { safeLog } from "@/lib/security/auth-guards";
import { withApiErrorHandler } from "@/lib/api/error-handler";
import { logger } from "@/lib/logger";

// This runs when a new trip or request is created
export const POST = withApiErrorHandler(async function POST(
  request: NextRequest
): Promise<NextResponse<AutoMatchResponse>> {
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
    const validation = validateRequestBody(autoMatchRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { type, id } = validation.data;
    const supabase = await createClient();

    if (type === "trip") {
      // Find matching requests
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .select("*")
        .eq("id", id)
        .single<Trip>();

      if (tripError || !trip) {
        safeLog('warn', 'Auto-match: Trip not found', { tripId: id, userId: user.id });
        return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
      }

      // Verify trip ownership (RLS check)
      if (trip.user_id !== user.id) {
        safeLog('warn', 'Auto-match: Unauthorized trip access', { tripId: id, userId: user.id });
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
      }

      // Find matching requests
      const { data: requests, error: requestsError } = await supabase
        .from("requests")
        .select("*")
        .eq("status", "open")
        .eq("from_location", trip.from_location)
        .eq("to_location", trip.to_location)
        .gte("deadline_latest", trip.eta_window_start || "")
        .lte("deadline_earliest", trip.eta_window_end || "")
        .lte("weight_kg", trip.spare_kg)
        .or(
          `preferred_method.eq.${trip.type},preferred_method.eq.any`
        ) as { data: RequestType[] | null; error: unknown };

      if (requestsError) {
        safeLog('error', 'Auto-match: Failed to query requests', { tripId: id });
        return errorResponse(requestsError, 500);
      }

      // Create matches for each matching request
      for (const req of requests || []) {
        // Check if match already exists
        const { data: existing } = await supabase
          .from("matches")
          .select("id")
          .eq("trip_id", id)
          .eq("request_id", req.id)
          .single();

        if (!existing) {
          const { error: insertError } = await supabase.from("matches").insert({
            trip_id: id,
            request_id: req.id,
            status: "pending" as const,
            reward_amount: req.max_reward,
          });

          if (insertError) {
            logger.error("Error creating match", insertError, { tripId: id, requestId: req.id });
            continue;
          }

          // Send notification and email (stubbed for MVP)
          // TODO: requires backend push notification service setup
          // For MVP, notifications are handled client-side via Capacitor PushNotifications plugin
          const { sendNotifications } = await import("../../../../lib/notifications/push-service");
          // Get requester's profile for notifications
          const { data: requesterProfile } = await supabase
            .from("profiles")
            .select("expo_push_token, push_notifications_enabled")
            .eq("user_id", req.user_id)
            .single();
          
          if (requesterProfile?.expo_push_token && requesterProfile.push_notifications_enabled) {
            await sendNotifications(
              {
                to: requesterProfile.expo_push_token,
                title: "New Match Found!",
                body: `A trip matches your request from ${req.from_location} to ${req.to_location}`,
                data: { matchId: req.id, type: "match" },
              },
              {
                to: req.user_id, // Will need to get email from users table
                subject: "New Match Found on SpareCarry",
                html: `<p>A trip matches your request from ${req.from_location} to ${req.to_location}.</p>`,
              }
            );
          }
        }
      }
    } else if (type === "request") {
      // Find matching trips
      const { data: requestData, error: requestError } = await supabase
        .from("requests")
        .select("*")
        .eq("id", id)
        .single<RequestType>();

      if (requestError || !requestData) {
        safeLog('warn', 'Auto-match: Request not found', { requestId: id, userId: user.id });
        return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
      }

      // Verify request ownership (RLS check)
      if (requestData.user_id !== user.id) {
        safeLog('warn', 'Auto-match: Unauthorized request access', { requestId: id, userId: user.id });
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
      }

      // Find matching trips
      const { data: trips, error: tripsError } = await supabase
        .from("trips")
        .select("*")
        .eq("status", "active")
        .eq("from_location", requestData.from_location)
        .eq("to_location", requestData.to_location)
        .gte("eta_window_start", requestData.deadline_earliest || "1970-01-01")
        .lte("eta_window_end", requestData.deadline_latest)
        .gte("spare_kg", requestData.weight_kg)
        .or(
          `type.eq.${requestData.preferred_method},preferred_method.eq.any`
        ) as { data: Trip[] | null; error: unknown };

      if (tripsError) {
        safeLog('error', 'Auto-match: Failed to query trips', { requestId: id });
        return errorResponse(tripsError, 500);
      }

      // Create matches for each matching trip
      for (const trip of trips || []) {
        // Check if match already exists
        const { data: existing } = await supabase
          .from("matches")
          .select("id")
          .eq("trip_id", trip.id)
          .eq("request_id", id)
          .single();

        if (!existing) {
          const { error: insertError } = await supabase.from("matches").insert({
            trip_id: trip.id,
            request_id: id,
            status: "pending" as const,
            reward_amount: requestData.max_reward,
          });

          if (insertError) {
            logger.error("Error creating match", insertError, { tripId: id, requestId: req.id });
            continue;
          }

          // Send notification and email (stubbed for MVP)
          // TODO: requires backend push notification service setup
          // For MVP, notifications are handled client-side via Capacitor PushNotifications plugin
          const { sendNotifications } = await import("../../../../lib/notifications/push-service");
          // Get requester's profile for notifications
          const { data: requesterProfile } = await supabase
            .from("profiles")
            .select("expo_push_token, push_notifications_enabled")
            .eq("user_id", req.user_id)
            .single();
          
          if (requesterProfile?.expo_push_token && requesterProfile.push_notifications_enabled) {
            await sendNotifications(
              {
                to: requesterProfile.expo_push_token,
                title: "New Match Found!",
                body: `A trip matches your request from ${req.from_location} to ${req.to_location}`,
                data: { matchId: req.id, type: "match" },
              },
              {
                to: req.user_id, // Will need to get email from users table
                subject: "New Match Found on SpareCarry",
                html: `<p>A trip matches your request from ${req.from_location} to ${req.to_location}.</p>`,
              }
            );
          }
        }
      }
    }

    return successResponse({ success: true });
  },
  'Failed to auto-match'
);

