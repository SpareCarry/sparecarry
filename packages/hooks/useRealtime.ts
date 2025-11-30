/**
 * useRealtime - React hook for Supabase Realtime subscriptions
 *
 * Automatically subscribes on mount and unsubscribes on unmount.
 * Prevents duplicate subscriptions using RealtimeManager.
 */

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RealtimeManager } from "@sparecarry/lib/realtime";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export interface UseRealtimeOptions {
  table: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
  schema?: string;
  filter?: string;
  callback: (payload: RealtimePostgresChangesPayload<any>) => void;
  enabled?: boolean;
  customChannelName?: string;
}

/**
 * React hook for realtime subscriptions
 * Automatically handles subscribe/unsubscribe lifecycle
 */
export function useRealtime({
  table,
  event = "*",
  schema = "public",
  filter,
  callback,
  enabled = true,
  customChannelName,
}: UseRealtimeOptions) {
  const channelNameRef = useRef<string | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Create stable callback that uses ref
  const stableCallback = useCallback(
    (payload: RealtimePostgresChangesPayload<any>) => {
      callbackRef.current(payload);
    },
    []
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    try {
      // Subscribe using RealtimeManager
      const channelName = RealtimeManager.listen(
        {
          table,
          event,
          schema,
          filter,
        },
        stableCallback,
        customChannelName
      );

      channelNameRef.current = channelName;

      return () => {
        // Cleanup on unmount
        if (channelNameRef.current) {
          RealtimeManager.remove(channelNameRef.current, stableCallback);
          channelNameRef.current = null;
        }
      };
    } catch (error) {
      console.error("[useRealtime] Error subscribing:", error);
    }
  }, [
    enabled,
    table,
    event,
    schema,
    filter,
    stableCallback,
    customChannelName,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelNameRef.current) {
        RealtimeManager.remove(channelNameRef.current, stableCallback);
        channelNameRef.current = null;
      }
    };
  }, [stableCallback]);
}

/**
 * Hook for listening to a specific table with automatic query invalidation
 * Useful for React Query integration
 */
export function useRealtimeInvalidation(
  table: string,
  queryKey: (string | undefined)[],
  options?: {
    filter?: string;
    enabled?: boolean;
    customChannelName?: string;
  }
) {
  const queryClient = useQueryClient();

  useRealtime({
    table,
    filter: options?.filter,
    enabled: options?.enabled !== false,
    customChannelName: options?.customChannelName,
    callback: () => {
      // Filter out undefined and invalidate query on any change
      queryClient.invalidateQueries({
        queryKey: queryKey.filter(Boolean) as string[],
      });
    },
  });
}
