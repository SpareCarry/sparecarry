/**
 * Marketing Banner - shows remaining lifetime spots when under 150
 * Only appears if user doesn't have lifetime_active
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useLifetimeAvailability } from "../../lib/hooks/use-lifetime-availability";
import { Button } from "../ui/button";
import { Flame, Infinity } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "../../hooks/useUser";

type LifetimeProfile = {
  lifetime_active?: boolean | null;
};

export function LifetimeMarketingBanner() {
  const supabase = createClient() as SupabaseClient;
  const router = useRouter();
  const { available } = useLifetimeAvailability();

  // Use shared hook to prevent duplicate queries
  const { user } = useUser();

  const { data: profileData } = useQuery<LifetimeProfile | null>({
    queryKey: ["profile-lifetime-banner", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const { data } = await supabase
          .from("profiles")
          .select("lifetime_active")
          .eq("user_id", user.id)
          .single();
        return (data ?? null) as LifetimeProfile | null;
      } catch {
        return null;
      }
    },
    enabled: !!user,
    retry: false,
    throwOnError: false,
  });

  // Get remaining spots
  const { data: remainingSpots } = useQuery({
    queryKey: ["lifetime-remaining-spots-banner"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc(
          "get_lifetime_purchase_count"
        );

        if (error) return null;

        // Handle both single result and array result
        const result = Array.isArray(data) ? data[0] : data;
        const currentCount = (result as { total?: number })?.total || 0;
        return Math.max(0, 100 - currentCount);
      } catch {
        return null;
      }
    },
    retry: false,
    throwOnError: false,
  });

  // Don't show if:
  // - User has lifetime
  // - Not available
  // - More than 150 spots remaining
  if (
    profileData?.lifetime_active ||
    !available ||
    !remainingSpots ||
    remainingSpots > 150
  ) {
    return null;
  }

  const handleClick = () => {
    router.push("/subscription");
  };

  return (
    <div className="mb-6 rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex-shrink-0">
            <Flame className="h-6 w-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">
              🔥 Only {remainingSpots} Lifetime{" "}
              {remainingSpots === 1 ? "spot" : "spots"} left!
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Become a founding supporter
            </p>
          </div>
        </div>
        <Button
          onClick={handleClick}
          size="sm"
          className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700"
        >
          <Infinity className="mr-1 h-4 w-4" />
          Get Lifetime
        </Button>
      </div>
    </div>
  );
}
