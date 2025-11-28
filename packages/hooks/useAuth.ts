/**
 * useAuth - Universal auth hook for web and mobile
 * Provides auth state and methods across platforms
 */

import { useState, useEffect } from 'react';
import { createClient } from '@sparecarry/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// Check dev mode via environment variable
function isDevModeEnabled(): boolean {
  if (typeof process === 'undefined' || !process.env) return false;
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true' || 
         process.env.EXPO_PUBLIC_DEV_MODE === 'true';
}

function getDevModeUser(): User {
  const now = new Date().toISOString();
  return {
    id: 'dev-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'dev@sparecarry.com',
    email_confirmed_at: now,
    phone: '',
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
    user_metadata: {
      name: 'Dev User',
    },
    created_at: now,
    updated_at: now,
    confirmed_at: now,
    last_sign_in_at: now,
    identities: [],
    factors: [],
    is_anonymous: false,
  };
}

function createDevSession(user: User): Session {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  return {
    user,
    access_token: 'dev-token',
    refresh_token: 'dev-refresh-token',
    expires_in: 3600,
    expires_at: expiresAt,
    token_type: 'bearer',
  };
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  // Wrap createClient in try-catch to prevent crashes
  let supabase;
  try {
    supabase = createClient();
  } catch (error) {
    console.error('❌ [useAuth] Failed to create Supabase client:', error);
    // Return early with error state
    return {
      user: null,
      session: null,
      loading: false,
      error: error instanceof Error ? error : new Error(String(error)),
      signIn: async () => ({ error: new Error('Supabase client not available') }),
      signUp: async () => ({ error: new Error('Supabase client not available') }),
      signOut: async () => ({ error: new Error('Supabase client not available') }),
      signInWithOAuth: async () => ({ error: new Error('Supabase client not available') }),
    };
  }

  useEffect(() => {
    if (!supabase) {
      setState({
        user: null,
        session: null,
        loading: false,
        error: new Error('Supabase client not available'),
      });
      return;
    }

    // Dev mode: Return mock user immediately
    if (isDevModeEnabled()) {
      const devUser = getDevModeUser();
      const devSession = createDevSession(devUser);
      setState({
        user: devUser,
        session: devSession,
        loading: false,
        error: null,
      });
      return;
    }

    // Production: Get real session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: error ? new Error(error.message) : null,
      });
    }).catch((err) => {
      console.error('❌ [useAuth] getSession error:', err);
      setState({
        user: null,
        session: null,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    });

    // Listen for auth changes
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
        });
      });
      subscription = sub;
    } catch (err) {
      console.error('❌ [useAuth] onAuthStateChange error:', err);
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (err) {
          console.error('❌ [useAuth] unsubscribe error:', err);
        }
      }
    };
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    // Dev mode: Skip actual sign in
    if (isDevModeEnabled()) {
      const devUser = getDevModeUser();
      const devSession = createDevSession(devUser);
      setState({
        user: devUser,
        session: devSession,
        loading: false,
        error: null,
      });
      return { data: { user: devUser, session: null }, error: null };
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: new Error(error.message),
      }));
      return { error };
    }

    return { data, error: null };
  };

  const signUp = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: new Error(error.message),
      }));
      return { error };
    }

    return { data, error: null };
  };

  const signOut = async () => {
    setState((prev) => ({ ...prev, loading: true }));
    const { error } = await supabase.auth.signOut();
    if (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: new Error(error.message),
      }));
      return { error };
    }
    setState({
      user: null,
      session: null,
      loading: false,
      error: null,
    });
    return { error: null };
  };

  const signInWithOAuth = async (provider: 'google' | 'apple' | 'github') => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    // Get redirect URL based on platform
    const redirectUrl = getAuthRedirectUrl();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: new Error(error.message),
      }));
      return { error };
    }

    // OAuth redirects to browser, so we don't update state here
    return { data, error: null };
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
  };
}

function getAuthRedirectUrl(): string {
  // Web: Use current origin + callback route
  if (typeof window !== 'undefined') {
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      // Mobile web: Use deep link scheme
      return `${window.location.origin}/auth/callback`;
    }
    return `${window.location.origin}/auth/callback`;
  }
  
  // Default fallback
  return 'sparecarry://auth/callback';
}

