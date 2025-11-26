/**
 * Verification Hooks
 * 
 * Handles ID, email, and phone verification
 * Integrates with Stripe Identity for ID verification
 */

import { createClient } from '../supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface VerificationStatus {
  id_verified: boolean;
  email_verified: boolean;
  phone_verified: boolean;
}

/**
 * Verify user email (uses Supabase Auth)
 */
export async function verifyEmail(userId: string): Promise<boolean> {
  const supabase = createClient() as SupabaseClient;

  // Check if email is verified in auth.users
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return false;
  }

  const isVerified = user.email_confirmed_at !== null;

  // Update users table
  if (isVerified) {
    await supabase
      .from('users')
      .update({ email_verified: true } as Record<string, unknown>)
      .eq('id', userId);
  }

  return isVerified;
}

/**
 * Verify user phone (uses Supabase Auth or manual verification)
 */
export async function verifyPhone(userId: string, phoneNumber: string): Promise<boolean> {
  const supabase = createClient() as SupabaseClient;

  // In production, this would integrate with SMS verification service
  // For now, we'll mark as verified if phone exists in profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('phone')
    .eq('user_id', userId)
    .single();

  if (error || !profile || !profile.phone) {
    return false;
  }

  // Update users table
  await supabase
    .from('users')
    .update({ phone_verified: true } as Record<string, unknown>)
    .eq('id', userId);

  return true;
}

/**
 * Verify user ID using Stripe Identity (or stub for test mode)
 */
export async function verifyID(userId: string): Promise<{ verified: boolean; sessionId?: string }> {
  const supabase = createClient() as SupabaseClient;

  // Check if already verified
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id_verified')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return { verified: false };
  }

  if (user.id_verified) {
    return { verified: true };
  }

  // Check if Stripe Identity is enabled
  const stripeIdentityEnabled = process.env.NEXT_PUBLIC_ENABLE_STRIPE_IDENTITY !== 'false';

  if (!stripeIdentityEnabled || process.env.NODE_ENV === 'test') {
    // Test mode: return stub
    return { verified: false, sessionId: 'test_session_' + Date.now() };
  }

  // Get user's Stripe customer ID
  const { data: userData, error: dataError } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (dataError || !userData?.stripe_customer_id) {
    return { verified: false };
  }

  // Create Stripe Identity verification session
  try {
    const response = await fetch('/api/verification/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, customerId: userData.stripe_customer_id }),
    });

    if (!response.ok) {
      return { verified: false };
    }

    const { sessionId } = await response.json();
    return { verified: false, sessionId }; // Not verified yet, session created
  } catch (error) {
    console.error('Error creating verification session:', error);
    return { verified: false };
  }
}

/**
 * Get verification status for a user
 */
export async function getVerificationStatus(userId: string): Promise<VerificationStatus> {
  const supabase = createClient() as SupabaseClient;

  const { data: user, error } = await supabase
    .from('users')
    .select('id_verified, email_verified, phone_verified')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return {
      id_verified: false,
      email_verified: false,
      phone_verified: false,
    };
  }

  return {
    id_verified: user.id_verified || false,
    email_verified: user.email_verified || false,
    phone_verified: user.phone_verified || false,
  };
}

/**
 * Check if user has premium membership
 */
export async function isPremiumMember(userId: string): Promise<boolean> {
  const supabase = createClient() as SupabaseClient;

  const { data: user, error } = await supabase
    .from('users')
    .select('subscription_status, premium_member')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return false;
  }

  return user.premium_member || user.subscription_status === 'active';
}

