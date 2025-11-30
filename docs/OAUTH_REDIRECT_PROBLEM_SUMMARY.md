# OAuth Redirect Problem - Complete Summary

## Problem Description

When clicking "Sign in with Google" on the mobile app (Expo/React Native), the browser redirects to `localhost:3000` instead of the network IP (`http://192.168.1.238:3000`). This causes authentication to fail because the phone cannot reach `localhost:3000` - it needs the network-accessible IP address.

## Current Status

- ✅ Environment variables are correctly set
- ✅ Code is generating the correct redirect URL (`http://192.168.1.238:3000/auth/callback`)
- ✅ Supabase OAuth URL contains the correct `redirect_to` parameter
- ❌ **Supabase is still redirecting to `localhost:3000` after Google authentication**

## Technical Stack

- **Framework**: Next.js 14 (App Router) + Expo Router (React Native)
- **Auth Provider**: Supabase Auth
- **OAuth Provider**: Google OAuth via Supabase
- **Mobile**: Expo development build
- **Network**: Starlink (dynamic IP, but local network IP is `192.168.1.238`)

## Environment Variables

### `.env.local` (Root)

```env
NEXT_PUBLIC_APP_URL=http://192.168.1.238:3000
EXPO_PUBLIC_APP_URL=http://192.168.1.238:3000
NEXT_PUBLIC_SUPABASE_URL=https://gujyzwqcwecbeznlablx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### `apps/mobile/.env`

```env
EXPO_PUBLIC_APP_URL=http://192.168.1.238:3000
NEXT_PUBLIC_APP_URL=https://sparecarry.com  # Note: This might need to be local IP too
NEXT_PUBLIC_SUPABASE_URL=https://gujyzwqcwecbeznlablx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Supabase Dashboard Configuration

### What Should Be Set

**Authentication → URL Configuration:**

1. **Site URL**: `http://192.168.1.238:3000` (NOT localhost)
2. **Redirect URLs** (one per line):
   ```
   http://localhost:3000/auth/callback
   http://192.168.1.238:3000/auth/callback
   https://sparecarry.com/auth/callback
   ```

### Current Status

- User reports they have set these correctly
- But Supabase is still redirecting to localhost

## Code Implementation

### OAuth Flow (`packages/hooks/useAuth.ts`)

```typescript
const signInWithOAuth = async (provider: "google" | "apple" | "github") => {
  const redirectUrl = getAuthCallbackUrl("/home"); // Returns: http://192.168.1.238:3000/auth/callback?redirect=%2Fhome

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: false,
    },
  });

  // Opens URL with expo-linking
  if (data?.url) {
    await Linking.openURL(data.url);
  }
};
```

### Callback URL Helper (`lib/supabase/mobile.ts`)

```typescript
export function getAuthCallbackUrl(redirectPath: string = "/home"): string {
  // Priority 1: Use EXPO_PUBLIC_APP_URL if set
  const expoAppUrl = process.env.EXPO_PUBLIC_APP_URL;
  if (expoAppUrl) {
    return `${expoAppUrl}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
  }
  // ... fallbacks
}
```

### Callback Handler (`app/auth/callback/page.tsx`)

Handles the OAuth callback, detects mobile devices, and redirects to deep link:

- Detects if on mobile using `getAppScheme()`
- If mobile, redirects to `sparecarry://auth/callback` with tokens
- If web, processes session normally

## Logs Analysis

### What the Logs Show

When clicking "Sign in with Google", the logs show:

```
LOG  [useAuth] OAuth redirect URL: http://192.168.1.238:3000/auth/callback?redirect=%2Fhome
LOG  [useAuth] EXPO_PUBLIC_APP_URL: http://192.168.1.238:3000
LOG  [useAuth] NEXT_PUBLIC_APP_URL: undefined
LOG  [useAuth] Supabase OAuth URL: https://gujyzwqcwecbeznlablx.supabase.co/auth/v1/authorize?provider=google&redirect_to=http%3A%2F%2F192.168.1.238%3A3000%2Fauth%2Fcallback%3Fredirect%3D%252Fhome&...
LOG  [useAuth] Redirect_to in OAuth URL: http://192.168.1.238:3000/auth/callback?redirect=%2Fhome
LOG  [useAuth] Expected redirect_to: http://192.168.1.238:3000/auth/callback?redirect=%2Fhome
LOG  [useAuth] ✅ Redirect URL matches!
LOG  [useAuth] Opening OAuth URL: ...
LOG  [useAuth] URL opened successfully
```

**Analysis:**

- ✅ Code is generating correct redirect URL
- ✅ Supabase OAuth URL contains correct `redirect_to` parameter
- ✅ URL is being opened correctly
- ❌ **But after Google authentication, Supabase redirects to `localhost:3000` instead**

## Root Cause Hypothesis

Based on Supabase's behavior, the most likely causes are:

1. **Site URL in Supabase Dashboard is set to `localhost:3000`**
   - Supabase uses Site URL as a fallback when redirect URL validation fails
   - Even if redirect URL is in whitelist, Site URL might override it

2. **Redirect URL format mismatch**
   - Supabase might be strict about URL format (trailing slashes, query parameters)
   - The redirect URL includes query params: `?redirect=%2Fhome`

3. **Supabase Dashboard changes not propagated**
   - Changes might take time to propagate
   - User might be looking at wrong project

