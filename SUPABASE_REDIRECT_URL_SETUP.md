# Supabase Redirect URL Setup Guide

## The Problem

When you click a magic link, Supabase redirects to your callback URL. If that URL isn't in Supabase's allowed redirect URLs, authentication fails.

## The Solution

### 1. Go to Supabase Dashboard

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to: **Authentication** → **URL Configuration**

### 2. Add Redirect URLs

In the "Redirect URLs" section, add these URLs:

**For Local Development:**

```
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
```

**For Production (replace with your domain):**

```
https://your-domain.com/auth/callback
https://sparecarry.com/auth/callback
```

**Wildcard (if you want to allow all subdomains):**

```
https://*.sparecarry.com/auth/callback
```

### 3. Set Site URL

In the "Site URL" field, set:

- Local: `http://localhost:3001` (or 3000 if that's your port)
- Production: `https://sparecarry.com`

### 4. Save Changes

Click "Save" to save your changes.

## Verify Your Setup

### Check Current Configuration

1. Go to **Authentication** → **URL Configuration**
2. Verify these URLs are in the "Redirect URLs" list:
   - `http://localhost:3001/auth/callback` (or 3000)
   - Your production callback URL

### Test Magic Link

1. Request a new magic link
2. Click the link in your email
3. Check the browser's address bar - what URL does it redirect to?
4. Check your terminal/server logs for the error message

## Common Issues

### Issue 1: Port Mismatch

**Problem:** Link uses `localhost:3000` but server runs on `3001`

**Fix:** Add both ports to redirect URLs:

```
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
```

### Issue 2: Protocol Mismatch

**Problem:** Using `http://` but Supabase expects `https://`

**Fix:** Make sure your redirect URL matches your Site URL protocol

### Issue 3: Path Mismatch

**Problem:** Link goes to `/auth/callback` but redirect URL is `/callback`

**Fix:** Make sure redirect URL exactly matches: `/auth/callback`

## What the Error Means

If you see "Authentication failed", check:

1. Terminal logs - look for "Error exchanging code for session"
2. The actual error message will tell you what's wrong
3. Most common: "Invalid redirect URL" means the URL isn't in Supabase settings

## After Fixing

1. **Request a new magic link** (old links won't work with new settings)
2. Click the new link
3. You should be logged in and redirected to `/home`

## Quick Checklist

- [ ] Callback URL is in Supabase Redirect URLs list
- [ ] Site URL matches your app URL (http://localhost:3001)
- [ ] Requested a NEW magic link after updating settings
- [ ] Checked terminal logs for actual error message
