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

/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      safeLog('warn', 'Stripe webhook: Missing signature', {});
      return errorResponse("Missing stripe-signature header", 400);
    }

    // Validate webhook signature
    const webhookSecret = getWebhookSecret();
    if (!webhookSecret) {
      safeLog('warn', 'Stripe webhook: Webhook secret not configured', {});
      return errorResponse("Webhook secret not configured", 500);
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      safeLog('warn', 'Stripe webhook: Signature verification failed', { error: err.message });
      return errorResponse(`Webhook signature verification failed: ${err.message}`, 400);
    }

    const supabase = getSupabaseAdmin();

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === "subscription" && session.subscription) {
          // Handle subscription creation
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const customerId = subscription.customer as string;
          const userId = session.metadata?.userId;

          if (userId) {
            await supabase
              .from("users")
              .update({
                stripe_customer_id: customerId,
                subscription_status: subscription.status,
                subscription_current_period_end: new Date(
                  subscription.current_period_end * 1000
                ).toISOString(),
              })
              .eq("id", userId);
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
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
        const customerId = subscription.customer as string;

        await supabase
          .from("users")
          .update({
            subscription_status: "canceled",
            subscription_current_period_end: null,
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        safeLog('info', 'Stripe payment succeeded', {
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount,
        });
        // Handle successful payment (e.g., update match status, release escrow)
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        safeLog('warn', 'Stripe payment failed', {
          payment_intent_id: paymentIntent.id,
          error: paymentIntent.last_payment_error?.message,
        });
        // Handle failed payment
        break;
      }

      default:
        safeLog('info', 'Stripe webhook: Unhandled event type', { type: event.type });
    }

    return successResponse({ received: true });
  } catch (error: any) {
    safeLog('error', 'Stripe webhook: Error processing webhook', { error: error.message });
    return errorResponse("Internal server error", 500);
  }
}

