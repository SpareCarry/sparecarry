/**
 * Badge Awarding Utilities
 *
 * Server-side functions for awarding badges and updating traveller stats
 * These should be called from API routes or server actions
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Increment completed jobs count for a traveller
 * Triggers automatic badge awarding via SQL trigger
 */
export async function incrementTravellerCompletedJobs(userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase credentials not configured");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get current stats
  const { data: currentStats } = await supabase
    .from("traveller_stats")
    .select("completed_jobs_count")
    .eq("user_id", userId)
    .single();

  const newCount = (currentStats?.completed_jobs_count || 0) + 1;

  // Update stats (trigger will auto-award badge if count >= 3)
  const { error } = await supabase.from("traveller_stats").upsert(
    {
      user_id: userId,
      completed_jobs_count: newCount,
      last_completed_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    console.error("Error updating traveller stats:", error);
    throw error;
  }

  return { newCount, badgeAwarded: newCount >= 3 };
}

/**
 * Award a badge to a user (server-side)
 */
export async function awardBadgeToUser(userId: string, badgeSlug: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase credentials not configured");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get badge ID
  const { data: badge, error: badgeError } = await supabase
    .from("badges")
    .select("id")
    .eq("slug", badgeSlug)
    .single();

  if (badgeError || !badge) {
    throw new Error(`Badge not found: ${badgeSlug}`);
  }

  // Check if already awarded
  const { data: existing } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_id", badge.id)
    .single();

  if (existing) {
    return { success: true, message: "Badge already awarded" };
  }

  // Award badge
  const { error } = await supabase.from("user_badges").insert({
    user_id: userId,
    badge_id: badge.id,
  });

  if (error) {
    console.error("Error awarding badge:", error);
    throw error;
  }

  return { success: true, message: "Badge awarded successfully" };
}
