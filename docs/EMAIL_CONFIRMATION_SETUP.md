# Email Confirmation Setup Guide

## Issue: Not Receiving Signup Emails

If you're not receiving confirmation emails after signing up with a password, here's how to fix it:

## Option 1: Disable Email Confirmation (Recommended for Development)

If you're in development and want to skip email confirmation:

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Settings** → **Email Templates**
3. Find **"Confirm signup"** section
4. Scroll down to **"Auth"** settings
5. Find **"Enable email confirmations"**
6. **Toggle it OFF** (disable email confirmations)
7. Click **Save**

**Result:** Users will be automatically logged in after signup without needing to confirm their email.

## Option 2: Configure Email Provider (Required for Production)

For production, you need to configure a real email provider:

### Using Supabase's Built-in Email (Limited)

Supabase provides a basic email service, but it has limits:
- **Rate limits**: ~4 emails/hour per project (free tier)
- **May go to spam**: Emails from `noreply@mail.app.supabase.io`
- **Not recommended for production**

### Using Custom SMTP (Recommended for Production)

1. Go to **Supabase Dashboard** → **Authentication** → **Settings** → **SMTP Settings**
2. Enable **"Enable Custom SMTP"**
3. Configure your SMTP provider:
   - **SendGrid** (free tier: 100 emails/day)
   - **Mailgun** (free tier: 5,000 emails/month)
   - **AWS SES** (very cheap, pay per email)
   - **Resend** (developer-friendly, free tier available)
   - **Postmark** (reliable, paid)

4. Enter your SMTP credentials:
   - Host
   - Port
   - Username
   - Password
   - From email address

5. Click **Save**

### Example: Using Resend (Free Tier) - Step by Step

