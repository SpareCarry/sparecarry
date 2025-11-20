import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { stripe } from "../../../lib/stripe/server";
import { rateLimit, apiRateLimiter } from "@/lib/security/rate-limit";
import { assertAuthenticated } from "@/lib/security/auth-guards";
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

  const supabase = await createClient();

    // Get verification session ID from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_verification_session_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.stripe_verification_session_id) {
      return NextResponse.json({ verified: false, error: "No verification session found" });
    }

    // Check verification status with Stripe
    const verificationSession = await stripe.identity.verificationSessions.retrieve(
      profile.stripe_verification_session_id
    );

    const isVerified = verificationSession.status === "verified";

    if (isVerified) {
      // Update profile with verification timestamp
      await supabase
        .from("profiles")
        .update({
          stripe_identity_verified_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    return successResponse({
      verified: isVerified,
      status: verificationSession.status,
    });
});

