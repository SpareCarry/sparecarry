import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { stripe } from "../../../../lib/stripe/server";

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
    const { sessionId } = body;

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Verify this is for supporter tier
    if (session.metadata?.type !== "supporter") {
      return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
    }

    // Calculate expiration date (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Update user supporter status
    await supabase
      .from("users")
      .update({
        supporter_status: "active",
        supporter_purchased_at: new Date().toISOString(),
        supporter_expires_at: expiresAt.toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error verifying supporter payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}

