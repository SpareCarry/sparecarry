# Android Google Sign-In SDK Implementation Plan

## Answers to Your Questions

✅ **FREE** - Google Sign-In SDK is completely free  
✅ **Works in Development Builds** - Can test with `expo-dev-client` (which you already have)  
✅ **One-Tap Sign-In** - Uses device's Google account (same account signed into Play Store)  
✅ **No Browser Redirect** - Native in-app experience  
✅ **Fallback Support** - Browser OAuth remains as fallback option

## Recommended Solution

### Package: `@react-native-google-signin/google-signin`

This is the official React Native wrapper for Google Sign-In SDK that provides:
- Native Android Google Sign-In SDK integration
- One-tap sign-in support (uses device's Google account)
- No browser redirect needed
- Works with Expo SDK 54 via config plugin

## Implementation Steps

### 1. Install Dependencies

```bash
cd apps/mobile
pnpm add @react-native-google-signin/google-signin
```

### 2. Add Expo Config Plugin

Update `apps/mobile/app.json`:

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-dev-client",
      [
        "@react-native-google-signin/google-signin",
        {
          "androidGoogleSignInOptions": {
            "webClientId": "YOUR_WEB_CLIENT_ID_HERE"
          }
        }
      ],
      // ... other plugins
    ]
  }
}
```

### 3. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select your project
3. Enable Google Sign-In API
4. Create OAuth 2.0 credentials:
   - **Web client ID** (for Supabase backend)
   - **Android client ID** (SHA-1 fingerprint required)

### 4. Configure Android in Google Cloud Console

1. Get your app's SHA-1 fingerprint:
   ```bash
   cd apps/mobile/android
   ./gradlew signingReport
   ```
   Or for debug builds:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

2. Add SHA-1 to Google Cloud Console → Credentials → Android client ID

3. Package name: `com.sparecarry.app` (from your app.json)

### 5. Update Supabase Configuration

- Add Android client ID to Supabase Dashboard
- Configure redirect URLs if needed

### 6. Implement Native Google Sign-In

Create a new hook/utility that:
1. Checks if native Google Sign-In is available (Android only)
2. Uses `@react-native-google-signin/google-signin` for one-tap
3. Falls back to browser OAuth (current implementation) if:
   - Not on Android
   - Native sign-in fails
   - User cancels one-tap

## Code Implementation

### Create: `apps/mobile/lib/auth/googleSignIn.ts`

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { createClient } from '@sparecarry/lib/supabase';

export async function signInWithGoogleNative(): Promise<{
  idToken: string | null;
  error: Error | null;
}> {
  if (Platform.OS !== 'android') {
    return { idToken: null, error: new Error('Native Google Sign-In only available on Android') };
  }

  try {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // From Google Cloud Console
      offlineAccess: true,
    });

    // Check if user is already signed in
    await GoogleSignin.hasPlayServices();

    // Try one-tap sign-in (silent)
    try {
      const userInfo = await GoogleSignin.signInSilently();
      if (userInfo?.idToken) {
        return { idToken: userInfo.idToken, error: null };
      }
    } catch (silentError) {
      // One-tap not available, show sign-in UI
    }

    // Show sign-in UI
    const result = await GoogleSignin.signIn();
    return { idToken: result.idToken || null, error: null };
  } catch (error: any) {
    if (error.code === 'SIGN_IN_CANCELLED') {
      return { idToken: null, error: new Error('Sign-in cancelled') };
    }
    return { idToken: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

export async function signInWithGoogleNativeToSupabase(): Promise<{
  session: any;
  error: Error | null;
}> {
  const { idToken, error } = await signInWithGoogleNative();
  
  if (error || !idToken) {
    return { session: null, error: error || new Error('No ID token received') };
  }

  // Exchange ID token with Supabase
  const supabase = createClient();
  const { data, error: supabaseError } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (supabaseError) {
    return { session: null, error: new Error(supabaseError.message) };
  }

  return { session: data.session, error: null };
}
```

### Update: `packages/hooks/useAuth.ts`

Add platform detection and fallback:

```typescript
import { Platform } from 'react-native';

const signInWithOAuth = async (provider: "google" | "apple" | "github") => {
  // Try native Google Sign-In on Android first
  if (provider === "google" && Platform.OS === "android") {
    try {
      const { signInWithGoogleNativeToSupabase } = require("@sparecarry/mobile/lib/auth/googleSignIn");
      const { session, error } = await signInWithGoogleNativeToSupabase();
      
      if (!error && session) {
        setState((prev) => ({ ...prev, loading: false, session, user: session.user }));
        return { data: { session }, error: null };
      }
      
      // If native fails, fall through to browser OAuth
      console.log("[useAuth] Native Google Sign-In failed, falling back to browser OAuth");
    } catch (nativeError) {
      console.log("[useAuth] Native Google Sign-In not available, using browser OAuth");
      // Fall through to browser OAuth
    }
  }

  // Browser OAuth (current implementation - works as fallback)
  // ... existing browser OAuth code
};
```

## Testing in Development Build

1. Build development build with new config:
   ```bash
   cd apps/mobile
   eas build --platform android --profile development
   ```

2. Install on device and test:
   - One-tap should appear if user is signed into Play Store
   - Falls back to browser OAuth if one-tap fails
   - Works offline for signed-in users

## Environment Variables Needed

Add to `apps/mobile/.env.local`:

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

## Benefits

1. **Better UX**: One-tap sign-in, no browser redirect
2. **Offline Support**: Works if user is already signed in
3. **Seamless**: Uses Play Store account
4. **Fallback**: Still works with browser OAuth for iOS/web
5. **Free**: No cost for Google Sign-In SDK

## Fallback Strategy

```
Android:
  1. Try native Google Sign-In (one-tap)
  2. If fails/cancelled → Browser OAuth

iOS/Web:
  → Browser OAuth (current implementation)
```

## Next Steps

1. Install `@react-native-google-signin/google-signin`
2. Add config plugin to `app.json`
3. Get Google OAuth credentials
4. Implement native sign-in hook
5. Update `useAuth` to use native first, fallback to browser
6. Test in development build

