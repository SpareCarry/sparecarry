/**
 * Reliability Score Calculation
 * 
 * Calculates and updates user reliability scores based on:
 * - Completed deliveries
 * - Average rating
 * - Cancellation rate
 * - Response time (future)
 */

import { createClient } from '../supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ReliabilityScoreFactors {
  completedDeliveries: number;
  averageRating?: number;
  cancellationCount: number;
  completionRate: number;
}

/**
 * Calculate reliability score (0-100)
 */
export function calculateReliabilityScore(factors: ReliabilityScoreFactors): number {
  let score = 0;

  // Base score from completed deliveries (0-40 points)
  if (factors.completedDeliveries >= 50) {
    score += 40;
  } else if (factors.completedDeliveries >= 20) {
    score += 30;
  } else if (factors.completedDeliveries >= 10) {
    score += 20;
  } else if (factors.completedDeliveries >= 5) {
    score += 10;
  } else if (factors.completedDeliveries > 0) {
    score += 5;
  }

  // Rating score (0-30 points)
  if (factors.averageRating !== undefined) {
    if (factors.averageRating >= 4.8) {
      score += 30;
    } else if (factors.averageRating >= 4.5) {
      score += 25;
    } else if (factors.averageRating >= 4.0) {
      score += 20;
    } else if (factors.averageRating >= 3.5) {
      score += 15;
    } else if (factors.averageRating >= 3.0) {
      score += 10;
    } else {
      score += 5;
    }
  }

  // Cancellation penalty (0-30 points deduction)
  if (factors.cancellationCount > 0) {
    if (factors.cancellationCount >= 10) {
      score -= 30;
    } else if (factors.cancellationCount >= 5) {
      score -= 20;
    } else if (factors.cancellationCount >= 3) {
      score -= 10;
    } else {
      score -= 5;
    }
  }

  // Completion rate bonus (0-20 points)
  if (factors.completionRate >= 95) {
    score += 20;
  } else if (factors.completionRate >= 90) {
    score += 15;
  } else if (factors.completionRate >= 80) {
    score += 10;
  } else if (factors.completionRate >= 70) {
    score += 5;
  }

  // Cap score between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Update reliability score for a user
 */
export async function updateUserReliabilityScore(userId: string): Promise<number> {
  const supabase = createClient() as SupabaseClient;

  // Call database function
  const { data, error } = await supabase.rpc('update_user_reliability_score', {
    user_id_param: userId,
  });

  if (error) {
    console.error('Error updating reliability score:', error);
    return 0;
  }

  // Get updated score
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('reliability_score')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return 0;
  }

  return user.reliability_score || 0;
}

/**
 * Get reliability level from score
 */
export function getReliabilityLevel(score: number): 'excellent' | 'good' | 'fair' | 'new' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'new';
}

/**
 * Get reliability label for display
 */
export function getReliabilityLabel(score: number): string {
  const level = getReliabilityLevel(score);
  switch (level) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'fair':
      return 'Fair';
    case 'new':
      return 'New User';
  }
}

