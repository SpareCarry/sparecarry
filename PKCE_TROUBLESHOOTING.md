# PKCE Flow Troubleshooting Guide

## The Error

"invalid request: both auth code and code verifier should be non-empty"

## Why This Happens

Supabase magic links now use PKCE (Proof Key for Code Exchange) flow by default. This requires:
1. **Code verifier** - Generated and stored when requesting the magic link
2. **Authorization code** - Sent in the email link

The problem: When you click the magic link from your email:
- The code verifier is stored in **localStorage** on the browser where you requested the link
- If you click the link in a **different browser/device**, or **after clearing storage**, the code verifier is missing
- This causes the PKCE error

## Solutions

### Solution 1: Use Same Browser/Device (Quick Fix)

1. Request the magic link in your browser
2. **Don't close the tab**
3. Click the magic link in the **same browser tab** or same browser
4. The code verifier will be available in localStorage

### Solution 2: Store Code Verifier in Cookies (Better)

The code verifier should be stored in cookies (not localStorage) so it persists across:
- Different tabs
- Email link clicks
- Page refreshes

### Solution 3: Disable PKCE for Magic Links (If Allowed)

If Supabase allows it, you can disable PKCE for magic links:
- Only use PKCE for OAuth flows (Google, Apple)
- Use regular code exchange for magic links

## Current Implementation

The app now:
1. ✅ Configures Supabase client with PKCE flow
2. ✅ Uses localStorage for code verifier storage
3. ✅ Handles both PKCE and regular flows in callback
4. ✅ Logs all URL parameters for debugging

## What to Check

### 1. Check Terminal Logs

When you click the magic link, check terminal for:
```
Auth callback received: {
  code: "present" | "missing",
  codeVerifier: "present" | "missing",
  allParams: { ... }
}
```

**If `codeVerifier: "missing"`:**
- The code verifier wasn't stored or is in a different browser
- Try requesting a new magic link in the same browser session

### 2. Check Browser Console

When requesting a magic link, check console (F12) for:
- "Sending magic link to: [email]"
- "Callback URL: [url]"

### 3. Check Supabase Dashboard

1. Go to **Authentication** → **URL Configuration**
2. Make sure redirect URLs are correct
3. Check if PKCE is enabled/required

## Manual Workaround

If you keep getting the error:

1. **Request magic link** in your browser (keep tab open)
2. **Check email** for magic link
3. **Copy the URL** from email
4. **Paste it in the same browser tab** where you requested it
5. **Press Enter**

This ensures the code verifier in localStorage is available.

## Next Steps

The callback route now handles both PKCE and regular flows. If you still get the error:
1. Check terminal logs for what parameters are present
2. Try requesting a new magic link
3. Click the link in the same browser session
4. Share the terminal logs so we can debug further

