# Supabase Mobile Authentication Setup

This document explains how Supabase authentication is configured for both web and mobile (Capacitor) platforms.

## Architecture

### Web (Browser)

- Uses `@supabase/ssr` with PKCE flow
- Storage: `localStorage`
- Cookies handled automatically by Next.js middleware
- Redirect URLs: `https://yourdomain.com/auth/callback`

### Mobile (Capacitor)

- Uses `@supabase/supabase-js` with PKCE flow
- Storage: `@capacitor/preferences` (AsyncStorage-equivalent)
- Deep linking handled via Capacitor App plugin
- Redirect URLs: `carryspace://callback`

## Configuration

### 1. Supabase Dashboard Configuration

In Supabase Dashboard → Authentication → URL Configuration, add these redirect URLs:

**Web:**

- `https://sparecarry.com/auth/callback`
- `http://localhost:3000/auth/callback` (for development)

**Mobile:**

- `carryspace://callback`
- `carryspace://callback?redirect=/home`

### 2. Deep Link Scheme

The app uses `carryspace://` as the deep link scheme, configured in:

- `capacitor.config.ts`: `iosScheme: "carryspace"` and `androidScheme: "carryspace"`
- iOS: URL scheme must be registered in `Info.plist`
- Android: Intent filters must be configured in `AndroidManifest.xml`

### 3. Magic Link Flow

#### Web

1. User requests magic link on `/auth/login` or `/auth/signup`
2. `getAuthCallbackUrl()` returns: `https://sparecarry.com/auth/callback?redirect=/home`
3. Supabase sends email with magic link containing this callback URL
4. User clicks link → Opens browser → Redirects to callback URL
5. Next.js API route (`/app/auth/callback/route.ts`) exchanges code for session
6. User redirected to `/home` with session cookies set

#### Mobile

1. User requests magic link in mobile app
2. `getAuthCallbackUrl()` detects mobile and returns: `carryspace://callback?redirect=/home`
3. Supabase sends email with magic link containing deep link URL
4. User clicks link → Opens mobile app via deep link
5. Capacitor App plugin receives URL event
6. Deep linking handler (`lib/mobile/deep-linking.ts`) processes the auth callback
7. Mobile Supabase client exchanges code for session using Capacitor Preferences storage
8. User redirected to `/home` with session stored in Capacitor Preferences

## Files

### Core Files

- `lib/supabase/client.ts` - Unified client (detects web vs mobile)
- `lib/supabase/mobile.ts` - Mobile-specific client with Capacitor storage
- `lib/mobile/deep-linking.ts` - Deep link handler for auth callbacks
- `app/auth/callback/route.ts` - API route for web auth callbacks
- `app/auth/login/page.tsx` - Login page (uses `getAuthCallbackUrl()`)
- `app/auth/signup/page.tsx` - Signup page (uses `getAuthCallbackUrl()`)

### Configuration

- `capacitor.config.ts` - Deep link scheme configuration
- `app/layout.tsx` - Initializes mobile deep linking

## Testing

### Web

1. Navigate to `http://localhost:3000/auth/login`
2. Enter email and click "Send Magic Link"
3. Check email for magic link
4. Click link - should redirect back to app and log in

### Mobile

1. Open mobile app
2. Navigate to login page
3. Enter email and click "Send Magic Link"
4. Check email for magic link
5. Click link - should open mobile app via deep link and log in

## Troubleshooting

### Magic link doesn't open app

- Check that `carryspace://callback` is registered in Supabase redirect URLs
- Verify deep link scheme is configured in `capacitor.config.ts`
- Check iOS `Info.plist` or Android `AndroidManifest.xml` for URL scheme registration

### Session not persisting on mobile

- Check that `@capacitor/preferences` is installed
- Verify Capacitor Preferences API is working
- Check mobile client is using Capacitor storage (not localStorage)

### Redirects to web instead of app

- Verify `getAuthCallbackUrl()` is detecting mobile correctly
- Check that `isMobile()` function returns `true` in Capacitor environment
