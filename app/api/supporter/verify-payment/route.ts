import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { stripe } from "../../../../lib/stripe/server";
import { logger } from "../../../../lib/logger";

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

    const { data: userRow } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    if (session.metadata?.type !== "supporter") {
      return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
    }

    const sessionCustomerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id ?? null;

    const metadataUserId = session.metadata?.user_id;

    const ownsSession =
      (sessionCustomerId && userRow?.stripe_customer_id === sessionCustomerId) ||
      metadataUserId === user.id;

    if (!ownsSession) {
      logger.error("invalid_session_ownership", {
        sessionId,
        userId: user.id,
        metadataUserId,
        sessionCustomerId,
      });
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Calculate expiration date (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { data, error } = await supabase
      .from("users")
      .update({
        supporter_status: "active",
        supporter_purchased_at: new Date().toISOString(),
        supporter_expires_at: expiresAt.toISOString(),
      })
      .eq("id", user.id)
      .select("id");

    if (error) throw error;
    if (!data?.length) {
      logger.error("ZERO_ROW_SUPPORTER_UPDATE: This indicates metadata or session mismatched", {
        userId: user.id,
        sessionId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("Error verifying supporter payment", {
      message: error.message,
    });
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}

