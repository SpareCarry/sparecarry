/**
 * Price Learning System
 *
 * Tracks user feedback on suggested prices and learns from it
 * to improve future suggestions
 */

import { createClient } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface PriceFeedback {
  requestId: string;
  suggestedPrice: number;
  userAccepted: boolean; // Did user accept the suggestion?
  finalReward?: number; // Final reward if request was completed
  route: string; // fromLocation → toLocation
  category?: string;
  weightKg: number;
  timestamp: string;
}

export interface LearningAdjustment {
  route: string;
  category?: string;
  adjustmentMultiplier: number; // e.g., 1.1 = 10% increase needed
  confidence: number; // 0-1, how confident we are in this adjustment
  dataPoints: number;
  lastUpdated: string;
}

/**
 * Record price feedback when user accepts/rejects a suggestion
 * This should be called when:
 * - User accepts suggested price (userAccepted = true)
 * - User rejects and sets their own price (userAccepted = false)
 * - Request is completed (finalReward is set)
 */
export async function recordPriceFeedback(
  feedback: PriceFeedback,
  supabase?: SupabaseClient
): Promise<void> {
  const client = supabase || createClient();

  try {
    // Store feedback in a learning table (create if doesn't exist)
    // For now, we'll use a simple approach: store in a JSON column or separate table
    // In production, you'd want a dedicated price_feedback table

    // Note: This is a placeholder implementation
    // In production, create a table:
    // CREATE TABLE price_feedback (
    //   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    //   request_id UUID REFERENCES requests(id),
    //   suggested_price DECIMAL(10, 2),
    //   user_accepted BOOLEAN,
    //   final_reward DECIMAL(10, 2),
    //   route TEXT,
    //   category TEXT,
    //   weight_kg DECIMAL(10, 2),
    //   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    // );

    console.log("[price-learning] Recording feedback:", feedback);

    // For now, we'll just log it
    // In production, insert into price_feedback table
    // await client.from('price_feedback').insert({
    //   request_id: feedback.requestId,
    //   suggested_price: feedback.suggestedPrice,
    //   user_accepted: feedback.userAccepted,
    //   final_reward: feedback.finalReward,
    //   route: feedback.route,
    //   category: feedback.category,
    //   weight_kg: feedback.weightKg,
    // });
  } catch (error) {
    console.error("[price-learning] Error recording feedback:", error);
  }
}

/**
 * Get learning adjustments for a route/category
 * Returns multiplier adjustments based on historical feedback
 */
export async function getLearningAdjustments(
  route: string,
  category?: string,
  supabase?: SupabaseClient
): Promise<LearningAdjustment | null> {
  const client = supabase || createClient();

  try {
    // Query price_feedback table for this route/category
    // Calculate average adjustment needed

    // Placeholder: In production, this would query the price_feedback table
    // For now, return null (no adjustments)

    // Example query:
    // const { data, error } = await client
    //   .from('price_feedback')
    //   .select('*')
    //   .eq('route', route)
    //   .eq('category', category || null)
    //   .limit(100);

    // if (error || !data || data.length < 5) {
    //   return null; // Not enough data
    // }

    // Calculate adjustment:
    // - For accepted suggestions: ratio = final_reward / suggested_price
    // - Average ratio tells us if we're too high/low
    // - Adjustment = 1 / average_ratio (if ratio < 1, we need to lower; if > 1, raise)

    return null; // No adjustments yet (not enough data)
  } catch (error) {
    console.error(
      "[price-learning] Error getting learning adjustments:",
      error
    );
    return null;
  }
}

/**
 * Analyze feedback patterns and update learning adjustments
 * This could be run as a background job periodically
 */
export async function updateLearningAdjustments(
  supabase?: SupabaseClient
): Promise<void> {
  const client = supabase || createClient();

  try {
    // Query all price_feedback records
    // Group by route and category
    // Calculate average adjustments needed
    // Store in learning_adjustments table or cache

    // This is a background job that would:
    // 1. Query price_feedback table
    // 2. Group by route/category
    // 3. Calculate average ratio (final_reward / suggested_price)
    // 4. Store adjustments in learning_adjustments table

    console.log("[price-learning] Updating learning adjustments...");

    // Placeholder implementation
  } catch (error) {
    console.error(
      "[price-learning] Error updating learning adjustments:",
      error
    );
  }
}

/**
 * Apply learning adjustments to a suggested price
 */
export async function applyLearningAdjustments(
  basePrice: number,
  route: string,
  category?: string,
  supabase?: SupabaseClient
): Promise<number> {
  const adjustment = await getLearningAdjustments(route, category, supabase);

  if (adjustment && adjustment.confidence > 0.5 && adjustment.dataPoints >= 5) {
    return basePrice * adjustment.adjustmentMultiplier;
  }

  return basePrice; // No adjustment
}

/**
 * Track when a suggested price is shown to user
 * This helps us understand which suggestions are being used
 */
export async function trackSuggestionShown(
  requestId: string,
  suggestedPrice: number,
  route: string,
  weightKg: number,
  category?: string,
  supabase?: SupabaseClient
): Promise<void> {
  const client = supabase || createClient();

  try {
    // Store in analytics or tracking table
    // This helps us understand:
    // - How often suggestions are shown
    // - Which routes/categories get suggestions
    // - User engagement with suggestions

    console.log("[price-learning] Tracking suggestion shown:", {
      requestId,
      suggestedPrice,
      route,
      category,
      weightKg,
    });

    // In production, insert into analytics_events or similar table
  } catch (error) {
    console.error("[price-learning] Error tracking suggestion:", error);
  }
}

/**
 * Get feedback statistics for a route
 * Useful for understanding pricing patterns
 */
export interface FeedbackStats {
  route: string;
  totalSuggestions: number;
  acceptedCount: number;
  rejectedCount: number;
  averageAcceptedRatio: number; // final_reward / suggested_price for accepted
  averageRejectedRatio: number; // user_price / suggested_price for rejected
  confidence: "high" | "medium" | "low";
}

export async function getFeedbackStats(
  route: string,
  category?: string,
  supabase?: SupabaseClient
): Promise<FeedbackStats | null> {
  const client = supabase || createClient();

  try {
    // Query price_feedback table
    // Calculate statistics

    // Placeholder: In production, this would query the table
    return null;
  } catch (error) {
    console.error("[price-learning] Error getting feedback stats:", error);
    return null;
  }
}
