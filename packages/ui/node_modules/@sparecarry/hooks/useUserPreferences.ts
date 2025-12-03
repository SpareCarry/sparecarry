/**
 * Hook to get user preferences (imperial/metric, currency)
 * For mobile and web compatibility
 * 
 * IMPORTANT: This hook requires QueryClientProvider to be available in the React tree.
 * Ensure your root layout wraps the app with <QueryClientProvider client={queryClient}>
 */

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@sparecarry/lib/supabase";
import { useAuth } from "./useAuth";
import { shouldUseImperial } from "@sparecarry/lib/utils/imperial";
import { detectUserCurrency as detectCurrency } from "@sparecarry/lib/utils/currency";

export function useUserPreferences() {
  const { user } = useAuth();
  const supabase = createClient();

  // Check if dev user
  const isDevUser = user?.id === "dev-user-id";
  
  // MUST always call hooks in the same order (React rules)
  // Even for dev users, we must call useQuery (but disable it)
  // useQuery requires QueryClientProvider even when disabled
  // If provider isn't available, this will throw an error
  const { data: preferImperial, isLoading: imperialLoading } =
    useQuery<boolean>({
      queryKey: ["user-imperial-preference", user?.id],
      queryFn: async (): Promise<boolean> => {
        if (!user || isDevUser) {
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
      enabled: !!user && !isDevUser, // Disable for dev users
      staleTime: 5 * 60 * 1000,
      placeholderData: shouldUseImperial(),
    });

  const { data: preferredCurrency, isLoading: currencyLoading } =
    useQuery<string>({
      queryKey: ["user-currency", user?.id],
      queryFn: async (): Promise<string> => {
        if (!user || isDevUser) {
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
      enabled: !!user && !isDevUser, // Disable for dev users
      staleTime: 5 * 60 * 1000,
      placeholderData: detectCurrency(),
    });

  // For dev users, return defaults (queries are disabled but hooks were called)
  if (isDevUser) {
    return {
      preferImperial: shouldUseImperial(),
      preferredCurrency: detectCurrency(),
      isLoading: false,
    };
  }

  return {
    preferImperial: preferImperial ?? shouldUseImperial(),
    preferredCurrency: preferredCurrency ?? detectCurrency(),
    isLoading: imperialLoading || currencyLoading,
  };
}
