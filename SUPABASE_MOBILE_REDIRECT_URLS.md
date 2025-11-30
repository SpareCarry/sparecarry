# Supabase Redirect URLs Configuration

## Required Supabase Dashboard Configuration

Go to **Supabase Dashboard → Authentication → URL Configuration** and add these redirect URLs:

### Production

- `https://sparecarry.com/auth/callback`
- `carryspace://callback`
- `carryspace://callback?*`

### Staging (if applicable)

- `https://staging.sparecarry.com/auth/callback`
- `carryspace://callback`
- `carryspace://callback?*`

### Development

- `http://localhost:3000/auth/callback`
- `carryspace://callback`
- `carryspace://callback?*`

## Site URL Configuration

**Site URL** (in Supabase Dashboard → Authentication → URL Configuration):

- Production: `https://sparecarry.com`
- Staging: `https://staging.sparecarry.com` (if applicable)
- Development: `http://localhost:3000`

## How It Works

### Web Flow

1. User requests magic link
2. Email contains: `https://sparecarry.com/auth/callback?code=xxx&redirect=/home`
3. User clicks link → Opens browser
4. Next.js API route exchanges code for session
5. User redirected to `/home` with session cookies

### Mobile Flow

1. User requests magic link in mobile app
2. Email contains: `carryspace://callback?code=xxx&redirect=/home`
3. User clicks link → Opens mobile app via deep link
4. Capacitor App plugin receives deep link
5. Mobile app exchanges code for session using Capacitor Preferences
6. User redirected to `/home` with session stored in Capacitor Preferences

## Testing

### Test Web Redirect URL

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add: `http://localhost:3000/auth/callback`
3. Request magic link from `http://localhost:3000/auth/login`
4. Click magic link - should redirect back to app

### Test Mobile Deep Link

1. Add: `carryspace://callback`
2. Build mobile app: `pnpm mobile:build`
3. Install on device
4. Request magic link from mobile app
5. Click magic link - should open app via deep link
