/**
 * Promo Utilities
 * 
 * Shared utilities for promo logic and status checking
 */

import { getDaysLeft } from '@/utils/getDaysLeft';
import { PROMO_END_DATE } from '../../config/platformFees';
import { createClient } from '../supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PromoStatus, validatePromoStatus } from './promo-validation';

/**
 * Check if promo period is active
 */
export function isPromoPeriodActive(): boolean {
  return getDaysLeft() > 0;
}

/**
 * Get promo status (for server-side or client-side)
 * Validates data with Zod for security
 */
export async function getPromoStatus(): Promise<PromoStatus> {
  const daysLeft = getDaysLeft();
  const isActive = daysLeft > 0;

  // If promo is active, platform fee is 0%
  // Otherwise, use normal fee
  const platformFee = isActive ? 0 : 0.08; // Default 8% after promo

  const status = {
    is_active: isActive,
    days_left: daysLeft,
    platform_fee: platformFee,
  };

  // Validate with Zod
  return validatePromoStatus(status);
}

/**
 * Check if user has completed deliveries
 */
export async function hasCompletedDeliveries(userId: string): Promise<boolean> {
  const supabase = createClient() as SupabaseClient;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('completed_deliveries_count')
      .eq('id', userId)
      .single();

    if (error || !data) return false;
    return ((data as { completed_deliveries_count?: number | null }).completed_deliveries_count || 0) > 0;
  } catch (error) {
    console.warn('Failed to check completed deliveries:', error);
    return false;
  }
}

/**
 * Get which promo card to show (if any)
 */
export async function getPromoCardToShow(userId?: string): Promise<'early-supporter' | 'first-delivery' | null> {
  const daysLeft = getDaysLeft();
  
  // Early Supporter promo is active
  if (daysLeft > 0) {
    return 'early-supporter';
  }

  // After promo ends, show first delivery promo if user has no completed deliveries
  if (userId) {
    const hasDeliveries = await hasCompletedDeliveries(userId);
    if (!hasDeliveries) {
      return 'first-delivery';
    }
  }

  return null;
}

