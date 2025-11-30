# PKCE Flow Fix - "code verifier should be non-empty" Error

## The Problem

The error "invalid request: both auth code and code verifier should be non-empty" occurs when Supabase expects PKCE (Proof Key for Code Exchange) flow, but the code verifier is missing.

## Why This Happens

1. **Magic links don't need PKCE** - Magic links are email-based and don't require PKCE flow
2. **PKCE is for OAuth** - PKCE is typically used for OAuth flows (Google, Apple, etc.)
3. **Code verifier in localStorage** - If PKCE is enabled, the code verifier is stored in the browser's localStorage when you request the magic link
4. **Email link opens in different context** - When you click the magic link in your email, the code verifier might not be available

## The Fix

The callback route now:

1. ✅ Checks for `code_verifier` in the URL parameters
2. ✅ If present, uses PKCE flow
3. ✅ If not present, uses regular code exchange
4. ✅ Logs all URL parameters for debugging

## What to Check

### 1. Check Terminal Logs

When you click the magic link, check your terminal for:

```
Auth callback received: {
  code: "present" | "missing",
  codeVerifier: "present" | "missing",
  allParams: { ... all URL parameters ... }
}
```

### 2. Check Browser Console

When you request a magic link, check browser console (F12) for:

- "Sending magic link to: [email]"
- "Callback URL: [url]"

### 3. Check Magic Link URL

When you receive the magic link email, the URL should look like:

- **Without PKCE:** `https://your-project.supabase.co/auth/v1/verify?token=...&type=magiclink&redirect_to=http://localhost:3000/auth/callback`
- **With PKCE:** `https://your-project.supabase.co/auth/v1/verify?token=...&type=magiclink&redirect_to=http://localhost:3000/auth/callback&code=...`

## If Still Getting Error

### Option 1: Disable PKCE for Magic Links (Recommended)

Magic links don't need PKCE. If Supabase is requiring it, you can:

1. Check Supabase Dashboard → Authentication → URL Configuration
2. Make sure PKCE isn't forced for all flows
3. PKCE should only be required for OAuth flows

### Option 2: Ensure Code Verifier is Available

If you're using PKCE flow:

1. Request the magic link in the same browser
2. Click the link in the same browser session
3. Don't open the link in a different browser/device

### Option 3: Use OTP Instead of Magic Link

If PKCE continues to be an issue, consider using OTP codes instead:

- User enters email
- Receives a 6-digit code
- Enters code to verify
- No PKCE required

## Testing

1. **Request a new magic link**
2. **Check terminal logs** when you click the link
3. **Look for "codeVerifier: present" or "missing"** in logs
4. **If "missing" but still getting PKCE error**, Supabase might be requiring PKCE globally

## Current Implementation

The callback route now handles both flows:

- ✅ PKCE flow (if `code_verifier` is in URL)
- ✅ Regular flow (if no `code_verifier`)
- ✅ Better error logging
- ✅ All URL parameters logged for debugging

Try requesting a new magic link and check the terminal logs - it will tell you exactly what's happening!
