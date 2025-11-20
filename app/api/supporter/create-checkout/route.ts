import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { stripe } from "../../../lib/stripe/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create Stripe customer
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

    // Create one-time payment checkout session
    // Price ID should be set in environment variable: STRIPE_SUPPORTER_PRICE_ID
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment", // One-time payment
      line_items: [
        {
          price: process.env.STRIPE_SUPPORTER_PRICE_ID || "price_supporter_39", // Set this in Stripe Dashboard
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://sparecarry.com"}/supporter/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://sparecarry.com"}/supporter`,
      metadata: {
        user_id: user.id,
        type: "supporter",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating supporter checkout:", error);
    return NextResponse.json(
      { error: (error instanceof Error ? error.message :  "Failed to create checkout" },
      { status: 500 }
    );
  }
}

