"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import { useUser } from "../../hooks/useUser";
import { formatWeight, formatDimensions, shouldUseImperial } from "../../lib/utils/imperial";
import { cn } from "../../lib/utils";

interface WeightDisplayProps {
  weightKg: number;
  className?: string;
}

export function WeightDisplay({ weightKg, className }: WeightDisplayProps) {
  const { user } = useUser();
  const supabase = createClient();

  const { data: preferImperial } = useQuery<boolean>({
    queryKey: ["user-imperial-preference", user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user) return shouldUseImperial();
      
      const { data, error } = await supabase
        .from("profiles")
        .select("prefer_imperial_units")
        .eq("user_id", user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.warn("Error fetching imperial preference:", error);
        return shouldUseImperial();
      }
      
      const imperial = (data as { prefer_imperial_units?: boolean } | null)?.prefer_imperial_units;
      return imperial ?? shouldUseImperial();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const useImperial = preferImperial ?? shouldUseImperial();

  return (
    <span className={className}>
      {formatWeight(weightKg, useImperial)}
    </span>
  );
}

interface DimensionsDisplayProps {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  className?: string;
}

export function DimensionsDisplay({
  lengthCm,
  widthCm,
  heightCm,
  className,
}: DimensionsDisplayProps) {
  const { user } = useUser();
  const supabase = createClient();

  const { data: preferImperial } = useQuery<boolean>({
    queryKey: ["user-imperial-preference", user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user) return shouldUseImperial();
      
      const { data, error } = await supabase
        .from("profiles")
        .select("prefer_imperial_units")
        .eq("user_id", user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.warn("Error fetching imperial preference:", error);
        return shouldUseImperial();
      }
      
      const imperial = (data as { prefer_imperial_units?: boolean } | null)?.prefer_imperial_units;
      return imperial ?? shouldUseImperial();
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const useImperial = preferImperial ?? shouldUseImperial();

  return (
    <span className={className}>
      {formatDimensions(lengthCm, widthCm, heightCm, useImperial)}
    </span>
  );
}

