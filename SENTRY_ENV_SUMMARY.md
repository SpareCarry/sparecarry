# Sentry Environment Variables Summary

## Essential Variables (Required)

These are the **minimum required** for Sentry to work:

```env
NEXT_PUBLIC_SENTRY_DSN=https://d47ccc2f13e83188220eb792eca3d10f@o4510405686657024.ingest.us.sentry.io/4510405700485120
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
```

## Recommended Variables (For Better Release Tracking)

Add these for better release management and source maps:

```env
SENTRY_ORG=sparecarry
SENTRY_PROJECT=javascript-nextjs
```

## Optional Variables (Fine-tuning)

These have sensible defaults but you can customize:

```env
# Performance monitoring sample rate (default: 0.2 = 20%)
SENTRY_TRACES_SAMPLE_RATE=0.2

# Profiling sample rate (default: 0.1 = 10%)
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Release version (auto-generated if not set)
NEXT_PUBLIC_SENTRY_RELEASE=@sparecarry/sparecarry@1.0.0
```

## Complete .env.local Entry

Add this to your `.env.local` file:

```env
# ============================================================================
# Sentry (Error Tracking)
# ============================================================================
NEXT_PUBLIC_SENTRY_DSN=https://d47ccc2f13e83188220eb792eca3d10f@o4510405686657024.ingest.us.sentry.io/4510405700485120
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
SENTRY_ORG=sparecarry
SENTRY_PROJECT=javascript-nextjs
```

## Answer: What's Needed?

**For basic error tracking**: Just `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN`

**For full functionality** (recommended): All 4 variables:

- `NEXT_PUBLIC_SENTRY_DSN` ✓
- `SENTRY_AUTH_TOKEN` ✓
- `SENTRY_ORG` ✓ (for releases)
- `SENTRY_PROJECT` ✓ (for releases)

So yes, the 4 variables in `vercel-env-variables.env` are sufficient!
