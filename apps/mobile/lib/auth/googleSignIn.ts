/**
 * Native Google Sign-In for Android
 * Provides one-tap sign-in using device's Google account
 * Falls back to browser OAuth if native sign-in is unavailable
 */

import { Platform } from 'react-native';
import { createClient } from '@sparecarry/lib/supabase';

// Lazy load Google Sign-In to avoid errors on non-Android platforms
let GoogleSignin: any = null;

function getGoogleSignIn() {
  if (Platform.OS !== 'android') {
    return null;
  }

  if (!GoogleSignin) {
    try {
      GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
    } catch (error) {
      console.warn('[GoogleSignIn] Native Google Sign-In not available:', error);
      return null;
    }
  }

  return GoogleSignin;
}

/**
 * Configure Google Sign-In with Web Client ID
 * This should be called once at app startup
 */
export function configureGoogleSignIn() {
  if (Platform.OS !== 'android') {
    return;
  }

  // Get Web Client ID from environment variable or use default from config
  // The config plugin sets this in app.json, but we read from env at runtime
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 
    "216820312290-i2jbla4d5in9pfataafq2j5gvljd1gtp.apps.googleusercontent.com";
  
  if (!webClientId) {
    console.warn('[GoogleSignIn] Web Client ID not configured. Native Google Sign-In will be disabled.');
    return;
  }

  try {
    const googleSignIn = getGoogleSignIn();
    if (!googleSignIn) {
      return;
    }

    googleSignIn.configure({
      webClientId: webClientId,
      offlineAccess: true, // Request offline access for refresh tokens
      forceCodeForRefreshToken: true, // Get refresh token on first sign-in
    });

    console.log('[GoogleSignIn] Configured successfully');
  } catch (error) {
    console.error('[GoogleSignIn] Configuration error:', error);
  }
}

/**
 * Check if native Google Sign-In is available
 */
export function isGoogleSignInAvailable(): boolean {
  return Platform.OS === 'android' && getGoogleSignIn() !== null;
}

/**
 * Sign in with Google using native SDK (one-tap)
 * Returns ID token that can be used with Supabase
 */
export async function signInWithGoogleNative(): Promise<{
  idToken: string | null;
  error: Error | null;
}> {
  if (Platform.OS !== 'android') {
    return { idToken: null, error: new Error('Native Google Sign-In only available on Android') };
  }

  const googleSignIn = getGoogleSignIn();
  if (!googleSignIn) {
    return { idToken: null, error: new Error('Google Sign-In SDK not available') };
  }

  try {
    // Check if Google Play Services is available
    await googleSignIn.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Try silent sign-in first (one-tap if user is already signed in)
    try {
      const userInfo = await googleSignIn.signInSilently();
      if (userInfo?.idToken) {
        console.log('[GoogleSignIn] Silent sign-in successful');
        return { idToken: userInfo.idToken, error: null };
      }
    } catch (silentError: any) {
      // Silent sign-in not available (user not signed in or cancelled)
      // This is expected - continue to show sign-in UI
      console.log('[GoogleSignIn] Silent sign-in not available, showing UI');
    }

    // Show sign-in UI
    const result = await googleSignIn.signIn();
    
    if (result?.idToken) {
      console.log('[GoogleSignIn] Sign-in successful');
      return { idToken: result.idToken, error: null };
    }

    return { idToken: null, error: new Error('No ID token received from Google Sign-In') };
  } catch (error: any) {
    console.error('[GoogleSignIn] Sign-in error:', error);

    if (error.code === 'SIGN_IN_CANCELLED') {
      return { idToken: null, error: new Error('Sign-in cancelled by user') };
    }

    if (error.code === 'IN_PROGRESS') {
      return { idToken: null, error: new Error('Sign-in already in progress') };
    }

    return {
      idToken: null,
      error: error instanceof Error ? error : new Error(String(error.message || error)),
    };
  }
}

/**
 * Sign in with Google native SDK and exchange ID token with Supabase
 * Returns Supabase session
 */
export async function signInWithGoogleNativeToSupabase(): Promise<{
  session: any;
  user: any;
  error: Error | null;
}> {
  const { idToken, error: signInError } = await signInWithGoogleNative();

  if (signInError || !idToken) {
    return { session: null, user: null, error: signInError || new Error('No ID token received') };
  }

  try {
    // Exchange ID token with Supabase
    const supabase = createClient();
    const { data, error: supabaseError } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (supabaseError) {
      console.error('[GoogleSignIn] Supabase auth error:', supabaseError);
      return {
        session: null,
        user: null,
        error: new Error(supabaseError.message),
      };
    }

    console.log('[GoogleSignIn] Supabase session created successfully');
    return {
      session: data.session,
      user: data.user,
      error: null,
    };
  } catch (error) {
    console.error('[GoogleSignIn] Unexpected error:', error);
    return {
      session: null,
      user: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Sign out from Google
 */
export async function signOutGoogle(): Promise<{ error: Error | null }> {
  if (Platform.OS !== 'android') {
    return { error: null }; // Nothing to sign out from on non-Android
  }

  const googleSignIn = getGoogleSignIn();
  if (!googleSignIn) {
    return { error: null };
  }

  try {
    await googleSignIn.signOut();
    return { error: null };
  } catch (error) {
    console.error('[GoogleSignIn] Sign-out error:', error);
    return {
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

