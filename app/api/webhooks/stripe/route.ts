import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "../../../../lib/stripe/server";
import { createServiceRoleClient } from "../../../../lib/supabase/service-role";
import { logger } from "../../../../lib/logger";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ensureWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }
  return secret;
}

function isValidUuid(value?: string | null): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

function extractCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  if (!customer) return null;
  if (typeof customer === "string") return customer;
  if ("id" in customer && typeof customer.id === "string") {
    return customer.id;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, ensureWebhookSecret());
  } catch (err: any) {
    logger.error("Webhook signature verification failed", {
      message: err.message,
    });
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const supabaseAdmin = createServiceRoleClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session.mode) {
          logger.error("invalid_metadata", {
            eventId: event.id,
            mode: session.mode,
            sessionId: session.id,
          });
          return NextResponse.json(
            { error: "Missing session mode" },
            { status: 400 }
          );
        }

        if (session.mode === "subscription") {
          const customerId = extractCustomerId(session.customer);
          if (!customerId) {
            logger.error("invalid_metadata", {
              eventId: event.id,
              mode: session.mode,
              sessionId: session.id,
            });
            return NextResponse.json(
              { error: "Missing Stripe customer" },
              { status: 400 }
            );
          }

          if (typeof session.subscription !== "string") {
            logger.error("invalid_metadata", {
              eventId: event.id,
              mode: session.mode,
              sessionId: session.id,
            });
            return NextResponse.json(
              { error: "Missing subscription id" },
              { status: 400 }
            );
          }

          const subscription = await stripe.subscriptions.retrieve(
            session.subscription
          );

          const { data, error } = await supabaseAdmin
            .from("users")
            .update({
              subscription_status: subscription.status,
              subscription_current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
            })
            .eq("stripe_customer_id", customerId)
            .select("id");

          if (error) throw error;
          if (!data?.length) {
            logger.warn("stripe_webhook_zero_rows", {
              eventId: event.id,
              eventType: event.type,
              stripeCustomerId: customerId,
              metadata: session.metadata ?? null,
              mode: session.mode,
            });
          }
        } else if (session.mode === "payment") {
          if (session.metadata?.type !== "supporter") {
            logger.error("invalid_metadata", {
              eventId: event.id,
              mode: session.mode,
              sessionId: session.id,
              metadata: session.metadata ?? null,
              rawEvent: { id: event.id, type: event.type },
            });
            return NextResponse.json(
              { error: "Invalid supporter metadata" },
              { status: 400 }
            );
          }

          const userId = session.metadata.user_id;
          if (!isValidUuid(userId)) {
            logger.error("invalid_metadata", {
              eventId: event.id,
              mode: session.mode,
              sessionId: session.id,
              metadata: session.metadata ?? null,
              rawEvent: { id: event.id, type: event.type },
            });
            return NextResponse.json(
              { error: "Invalid supporter metadata" },
              { status: 400 }
            );
          }

          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);

          const { data, error } = await supabaseAdmin
            .from("users")
            .update({
              supporter_status: "active",
              supporter_purchased_at: new Date().toISOString(),
              supporter_expires_at: expiresAt.toISOString(),
            })
            .eq("id", userId)
            .select("id");

          if (error) throw error;
          if (!data?.length) {
            logger.warn("stripe_webhook_zero_rows", {
              eventId: event.id,
              eventType: event.type,
              stripeCustomerId: extractCustomerId(session.customer),
              metadata: session.metadata ?? null,
              mode: session.mode,
            });
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = extractCustomerId(subscription.customer);
        if (!customerId) break;

        const { data, error } = await supabaseAdmin
          .from("users")
          .update({
            subscription_status: subscription.status,
            subscription_current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
          })
          .eq("stripe_customer_id", customerId)
          .select("id");

        if (error) throw error;
        if (!data?.length) {
          logger.warn("stripe_webhook_zero_rows", {
            eventId: event.id,
            eventType: event.type,
            stripeCustomerId: customerId,
            metadata: null,
            mode: "subscription",
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = extractCustomerId(subscription.customer);
        if (!customerId) break;

        const { data, error } = await supabaseAdmin
          .from("users")
          .update({
            subscription_status: "canceled",
            subscription_current_period_end: null,
          })
          .eq("stripe_customer_id", customerId)
          .select("id");

        if (error) throw error;
        if (!data?.length) {
          logger.warn("stripe_webhook_zero_rows", {
            eventId: event.id,
            eventType: event.type,
            stripeCustomerId: customerId,
            metadata: null,
            mode: "subscription",
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = extractCustomerId(invoice.customer);
        if (!customerId) break;

        const { data, error } = await supabaseAdmin
          .from("users")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId)
          .select("id");

        if (error) throw error;

        logger.error("ALERT: Subscription payment failure", {
          eventId: event.id,
          stripeCustomerId: customerId,
        });
        logger.warn("stripe_payment_failed", {
          stripeCustomerId: customerId,
          invoiceId: invoice.id,
        });

        if (!data?.length) {
          logger.warn("stripe_webhook_zero_rows", {
            eventId: event.id,
            eventType: event.type,
            stripeCustomerId: customerId,
            metadata: null,
            mode: "subscription",
          });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (
          session.mode === "payment" &&
          session.metadata?.type === "supporter" &&
          session.metadata.user_id
        ) {
          logger.info("supporter_checkout_expired", {
            sessionId: session.id,
            userId: session.metadata.user_id,
          });
        }
        break;
      }

      default:
        logger.info("Unhandled Stripe event type", {
          message: `Unhandled Stripe event type: ${event.type}`,
          eventId: event.id,
          eventType: event.type,
        });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error("Error processing webhook", {
      message: error.message,
      eventId: event.id,
    });
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

