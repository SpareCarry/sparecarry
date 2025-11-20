/**
 * Secure Stripe Webhook Validation
 * 
 * Validates Stripe webhook signatures and handles events securely
 */

import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { safeLog } from './auth-guards';

/**
 * Validate Stripe webhook signature
 */
export function validateStripeWebhook(
  request: NextRequest,
  body: string,
  signature: string | null,
  webhookSecret: string
): { valid: boolean; event?: Stripe.Event; error?: string } {
  if (!signature) {
    safeLog('warn', 'Stripe webhook: Missing signature header');
    return {
      valid: false,
      error: 'Missing signature',
    };
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    });

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    return {
      valid: true,
      event,
    };
  } catch (error) {
    // Log invalid webhook attempts (but don't expose details)
    safeLog('error', 'Stripe webhook: Invalid signature', {
      signatureLength: signature.length,
      bodyLength: body.length,
    });

    // Fallback: Log to local file/system (for security monitoring)
    // In production, you might want to:
    // - Log to a security monitoring service
    // - Alert on repeated invalid attempts
    // - Rate limit webhook endpoint
    logInvalidWebhookAttempt(request, signature, error);

    return {
      valid: false,
      error: 'Invalid signature',
    };
  }
}

/**
 * Log invalid webhook attempts (local logging)
 * In production, integrate with your logging/monitoring system
 */
function logInvalidWebhookAttempt(
  request: NextRequest,
  signature: string,
  error: unknown
): void {
  const timestamp = new Date().toISOString();
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // Log to console (in production, use proper logging service)
  console.error(`[STRIPE_WEBHOOK_SECURITY] ${timestamp} - Invalid webhook attempt from ${ip}`);

  // TODO: In production, implement:
  // - Log to file system (with rotation)
  // - Send to security monitoring service (e.g., Sentry, DataDog)
  // - Alert if too many invalid attempts from same IP
  // - Store in database for audit trail
}

/**
 * Validate webhook event type
 */
export function validateWebhookEventType(
  event: Stripe.Event,
  allowedTypes: string[]
): boolean {
  return allowedTypes.includes(event.type);
}

/**
 * Extract price from Stripe event (server-side only)
 * Never trust client-provided prices
 */
export function extractPriceFromEvent(event: Stripe.Event): number | null {
  // Extract price from different event types
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      // Get amount from session (server-side value)
      return session.amount_total || null;
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      return paymentIntent.amount || null;
    }
    case 'charge.succeeded': {
      const charge = event.data.object as Stripe.Charge;
      return charge.amount || null;
    }
    default:
      return null;
  }
}

/**
 * Get webhook secret from environment
 */
export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return secret;
}

