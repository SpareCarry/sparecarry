import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { stripe } from "../../../../lib/stripe/server";

function ensureSubscriptionPriceIds(): Record<"monthly" | "yearly", string> {
  const monthly = process.env.STRIPE_MONTHLY_PRICE_ID;
  const yearly = process.env.STRIPE_YEARLY_PRICE_ID;
  if (!monthly || !yearly) {
    throw new Error("Stripe subscription price IDs are not configured");
  }
  return { monthly, yearly };
}

function getBaseUrl(request: NextRequest) {
  return (
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://sparecarry.com"
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { priceId: "monthly" | "yearly" };
    const { priceId } = body;

    if (!priceId || (priceId !== "monthly" && priceId !== "yearly")) {
      return NextResponse.json(
        { error: "Invalid price ID" },
        { status: 400 }
      );
    }

    const prices = ensureSubscriptionPriceIds();

    const { data: userData } = await supabase
      .from("users")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .single();

    let customerId = userData?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData?.email || user.email || undefined,
        metadata: {
          user_id: user.id,
        },
      });

      customerId = customer.id;

      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const baseUrl = getBaseUrl(request);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: prices[priceId],
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription`,
      metadata: {
        user_id: user.id,
        subscription_type: priceId,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Error creating subscription checkout:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

