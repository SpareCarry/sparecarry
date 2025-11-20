import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { stripe } from "../../../lib/stripe/server";
import { createStripeVerificationRequestSchema } from "../../../lib/zod/api-schemas";
import { rateLimit, apiRateLimiter } from "@/lib/security/rate-limit";
import { assertAuthenticated } from "@/lib/security/auth-guards";
import { validateRequestBody } from "@/lib/security/validation";
import { errorResponse, successResponse } from "@/lib/security/api-response";
import { safeLog } from "@/lib/security/auth-guards";
import { withApiErrorHandler } from "@/lib/api/error-handler";

export const POST = withApiErrorHandler(async function POST(request: NextRequest) {
  // Rate limiting (stricter for verification)
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
  const validation = validateRequestBody(createStripeVerificationRequestSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { userId, email } = validation.data;

  if (userId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

    // Create Stripe Identity VerificationSession
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: {
        user_id: user.id,
      },
      options: {
        document: {
          allowed_types: ["passport", "driving_license", "id_card"],
          require_matching_selfie: true,
        },
      },
    });

    // Store verification session ID in profile
    await supabase
      .from("profiles")
      .update({
        stripe_verification_session_id: verificationSession.id,
      })
      .eq("user_id", user.id);

    return successResponse({
      verificationUrl: verificationSession.url,
      sessionId: verificationSession.id,
    });
});

