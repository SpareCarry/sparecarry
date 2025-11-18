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

    return NextResponse.json({
      verified: isVerified,
      status: verificationSession.status,
    });
  } catch (error: any) {
    console.error("Error checking verification status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check verification status" },
      { status: 500 }
    );
  }
}

