# Environment Variables Setup Guide

## Quick Setup for Free Supabase Tier

Since you're on the free Supabase tier, disable phone auth for now.

### Required Variables for .env.local

Add these to your `.env.local` file:

```env
# ============================================================================
# Core Application (Required)
# ============================================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development

# ============================================================================
# Supabase (Required)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ============================================================================
# Email Notifications (Required)
# ============================================================================
RESEND_API_KEY=your_resend_api_key
NOTIFICATIONS_EMAIL_FROM=SpareCarry <notifications@sparecarry.com>

# ============================================================================
# Push Notifications (Required)
# ============================================================================
EXPO_ACCESS_TOKEN=your_expo_access_token

# ============================================================================
# Phone & Identity Features (Free Supabase = Phone Auth Disabled)
# ============================================================================
NEXT_PUBLIC_ENABLE_PHONE_AUTH=false
NEXT_PUBLIC_ENABLE_STRIPE_IDENTITY=true
NEXT_PUBLIC_SUPPORT_EMAIL=support@sparecarry.com

# ============================================================================
# Stripe (Optional but Recommended)
# ============================================================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ============================================================================
# Cron Job (Required for Auto-Release)
# ============================================================================
# Generate using: openssl rand -hex 32
# Or: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CRON_SECRET=your_generated_32_character_hex_string_here

# ============================================================================
# Sentry (Optional)
# ============================================================================
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
SENTRY_ORG=sparecarry
SENTRY_PROJECT=javascript-nextjs
```

## Generate CRON_SECRET

Run one of these commands to generate a secure CRON_SECRET:

**PowerShell:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Command Prompt:**
```cmd
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Or use OpenSSL (if installed):**
```bash
openssl rand -hex 32
```

Copy the output and use it as your `CRON_SECRET` value.

## Add to Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Click "Import" or "Add"
3. Import from `vercel-env-variables.env` OR manually add:
   - `CRON_SECRET` (use generated value)
   - `NEXT_PUBLIC_ENABLE_PHONE_AUTH=false`
   - `NEXT_PUBLIC_ENABLE_STRIPE_IDENTITY=true`
   - `NEXT_PUBLIC_SUPPORT_EMAIL=support@sparecarry.com`
4. Set for **ALL environments** (Production, Preview, Development)
5. Click "Save"

## Phone Auth Note

- **Free Supabase**: Phone auth is disabled (`NEXT_PUBLIC_ENABLE_PHONE_AUTH=false`)
- **Paid Supabase**: You can enable phone auth later (`NEXT_PUBLIC_ENABLE_PHONE_AUTH=true`)
- The UI will show instructions to contact support if phone auth is disabled

## Security Notes

- ✅ `.env.local` is already in `.gitignore`
- ✅ `vercel-env-variables.env` is already in `.gitignore`
- ⚠️ Never commit secrets to git
- ⚠️ Generate a unique `CRON_SECRET` for production