**Prerequisites:**
- Resend account at [resend.com](https://resend.com)
- Resend API key (starts with `re_`)

**Step 1: Get Your Resend API Key**
1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Click **"Create API Key"**
3. Name it (e.g., "Supabase SMTP")
4. Copy the API key (starts with `re_`) - **You can only see it once!**

**Step 2: Set Up Domain (Optional for Testing)**
- For testing, you can use Resend's test domain: `onboarding@resend.dev`
- For production, add your domain in Resend Dashboard → Domains

**Step 3: Configure Supabase SMTP**

1. Go to **Supabase Dashboard** → **Authentication** → **Emails**
2. Scroll down to find **"SMTP Settings"** section (or look for "Custom SMTP" toggle)
3. Enable **"Enable Custom SMTP"** toggle
4. Fill in the following:

   ```
   SMTP Host: smtp.resend.com
   SMTP Port: 465 (or 587 for TLS)
   SMTP Username: resend
   SMTP Password: [Your Resend API key - the one starting with re_]
   Sender Name: SpareCarry (or your app name)
   Sender Email: onboarding@resend.dev (for testing)
                    OR
                  noreply@yourdomain.com (for production)
   ```

5. Click **"Save"** at the bottom

**Step 4: Test It**
1. Try signing up with a password
2. Check your email (including spam folder)
3. You should receive the confirmation email from Resend

**Important Notes:**
- **Port 465** = SSL (more secure, recommended)
- **Port 587** = TLS (alternative)
- For testing: Use `onboarding@resend.dev` as sender email
- For production: Use your verified domain (e.g., `noreply@sparecarry.com`)
- Resend free tier: 3,000 emails/month, 100 emails/day

## Option 3: Check Spam Folder

Sometimes emails go to spam:
- Check your spam/junk folder
- Add `noreply@mail.app.supabase.io` to your contacts
- Check email filters

## Troubleshooting: Not Receiving Emails After Resend Setup

### Step 1: Verify SMTP Configuration

Double-check your Supabase SMTP settings:
1. Go to **Supabase Dashboard** → **Authentication** → **Emails**
2. Verify **"Enable Custom SMTP"** is **ON** (toggle enabled)
3. Check all fields are filled correctly:
   - ✅ SMTP Host: `smtp.resend.com`
   - ✅ SMTP Port: `465` (or `587`)
   - ✅ SMTP Username: `resend` (exactly this, lowercase)
   - ✅ SMTP Password: Your Resend API key (starts with `re_`)
   - ✅ Sender Email: `onboarding@resend.dev` (for testing)
4. Click **"Save"** again (even if already saved)

### Step 2: Verify Email Confirmations Are Enabled

1. In **Supabase Dashboard** → **Authentication** → **Emails**
2. Scroll to **"Auth"** section
3. Make sure **"Enable email confirmations"** is **ON** (enabled)
4. If it's OFF, users won't receive confirmation emails

### Step 3: Check Resend Dashboard

1. Go to [Resend Dashboard](https://resend.com/emails)
2. Click **"Logs"** or **"Activity"**
3. Look for recent email attempts
4. Check for any errors:
   - ❌ **"Invalid API key"** → Your API key is wrong
   - ❌ **"Rate limit exceeded"** → Too many emails sent
   - ❌ **"Domain not verified"** → If using custom domain
   - ✅ **"Delivered"** → Email was sent successfully

### Step 4: Test SMTP Connection

1. In **Supabase Dashboard** → **Authentication** → **Emails**
2. Look for a **"Test SMTP"** or **"Send Test Email"** button
3. Click it and enter your email address
4. Check if you receive the test email

### Step 5: Check Common Issues

**Issue: Wrong SMTP Username**
- ❌ Wrong: `Resend`, `RESEND`, `your-email@resend.com`
- ✅ Correct: `resend` (lowercase, exactly this)

**Issue: Wrong Port**
- Try both: `465` (SSL) or `587` (TLS)
- Some networks block port 465, try 587

**Issue: API Key Format**
- ❌ Wrong: `re_abc123` (missing characters)
- ✅ Correct: `re_...` (full key, usually 40+ characters)
- Make sure you copied the **entire** API key

**Issue: Email in Spam**
- Check spam/junk folder
- Add `onboarding@resend.dev` to contacts
- Check email filters

### Step 6: Manual Resend

If email still doesn't arrive:

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find the user you just created (by email)
3. Click on the user
4. Look for **"Resend confirmation email"** button
5. Click it
6. Check Resend logs to see if it was sent

### Step 7: Check Supabase Logs

1. Go to **Supabase Dashboard** → **Logs** → **Auth Logs**
2. Look for errors related to email sending
3. Common errors:
   - `SMTP connection failed` → Check host/port
   - `Authentication failed` → Check username/password
   - `Invalid sender email` → Check sender email format

## Option 4: Resend Confirmation Email

If you didn't receive the email:

1. Go to the login page
2. Try to log in with your email and password
3. If email isn't confirmed, you'll see an error
4. Use the "Resend confirmation email" option (if available)
5. Or go to Supabase Dashboard → **Authentication** → **Users**
6. Find your user and click **"Resend confirmation email"**

## Current Behavior

- **Password Signup**: Requires email confirmation by default
- **Magic Link Signup**: No email confirmation needed (the magic link IS the confirmation)
- **Google OAuth**: No email confirmation needed (Google handles it)

## Quick Fix: Disable Email Confirmation for Now

If SMTP setup isn't working and you need to test signup immediately:

1. Go to **Supabase Dashboard** → **Authentication** → **Emails**
2. Scroll to **"Auth"** section
3. Find **"Enable email confirmations"**
4. **Toggle it OFF** (disable)
5. Click **Save**

**Result:** Users will be automatically logged in after signup (no email needed).

You can re-enable email confirmation later once SMTP is working properly.

## Recommendation

**For Development:**
- Disable email confirmation (Option 1)
- Faster testing, no email setup needed
- Fix SMTP later when you have time

**For Production:**
- Enable email confirmation
- Set up custom SMTP (Option 2)
- Better security and user verification
- Test thoroughly before going live

## Testing Email Templates

You can customize email templates in:
**Supabase Dashboard** → **Authentication** → **Email Templates**

Templates available:
- Confirm signup
- Magic Link
- Change Email Address
- Reset Password
- Invite user

