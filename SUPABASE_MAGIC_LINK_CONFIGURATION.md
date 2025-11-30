# Supabase Magic Link Configuration Guide

## Critical Configuration Steps

### 1. Supabase Dashboard → Authentication → URL Configuration

**Go to**: [Supabase Dashboard](https://app.supabase.com) → Your Project → Authentication → URL Configuration

**Required Redirect URLs** (add ALL of these):

```
http://localhost:3000/auth/callback
https://your-production-domain.com/auth/callback
```

**Site URL** (set to your production domain):

```
https://your-production-domain.com
```

OR for local development:

```
http://localhost:3000
```

### 2. Verify Environment Variables

**Check your `.env.local` file has:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Verify these are correct:**

1. Go to Supabase Dashboard → Settings → API
2. Copy `Project URL` → should match `NEXT_PUBLIC_SUPABASE_URL`
3. Copy `anon/public` key → should match `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. How Magic Links Work

1. User requests magic link from `/auth/login` or `/auth/signup`
2. Supabase sends email with link: `https://your-domain.com/auth/callback?code=...&redirect=/home`
3. User clicks link → goes to `/auth/callback` route
4. Route exchanges `code` for session via `exchangeCodeForSession()`
5. Session cookies are set and user is redirected to `/home` (or redirect param)

### 4. Common Issues and Fixes

**Issue: Redirects to signup page instead of logging in**

**Possible Causes:**

1. ✅ **FIXED**: Session cookies not persisting → Enhanced cookie persistence logic
2. Callback URL not in Supabase redirect URLs → Add to Supabase Dashboard
3. Site URL mismatch → Verify in Supabase Dashboard
4. Environment variables incorrect → Check `.env.local`

**Fix Steps:**

1. ✅ Code fix applied - session cookies now properly persist
2. Add callback URL to Supabase → Authentication → URL Configuration
3. Verify Site URL matches your domain
4. Request a NEW magic link (old links won't work after code changes)

**Issue: "No session created"**

**Possible Causes:**

1. Code exchange failing → Check server logs for errors
2. PKCE code verifier missing → Should be auto-included in email link
3. Cookie options incorrect → ✅ FIXED with proper cookie options

**Fix Steps:**

1. Check terminal/console logs when clicking magic link
2. Look for: "Successfully exchanged code for session:"
3. If error, check error message in logs
4. Verify Supabase project settings → Authentication → Providers → Email

### 5. Testing the Fix

1. **Clear browser cookies/storage** (important - old session might interfere)
2. **Go to** `/auth/login` or `/auth/signup`
3. **Enter email** and click "Send Magic Link"
4. **Check email** - should contain link like:
   ```
   http://localhost:3000/auth/callback?code=xxx&redirect=/home
   ```
5. **Click magic link** - should:
   - Redirect to `/home` (or the redirect param)
   - Create session cookies
   - Log you in (check by trying to access protected routes)

### 6. Debugging

**Check Server Logs** (terminal where `pnpm dev` is running):

```
Auth callback received: { code: "present", redirectTo: "/home", ... }
Successfully exchanged code for session: user@example.com
Copying cookies to redirect response: ["sb-xxx-auth-token", ...]
Redirecting to: /home
Session cookies set: ["sb-xxx-auth-token", ...]
```

**Check Browser DevTools**:

1. Network tab → Find `/auth/callback` request
2. Response headers → Should see `Set-Cookie` headers
3. Application → Cookies → Should see Supabase session cookies

**If redirects to signup:**

- Session wasn't created → Check server logs for errors
- Cookies not persisting → Check browser cookies are set
- Callback URL mismatch → Verify in Supabase Dashboard

## Summary of Fixes Applied

✅ **Enhanced cookie persistence** - Cookies are now properly copied to redirect response
✅ **Proper cookie options** - secure flag respects environment (false in dev, true in prod)
✅ **Better error handling** - Comprehensive logging for debugging
✅ **Cookie copying** - Both response and request cookies are copied to ensure persistence

## Next Steps

1. **Request a new magic link** (old links won't work after code changes)
2. **Click the link** - should log you in and redirect to `/home`
3. **Verify session** - check cookies in browser DevTools
4. **If still issues** - check server logs for specific error messages
