/**
 * Universal Supabase client for web and mobile (Expo)
 * Automatically detects the environment and uses the appropriate storage
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isWeb, isMobile } from '../platform';

// Conditional import for expo-secure-store (mobile only)
let SecureStore: typeof import('expo-secure-store') | null = null;
if (isMobile && typeof require !== 'undefined') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (e) {
    // expo-secure-store not available (e.g., on web)
  }
}

// Type for database schema
// In a real implementation, this would be imported from a shared types package
// For now, we use 'any' to allow flexibility
type Database = any;

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Create Expo SecureStore adapter for mobile
 */
function createExpoStorage() {
  if (!SecureStore) {
    throw new Error('expo-secure-store is not available. This function should only be called on mobile.');
  }
  
  return {
    getItem: async (key: string): Promise<string | null> => {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (error) {
        console.error('[Supabase] Error getting item from SecureStore:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.error('[Supabase] Error setting item in SecureStore:', error);
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.error('[Supabase] Error removing item from SecureStore:', error);
      }
    },
  };
}

/**
 * Create mobile Supabase client (Expo)
 */
function createMobileClient(): SupabaseClient {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = `Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY. 
    Current values:
    - EXPO_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'SET' : 'MISSING'}
    - EXPO_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET' : 'MISSING'}
    
    To fix:
    1. Create apps/mobile/.env.local
    2. Add: EXPO_PUBLIC_SUPABASE_URL=your_url
    3. Add: EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
    4. Restart Metro bundler`;
    console.error('❌', errorMsg);
    // Don't throw - return a placeholder client that will fail gracefully
    // This prevents the app from crashing on startup
    console.warn('⚠️ Creating placeholder Supabase client. API calls will fail.');
    return createSupabaseClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }

  let storage;
  try {
    storage = createExpoStorage();
  } catch (storageError) {
    console.error('❌ Failed to create Expo storage:', storageError);
    // Fallback to in-memory storage if SecureStore fails
    console.warn('⚠️ Falling back to in-memory storage (sessions won\'t persist)');
    storage = {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    };
  }

  try {
    const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: storage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // We handle deep links manually
        flowType: "pkce", // Use PKCE for mobile too (Expo supports it)
      },
      global: {
        // Add fetch with timeout and error handling
        fetch: async (url, options = {}) => {
          let timeoutId: ReturnType<typeof setTimeout> | null = null;
          try {
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            const response = await fetch(url, {
              ...options,
              signal: controller.signal,
            });
            
            if (timeoutId) clearTimeout(timeoutId);
            return response;
          } catch (error: any) {
            if (timeoutId) clearTimeout(timeoutId);
            // Log network errors for debugging
            if (error.name === 'AbortError') {
              console.error('❌ [Supabase] Request timeout:', url);
            } else if (error.message?.includes('fetch failed') || error.message?.includes('Network request failed')) {
              console.error('❌ [Supabase] Network error:', error.message);
              console.error('   URL:', url);
              console.error('   This might be a connectivity issue. Check your network connection.');
            } else {
              console.error('❌ [Supabase] Request error:', error.message);
            }
            throw error;
          }
        },
      },
    });
    
    // Test the connection (non-blocking)
    client.auth.getSession().catch((err) => {
      if (err.message?.includes('fetch failed') || err.message?.includes('Network request failed')) {
        console.warn('⚠️ [Supabase] Connection test failed - network error (this is OK if offline):', err.message);
      } else {
        console.warn('⚠️ [Supabase] Connection test failed (this is OK if offline):', err.message);
      }
    });
    
    return client;
  } catch (clientError) {
    console.error('❌ Failed to create Supabase client:', clientError);
    // Return a placeholder client instead of throwing
    console.warn('⚠️ Creating placeholder Supabase client. API calls will fail.');
    return createSupabaseClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }
}

// Client-side singleton to prevent creating multiple instances
let browserClientInstance: TypedSupabaseClient | null = null;
let mobileClientInstance: TypedSupabaseClient | null = null;

/**
 * Create the appropriate Supabase client based on the environment
 * - Mobile (Expo): Uses SecureStore for token storage
 * - Web: Uses browser client with localStorage and PKCE flow
 */
export function createClient(): TypedSupabaseClient {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // During static export build, env vars may not be set
  // Return a client with placeholder values that will fail gracefully at runtime
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isMobile && !mobileClientInstance) {
      try {
        mobileClientInstance = createMobileClient() as TypedSupabaseClient;
      } catch (error) {
        // Fallback to standard client if mobile client creation fails
        mobileClientInstance = createSupabaseClient(
          "https://placeholder.supabase.co",
          "placeholder-key"
        ) as TypedSupabaseClient;
      }
    }
    if (isWeb && !browserClientInstance) {
      // Use standard client - @supabase/ssr is only needed for Next.js SSR
      // For regular web usage, standard client works fine
      browserClientInstance = createSupabaseClient(
        "https://placeholder.supabase.co",
        "placeholder-key",
        {
          auth: {
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
            autoRefreshToken: true,
            persistSession: true,
          },
        }
      ) as TypedSupabaseClient;
    }
    return isMobile ? (mobileClientInstance || browserClientInstance!) : browserClientInstance!;
  }
  
  // Check if we're in a mobile Expo environment
  if (isMobile) {
    if (!mobileClientInstance) {
      mobileClientInstance = createMobileClient() as TypedSupabaseClient;
    }
    return mobileClientInstance;
  }
  
  // Browser client - use singleton
  // Use standard createSupabaseClient for web (works for both client-side and SSR)
  // @supabase/ssr is only needed for Next.js App Router SSR, which we handle separately
  if (!browserClientInstance) {
    browserClientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        persistSession: true,
      },
    }) as TypedSupabaseClient;
  }
  return browserClientInstance;
}

