/**
 * Feature Flag Provider
 * 
 * Provides feature flags to the application via React context
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { initializeUnleash, isFeatureEnabled as checkFeatureEnabled, getAllFeatureFlags, destroyUnleash } from '@/lib/flags/unleashClient';
import type { FeatureFlag } from '@/lib/flags/unleashClient';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';

interface FeatureFlagContextValue {
  flags: Map<string, FeatureFlag>;
  isEnabled: (flagKey: string, defaultValue?: boolean) => boolean;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | undefined>(undefined);

interface FeatureFlagProviderProps {
  children: React.ReactNode;
}

export function FeatureFlagProvider({ children }: FeatureFlagProviderProps) {
  const supabase = createClient();
  // Use shared hook to prevent duplicate queries
  const { user } = useUser();
  
  const [flags, setFlags] = useState<Map<string, FeatureFlag>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const unleashUrl = process.env.NEXT_PUBLIC_UNLEASH_URL;
      const unleashKey = process.env.NEXT_PUBLIC_UNLEASH_CLIENT_KEY;

      if (!unleashUrl || !unleashKey) {
        // Not an error - just means feature flags aren't configured, which is fine
        setIsLoading(false);
        return;
      }

      const subscriptionStatus =
        (user?.user_metadata as { subscription_status?: string } | undefined)
          ?.subscription_status;

      await initializeUnleash(
        {
          url: unleashUrl,
          clientKey: unleashKey,
          appName: 'sparecarry',
          environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'production',
          refreshInterval: 30000,
        },
        user?.id,
        {
          email: user?.email,
          subscription_status: subscriptionStatus,
        }
      );

      const allFlags = getAllFeatureFlags();
      setFlags(allFlags);
    } catch (err) {
      console.error('[FeatureFlags] Failed to initialize:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();

    return () => {
      destroyUnleash();
    };
  }, [refresh]);

  const isEnabled = useCallback(
    (flagKey: string, defaultValue = false): boolean => {
      return checkFeatureEnabled(flagKey, defaultValue);
    },
    []
  );

  const value: FeatureFlagContextValue = {
    flags,
    isEnabled,
    isLoading,
    error,
    refresh,
  };

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook to use feature flags
 */
export function useFlag(flagKey: string, defaultValue = false): boolean {
  const context = useContext(FeatureFlagContext);

  if (!context) {
    console.warn('[FeatureFlags] useFlag called outside FeatureFlagProvider');
    return defaultValue;
  }

  return context.isEnabled(flagKey, defaultValue);
}

/**
 * Hook to get feature flag with variant
 */
export function useFeatureFlag(flagKey: string): FeatureFlag | null {
  const context = useContext(FeatureFlagContext);

  if (!context) {
    return null;
  }

  return context.flags.get(flagKey) ?? null;
}

/**
 * Hook to access feature flag context
 */
export function useFeatureFlags(): FeatureFlagContextValue {
  const context = useContext(FeatureFlagContext);

  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagProvider');
  }

  return context;
}

