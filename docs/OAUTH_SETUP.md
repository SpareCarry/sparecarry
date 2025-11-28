# OAuth Provider Setup Guide

This guide explains how to enable Google and Apple Sign-In in your Supabase project.

## Prerequisites

- Supabase project created
- Access to Supabase Dashboard

## Google OAuth Setup (Free)

### Step 1: Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** → **OAuth consent screen**
4. Select **External** (unless you have a Google Workspace account)
5. Fill in the required information:
   - **App name**: "SpareCarry" (or your app name)
   - **User support email**: Your email
   - **Developer contact information**: Your email
6. Click **Save and Continue**
7. **Scopes** (Step 2): Click **Save and Continue** (default scopes are fine)
8. **Test users** (Step 3): Add your email as a test user (for development), then click **Save and Continue**
9. **Summary** (Step 4): Review and click **Back to Dashboard**

### Step 2: Create OAuth Client

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** at the top (or **Create OAuth client** button)
3. Select **OAuth client ID** (or it may say "Create OAuth client")
4. Select **Web application** as the application type
5. Fill in:
   - **Name**: "SpareCarry Web"
   - **Authorized redirect URIs**: Click **+ ADD URI** and add:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     (Replace `YOUR_PROJECT_REF` with your actual Supabase project reference)
     - To find your project reference: Go to Supabase Dashboard → Settings → API → Look for "Project URL" (the part before `.supabase.co`)
     - Example: If your URL is `https://gujyzwqcwecbeznlablx.supabase.co`, your project ref is `gujyzwqcwecbeznlablx`
6. Click **CREATE** (or **Save**)
7. Copy the **Client ID** and **Client Secret** (you'll see them in a popup - save these!)

### Step 2: Configure in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and click to expand
4. Toggle **Enable Google provider**
5. Enter your **Client ID** and **Client Secret** from Google Cloud Console
6. Click **Save**

### Step 3: Test

Try clicking "Continue with Google" on your login page. It should redirect to Google's sign-in page.

---

## Apple Sign-In Setup

### Prerequisites

- Apple Developer Account ($99/year) - **Required**
- App registered in Apple Developer Portal

### Step 1: Create Apple Service ID

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Go to **Identifiers** → Click **+** to create new
4. Select **Services IDs** → Continue
5. Register a new Services ID:
   - Description: "SpareCarry Web"
   - Identifier: `com.sparecarry.web` (or your domain)
   - Enable **Sign in with Apple**
   - Configure:
     - Primary App ID: Select your app
     - Website URLs:
       - Domains: `yourdomain.com` (or `localhost:3000` for dev)
       - Return URLs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
6. Save the **Services ID** and **Return URL**

### Step 2: Create Apple Key

1. In Apple Developer Portal, go to **Keys**
2. Click **+** to create new key
3. Name: "SpareCarry Apple Sign-In"
4. Enable **Sign in with Apple**
5. Click **Configure** → Select your Primary App ID
6. Click **Save** → **Continue** → **Register**
7. **Download the key file** (`.p8` file) - **You can only download this once!**
8. Note the **Key ID**

### Step 3: Configure in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Apple** and click to expand
4. Toggle **Enable Apple provider**
5. Enter:
   - **Services ID**: The identifier you created (e.g., `com.sparecarry.web`)
   - **Secret Key**: Open the `.p8` file you downloaded and copy its contents
   - **Key ID**: The Key ID from Apple Developer Portal
   - **Team ID**: Found in Apple Developer Portal → Membership
6. Click **Save**

### Step 4: Test

Try clicking "Continue with Apple" on your login page.

---

## Cost Summary

- **Google OAuth**: ✅ **FREE** (no cost)
- **Apple Sign-In**: ⚠️ **Requires Apple Developer Account** ($99/year)
  - The API itself is free, but you need a paid developer account

---

## Troubleshooting

### "Unsupported provider: provider is not enabled"

This means the provider isn't enabled in Supabase:
1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Find the provider (Google/Apple)
3. Toggle it **ON**
4. Make sure all required fields are filled
5. Click **Save**

### Google OAuth redirects but shows error

- Check that your redirect URI in Google Cloud Console matches exactly:
  `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
- Make sure the project reference is correct (found in Supabase Dashboard → Settings → API)

### Apple Sign-In not working

- Verify your Services ID is configured correctly
- Check that the `.p8` key file content is pasted correctly (include the full key, including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
- Ensure your Team ID is correct

---

## For Development (Localhost)

For local development, you may need to:
1. Add `http://localhost:3000` to authorized domains in Google/Apple
2. Use Supabase's local development setup, or
3. Test OAuth on your deployed Vercel URL instead

---

## Notes

- **Magic Link** (passwordless email) is already enabled by default in Supabase
- **Password login** is now available in the login page (toggle between "Password" and "Magic Link")
- OAuth providers are optional - you can use just email/password or magic links if preferred

