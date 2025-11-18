import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, email } = body;

    if (userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    return NextResponse.json({
      verificationUrl: verificationSession.url,
      sessionId: verificationSession.id,
    });
  } catch (error: any) {
    console.error("Error creating verification session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create verification session" },
      { status: 500 }
    );
  }
}

