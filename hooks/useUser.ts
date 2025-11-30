/**
 * Shared hook for fetching current user
 * All components should use this hook instead of creating their own queries
 * This prevents duplicate requests and infinite loops
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { createClient } from "../lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useUser() {
  // Memoize supabase client to prevent creating new instances
  const supabase = useMemo(() => createClient(), []);

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User | null>({
    queryKey: ["current-user"],
    queryFn: async () => {
      // TEST MODE: Check for test user in window (set by Playwright)
      if (
        typeof window !== "undefined" &&
        (window as any).__PLAYWRIGHT_TEST_MODE__ &&
        (window as any).__TEST_USER__
      ) {
        const testUser = (window as any).__TEST_USER__;
        console.log("[useUser] Using test user:", testUser?.email);
        return testUser;
      }

      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.warn("Error getting user:", error);
          return null;
        }

        return user;
      } catch (error: any) {
        console.warn("Exception getting user:", error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - user doesn't change that often
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Use cached data if available
    refetchOnReconnect: false, // Don't refetch on reconnect
    retry: false,
    throwOnError: false,
    // Use placeholder data to prevent flickering during refetches
    placeholderData: (previousData) => previousData,
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}
