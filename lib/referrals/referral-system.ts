// Referral program: $35 credit each way after ANY successful delivery
// Credits are platform-only (can only be used on fees/rewards, never cashed out)

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export function generateReferralCode(userId: string): string {
  // Generate unique referral code: first 8 chars of user ID + random 4 chars
  const userIdPart = userId.slice(0, 8).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${userIdPart}-${randomPart}`;
}

export async function createReferralCode(userId: string): Promise<string> {
  const code = generateReferralCode(userId);
  
  // Update user with referral code (use admin client for service role)
  const { error } = await supabaseAdmin
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
  matchId: string
): Promise<void> {
  // Award $35 credit to referred user after ANY successful delivery
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
      // Award credits to both parties
      await supabaseAdmin.rpc("add_referral_credit", {
        user_id: userId,
        amount: 35,
      });
      await supabaseAdmin.rpc("add_referral_credit", {
        user_id: user.referred_by,
        amount: 35,
      });
    }
    return;
  }

  // Award $35 credit to referred user (every delivery)
  await supabaseAdmin.rpc("add_referral_credit", {
    user_id: userId,
    amount: 35,
  });

  // Award $35 credit to referrer (every delivery by referred user)
  await supabaseAdmin.rpc("add_referral_credit", {
    user_id: referral.referrer_id,
    amount: 35,
  });

  // Track delivery count for this referral
  await supabaseAdmin
    .from("referrals")
    .update({
      first_delivery_completed_at: referral.first_delivery_completed_at || new Date().toISOString(),
    })
    .eq("id", referral.id);
}

export async function getReferralStats(userId: string): Promise<{
  referralCode: string | null;
  totalReferrals: number;
  creditsEarned: number;
  creditsAvailable: number;
}> {
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("referral_code, referral_credits")
    .eq("id", userId)
    .single();

  const { count: totalReferrals } = await supabaseAdmin
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", userId);

  const { data: referrals } = await supabaseAdmin
    .from("referrals")
    .select("referrer_credit_earned")
    .eq("referrer_id", userId);

  // Calculate total credits earned (35 per referral delivery)
  // This is approximate - actual credits are tracked in referral_credits field
  const creditsEarned = (user?.referral_credits || 0);

  return {
    referralCode: user?.referral_code || null,
    totalReferrals: totalReferrals || 0,
    creditsEarned,
    creditsAvailable: user?.referral_credits || 0,
  };
}

