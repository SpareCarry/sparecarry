/**
 * Promo Validation with Zod
 * 
 * Validates all promo-related data for security
 */

import { z } from 'zod';

// Promo status schema
export const PromoStatusSchema = z.object({
  is_active: z.boolean(),
  days_left: z.number().int().min(0).max(1000),
  platform_fee: z.number().min(0).max(1), // 0-100% as decimal
});

export type PromoStatus = z.infer<typeof PromoStatusSchema>;

// Promo dismissal schema
export const PromoDismissalSchema = z.object({
  dismissed_until: z.string().datetime(),
  user_id: z.string().uuid().optional(),
});

export type PromoDismissal = z.infer<typeof PromoDismissalSchema>;

/**
 * Validate promo status from Supabase RPC
 */
export function validatePromoStatus(data: unknown): PromoStatus {
  return PromoStatusSchema.parse(data);
}

/**
 * Validate promo dismissal data
 */
export function validatePromoDismissal(data: unknown): PromoDismissal {
  return PromoDismissalSchema.parse(data);
}

