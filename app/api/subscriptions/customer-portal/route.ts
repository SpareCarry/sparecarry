import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has lifetime access; they don't need/manage a subscription
    const { data: profile } = await supabase
      .from("profiles")
      .select("lifetime_active")
      .eq("user_id", user.id)
      .single();

    if (profile?.lifetime_active) {
      return NextResponse.json(
        {
          error:
            "You already have Lifetime access. There's no active subscription to manage.",
        },
        { status: 400 }
      );
    }

    // Fetch or create Stripe customer
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

      await supabase
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId!,
      return_url: `${appUrl}/profile`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating customer portal session:", error);
    return NextResponse.json(
      { error: "Failed to open subscription portal. Please try again." },
      { status: 500 }
    );
  }
}


