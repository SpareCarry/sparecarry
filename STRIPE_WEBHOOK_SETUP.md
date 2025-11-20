# Stripe Webhook Setup Guide

**Webhook URL**: `https://your-ngrok-url.ngrok-free.dev/api/stripe/webhook`

---

## Quick Setup Steps

### 1. Configure ngrok (if not already done)

```bash
ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN
```

### 2. Start ngrok tunnel (if needed)

```bash
ngrok http 3000
```

This will expose your local server at `http://localhost:3000` via the ngrok URL.

---

## Stripe Dashboard Configuration

### Step 1: Create Webhook Endpoint

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Enter endpoint URL:
   ```
   https://your-ngrok-url.ngrok-free.dev/api/stripe/webhook
   ```
4. Click **"Add endpoint"**

### Step 2: Select Events to Listen For

Select these events:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`
- ✅ `charge.succeeded`
- ✅ `charge.failed`

### Step 3: Get Webhook Signing Secret

1. After creating the endpoint, click on it
2. In the **"Signing secret"** section, click **"Reveal"**
3. Copy the secret (starts with `whsec_`)
4. Add it to your `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

### Step 4: Test the Webhook

1. In Stripe Dashboard → Webhooks → Your endpoint
2. Click **"Send test webhook"**
3. Select an event (e.g., `checkout.session.completed`)
4. Click **"Send test webhook"**
5. Check your server logs to verify it was received

---

## Environment Variables

### Required in `.env.local`:

```env
# Stripe Keys
# Get these from: https://dashboard.stripe.com/test/apikeys
# Test keys start with: pk_test_... and sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY_HERE

# Webhook Configuration
STRIPE_WEBHOOK_URL=https://your-ngrok-url.ngrok-free.dev
STRIPE_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE  # Get this from Stripe Dashboard (starts with whsec_)
```

### Required in `.env.staging`:

```env
# Stripe Keys (Test Mode)
# Get these from: https://dashboard.stripe.com/test/apikeys
# Test keys start with: pk_test_... and sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_STRIPE_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY_HERE

# Webhook Configuration
STRIPE_WEBHOOK_URL=https://your-ngrok-url.ngrok-free.dev
STRIPE_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE  # Get this from Stripe Dashboard (starts with whsec_)
```

---

## Webhook Endpoint

Your webhook endpoint is located at:
- **Path**: `/api/stripe/webhook`
- **Method**: `POST`
- **Full URL**: `https://your-ngrok-url.ngrok-free.dev/api/stripe/webhook`

---

## Testing

### Test Cards (Stripe Test Mode)

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Any future expiry date and any CVC will work.

### Test Webhook Locally

1. Start your dev server:
   ```bash
   pnpm dev
   ```

2. Start ngrok (if not already running):
   ```bash
   ngrok http 3000
   ```

3. Update Stripe webhook URL if ngrok URL changed

4. Trigger a test payment in your app

5. Check Stripe Dashboard → Webhooks → Your endpoint → Events

---

## Security Notes

⚠️ **Important**:
- The webhook secret (`STRIPE_WEBHOOK_SECRET`) is used to verify webhook signatures
- Never commit webhook secrets to version control
- Always verify webhook signatures in production
- Use different webhook secrets for test and live modes

---

## Troubleshooting

### Webhook not receiving events

1. Check ngrok is running: `ngrok http 3000`
2. Verify webhook URL in Stripe Dashboard matches your ngrok URL
3. Check server logs for errors
4. Verify `STRIPE_WEBHOOK_SECRET` is set correctly

### Signature verification failed

1. Ensure `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe Dashboard
2. Check that you're using the correct secret (test vs live mode)
3. Verify the webhook endpoint is receiving the raw request body

---

**Last Updated**: 2024-12-19

