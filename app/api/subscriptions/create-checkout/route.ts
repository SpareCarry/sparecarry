import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { createSubscriptionCheckoutRequestSchema } from "@/lib/zod/api-schemas";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json().catch(() => null);
    const parsed = createSubscriptionCheckoutRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid price ID. Must be one of monthly, yearly, lifetime." },
        { status: 400 }
      );
    }

    const { priceId } = parsed.data;

    const priceMap: Record<"monthly" | "yearly" | "lifetime", string | undefined> = {
      monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
      yearly: process.env.STRIPE_YEARLY_PRICE_ID,
      // Lifetime uses the supporter price ID (one-time payment for Lifetime Pro)
      lifetime: process.env.STRIPE_SUPPORTER_PRICE_ID,
    };

    const stripePriceId = priceMap[priceId];

    if (!stripePriceId) {
      return NextResponse.json(
        { error: "Subscription price is not configured on the server." },
        { status: 500 }
      );
    }

    // Fetch or create Stripe customer for this user
    const { data: userRecord } = await supabase
      .from("users")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .single();

    let customerId = userRecord?.stripe_customer_id as string | null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userRecord?.email || user.email || undefined,
        metadata: { userId: user.id },
      });

      customerId = customer.id;

      // Best-effort update; respect RLS (user can update their own row)
      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    const isLifetime = priceId === "lifetime";

    const session = await stripe.checkout.sessions.create({
      mode: isLifetime ? "payment" : "subscription",
      customer: customerId || undefined,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/profile?checkout=success`,
      cancel_url: `${appUrl}/profile?checkout=cancelled`,
      metadata: {
        userId: user.id,
        type: isLifetime ? "lifetime_pro" : "subscription",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating subscription checkout:", error);
    return NextResponse.json(
      { error: "Failed to create checkout. Please try again." },
      { status: 500 }
    );
  }
}


