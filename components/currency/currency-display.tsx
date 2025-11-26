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
  const supabase = createClient();

  const { data: userCurrency } = useQuery<string>({
    queryKey: ["user-currency", user?.id],
    queryFn: async (): Promise<string> => {
      if (!user) return detectUserCurrency();
      
      const { data, error } = await supabase
        .from("profiles")
        .select("preferred_currency")
        .eq("user_id", user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.warn("Error fetching preferred currency:", error);
        return detectUserCurrency();
      }
      
      const currency = (data as { preferred_currency?: string } | null)?.preferred_currency;
      return currency || detectUserCurrency();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const currency = userCurrency || detectUserCurrency();
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

