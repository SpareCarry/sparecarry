# Mobile Auth Setup Guide

## Important: Google OAuth Configuration

**You do NOT need Google Client ID/Secret in your env files!**

- ✅ Google OAuth credentials are configured in **Supabase Dashboard** → Authentication → Providers → Google
- ✅ Callback URLs are configured in **Supabase Dashboard** → Authentication → URL Configuration
- ✅ Your app only needs `EXPO_PUBLIC_APP_URL` to know where to redirect

See `docs/GOOGLE_OAUTH_SETUP.md` for complete Google OAuth setup instructions.

## Local Development Setup

When developing the mobile app locally, you need to configure the callback URL so OAuth and magic links work properly.

### Problem

By default, the app uses `localhost:3000` which doesn't work on mobile devices because:

- Your phone can't access `localhost` on your computer
- You need to use your computer's network IP address instead

### Solution

1. **Find your network IP address:**

   ```bash
   # Windows
   ipconfig
   # Look for "IPv4 Address" under your active network adapter

   # Mac/Linux
   ifconfig
   # Look for "inet" under your active network adapter (usually en0 or wlan0)

   # Or use the helper script:
   node apps/mobile/scripts/get-network-ip.js
   ```

2. **Set EXPO_PUBLIC_APP_URL in your .env.local:**

   ```bash
   # Add this line to your .env.local file (in the project root)
   EXPO_PUBLIC_APP_URL=http://YOUR_IP_ADDRESS:3000

   # Example:
   EXPO_PUBLIC_APP_URL=http://192.168.1.100:3000
   ```

3. **Make sure your Next.js dev server is running:**

   ```bash
   pnpm dev:web
   # Or
   npm run dev
   ```

4. **Make sure your phone is on the same WiFi network** as your computer

5. **Restart your Expo dev server** after setting the environment variable:
   ```bash
   cd apps/mobile
   pnpm start --clear
   ```

### Production Setup

For production builds, set:

```bash
EXPO_PUBLIC_APP_URL=https://sparecarry.com
```

Or in your EAS build configuration, set it as an environment variable.

### Testing

1. Start your Next.js dev server: `pnpm dev:web`
2. Start Expo: `cd apps/mobile && pnpm start`
3. Open the app on your phone
4. Try "Sign in with Google" - it should open the browser and redirect back to your app

### Troubleshooting

**"Can't reach localhost:3000" error:**

- Make sure `EXPO_PUBLIC_APP_URL` is set correctly
- Make sure your phone and computer are on the same WiFi
- Make sure your Next.js dev server is running
- Check your firewall isn't blocking port 3000

**OAuth redirects but doesn't authenticate:**

- Check that the callback URL in Supabase dashboard includes your network IP
- Make sure the deep link scheme `sparecarry://` is configured correctly

**Magic links don't work:**

- Same as above - make sure the callback URL is accessible from your phone
- Check your email for the magic link and click it on your phone
