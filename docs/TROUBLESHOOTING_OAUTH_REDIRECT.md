# Troubleshooting OAuth Redirect to localhost:3000

## Problem

When clicking "Sign in with Google" on mobile, the browser redirects to `localhost:3000` instead of your network IP (`http://192.168.1.238:3000`), causing the authentication to fail because your phone can't reach `localhost`.

## Root Cause

**Supabase validates all redirect URLs against a whitelist in the Dashboard.** Even if your code passes the correct `redirectTo` parameter, Supabase will ignore it if the URL is not in the whitelist and will use the Site URL instead (which is likely set to `localhost:3000`).

## Solution: Add Your Network IP to Supabase Dashboard

### Step 1: Find Your Network IP

Run this command in your terminal:

```bash
node apps/mobile/scripts/get-network-ip.js
```

This will print your network IP address (e.g., `192.168.1.238`).

### Step 2: Configure Supabase Dashboard

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Navigate to**: Authentication → **URL Configuration**
4. **Set Site URL**:
   - For local development: `http://192.168.1.238:3000` (replace with your actual IP)
   - For production: `https://sparecarry.com`
5. **Add Redirect URLs** (add ALL of these, one per line):
   ```
   http://localhost:3000/auth/callback
   http://192.168.1.238:3000/auth/callback
   https://sparecarry.com/auth/callback
   ```
   ⚠️ **CRITICAL**: Replace `192.168.1.238` with your actual network IP from Step 1
6. **Click "Save"**
7. **Wait 10-30 seconds** for changes to propagate

### Step 3: Verify Environment Variables

Make sure your environment variables are set correctly:

**`.env.local` (root)**:

```env
EXPO_PUBLIC_APP_URL=http://192.168.1.238:3000
NEXT_PUBLIC_APP_URL=http://192.168.1.238:3000
```

**`apps/mobile/.env`**:

```env
EXPO_PUBLIC_APP_URL=http://192.168.1.238:3000
NEXT_PUBLIC_APP_URL=http://192.168.1.238:3000
```

### Step 4: Restart Your App

1. **Stop Expo** (Ctrl+C)
2. **Clear cache and restart**:
   ```bash
   cd apps/mobile
   npx expo start --clear
   ```
3. **Try "Sign in with Google" again**

## How to Verify It's Fixed

After making the changes, check the logs when you click "Sign in with Google". You should see:

```
LOG  [useAuth] OAuth redirect URL: http://192.168.1.238:3000/auth/callback?redirect=%2Fhome
LOG  [useAuth] Supabase OAuth URL: https://...supabase.co/auth/v1/authorize?...redirect_to=http%3A%2F%2F192.168.1.238%3A3000%2Fauth%2Fcallback...
LOG  [useAuth] ✅ Redirect URL matches!
```

If you see:

```
LOG  [useAuth] ❌ MISMATCH: Supabase is not using our redirect URL!
```

Then the URL is still not in the Supabase Dashboard whitelist. Double-check Step 2.

## Common Mistakes

### ❌ Only adding to "Redirect URLs" but not setting "Site URL"

- **Fix**: Set both "Site URL" and "Redirect URLs" in Supabase Dashboard

### ❌ Using localhost instead of network IP

- **Fix**: Use your network IP (`192.168.1.238`) not `localhost` for mobile development

### ❌ Not waiting for changes to propagate

- **Fix**: Wait 10-30 seconds after saving in Supabase Dashboard before testing

### ❌ Not restarting Expo after changing env variables

- **Fix**: Always restart Expo with `--clear` flag after changing `.env` files

### ❌ Phone and computer on different networks

- **Fix**: Make sure your phone and computer are on the same WiFi network

## Still Not Working?

1. **Check the logs** - Look for the `[useAuth]` log messages to see what URL Supabase is actually using
2. **Verify in Supabase Dashboard** - Double-check that your network IP URL is in the Redirect URLs list
3. **Check Site URL** - Make sure Site URL is set to your network IP (not localhost) for local dev
4. **Try production URL** - Temporarily set both to `https://sparecarry.com` to test if it's a network issue
5. **Check Google Cloud Console** - Make sure the Supabase callback URL is in Google's authorized redirect URIs

## Quick Checklist

- [ ] Network IP added to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
- [ ] Site URL set to network IP (not localhost) in Supabase Dashboard
- [ ] `EXPO_PUBLIC_APP_URL` set in `apps/mobile/.env`
- [ ] `NEXT_PUBLIC_APP_URL` set in `.env.local`
- [ ] Expo restarted with `--clear` flag
- [ ] Phone and computer on same WiFi network
- [ ] Waited 10-30 seconds after saving Supabase Dashboard changes

If all of these are checked and it still doesn't work, check the logs for the exact error message.
