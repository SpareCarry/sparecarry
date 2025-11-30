/**
 * Optimized version of useRealtime with debouncing
 */

import { useCallback, useRef } from "react";
import { useRealtime as useRealtimeBase } from "./useRealtime";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

const DEBOUNCE_DELAY = 100;

export function useRealtimeOptimized(
  options: Parameters<typeof useRealtimeBase>[0] & { debounceMs?: number }
) {
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceDelay = options.debounceMs ?? DEBOUNCE_DELAY;

  const debouncedCallback = useCallback(
    (payload: RealtimePostgresChangesPayload<any>) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        options.callback(payload);
      }, debounceDelay);
    },
    [options.callback, debounceDelay]
  );

  return useRealtimeBase({
    ...options,
    callback: debouncedCallback,
  });
}
