# Google OAuth Setup Guide

## Overview

SpareCarry uses **Supabase Auth** for Google OAuth, which means:

- ✅ **Google Client ID and Secret** are configured in **Supabase Dashboard** (NOT in your env files)
- ✅ **Callback URLs** are configured in **Supabase Dashboard** (NOT in your env files)
- ✅ Your app only needs to know the callback URL to redirect to (handled automatically)

## Step 1: Configure Google OAuth in Supabase

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Navigate to**: Authentication → Providers
4. **Find Google** and click to configure
5. **Enable Google provider**
6. **Add your Google OAuth credentials**:
   - **Client ID (for OAuth)**: Get from [Google Cloud Console](https://console.cloud.google.com/)
   - **Client Secret (for OAuth)**: Get from Google Cloud Console

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API** (or **Google Identity API**)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add **Authorized redirect URIs**:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   Replace `YOUR_PROJECT_REF` with your Supabase project reference (found in your Supabase URL)
7. Copy the **Client ID** and **Client Secret**
8. Paste them into Supabase Dashboard → Authentication → Providers → Google

## Step 2: Configure Callback URLs in Supabase ⚠️ CRITICAL

**This is the most common issue!** Supabase will **only redirect to URLs in this whitelist**, even if you pass a different `redirectTo` parameter.

1. **In Supabase Dashboard**: Authentication → URL Configuration
2. **Set Site URL**:
   - **For local dev**: `http://192.168.1.238:3000` (your network IP)
   - **For production**: `https://sparecarry.com`
3. **Add Redirect URLs** (add ALL of these):

   ```
   http://localhost:3000/auth/callback
   http://192.168.1.238:3000/auth/callback
   https://sparecarry.com/auth/callback
   ```

   ⚠️ **CRITICAL**:
   - Replace `192.168.1.238` with your actual network IP (run `node apps/mobile/scripts/get-network-ip.js`)
   - **All three URLs must be added** - Supabase validates against this list
   - If your network IP is missing, Supabase will redirect to localhost or Site URL instead

4. **For mobile deep links** (optional, Supabase handles this automatically):
   ```
   sparecarry://auth/callback
   ```

## Step 3: Environment Variables (What You Actually Need)

### ✅ Required in `.env.local` (Root)

```env
# Your app URL (used for OAuth callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # For local dev
# Or for production:
# NEXT_PUBLIC_APP_URL=https://sparecarry.com

# Supabase credentials (already have these)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### ✅ Required in `apps/mobile/.env` (For Mobile)

```env
# Your network IP for mobile OAuth callbacks
EXPO_PUBLIC_APP_URL=http://192.168.1.238:3000
# Replace with your actual network IP (run: node apps/mobile/scripts/get-network-ip.js)

# Supabase credentials (already have these)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### ❌ NOT Needed in Env Files

- ❌ `GOOGLE_CLIENT_ID` - Configured in Supabase Dashboard
- ❌ `GOOGLE_CLIENT_SECRET` - Configured in Supabase Dashboard
- ❌ `SUPABASE_CALLBACK_URL` - Handled automatically by Supabase

## How It Works

1. **User clicks "Sign in with Google"** in your app
2. **App calls** `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. **Supabase redirects** to Google OAuth (using credentials from Supabase Dashboard)
4. **User authenticates** with Google
5. **Google redirects back** to Supabase callback URL
6. **Supabase processes** the OAuth response
7. **Supabase redirects** to your app's callback URL (`/auth/callback`)
8. **Your app** (`app/auth/callback/page.tsx`) processes the tokens
9. **Mobile**: Web callback detects mobile and redirects to deep link (`sparecarry://auth/callback`)
10. **Mobile app** receives tokens and completes authentication

## Troubleshooting

### "redirect_uri_mismatch" Error

**Problem**: Google OAuth fails with redirect URI mismatch

**Solution**:

1. Check Google Cloud Console → Credentials → OAuth 2.0 Client ID
2. Make sure this redirect URI is added:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
3. Check Supabase Dashboard → Authentication → URL Configuration
4. Make sure your callback URLs are listed there

### OAuth Works on Web but Not Mobile

**Problem**: Google sign-in works on web but fails on mobile

**Solution**:

1. Make sure `EXPO_PUBLIC_APP_URL` is set in `apps/mobile/.env`
2. Make sure the URL is your network IP (not localhost)
3. Make sure your phone and computer are on the same WiFi
4. Make sure the callback URL is added to Supabase Dashboard:
   ```
   http://YOUR_NETWORK_IP:3000/auth/callback
   ```

### "Invalid OAuth credentials" Error

**Problem**: Supabase returns invalid OAuth credentials error

**Solution**:

1. Check Supabase Dashboard → Authentication → Providers → Google
2. Verify Client ID and Client Secret are correct
3. Make sure Google provider is **enabled**
4. Check that the redirect URI in Google Cloud Console matches Supabase's callback URL

## Summary

- ✅ **Google Client ID/Secret**: Configure in **Supabase Dashboard** (not env files)
- ✅ **Callback URLs**: Configure in **Supabase Dashboard** → Authentication → URL Configuration
- ✅ **App needs**: Only `NEXT_PUBLIC_APP_URL` / `EXPO_PUBLIC_APP_URL` for redirects
- ✅ **Mobile needs**: `EXPO_PUBLIC_APP_URL` set to your network IP

The app code handles everything else automatically! 🎉
