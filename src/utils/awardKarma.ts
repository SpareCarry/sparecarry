/**
 * Award Karma Points Utility
 * 
 * Awards karma points to users when deliveries are completed.
 * Called from delivery confirmation flow.
 */

import { createClient } from '../../lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { trackKarmaPointsEarned } from '../../lib/analytics/tracking';

export interface AwardKarmaInput {
  userId: string;
  weight: number; // kg
  platformFee: number; // USD
  karmaPoints: number; // Pre-calculated karma points
}

/**
 * Award karma points to a user
 * Updates the user's karma_points in the database
 */
export async function awardKarmaPoints(input: AwardKarmaInput): Promise<number> {
  const { userId, karmaPoints } = input;

  if (karmaPoints <= 0) {
    return 0;
  }

  try {
    const supabase = createClient() as SupabaseClient;

    // Get current karma points
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('karma_points')
      .eq('id', userId)
      .single<{ karma_points: number | null }>();

    if (fetchError) {
      console.error('Error fetching user karma:', fetchError);
      return 0;
    }

    const currentKarma = userData?.karma_points || 0;
    const newKarma = currentKarma + karmaPoints;

    // Update karma points
    const { error: updateError } = await supabase
      .from('users')
      .update({ karma_points: newKarma })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating karma points:', updateError);
      return 0;
    }

    // Track analytics
    trackKarmaPointsEarned(karmaPoints, input.weight, input.platformFee);

    return newKarma;
  } catch (error) {
    console.error('Exception awarding karma points:', error);
    return 0;
  }
}

