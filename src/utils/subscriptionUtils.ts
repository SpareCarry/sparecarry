/**
 * Subscription Utilities
 * 
 * Helper functions to check user subscription status
 * Works offline with safe defaults
 */

import { createClient } from '../../lib/supabase/client';

export interface SubscriptionStatus {
  isPremium: boolean;
  subscriptionStatus: string | null;
  isLifetime: boolean;
  isSupporter: boolean;
}

/**
 * Check if user has active premium subscription
 * Returns false if offline or error (safe default)
 */
export async function checkSubscriptionStatus(userId?: string): Promise<SubscriptionStatus> {
  // Default to non-premium if no user ID
  const defaultStatus: SubscriptionStatus = {
    isPremium: false,
    subscriptionStatus: null,
    isLifetime: false,
    isSupporter: false,
  };

  if (!userId) {
    return defaultStatus;
  }

  try {
    const supabase = createClient();
    
    // Fetch user data including subscription and profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_status, supporter_status')
      .eq('id', userId)
      .single<{ subscription_status: string | null; supporter_status: string | null }>();

    if (userError || !userData) {
      return defaultStatus;
    }

    // Check profile for lifetime status
    const { data: profileData } = await supabase
      .from('profiles')
      .select('lifetime_active')
      .eq('user_id', userId)
      .single<{ lifetime_active: boolean | null }>();

    const isSubscribed = userData.subscription_status === 'active' || 
                        userData.subscription_status === 'trialing';
    const isLifetime = profileData?.lifetime_active === true;
    const isSupporter = userData.supporter_status === 'active';

    return {
      isPremium: isSubscribed || isLifetime || isSupporter,
      subscriptionStatus: userData.subscription_status,
      isLifetime,
      isSupporter,
    };
  } catch (error) {
    // Return safe default on any error (offline mode)
    console.warn('Error checking subscription status:', error);
    return defaultStatus;
  }
}

