# Stripe Subscription Setup

This document explains how to set up Stripe subscriptions for SpareCarry Pro.

## Environment Variables

Add these to your `.env.local` file:

```env
STRIPE_MONTHLY_PRICE_ID=price_xxxxx  # Monthly subscription price ID ($6.99)
STRIPE_YEARLY_PRICE_ID=price_xxxxx   # Yearly subscription price ID ($59)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx    # Webhook signing secret
```

## Creating Products and Prices in Stripe

1. **Create Product:**
   - Go to Stripe Dashboard → Products
   - Create a product named "SpareCarry Pro"
   - Description: "Premium subscription with 0% platform fees, priority placement, and verified badge"

2. **Create Monthly Price:**
   - Add a recurring price: $6.99/month
   - Copy the Price ID (starts with `price_`)
   - Add to `STRIPE_MONTHLY_PRICE_ID`

3. **Create Yearly Price:**
   - Add a recurring price: $59/year
   - Copy the Price ID (starts with `price_`)
   - Add to `STRIPE_YEARLY_PRICE_ID`

## Webhook Setup

1. **Create Webhook Endpoint:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

2. **Get Webhook Secret:**
   - Copy the signing secret (starts with `whsec_`)
   - Add to `STRIPE_WEBHOOK_SECRET`

## Testing

Use Stripe test mode:
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC

## Subscription Benefits

- **0% Platform Fee**: Subscribers pay 0% instead of 15-18%
- **Priority in Feed**: Subscribers' trips/requests appear first
- **Blue Check Badge**: Verified status indicator

## Database Schema

The `users` table includes:
- `stripe_customer_id`: Stripe Customer ID
- `subscription_status`: active, canceled, past_due, trialing, etc.
- `subscription_current_period_end`: When subscription expires

## Customer Portal

Users can manage subscriptions via Stripe Customer Portal:
- Cancel subscription
- Update payment method
- View billing history
- Download invoices

Access via `/subscription` page → "Manage Subscription" button.

