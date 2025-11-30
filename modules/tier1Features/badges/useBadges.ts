/**
 * Badges Hook
 *
 * Fetches user badges and handles badge awarding
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { createClient } from "../../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Badge, UserBadge } from "./types";

/**
 * Hook to fetch user badges
 */
export function useUserBadges(userId: string | null) {
  const supabase = createClient() as SupabaseClient;

  return useQuery({
    queryKey: ["user-badges", userId],
    queryFn: async () => {
      if (!userId) return [];

      // Fetch user badges with badge details joined
      const { data, error } = await supabase
        .from("user_badges")
        .select(
          `
          *,
          badge:badges(*)
        `
        )
        .eq("user_id", userId)
        .order("awarded_at", { ascending: false });

      if (error) {
        console.warn("Error fetching user badges:", error);
        return [];
      }

      return (data || []) as UserBadge[];
    },
    enabled: !!userId,
    retry: false,
    throwOnError: false,
  });
}

/**
 * Hook to fetch all available badges
 */
export function useAllBadges() {
  const supabase = createClient() as SupabaseClient;

  return useQuery({
    queryKey: ["all-badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("title");

      if (error) {
        console.warn("Error fetching badges:", error);
        return [];
      }

      return (data || []) as Badge[];
    },
    retry: false,
    throwOnError: false,
  });
}

/**
 * Award a badge to a user
 * Note: In production, this should be done server-side for security
 */
export function useAwardBadge() {
  const supabase = createClient() as SupabaseClient;

  return useMutation({
    mutationFn: async ({
      userId,
      badgeSlug,
    }: {
      userId: string;
      badgeSlug: string;
    }) => {
      // First, get the badge ID
      const { data: badge, error: badgeError } = await supabase
        .from("badges")
        .select("id")
        .eq("slug", badgeSlug)
        .single();

      if (badgeError || !badge) {
        throw new Error(`Badge not found: ${badgeSlug}`);
      }

      // Check if user already has the badge
      const { data: existing } = await supabase
        .from("user_badges")
        .select("id")
        .eq("user_id", userId)
        .eq("badge_id", badge.id)
        .single();

      if (existing) {
        return { success: true, message: "Badge already awarded" };
      }

      // Award the badge
      const { error } = await supabase.from("user_badges").insert({
        user_id: userId,
        badge_id: badge.id,
      });

      if (error) {
        console.error("Error awarding badge:", error);
        throw error;
      }

      return { success: true, message: "Badge awarded successfully" };
    },
  });
}

/**
 * Check and award trusted traveller badge if user has completed 3+ jobs
 * This should ideally be called server-side after job completion
 */
export async function checkAndAwardTrustedTraveller(
  userId: string,
  supabaseClient: SupabaseClient
): Promise<boolean> {
  // Get traveller stats
  const { data: stats, error: statsError } = await supabaseClient
    .from("traveller_stats")
    .select("completed_jobs_count")
    .eq("user_id", userId)
    .single();

  if (statsError || !stats) {
    return false;
  }

  // If user has 3+ completed jobs, check if they have the badge
  if (stats.completed_jobs_count >= 3) {
    // Check if already has badge
    const { data: badge } = await supabaseClient
      .from("badges")
      .select("id")
      .eq("slug", "trusted_traveller")
      .single();

    if (!badge) return false;

    const { data: existing } = await supabaseClient
      .from("user_badges")
      .select("id")
      .eq("user_id", userId)
      .eq("badge_id", badge.id)
      .single();

    if (!existing) {
      // Award the badge (this should ideally be done server-side)
      const awardBadge = useAwardBadge();
      await awardBadge.mutateAsync({ userId, badgeSlug: "trusted_traveller" });
      return true;
    }
  }

  return false;
}
