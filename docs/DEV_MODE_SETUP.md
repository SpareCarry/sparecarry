# Dev Mode Setup - Skip Authentication for Testing

## Overview

Dev mode allows you to skip authentication and go straight to the home screen for faster testing and development.

## ⚠️ IMPORTANT

**Always disable dev mode before production builds!**

## Mobile App (Expo)

### Enable Dev Mode

1. Create or update `apps/mobile/.env`:

```env
EXPO_PUBLIC_DEV_MODE=true
```

2. Restart the Expo dev server:

```bash
pnpm dev:mobile
```

### Disable Dev Mode

1. Set `EXPO_PUBLIC_DEV_MODE=false` in `apps/mobile/.env` or remove the variable
2. Restart the dev server

### How It Works

- When `EXPO_PUBLIC_DEV_MODE=true`, the app automatically redirects from auth screens to the home screen
- A yellow banner appears at the top indicating dev mode is enabled
- Authentication is completely bypassed

## Web App (Next.js)

### Enable Dev Mode

1. Add to `.env.local`:

```env
NEXT_PUBLIC_DEV_MODE=true
```

2. Restart the dev server:

```bash
pnpm dev:web
```

### Disable Dev Mode

1. Set `NEXT_PUBLIC_DEV_MODE=false` in `.env.local` or remove the variable
2. Restart the dev server

### How It Works

- When `NEXT_PUBLIC_DEV_MODE=true`, middleware skips authentication checks
- A yellow banner appears at the top of all pages
- All routes are accessible without authentication

## Safety Features

1. **Production Check**: Dev mode is automatically disabled in production builds (`NODE_ENV=production`)
2. **Visual Warning**: Yellow banner appears when dev mode is enabled
3. **Environment Variable**: Must be explicitly set (not enabled by default)

## Example Usage

### Testing Features Without Auth

1. Enable dev mode (see above)
2. Start the app - you'll go straight to home screen
3. Test all features without logging in
4. **Disable dev mode** before committing or deploying

### Before Production

**Checklist:**

- [ ] `EXPO_PUBLIC_DEV_MODE` is not set or set to `false`
- [ ] `NEXT_PUBLIC_DEV_MODE` is not set or set to `false`
- [ ] No yellow dev mode banner visible
- [ ] Authentication is required to access protected routes

## Files Modified

- `apps/mobile/config/devMode.ts` - Mobile dev mode config
- `apps/mobile/app/_layout.tsx` - Navigation handler with dev mode
- `config/devMode.ts` - Web dev mode config
- `lib/supabase/middleware.ts` - Middleware with dev mode check
- `components/dev/DevModeBanner.tsx` - Visual warning banner

## Troubleshooting

**Dev mode not working?**

- Make sure you restarted the dev server after changing env vars
- Check that the env variable is set correctly (case-sensitive)
- Verify you're not in production mode (`NODE_ENV=production`)

**Can't disable dev mode?**

- Remove the env variable completely (don't just set to false)
- Clear `.next` cache: `rm -rf .next`
- Restart the dev server
