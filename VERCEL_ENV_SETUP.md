# Vercel Environment Variables Setup Guide

## Quick Import Method

1. **Fill in the values** in `vercel-env-variables.env`:
   - Replace all `your_*_here` placeholders with your actual values
   - Copy Stripe values from your `.env.local` file

2. **Import into Vercel**:
   - Go to your Vercel project: https://vercel.com/dashboard
   - Navigate to: **Project Settings → Environment Variables**
   - Click **"Import"** button
   - Select `vercel-env-variables.env` file
   - Select environments: **Production**, **Preview**, and **Development**
   - Click **"Import"**

## Manual Setup Method

If you prefer to add variables manually:

1. Go to **Project Settings → Environment Variables** in Vercel
2. For each variable below, click **"Add"** and enter:
   - **Key**: The variable name
   - **Value**: The variable value
   - **Environment**: Select Production, Preview, and/or Development

## Required Variables (Must Have)

These are required for the app to build and run:

| Variable                        | Description                  | Example                                     |
| ------------------------------- | ---------------------------- | ------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`           | Your app's URL               | `https://sparecarry.vercel.app`             |
| `NEXT_PUBLIC_APP_ENV`           | Environment name             | `production` or `staging`                   |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL         | `https://xxxxx.supabase.co`                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key            | `eyJhbGc...`                                |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key    | `eyJhbGc...`                                |
| `RESEND_API_KEY`                | Resend API key               | `re_xxxxx` or `3dnauYJh_...`                |
| `NOTIFICATIONS_EMAIL_FROM`      | Email sender                 | `SpareCarry <notifications@sparecarry.com>` |
| `EXPO_ACCESS_TOKEN`             | Expo push notification token | `WPGnB7vBBa...`                             |

## Optional Variables (Recommended)

These enable additional features but won't block deployment:

### Stripe (Payment Processing)

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Starts with `pk_test_` or `pk_live_`
- `STRIPE_SECRET_KEY` - Starts with `sk_test_` or `sk_live_`
- `STRIPE_WEBHOOK_SECRET` - Starts with `whsec_`
- `STRIPE_SUPPORTER_PRICE_ID` - Starts with `price_`
- `STRIPE_MONTHLY_PRICE_ID` - Starts with `price_`
- `STRIPE_YEARLY_PRICE_ID` - Starts with `price_`

### Analytics

- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics ID (format: `G-XXXXXXXXXX`)
- `NEXT_PUBLIC_META_PIXEL_ID` - Meta Pixel ID (numeric)

### Feature Flags

- `NEXT_PUBLIC_UNLEASH_URL` - Unleash API URL
- `NEXT_PUBLIC_UNLEASH_CLIENT_KEY` - Unleash client key

### Other

- `CRON_SECRET` - Secret for cron job authentication (min 16 chars)
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN for error tracking
- `SENTRY_AUTH_TOKEN` - Sentry auth token
- `NEXT_PUBLIC_SUPPORT_EMAIL` - Support email address
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key

## Getting Your Values

### Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings → API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Stripe

1. Go to https://dashboard.stripe.com
2. Copy from your `.env.local` file or:
   - **API Keys** → Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **API Keys** → Secret key → `STRIPE_SECRET_KEY`
   - **Webhooks** → Signing secret → `STRIPE_WEBHOOK_SECRET`
   - **Products** → Price IDs → `STRIPE_*_PRICE_ID`

### Resend

1. Go to https://resend.com/api-keys
2. Copy your API key → `RESEND_API_KEY`

### Expo

1. Go to https://expo.dev/accounts/[account]/settings/access-tokens
2. Copy your access token → `EXPO_ACCESS_TOKEN`

## After Importing

1. **Redeploy** your project in Vercel
2. The build should now succeed with the required variables
3. Optional variables can be added later as needed

## Security Notes

- ✅ Never commit `.env.local` or `vercel-env-variables.env` to git
- ✅ Use different keys for production vs staging
- ✅ Rotate secrets regularly
- ✅ Use Vercel's environment-specific variables when possible
