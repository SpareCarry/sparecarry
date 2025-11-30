# Supabase Dashboard Configuration Checklist

## ⚠️ CRITICAL: If OAuth redirects to localhost instead of your network IP

This checklist will help you verify your Supabase Dashboard settings are correct.

## Step-by-Step Verification

### 1. Go to Supabase Dashboard

1. Open: https://supabase.com/dashboard
2. **Select your project** (make sure it's the right one!)
3. Navigate to: **Authentication** → **URL Configuration**

### 2. Check Site URL

**Current value should be:**

```
http://192.168.1.238:3000
```

**NOT:**

- ❌ `http://localhost:3000`
- ❌ `https://sparecarry.com` (for local dev)
- ❌ Empty

**How to fix:**

1. Click the "Site URL" field
2. Change it to: `http://192.168.1.238:3000`
3. Replace `192.168.1.238` with your actual network IP (run `node apps/mobile/scripts/get-network-ip.js`)
4. **Click "Save"**
5. **Wait 30 seconds** for changes to propagate

### 3. Check Redirect URLs

**Must include ALL of these (one per line):**

```
http://localhost:3000/auth/callback
http://192.168.1.238:3000/auth/callback
https://sparecarry.com/auth/callback
```

**Important:**

- Replace `192.168.1.238` with your actual network IP
- Each URL must be on a **separate line**
- No trailing slashes (don't use `/auth/callback/`)
- Must include the `/auth/callback` path

**How to verify:**

1. Scroll to "Redirect URLs" section
2. Check that `http://192.168.1.238:3000/auth/callback` is in the list
3. If missing, click "Add URL" and add it
4. **Click "Save"**
5. **Wait 30 seconds**

### 4. Common Mistakes

#### ❌ Site URL is localhost

**Problem**: Supabase will use Site URL as fallback if redirect URL validation fails
**Fix**: Set Site URL to your network IP: `http://192.168.1.238:3000`

#### ❌ Redirect URL missing `/auth/callback`

**Problem**: `http://192.168.1.238:3000` without the path won't work
**Fix**: Must be `http://192.168.1.238:3000/auth/callback`

#### ❌ Trailing slash

**Problem**: `http://192.168.1.238:3000/auth/callback/` (with trailing slash) might not match
**Fix**: Use `http://192.168.1.238:3000/auth/callback` (no trailing slash)

#### ❌ Wrong project

**Problem**: You're looking at a different Supabase project
**Fix**: Double-check your project URL matches your `NEXT_PUBLIC_SUPABASE_URL`

#### ❌ Changes not saved

**Problem**: You edited but didn't click "Save"
**Fix**: Make sure you click "Save" and see a success message

#### ❌ Changes not propagated

**Problem**: Supabase needs time to propagate changes
**Fix**: Wait 30 seconds after saving, then try again

### 5. Verify Your Project

Make sure you're in the correct Supabase project:

1. Check your `.env.local` file for `NEXT_PUBLIC_SUPABASE_URL`
2. It should be: `https://gujyzwqcwecbeznlablx.supabase.co`
3. In Supabase Dashboard, verify the project URL matches

### 6. Test After Changes

1. **Save** all changes in Supabase Dashboard
2. **Wait 30 seconds**
3. **Restart Expo** with cleared cache:
   ```bash
   cd apps/mobile
   npx expo start --clear
   ```
4. **Try "Sign in with Google" again**
5. **Check logs** - you should see:
   ```
   LOG  [AuthCallback] Current URL: http://192.168.1.238:3000/auth/callback?...
   ```
   NOT:
   ```
   LOG  [AuthCallback] Current URL: http://localhost:3000/auth/callback?...
   ```

## Quick Reference

### For Local Development:

- **Site URL**: `http://192.168.1.238:3000`
- **Redirect URLs**:
  - `http://localhost:3000/auth/callback`
  - `http://192.168.1.238:3000/auth/callback`
  - `https://sparecarry.com/auth/callback`

### For Production:

- **Site URL**: `https://sparecarry.com`
- **Redirect URLs**:
  - `https://sparecarry.com/auth/callback`
  - (Keep localhost and network IP for testing)

## Still Not Working?

1. **Check the callback logs** - Look for `[AuthCallback]` messages to see what URL Supabase actually redirected to
2. **Double-check Site URL** - This is the most common issue
3. **Verify Redirect URLs** - Make sure the exact URL is in the list
4. **Wait longer** - Sometimes Supabase takes up to 1 minute to propagate changes
5. **Try in incognito** - Clear browser cache and try again
6. **Check Google Cloud Console** - Make sure Supabase callback URL is authorized

## Summary

The most common issue is **Site URL being set to localhost**. Even if your redirect URL is correct, Supabase will use the Site URL as a fallback. Make sure:

1. ✅ Site URL = `http://192.168.1.238:3000` (your network IP)
2. ✅ Redirect URLs includes `http://192.168.1.238:3000/auth/callback`
3. ✅ Changes are saved and propagated (wait 30 seconds)
4. ✅ You're in the correct Supabase project
