"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import { useUser } from "../../hooks/useUser";
import { formatCurrencyWithConversion, detectUserCurrency } from "../../lib/utils/currency";
import { cn } from "../../lib/utils";

interface CurrencyDisplayProps {
  amount: number;
  originalCurrency?: string;
  className?: string;
  showSecondary?: boolean;
}

export function CurrencyDisplay({
  amount,
  originalCurrency = "USD",
  className,
  showSecondary = true,
}: CurrencyDisplayProps) {
  const { user } = useUser();
  
  // Use a default currency immediately to prevent flickering
  const defaultCurrency = detectUserCurrency();

  const { data: userCurrency } = useQuery<string>({
    queryKey: ["user-currency", user?.id],
    queryFn: async (): Promise<string> => {
      if (!user) return defaultCurrency;
      
      // Create client inside queryFn to avoid creating it on every render
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("preferred_currency")
        .eq("user_id", user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.warn("Error fetching preferred currency:", error);
        return defaultCurrency;
      }
      
      const currency = (data as { preferred_currency?: string } | null)?.preferred_currency;
      return currency || defaultCurrency;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    placeholderData: defaultCurrency, // Use default currency while loading to prevent flickering
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if we have cached data
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Always use a currency value - never undefined
  const currency = userCurrency ?? defaultCurrency;
  const formatted = formatCurrencyWithConversion(amount, currency, originalCurrency);

  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span>{formatted.primary}</span>
      {showSecondary && formatted.secondary && (
        <span className="text-xs text-slate-400">{formatted.secondary}</span>
      )}
    </span>
  );
}

