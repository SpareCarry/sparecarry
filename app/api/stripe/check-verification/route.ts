import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";

const STRIPE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_STRIPE_IDENTITY !== "false";

export async function POST(request: NextRequest) {
  try {
    if (!STRIPE_ENABLED) {
      return NextResponse.json(
        { error: "Identity verification is disabled." },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_verification_session_id, stripe_identity_verified_at")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    if (profile?.stripe_identity_verified_at) {
      return NextResponse.json({ verified: true, status: "verified" });
    }

    if (!profile?.stripe_verification_session_id) {
      return NextResponse.json({
        verified: false,
        error: "No verification session found. Please start verification again.",
      });
    }

    const verificationSession = await stripe.identity.verificationSessions.retrieve(
      profile.stripe_verification_session_id
    );

    const isVerified = verificationSession.status === "verified";

    if (isVerified) {
      await supabase
        .from("profiles")
        .update({
          stripe_identity_verified_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    if (verificationSession.status === "requires_input" && verificationSession.last_error) {
      logger.warn("stripe_identity_requires_input", {
        userId: user.id,
        code: verificationSession.last_error.code,
        reason: verificationSession.last_error.reason,
      });
    }

    return NextResponse.json({
      verified: isVerified,
      status: verificationSession.status,
      lastError: verificationSession.last_error ?? null,
    });
  } catch (error: any) {
    logger.error("check_verification_failed", error);
    return NextResponse.json(
      { error: error.message || "Failed to check verification status" },
      { status: 500 }
    );
  }
}

