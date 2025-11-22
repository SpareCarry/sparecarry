# Why Am I Not Receiving Magic Link Emails?

## Possible Reasons

### 1. **Supabase Email Service Limitations (Most Likely)**

If you're on Supabase's **free tier**, email sending has limitations:
- Limited number of emails per hour/day
- May delay or block emails if rate limit exceeded
- Check **Authentication** → **Logs** in Supabase Dashboard for email sending status

### 2. **Email Provider Not Configured**

By default, Supabase uses its own email service. To send emails reliably:
- Configure a custom SMTP provider (Gmail, SendGrid, etc.)
- Or upgrade to a Supabase plan with better email limits

### 3. **Email in Spam Folder**

- Check your spam/junk folder
- Add `noreply@mail.app.supabase.io` to your contacts (if using Supabase email)
- Or check your email provider's spam filter

### 4. **Email Address Typo**

- Double-check the email address you entered
- Try a different email address to test

### 5. **Email Already Sent (Rate Limit)**

- Supabase may have rate limits per email address
- Wait a few minutes and try again
- Check Supabase logs for rate limit errors

## How to Check If Email Was Sent

### 1. Check Supabase Dashboard

1. Go to **Authentication** → **Logs**
2. Look for entries with type "magic_link" or "email"
3. Check for any errors or status messages

### 2. Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Request a magic link
4. Look for:
   - "Sending magic link to: [email]"
   - "Callback URL: [url]"
   - Any error messages

### 3. Check Server Terminal

1. Check your `pnpm dev` terminal
2. Look for any errors when requesting magic link
3. Should see callback URL being logged

## Quick Fixes

### Fix 1: Wait and Retry

- Wait 5-10 minutes between requests
- Request a new magic link
- Check spam folder

### Fix 2: Try Different Email

- Use a different email address
- Use Gmail (most reliable)
- Avoid temporary/throwaway emails

### Fix 3: Check Supabase Email Settings

1. Go to **Authentication** → **Email Templates**
2. Make sure "Enable email provider" is ON
3. Check if there are any error messages

### Fix 4: Configure Custom SMTP (For Production)

If emails are critical, configure a custom SMTP:
- Use Resend, SendGrid, or Gmail SMTP
- Configure in Supabase: **Project Settings** → **Auth** → **Email Templates** → **SMTP Settings**

## Current Implementation

The app now:
- ✅ Automatically detects which port you're using (`window.location.origin`)
- ✅ Logs the callback URL to console
- ✅ Works with any port (3000, 3001, etc.) as long as it's in Supabase settings

**You still need to:**
1. Add the port to Supabase Redirect URLs
2. Wait for email (may take 1-2 minutes on free tier)
3. Check spam folder

## Test It

1. **Request a magic link:**
   - Check browser console for "Sending magic link to:" message
   - Check "Callback URL:" - should match your current port

2. **Wait 1-2 minutes** (free tier may have delays)

3. **Check email:**
   - Inbox first
   - Then spam folder
   - Check Supabase logs if still nothing

4. **Click the link:**
   - Should redirect to `/auth/callback`
   - Check terminal logs for callback details
   - Should log in and redirect to `/home`

