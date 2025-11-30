/**
 * Check if user has Pro subscription access
 * Pro access includes: active subscription, trialing, supporter, or lifetime
 */

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProStatusCheck {
  hasPro: boolean;
  reason?: "subscription" | "supporter" | "lifetime" | "none";
}

/**
 * Check if a user has Pro access
 * @param userId - User ID to check
 * @param supabase - Optional Supabase client (will create one if not provided)
 * @returns Pro status check result
 */
export async function checkProStatus(
  userId: string,
  supabase?: SupabaseClient
): Promise<ProStatusCheck> {
  const client = supabase || (await createClient());

  try {
    // Check users table for subscription and supporter status
    const { data: userData, error: userError } = await client
      .from("users")
      .select("subscription_status, supporter_status")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error checking user Pro status:", userError);
      return { hasPro: false, reason: "none" };
    }

    // Check subscription status
    const isSubscribed = userData?.subscription_status === "active";
    const isTrialing = userData?.subscription_status === "trialing";
    const isSupporter = userData?.supporter_status === "active";

    if (isSubscribed || isTrialing) {
      return { hasPro: true, reason: "subscription" };
    }

    if (isSupporter) {
      return { hasPro: true, reason: "supporter" };
    }

    // Check profiles table for lifetime Pro
    const { data: profileData, error: profileError } = await client
      .from("profiles")
      .select("lifetime_active")
      .eq("user_id", userId)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error checking profile lifetime status:", profileError);
    }

    if (profileData?.lifetime_active) {
      return { hasPro: true, reason: "lifetime" };
    }

    return { hasPro: false, reason: "none" };
  } catch (error) {
    console.error("Exception checking Pro status:", error);
    return { hasPro: false, reason: "none" };
  }
}
