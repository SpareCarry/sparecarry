import { NextRequest, NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe/server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { validateStripeWebhook, getWebhookSecret, extractPriceFromEvent } from "@/lib/security/stripe-webhook";
import { errorResponse, successResponse } from "@/lib/security/api-response";
import { safeLog } from "@/lib/security/auth-guards";

// Lazy initialization to avoid errors during static export build
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are not set");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }
  return secret;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    // Validate webhook signature
    const validation = validateStripeWebhook(request, body, signature, getWebhookSecret());
    if (!validation.valid || !validation.event) {
      return errorResponse(new Error(validation.error || "Invalid webhook signature"), 400);
    }

    const event = validation.event;

    // Extract price from event (server-side only - never trust client)
    const eventPrice = extractPriceFromEvent(event);
    if (eventPrice !== null) {
      safeLog('info', 'Stripe webhook: Price extracted from event', {
        eventType: event.type,
        amount: eventPrice,
      });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Handle subscription checkout
        if (session.mode === "subscription") {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );

          // Update user subscription status
          await getSupabaseAdmin()
            .from("users")
            .update({
              subscription_status: subscription.status,
              subscription_current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
            })
            .eq("stripe_customer_id", customerId);
        }
        
        // Handle one-time supporter payment
        if (session.mode === "payment" && session.metadata?.type === "supporter") {
          const customerId = session.customer;
          const userId = session.metadata.user_id;

          // Calculate expiration date (1 year from now)
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);

          // Update user supporter status
          await getSupabaseAdmin()
            .from("users")
            .update({
              supporter_status: "active",
              supporter_purchased_at: new Date().toISOString(),
              supporter_expires_at: expiresAt.toISOString(),
            })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer;

        await getSupabaseAdmin()
          .from("users")
          .update({
            subscription_status: subscription.status,
            subscription_current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer;

        await getSupabaseAdmin()
          .from("users")
          .update({
            subscription_status: "canceled",
            subscription_current_period_end: null,
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      default:
        safeLog('info', 'Stripe webhook: Unhandled event type', { eventType: event.type });
    }

    return successResponse({ received: true });
  } catch (error) {
    safeLog('error', 'Stripe webhook: Error processing event', {});
    return errorResponse(error, 500);
  }
}

