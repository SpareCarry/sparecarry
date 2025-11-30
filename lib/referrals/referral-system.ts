// Referral program: 2,000 Karma Points each way after first PAID delivery (platform_fee > 0)
// Karma points can be converted to credit at checkout (200 points = $1, max $1 per delivery)

import { createClient } from "@supabase/supabase-js";
import { REFERRAL_KARMA_POINTS } from "../incentives/karma-conversion";

// Lazy initialization to avoid errors during static export build
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are not set");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export function generateReferralCode(userId: string): string {
  // Generate unique referral code: first 8 chars of user ID + random 4 chars
  const userIdPart = userId.slice(0, 8).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${userIdPart}-${randomPart}`;
}

export async function createReferralCode(userId: string): Promise<string> {
  const code = generateReferralCode(userId);

  // Update user with referral code (use admin client for service role)
  const { error } = await getSupabaseAdmin()
    .from("users")
    .update({ referral_code: code })
    .eq("id", userId);

  if (error) throw error;
  return code;
}

export async function applyReferralCode(
  referredUserId: string,
  referralCode: string
): Promise<{ success: boolean; referrerId?: string; error?: string }> {
  const supabaseAdmin = getSupabaseAdmin();

  // Find referrer by code (use admin client)
  const { data: referrer, error: findError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("referral_code", referralCode.toUpperCase())
    .single();

  if (findError || !referrer) {
    return { success: false, error: "Invalid referral code" };
  }

  // Check if user already referred
  const { data: existing } = await supabaseAdmin
    .from("referrals")
    .select("id")
    .eq("referred_id", referredUserId)
    .single();

  if (existing) {
    return { success: false, error: "You've already used a referral code" };
  }

  // Check if self-referral
  if (referrer.id === referredUserId) {
    return { success: false, error: "Cannot refer yourself" };
  }

  // Create referral record
  const { error: createError } = await supabaseAdmin.from("referrals").insert({
    referrer_id: referrer.id,
    referred_id: referredUserId,
  });

  if (createError) {
    return { success: false, error: createError.message };
  }

  // Update referred user
  await supabaseAdmin
    .from("users")
    .update({ referred_by: referrer.id })
    .eq("id", referredUserId);

  return { success: true, referrerId: referrer.id };
}

export async function processReferralCredits(
  userId: string,
  matchId: string,
  platformFee: number
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  // Only award credits on first PAID delivery (platform_fee > 0)
  if (platformFee <= 0) {
    return; // Free delivery (first 3), no referral credit
  }

  // Get user's profile to check completed_deliveries
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("completed_deliveries")
    .eq("user_id", userId)
    .single();

  // Check if this is user's first PAID delivery
  // If completed_deliveries = 1, this is their 2nd delivery (first paid one, since first delivery is free)
  // We check if they just completed their 1st delivery (meaning this is delivery #2, first paid)
  const isFirstPaidDelivery = profile && profile.completed_deliveries === 1;

  if (!isFirstPaidDelivery) {
    return; // Not first paid delivery
  }

  // Get user's referred_by
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("referred_by")
    .eq("id", userId)
    .single();

  if (!user || !user.referred_by) {
    return; // No referrer
  }

  // Get referral record
  const { data: referral } = await supabaseAdmin
    .from("referrals")
    .select("*")
    .eq("referred_id", userId)
    .eq("referrer_id", user.referred_by)
    .single();

  if (!referral) {
    // Create referral record if it doesn't exist
    const { data: newReferral } = await supabaseAdmin
      .from("referrals")
      .insert({
        referrer_id: user.referred_by,
        referred_id: userId,
      })
      .select()
      .single();

    if (newReferral) {
      // Award 2,000 Karma Points to both parties
      // Get current karma for referred user
      const { data: referredUserData } = await supabaseAdmin
        .from("users")
        .select("karma_points")
        .eq("id", userId)
        .single();

      const referredCurrentKarma =
        (referredUserData?.karma_points as number) || 0;
      await supabaseAdmin
        .from("users")
        .update({ karma_points: referredCurrentKarma + REFERRAL_KARMA_POINTS })
        .eq("id", userId);

      // Get current karma for referrer
      const { data: referrerUserData } = await supabaseAdmin
        .from("users")
        .select("karma_points")
        .eq("id", user.referred_by)
        .single();

      const referrerCurrentKarma =
        (referrerUserData?.karma_points as number) || 0;
      await supabaseAdmin
        .from("users")
        .update({ karma_points: referrerCurrentKarma + REFERRAL_KARMA_POINTS })
        .eq("id", user.referred_by);
    }
    return;
  }

  // Check if karma points already awarded for this referral
  if (referral.first_paid_delivery_completed_at) {
    return; // Karma points already awarded
  }

  // Award 2,000 Karma Points to both parties
  // Get current karma for referred user
  const { data: referredUserData } = await supabaseAdmin
    .from("users")
    .select("karma_points")
    .eq("id", userId)
    .single();

  const referredCurrentKarma = (referredUserData?.karma_points as number) || 0;
  await supabaseAdmin
    .from("users")
    .update({ karma_points: referredCurrentKarma + REFERRAL_KARMA_POINTS })
    .eq("id", userId);

  // Get current karma for referrer
  const { data: referrerUserData } = await supabaseAdmin
    .from("users")
    .select("karma_points")
    .eq("id", user.referred_by)
    .single();

  const referrerCurrentKarma = (referrerUserData?.karma_points as number) || 0;
  await supabaseAdmin
    .from("users")
    .update({ karma_points: referrerCurrentKarma + REFERRAL_KARMA_POINTS })
    .eq("id", user.referred_by);

  // Track first paid delivery completion
  await supabaseAdmin
    .from("referrals")
    .update({
      first_paid_delivery_completed_at: new Date().toISOString(),
    })
    .eq("id", referral.id);
}

export async function getReferralStats(userId: string): Promise<{
  referralCode: string | null;
  totalReferrals: number;
  creditsEarned: number;
  creditsAvailable: number;
}> {
  const supabaseAdmin = getSupabaseAdmin();

  // Get referral_code from users and referral_credit_cents from profiles
  const [userResult, profileResult] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("referral_code")
      .eq("id", userId)
      .single(),
    supabaseAdmin
      .from("profiles")
      .select("referral_credit_cents")
      .eq("user_id", userId)
      .single(),
  ]);

  const referralCode = userResult.data?.referral_code || null;
  const creditsCents = profileResult.data?.referral_credit_cents || 0;
  const creditsAvailable = creditsCents / 100; // Convert cents to dollars

  const { count: totalReferrals } = await supabaseAdmin
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", userId);

  return {
    referralCode,
    totalReferrals: totalReferrals || 0,
    creditsEarned: creditsAvailable, // Credits earned = credits available (they accumulate)
    creditsAvailable,
  };
}
