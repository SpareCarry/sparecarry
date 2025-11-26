/**
 * Safety Score Hook
 * 
 * Computes and stores safety scores for listings
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { createClient } from '../../../lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { computeSafetyScore } from './scoringRules';
import { ListingDetails, SafetyScoreResult } from './types';

/**
 * Hook to compute and store safety score for a listing
 */
export function useSafetyScore(listingId: string | null, details: ListingDetails) {
  const supabase = createClient() as SupabaseClient;

  // Compute score locally
  const computedScore = computeSafetyScore(details);

  // Fetch stored score from database
  const { data: storedScore, refetch } = useQuery({
    queryKey: ['listing-safety', listingId],
    queryFn: async () => {
      if (!listingId) return null;
      
      const { data, error } = await supabase
        .from('listing_safety')
        .select('*')
        .eq('listing_id', listingId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching safety score:', error);
        return null;
      }

      return data;
    },
    enabled: !!listingId,
    retry: false,
    throwOnError: false,
  });

  // Mutation to save score
  const saveScoreMutation = useMutation({
    mutationFn: async (listingId: string) => {
      const scoreResult = computeSafetyScore(details);
      
      const { data, error } = await supabase
        .from('listing_safety')
        .upsert({
          listing_id: listingId,
          safety_score: scoreResult.score,
          reasons: scoreResult.reasons,
          computed_at: new Date().toISOString(),
        } as Record<string, unknown>, {
          onConflict: 'listing_id',
        });

      if (error) {
        console.error('Error saving safety score:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      refetch();
    },
  });

  // Use stored score if available and recent, otherwise use computed
  const displayScore: SafetyScoreResult = storedScore?.computed_at 
    ? {
        score: storedScore.safety_score,
        reasons: storedScore.reasons || [],
      }
    : computedScore;

  return {
    score: displayScore.score,
    reasons: displayScore.reasons,
    computedScore,
    storedScore,
    saveScore: (listingId: string) => saveScoreMutation.mutate(listingId),
    isSaving: saveScoreMutation.isPending,
  };
}

