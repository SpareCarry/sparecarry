# Supabase Authentication Fix

## Issue Fixed

Fixed the error: **"Could not parse request body as JSON: json: cannot unmarshal object into Go struct field PKCEGrantParams.auth_code of type string"**

This error occurred when clicking magic link emails after requesting authentication.

## Root Cause

The callback route (`app/auth/callback/route.ts`) was incorrectly passing an object `{ code, codeVerifier }` to `supabase.auth.exchangeCodeForSession()`, but Supabase's backend expects just the code string. The Supabase SSR library automatically handles PKCE code verifier extraction from cookies or URL parameters.

## Solution

Modified `app/auth/callback/route.ts` to:

1. **Always pass just the code string** to `exchangeCodeForSession(code)` - never pass an object
2. **Let Supabase SSR handle PKCE automatically** - the library extracts code_verifier from:
   - URL parameters (if present)
   - Cookies (if stored by Supabase SSR)
   - Falls back to non-PKCE flow if not needed
3. **Added support for legacy token_hash flow** - handles older magic link format with `token_hash` parameter
4. **Fixed TypeScript errors** - added proper type assertions for Next.js 14 compatibility

## Key Changes

### Before (Incorrect)

```typescript
// This caused the error
if (finalCodeVerifier && !codeVerifier) {
  exchangeResult = await supabase.auth.exchangeCodeForSession({
    code: code,
    codeVerifier: finalCodeVerifier,
  });
}
```

### After (Correct)

```typescript
// Always pass just the code string - Supabase SSR handles PKCE automatically
exchangeResult = await supabase.auth.exchangeCodeForSession(code);
```

## Supabase Configuration Requirements

### 1. Redirect URLs Setup

In your Supabase Dashboard → Authentication → URL Configuration:

**For Local Development:**

```
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
```

**For Production:**

```
https://yourdomain.com/auth/callback
```

**Site URL:**

- Local: `http://localhost:3000` (or your port)
- Production: `https://yourdomain.com`

### 2. PKCE Flow

The Supabase client is configured with PKCE enabled (`lib/supabase/client.ts`):

```typescript
auth: {
  flowType: "pkce",
  storage: getBrowserStorage(),
}
```

This ensures:

- Code verifier is stored in localStorage for client-side requests
- Supabase SSR automatically manages cookies for server-side callbacks
- Magic links work correctly when clicked from email

### 3. Environment Variables

Required environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Testing

### Manual Test

1. Start dev server: `npm run dev`
2. Navigate to `/auth/signup` or `/auth/login`
3. Enter your email and request magic link
4. Check your email and click the magic link
5. Should redirect to `/home` successfully (no error)

### What to Check

If you still see errors:

1. **Check terminal logs** when clicking the magic link:
   - Look for "Auth callback received:" log
   - Check if `code` is present
   - Check if `code_verifier` is in URL or cookies

2. **Verify Supabase Dashboard**:
   - Authentication → URL Configuration
   - Ensure callback URL is in "Redirect URLs" list
   - Site URL matches your app URL

3. **Check Email Link**:
   - The magic link URL should contain `code=` parameter
   - May also contain `code_verifier=` parameter
   - Should redirect to `http://localhost:3000/auth/callback` (or your port)

## Files Modified

1. `app/auth/callback/route.ts` - Fixed exchangeCodeForSession call and added token_hash support
2. `SUPABASE_AUTH_FIX.md` - This documentation

## Next Steps

1. **Request a new magic link** (old links won't work with updated code)
2. **Test the authentication flow** end-to-end
3. **Verify redirect URLs** in Supabase Dashboard match your setup
4. **Check logs** if any issues persist

## Related Files

- `lib/supabase/client.ts` - Browser client with PKCE configuration
- `lib/supabase/server.ts` - Server client for SSR
- `lib/supabase/middleware.ts` - Middleware for session management
- `app/auth/login/page.tsx` - Login page
- `app/auth/signup/page.tsx` - Signup page

## Additional Notes

- Magic links now support both PKCE flow (with `code`) and legacy flow (with `token_hash`)
- The callback route handles both automatically
- PKCE is required for better security with magic links
- Supabase SSR library version: 0.1.0 (check if updates are needed)
