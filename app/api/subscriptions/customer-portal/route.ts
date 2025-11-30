import { NextRequest, NextResponse } from "next/server";
import { getStripeInstance } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { isDevMode } from "@/config/devMode";

export async function POST(request: NextRequest) {
  try {
    // Get user - handle dev mode
    let user: { id: string; email: string | null } | null = null;

    if (isDevMode()) {
      // In dev mode, use mock user
      user = {
        id: "dev-user-id",
        email: "dev@sparecarry.com",
      };
    } else {
      // In production, get real user from session
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      user = {
        id: authUser.id,
        email: authUser.email ?? null,
      };
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      // In dev mode without Stripe, return a mock portal URL
      if (isDevMode()) {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        return NextResponse.json({
          url: `${appUrl}/subscription?devMode=true`,
        });
      }
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const stripe = getStripeInstance();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Get or create Stripe customer
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Create Stripe customer if doesn't exist
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase.from("profiles").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
      });
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/subscription`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("[API] Error creating portal session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create portal session" },
      { status: 500 }
    );
  }
}
