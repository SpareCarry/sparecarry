# Vercel Deployment Guide for SpareCarry

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Environment Variables**: Prepare all production environment variables

## Step 1: Connect Repository to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect Next.js

## Step 2: Configure Build Settings

Vercel will use these settings from `vercel.json`:

- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install`
- **Output Directory**: `out` (for static export)

## Step 3: Add Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

### Required Variables

```
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://gujyzwqcwecbeznlablx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Optional Variables

```
SENTRY_DSN=...
NEXT_PUBLIC_UNLEASH_URL=...
NEXT_PUBLIC_UNLEASH_CLIENT_KEY=...
RESEND_API_KEY=...
```

## Step 4: Configure Stripe Webhook

1. Get your Vercel deployment URL: `https://your-project.vercel.app`
2. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
3. Add endpoint: `https://your-project.vercel.app/api/stripe/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing Secret** (starts with `whsec_`)
6. Add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

## Step 5: Deploy

1. Push to your main branch
2. Vercel will automatically deploy
3. Check deployment logs for any errors

## Step 6: Verify Deployment

### Health Check

```bash
curl https://your-project.vercel.app/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-11-20T...",
  "environment": "production",
  "services": {
    "supabase": { "status": "ok", ... },
    "stripe": { "status": "ok", ... },
    ...
  }
}
```

### API Routes

- `/api/health` - Health check endpoint
- `/api/stripe/webhook` - Stripe webhook handler

### Test Stripe Webhook

1. Use Stripe CLI: `stripe listen --forward-to https://your-project.vercel.app/api/stripe/webhook`
2. Trigger a test event: `stripe trigger payment_intent.succeeded`
3. Check Vercel function logs for webhook processing

## Troubleshooting

### Build Fails

- Check build logs in Vercel Dashboard
- Ensure all environment variables are set
- Verify `package.json` has correct dependencies

### API Routes Not Working

- Ensure `output: 'export'` is NOT set for API routes (use `output: 'standalone'` for API routes)
- For static export, API routes won't work - use Edge Functions or separate API server

### Environment Variables Not Loading

- Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding new environment variables

### Stripe Webhook Fails

- Verify webhook URL matches Vercel deployment URL
- Check webhook secret is correct
- Review Stripe Dashboard webhook logs

## Production Checklist

- [ ] All environment variables configured in Vercel
- [ ] Stripe webhook configured with correct URL
- [ ] Health check endpoint returns `ok`
- [ ] API routes are accessible
- [ ] Feature flags are working (if configured)
- [ ] Sentry error tracking is working (if configured)
- [ ] Custom domain configured (optional)

## Next Steps

1. Set up custom domain (optional)
2. Configure CDN caching
3. Set up monitoring and alerts
4. Configure backup and recovery
