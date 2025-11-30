# SMTP Troubleshooting Guide

## If Resend SMTP Setup Looks Correct But Emails Don't Work

### Step 1: Verify Supabase is Actually Using Custom SMTP

Sometimes Supabase doesn't switch to custom SMTP even when enabled. Try this:

1. **Disable Custom SMTP:**
   - Go to Supabase → Authentication → Emails
   - Turn OFF "Enable Custom SMTP"
   - Click Save
   - Wait 10 seconds

2. **Re-enable Custom SMTP:**
   - Turn ON "Enable Custom SMTP"
   - Re-enter all settings (don't just toggle)
   - Click Save

3. **Test immediately:**
   - Try signing up again
   - Check Resend logs within 1-2 minutes

### Step 2: Check Resend API Key Permissions

1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Verify your API key:
   - Is it **active**? (not revoked/expired)
   - Does it have **"Send Email"** permission?
   - Is it the **full key**? (starts with `re_`, usually 40+ characters)

3. **Create a new API key** if unsure:
   - Delete the old one
   - Create a new one
   - Update Supabase with the new key

### Step 3: Test SMTP Connection Directly

You can test if Supabase can connect to Resend:

1. In Supabase → Authentication → Emails
2. Look for **"Test SMTP Connection"** or **"Send Test Email"** button
3. If you see it, click it and enter your email
4. Check if you receive the test email

**If test email works but signup emails don't:**

- The SMTP connection is fine
- The issue is with email templates or confirmation settings

### Step 4: Check Email Template Configuration

1. Go to **Supabase Dashboard** → **Authentication** → **Emails**
2. Click on **"Confirm signup"** template
3. Verify:
   - Template is **enabled**
   - **Subject** is set (e.g., "Confirm your signup")
   - **Body** contains `{{ .ConfirmationURL }}` or similar
4. Click **"Save"** even if you didn't change anything

### Step 5: Verify Email Confirmations Are Actually Enabled

1. Go to **Supabase Dashboard** → **Authentication** → **Emails**
2. Scroll to **"Auth"** section (or look for "Email Confirmations")
3. Verify **"Enable email confirmations"** is:
   - ✅ **ON** (enabled) - if you want email confirmation
   - ❌ **OFF** (disabled) - if you want immediate signup

**Important:** Even with custom SMTP, if email confirmations are OFF, no confirmation emails will be sent.

### Step 6: Check Supabase Logs for Errors

1. Go to **Supabase Dashboard** → **Logs** → **Auth Logs**
2. Filter by **"Error"** or **"Email"**
3. Look for recent errors when you tried to sign up
4. Common errors:
   - `SMTP connection timeout` → Network/firewall issue
   - `SMTP authentication failed` → Wrong username/password
   - `Invalid sender address` → Wrong sender email format
   - `Rate limit exceeded` → Too many emails sent

### Step 7: Try Alternative SMTP Port

Some networks/firewalls block port 465. Try port 587:

1. In Supabase → Authentication → Emails → SMTP Settings
2. Change **SMTP Port** from `465` to `587`
3. Click **Save**
4. Try signing up again

### Step 8: Verify Sender Email Format

The sender email must be:

- ✅ Valid format: `onboarding@resend.dev` or `noreply@yourdomain.com`
- ❌ Invalid: `onboarding resend.dev` (missing @)
- ❌ Invalid: `@resend.dev` (missing username)

### Step 9: Check Resend Rate Limits

1. Go to [Resend Dashboard](https://resend.com)
2. Check your **usage/limits**:
   - Free tier: 3,000 emails/month, 100/day
   - If you hit the limit, emails won't send
3. Check **logs** for rate limit errors

### Step 10: Nuclear Option - Disable Email Confirmation

If nothing works and you need to test signup:

1. **Disable email confirmation:**
   - Supabase → Authentication → Emails
   - Turn OFF "Enable email confirmations"
   - Save

2. **Users will be logged in immediately after signup** (no email needed)

3. **Fix SMTP later** when you have more time to debug

## Still Not Working?

### Check These One More Time:

- [ ] SMTP Host: `smtp.resend.com` (exactly this)
- [ ] SMTP Port: `465` or `587`
- [ ] SMTP Username: `resend` (lowercase, exactly this)
- [ ] SMTP Password: Full Resend API key (starts with `re_`)
- [ ] Sender Email: `onboarding@resend.dev` (for testing)
- [ ] "Enable Custom SMTP" is ON
- [ ] "Enable email confirmations" is ON (if you want emails)
- [ ] Resend API key is active and has send permissions
- [ ] You're not hitting Resend rate limits

### Alternative: Use Supabase's Built-in Email (Temporary)

If Resend isn't working, you can temporarily use Supabase's built-in email:

1. **Disable Custom SMTP** in Supabase
2. **Enable email confirmations**
3. Emails will come from `noreply@mail.app.supabase.io`
4. **Limitations:**
   - Rate limit: ~4 emails/hour (free tier)
   - May go to spam
   - Not for production

### Get Help

If still stuck:

1. Check Supabase community forums
2. Check Resend support/docs
3. Verify your Resend account is active
4. Try a different email provider (SendGrid, Mailgun) to test if it's Resend-specific
