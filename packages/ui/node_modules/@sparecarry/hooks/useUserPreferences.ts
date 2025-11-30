/**
 * Hook to get user preferences (imperial/metric, currency)
 * For mobile and web compatibility
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@sparecarry/lib/supabase";
import { useAuth } from "./useAuth";
import { shouldUseImperial } from "@sparecarry/lib/utils/imperial";
import { detectUserCurrency as detectCurrency } from "@sparecarry/lib/utils/currency";

export function useUserPreferences() {
  const { user } = useAuth();
  const supabase = createClient();

  const { data: preferImperial, isLoading: imperialLoading } =
    useQuery<boolean>({
      queryKey: ["user-imperial-preference", user?.id],
      queryFn: async (): Promise<boolean> => {
        if (!user || user.id === "dev-user-id") {
          return shouldUseImperial();
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("prefer_imperial_units")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.warn("Error fetching imperial preference:", error);
          return shouldUseImperial();
        }

        const imperial = (data as { prefer_imperial_units?: boolean } | null)
          ?.prefer_imperial_units;
        return imperial ?? shouldUseImperial();
      },
      enabled: !!user,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      placeholderData: shouldUseImperial(), // Use default while loading
    });

  const { data: preferredCurrency, isLoading: currencyLoading } =
    useQuery<string>({
      queryKey: ["user-currency", user?.id],
      queryFn: async (): Promise<string> => {
        if (!user || user.id === "dev-user-id") {
          return detectCurrency();
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("preferred_currency")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.warn("Error fetching preferred currency:", error);
          return detectCurrency();
        }

        const currency = (data as { preferred_currency?: string } | null)
          ?.preferred_currency;
        return currency || detectCurrency();
      },
      enabled: !!user,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      placeholderData: detectCurrency(), // Use default while loading
    });

  return {
    preferImperial: preferImperial ?? shouldUseImperial(),
    preferredCurrency: preferredCurrency ?? detectCurrency(),
    isLoading: imperialLoading || currencyLoading,
  };
}
