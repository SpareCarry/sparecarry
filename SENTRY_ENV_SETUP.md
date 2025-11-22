# Sentry Environment Variables Setup

## Add to .env.local

Add these lines to your `.env.local` file:

```env
# ============================================================================
# Sentry (Error Tracking)
# ============================================================================
NEXT_PUBLIC_SENTRY_DSN=https://d47ccc2f13e83188220eb792eca3d10f@o4510405686657024.ingest.us.sentry.io/4510405700485120
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
SENTRY_ORG=sparecarry
SENTRY_PROJECT=javascript-nextjs
```

## Add to Vercel

The `vercel-env-variables.env` file has been updated with these values. 

**To add to Vercel:**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables (or re-import `vercel-env-variables.env`):

```
NEXT_PUBLIC_SENTRY_DSN=https://d47ccc2f13e83188220eb792eca3d10f@o4510405686657024.ingest.us.sentry.io/4510405700485120
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
SENTRY_ORG=sparecarry
SENTRY_PROJECT=javascript-nextjs
```

3. **Important**: Select **ALL environments** (Production, Preview, Development)
4. Click "Save"

## Sentry Configuration Details

- **Organization Slug**: `sparecarry`
- **Project Slug**: `javascript-nextjs`
- **Project ID**: `4510405700485120`
- **DSN**: `https://d47ccc2f13e83188220eb792eca3d10f@o4510405686657024.ingest.us.sentry.io/4510405700485120`
- **Auth Token**: Personal token for releases and source maps

## After Adding

1. **Redeploy** your Vercel project
2. Sentry error tracking will be enabled
3. Check Sentry dashboard: https://sentry.io/organizations/sparecarry/projects/javascript-nextjs/

## Security Note

⚠️ **Never commit `.env.local` or tokens to git!** These are already in `.gitignore`.

