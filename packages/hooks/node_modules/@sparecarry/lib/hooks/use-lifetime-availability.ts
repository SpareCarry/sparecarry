/**
 * Hook to check if lifetime plan is available
 * Fetches from Supabase RPC function get_lifetime_availability()
 * Returns availability status without blocking UI
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "../supabase";

export interface LifetimeAvailabilityResult {
  available: boolean;
  loading: boolean;
  error: Error | null;
}

export function useLifetimeAvailability(): LifetimeAvailabilityResult {
  const supabase = createClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["lifetime-availability"],
    queryFn: async () => {
      try {
        // Call Supabase RPC function to check availability
        // This function checks if lifetime_pro count < 100
        const { data: result, error: rpcError } = await supabase.rpc(
          "get_lifetime_availability"
        );

        if (rpcError) {
          console.warn("Error checking lifetime availability:", rpcError);
          // Default to false (not available) on error to be safe
          return false;
        }

        // RPC returns boolean: true if available (< 100), false if limit reached
        return result === true;
      } catch (error) {
        console.warn("Exception checking lifetime availability:", error);
        // Default to false on exception
        return false;
      }
    },
    retry: false,
    throwOnError: false,
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });

  return {
    available: data ?? false,
    loading: isLoading,
    error: error instanceof Error ? error : null,
  };
}