4. **Google OAuth configuration**
   - Google Cloud Console might have wrong redirect URIs
   - But this would cause a different error (redirect_uri_mismatch)

## What We've Done

### 1. Enhanced Logging

- Added detailed logging in `useAuth.ts` to show:
  - Generated redirect URL
  - Supabase OAuth URL
  - Comparison of expected vs actual redirect
- Added logging in `app/auth/callback/page.tsx` to show:
  - Exact URL received
  - Warning if localhost is detected
  - Step-by-step troubleshooting instructions

### 2. Environment Variable Configuration

- Verified `.env.local` has correct values
- Verified `apps/mobile/.env` has correct values
- Created script to find network IP: `apps/mobile/scripts/get-network-ip.js`

### 3. Documentation

- Created `docs/GOOGLE_OAUTH_SETUP.md` - OAuth setup guide
- Created `docs/TROUBLESHOOTING_OAUTH_REDIRECT.md` - Troubleshooting guide
- Created `docs/SUPABASE_DASHBOARD_CHECKLIST.md` - Dashboard verification checklist
- Created `docs/FINDING_LOCAL_IP.md` - How to find local IP
- Created `docs/ENV_VARIABLES_EXPLAINED.md` - Environment variable explanation

### 4. Code Improvements

- Enhanced `getAuthCallbackUrl()` to prioritize `EXPO_PUBLIC_APP_URL`
- Added warnings when network IP is not set
- Improved mobile detection in callback handler
- Added deep link redirect for mobile devices

## Key Files Modified

1. **`packages/hooks/useAuth.ts`**
   - Added detailed OAuth logging
   - Added redirect URL validation
   - Added error messages with troubleshooting steps

2. **`lib/supabase/mobile.ts`**
   - Updated `getAuthCallbackUrl()` to prioritize `EXPO_PUBLIC_APP_URL`
   - Added warnings for missing network IP
   - Fixed app scheme to match `sparecarry://`

3. **`app/auth/callback/page.tsx`**
   - Added detailed URL logging
   - Added localhost detection and warnings
   - Enhanced mobile deep link handling

## Next Steps / What to Try

### 1. Verify Supabase Dashboard (Most Important)

- Double-check Site URL is `http://192.168.1.238:3000` (NOT localhost)
- Verify Redirect URLs includes exact match: `http://192.168.1.238:3000/auth/callback`
- Make sure you're in the correct Supabase project
- Wait 30-60 seconds after saving changes

### 2. Check Callback Logs

After fixing Supabase Dashboard, check the callback logs:

- Should see: `[AuthCallback] Current URL: http://192.168.1.238:3000/auth/callback?...`
- Should NOT see: `[AuthCallback] Current URL: http://localhost:3000/auth/callback?...`

### 3. Try Without Query Parameters

Supabase might be strict about query parameters. Try:

- Set redirect URL to: `http://192.168.1.238:3000/auth/callback` (without `?redirect=...`)
- Handle redirect in callback handler instead

### 4. Check Google Cloud Console

- Verify authorized redirect URIs include Supabase callback:
  ```
  https://gujyzwqcwecbeznlablx.supabase.co/auth/v1/callback
  ```

### 5. Test with Production URL

Temporarily set both to production to isolate the issue:

- Site URL: `https://sparecarry.com`
- Redirect URL: `https://sparecarry.com/auth/callback`
- If this works, the issue is specific to local network IP

### 6. Check Supabase Project Settings

- Verify project URL matches: `https://gujyzwqcwecbeznlablx.supabase.co`
- Check if there are any project-level redirect restrictions

## Important Notes

1. **Starlink**: User is on Starlink, but local network IP (`192.168.1.238`) is controlled by router, not Starlink. IP can change if router restarts.

2. **Expo Environment Variables**: Expo reads from `apps/mobile/.env`, not root `.env.local`. Both should be set for consistency.

3. **Supabase Validation**: Supabase validates redirect URLs against a whitelist. If URL is not in whitelist, it uses Site URL as fallback.

4. **Mobile Deep Links**: The callback page detects mobile and redirects to `sparecarry://auth/callback` with tokens. This part works correctly.

## Questions to Answer

1. What is the exact Site URL in Supabase Dashboard?
2. What are the exact Redirect URLs in Supabase Dashboard?
3. What URL does the callback page actually receive? (Check `[AuthCallback]` logs)
4. Is the Supabase project URL correct? (`https://gujyzwqcwecbeznlablx.supabase.co`)
5. Are there any errors in the browser console when redirecting?
6. Does it work if you temporarily use production URL (`https://sparecarry.com`)?

## Related Documentation Files

- `docs/GOOGLE_OAUTH_SETUP.md` - Complete OAuth setup guide
- `docs/TROUBLESHOOTING_OAUTH_REDIRECT.md` - Troubleshooting steps
- `docs/SUPABASE_DASHBOARD_CHECKLIST.md` - Dashboard verification checklist
- `docs/FINDING_LOCAL_IP.md` - How to find local IP address
- `docs/ENV_VARIABLES_EXPLAINED.md` - Environment variable guide

## Code References

- OAuth implementation: `packages/hooks/useAuth.ts` (line 273-354)
- Callback URL helper: `lib/supabase/mobile.ts` (line 135-201)
- Callback handler: `app/auth/callback/page.tsx` (line 30-176)
- Mobile login screen: `apps/mobile/app/auth/login.tsx`
