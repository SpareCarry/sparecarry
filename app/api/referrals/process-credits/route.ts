import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { processReferralCredits } from "../../../lib/referrals/referral-system";
import { processReferralCreditsRequestSchema } from "../../../lib/zod/api-schemas";
import { rateLimit, apiRateLimiter } from "@/lib/security/rate-limit";
import { assertAuthenticated } from "@/lib/security/auth-guards";
import { validateRequestBody } from "@/lib/security/validation";
import { errorResponse, successResponse } from "@/lib/security/api-response";
import { safeLog } from "@/lib/security/auth-guards";
import { withApiErrorHandler } from "@/lib/api/error-handler";

// Called when a match is completed to process referral credits
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
  const validation = validateRequestBody(processReferralCreditsRequestSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  const { matchId, userId } = validation.data;

  // Verify user can process credits for this userId
  if (userId !== user.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  await processReferralCredits(userId, matchId);

  return successResponse({ success: true });
});

