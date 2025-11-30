# Dev Mode Enabled - Testing Without Authentication

## ✅ Dev Mode is Now Active

Dev mode has been enabled so you can test all features without needing to authenticate through Supabase.

## What Dev Mode Does

### For Mobile App:

- ✅ **Skips login screen** - Automatically redirects to home screen
- ✅ **Provides mock user** - You'll be logged in as `dev@sparecarry.com`
- ✅ **Bypasses Supabase** - No network calls needed for authentication
- ✅ **Full app access** - All features are accessible

### For Web App:

- ✅ **Skips authentication checks** - Middleware allows all routes
- ✅ **Provides mock user** - You'll be logged in as `dev@sparecarry.com`
- ✅ **Bypasses Supabase** - No network calls needed for authentication

## Environment Variables Set

### `.env.local` (Root)

```env
NEXT_PUBLIC_DEV_MODE=true
```

### `apps/mobile/.env`

```env
EXPO_PUBLIC_DEV_MODE=true
```

## How to Use

### Mobile App:

1. **Restart Expo** with cleared cache:
   ```bash
   cd apps/mobile
   npx expo start --clear
   ```
2. **Open the app** - You'll be automatically logged in
3. **Test all features** - Everything should work without authentication

### Web App:

1. **Restart Next.js dev server**:
   ```bash
   npm run dev
   ```
2. **Open browser** - You'll be automatically logged in
3. **Test all features** - Everything should work without authentication

## Mock User Details

When dev mode is enabled, you'll be logged in as:

- **Email**: `dev@sparecarry.com`
- **User ID**: `dev-user-id`
- **Name**: `Dev User`

## What Works

- ✅ All app screens and navigation
- ✅ UI components and features
- ✅ Client-side functionality
- ✅ Local state management

## What Won't Work

- ❌ **Database queries** - Will fail because there's no real user in Supabase
- ❌ **API calls that require real user** - Will fail without valid session
- ❌ **Real-time features** - Supabase Realtime won't work
- ❌ **File uploads** - Supabase Storage won't work

## Testing Database Features

If you need to test database features, you have two options:

1. **Use Supabase with real authentication** (when Supabase is accessible)
2. **Mock the database calls** in your components

## Disabling Dev Mode

### Before Production:

1. **Set to false in `.env.local`**:

   ```env
   NEXT_PUBLIC_DEV_MODE=false
   ```

2. **Set to false in `apps/mobile/.env`**:

   ```env
   EXPO_PUBLIC_DEV_MODE=false
   ```

3. **Restart all servers**

⚠️ **IMPORTANT**: Never deploy with dev mode enabled!

## Troubleshooting

### Dev mode not working?

1. **Check environment variables are set**:

   ```bash
   # Web
   grep DEV_MODE .env.local

   # Mobile
   grep DEV_MODE apps/mobile/.env
   ```

2. **Restart servers** - Environment variables are loaded at startup

3. **Clear cache**:

   ```bash
   # Mobile
   npx expo start --clear

   # Web
   rm -rf .next
   npm run dev
   ```

### Still seeing login screen?

- Make sure you restarted Expo/Next.js after adding the env variables
- Check that the variable is exactly `true` (not `"true"` or `True`)

## Summary

✅ Dev mode is enabled - you can now test all UI and client-side features without authentication!

⚠️ Remember to disable it before production builds!
