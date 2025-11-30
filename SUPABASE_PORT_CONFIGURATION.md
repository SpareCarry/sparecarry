# Supabase Port Configuration Guide

## The Problem

When your Next.js dev server runs on different ports (3000, 3001, etc.), the magic link needs to use the correct port. Supabase also needs to have that port configured in its redirect URLs.

## The Solution

### Dynamic Port Detection (Already Implemented)

The app now automatically detects which port you're using via `window.location.origin`. This means:

- If server runs on `localhost:3000`, links use `localhost:3000`
- If server runs on `localhost:3001`, links use `localhost:3001`
- No code changes needed!

### Configure Supabase for Multiple Ports

Since you might use different ports, add **all possible ports** to Supabase:

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Select your project
   - **Authentication** → **URL Configuration**

2. **Add All Ports to Redirect URLs:**

   Add these URLs to the "Redirect URLs" list:

   ```
   http://localhost:3000/auth/callback
   http://localhost:3001/auth/callback
   http://localhost:3002/auth/callback
   http://127.0.0.1:3000/auth/callback
   http://127.0.0.1:3001/auth/callback
   ```

3. **Set Site URL:**

   Set to your primary port (or use wildcard if supported):

   ```
   http://localhost:3000
   ```

   Or if you want to allow any port (if Supabase supports wildcards):

   ```
   http://localhost:*
   ```

   (Note: Not all Supabase instances support wildcards - add specific ports if needed)

4. **Save Changes**

### Test It

1. **Start your server:**

   ```powershell
   pnpm dev
   ```

   Note which port it uses (check terminal output)

2. **Request a magic link:**
   - The console will log the callback URL being used
   - It will match your current port automatically

3. **Check Supabase logs:**
   - Go to **Authentication** → **Logs**
   - See if the redirect URL matches what's in your allowed list

4. **Click the magic link:**
   - Should redirect to your callback URL
   - Check terminal logs for the callback details

## Troubleshooting

### Not Receiving Email

1. **Check Supabase Email Settings:**
   - Go to **Authentication** → **Email Templates**
   - Make sure email is enabled
   - Check spam folder

2. **Check Supabase Email Provider:**
   - Free tier uses Supabase's email service (limited)
   - May have rate limits
   - Check **Authentication** → **Logs** for email sending errors

3. **Verify Email Address:**
   - Make sure email is valid
   - Try a different email address
   - Check for typos

4. **Check Console Logs:**
   - Browser console (F12) will show if magic link request succeeded
   - Server terminal will show callback URL being used

### Wrong Port in Link

The app now uses `window.location.origin` which automatically detects:

- Current protocol (http/https)
- Current hostname (localhost, 127.0.0.1, etc.)
- Current port (3000, 3001, etc.)

**If you still get wrong port:**

1. Refresh the page before requesting link
2. Make sure you're accessing the app on the correct port
3. Check browser console for the callback URL being logged

## Quick Fix Checklist

- [ ] Added all possible ports to Supabase Redirect URLs (3000, 3001, etc.)
- [ ] Site URL set correctly in Supabase
- [ ] Requested a NEW magic link after updating Supabase settings
- [ ] Checked browser console for callback URL log
- [ ] Checked terminal logs when clicking magic link
- [ ] Verified email not in spam folder
- [ ] Checked Supabase Authentication → Logs for errors

## Production Setup

For production, you'll only need:

```
https://your-domain.com/auth/callback
```

But for local development, add all the ports you might use!
