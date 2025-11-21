import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";

const STRIPE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_STRIPE_IDENTITY !== "false";

export async function POST(request: NextRequest) {
  try {
    if (!STRIPE_ENABLED) {
      return NextResponse.json(
        { error: "Identity verification is disabled. Please contact support." },
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

    const body = await request.json();
    const { userId } = body as { userId: string; email?: string };

    if (userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_identity_verified_at, stripe_verification_session_id")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    if (profile?.stripe_identity_verified_at) {
      return NextResponse.json({ alreadyVerified: true });
    }

    if (profile?.stripe_verification_session_id) {
      const existingSession = await stripe.identity.verificationSessions.retrieve(
        profile.stripe_verification_session_id
      );

      if (existingSession.status === "verified") {
        await supabase
          .from("profiles")
          .update({
            stripe_identity_verified_at: new Date().toISOString(),
            stripe_verification_session_id: existingSession.id,
          })
          .eq("user_id", user.id);
        return NextResponse.json({ alreadyVerified: true });
      }

      if (
        ["requires_input", "processing", "pending"].includes(
          existingSession.status
        ) &&
        existingSession.url
      ) {
        return NextResponse.json({
          verificationUrl: existingSession.url,
          sessionId: existingSession.id,
          status: existingSession.status,
        });
      }
    }

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

    await supabase
      .from("profiles")
      .update({
        stripe_verification_session_id: verificationSession.id,
      })
      .eq("user_id", user.id);

    return NextResponse.json({
      verificationUrl: verificationSession.url,
      sessionId: verificationSession.id,
      status: verificationSession.status,
    });
  } catch (error: any) {
    logger.error("create_verification_session_failed", error);
    return NextResponse.json(
      { error: error.message || "Failed to create verification session" },
      { status: error?.statusCode || 500 }
    );
  }
}

