import { NextRequest, NextResponse } from "next/server";
import { getStripeInstance } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { isDevMode } from "@/config/devMode";
import { withErrorHandling, handleAuthError, handleValidationError, createSuccessResponse } from "@/lib/utils/api-error-handler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { priceId } = body;

    // Validate priceId
    const validPriceIds = ["monthly", "yearly", "lifetime"];
    if (!priceId || !validPriceIds.includes(priceId)) {
      return NextResponse.json(
        {
          error: "Invalid price ID. Must be one of: monthly, yearly, lifetime",
        },
        { status: 400 }
      );
    }

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

    if (!user || !user.email) {
      return NextResponse.json(
        { error: "User email required" },
        { status: 400 }
      );
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      // In dev mode without Stripe, return a mock checkout URL
      if (isDevMode()) {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        return NextResponse.json({
          url: `https://checkout.stripe.com/test?priceId=${priceId}&devMode=true`,
        });
      }
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const stripe = getStripeInstance();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create checkout session based on priceId
    let checkoutSession;

    if (priceId === "lifetime") {
      // Lifetime Pro - one-time payment of $100
      checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "SpareCarry Pro - Lifetime",
                description: "Lifetime access to all Pro features",
              },
              unit_amount: 10000, // $100.00 in cents
            },
            quantity: 1,
          },
        ],
        customer_email: user.email,
        metadata: {
          userId: user.id,
          type: "lifetime_pro",
        },
        success_url: `${appUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/subscription`,
      });
    } else {
      // Monthly or Yearly subscription
      const priceIdMap: Record<string, string> = {
        monthly: process.env.STRIPE_MONTHLY_PRICE_ID || "",
        yearly: process.env.STRIPE_YEARLY_PRICE_ID || "",
      };

      const stripePriceId = priceIdMap[priceId];
      if (!stripePriceId) {
        return NextResponse.json(
          { error: `Stripe price ID not configured for ${priceId}` },
          { status: 500 }
        );
      }

      checkoutSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: stripePriceId,
            quantity: 1,
          },
        ],
        customer_email: user.email,
        metadata: {
          userId: user.id,
          type: "subscription",
          priceId,
        },
        success_url: `${appUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/subscription`,
      });
    }

    return createSuccessResponse({ url: checkoutSession.url });
  } catch (error: unknown) {
    // Error handling is done by withErrorHandling wrapper if used
    // For now, keep existing error handling but use standardized format
    return withErrorHandling(
      async () => {
        throw error;
      },
      { operation: "create checkout session" }
    );
  }
}
