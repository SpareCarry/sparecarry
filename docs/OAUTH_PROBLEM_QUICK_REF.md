# OAuth Redirect Problem - Quick Reference

## Problem

Mobile Google OAuth redirects to `localhost:3000` instead of `http://192.168.1.238:3000`, causing auth failure.

## Current State

- ✅ Code generates correct redirect URL: `http://192.168.1.238:3000/auth/callback`
- ✅ Supabase OAuth URL contains correct `redirect_to` parameter
- ❌ **Supabase redirects to `localhost:3000` after Google auth**

## Root Cause

**Site URL in Supabase Dashboard is likely set to `localhost:3000`**. Supabase uses Site URL as fallback when redirect validation fails.

## Fix Required

### Supabase Dashboard → Authentication → URL Configuration:

1. **Site URL**: `http://192.168.1.238:3000` (NOT localhost)
2. **Redirect URLs**: Must include `http://192.168.1.238:3000/auth/callback`
3. Save and wait 30 seconds

## Environment Variables

```env
# .env.local (root)
EXPO_PUBLIC_APP_URL=http://192.168.1.238:3000
NEXT_PUBLIC_APP_URL=http://192.168.1.238:3000

# apps/mobile/.env
EXPO_PUBLIC_APP_URL=http://192.168.1.238:3000
```

## Key Files

- `packages/hooks/useAuth.ts` - OAuth implementation
- `lib/supabase/mobile.ts` - Callback URL helper
- `app/auth/callback/page.tsx` - Callback handler

## Logs to Check

After fix, callback logs should show:

```
[AuthCallback] Current URL: http://192.168.1.238:3000/auth/callback?...
```

NOT:

```
[AuthCallback] Current URL: http://localhost:3000/auth/callback?...
```

## Full Details

See `docs/OAUTH_REDIRECT_PROBLEM_SUMMARY.md` for complete information.
