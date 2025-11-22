# Debug Authentication Issues

## Common Issues with Magic Link Authentication

### 1. **Callback URL Not Configured in Supabase**
**Problem:** Supabase doesn't allow redirects to unconfigured URLs

**Fix:** 
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your callback URL to "Redirect URLs":
   - Local: `http://localhost:3001/auth/callback`
   - Production: `https://your-domain.com/auth/callback`
3. Make sure "Site URL" is set correctly

### 2. **Code Expired or Already Used**
**Problem:** Magic link codes expire after a certain time or can only be used once

**Fix:** Request a new magic link

### 3. **Cookie Settings**
**Problem:** Cookies not being set properly due to SameSite or Secure settings

**Fix:** Check browser console for cookie errors

## How to Debug

1. **Check Server Logs:**
   - Look for "Error exchanging code for session" in your terminal
   - Check the error details that are now logged

2. **Check Supabase Dashboard:**
   - Go to Authentication → Logs
   - See if the code exchange request is appearing
   - Check for any errors there

3. **Check Browser Console:**
   - Open DevTools → Network tab
   - Click the magic link
   - Check the callback request
   - See what error is returned

4. **Verify Environment Variables:**
   - Make sure `NEXT_PUBLIC_SUPABASE_URL` is correct
   - Make sure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct

## Next Steps

1. Check your terminal/server logs for the actual error message
2. Verify callback URL is in Supabase redirect URLs
3. Try requesting a fresh magic link
4. Check browser console for additional errors

