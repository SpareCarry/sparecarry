# Supabase Redirect URL Configuration

## Critical: Add Your Network IP to Supabase Dashboard

Even though your app is passing the correct redirect URL, **Supabase will only redirect to URLs that are whitelisted in the Supabase Dashboard**.

### Step 1: Go to Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Authentication** → **URL Configuration**

### Step 2: Add Redirect URLs

In the **Redirect URLs** section, add **ALL** of these URLs:

```
http://localhost:3000/auth/callback
http://192.168.1.238:3000/auth/callback
https://sparecarry.com/auth/callback
```

**Important**: Replace `192.168.1.238` with your actual network IP (run `node apps/mobile/scripts/get-network-ip.js` to find it).

### Step 3: Set Site URL

In the **Site URL** field, set:

- **For local development**: `http://192.168.1.238:3000` (or `http://localhost:3000` for web-only)
- **For production**: `https://sparecarry.com`

### Why This Matters

Supabase **validates** the `redirectTo` parameter against the whitelist. If your network IP URL is not in the list, Supabase will:

- ❌ Ignore your `redirectTo` parameter
- ❌ Use the **Site URL** instead
- ❌ Redirect to `localhost:3000` (if that's your Site URL)

### Verification

After adding the URLs:

1. Save the changes in Supabase Dashboard
2. Wait a few seconds for changes to propagate
3. Try OAuth again
4. Check the logs - you should see the correct URL being used

### Common Issues

**"redirect_uri_mismatch" error:**

- ✅ Make sure your network IP is in the Redirect URLs list
- ✅ Make sure the URL format is exact: `http://192.168.1.238:3000/auth/callback`

**Redirects to localhost instead of network IP:**

- ✅ Check Supabase Dashboard → Authentication → URL Configuration
- ✅ Make sure `http://192.168.1.238:3000/auth/callback` is in the list
- ✅ Make sure Site URL is set correctly

**OAuth works on web but not mobile:**

- ✅ Add your network IP to Redirect URLs
- ✅ Make sure `EXPO_PUBLIC_APP_URL` is set in `apps/mobile/.env`
- ✅ Restart Expo after changing env variables
