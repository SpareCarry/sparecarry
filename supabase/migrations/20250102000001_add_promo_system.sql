-- ============================================================================
-- Migration: Add Promo System
-- Date: 2025-01-02
-- Description: Adds promo status functions and view for Early Supporter Reward
-- ============================================================================

-- ============================================================================
-- 1. Add promo_dismissed_until column to profiles
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS promo_dismissed_until TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_promo_dismissed ON public.profiles(promo_dismissed_until);

-- ============================================================================
-- 2. Create promotion_status view
-- ============================================================================

CREATE OR REPLACE VIEW public.promotion_status AS
SELECT 
  CASE 
    WHEN NOW() < '2026-02-18T00:00:00Z'::timestamp WITH TIME ZONE 
    THEN true 
    ELSE false 
  END as is_active,
  CASE 
    WHEN NOW() < '2026-02-18T00:00:00Z'::timestamp WITH TIME ZONE 
    THEN GREATEST(0, CEIL(EXTRACT(EPOCH FROM ('2026-02-18T00:00:00Z'::timestamp WITH TIME ZONE - NOW())) / 86400))
    ELSE 0 
  END as days_left,
  CASE 
    WHEN NOW() < '2026-02-18T00:00:00Z'::timestamp WITH TIME ZONE 
    THEN 0.0 
    ELSE 0.08 
  END as platform_fee;

-- ============================================================================
-- 3. Create get_active_promotions() RPC function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_active_promotions()
RETURNS TABLE (
  is_active BOOLEAN,
  days_left INTEGER,
  platform_fee DECIMAL(5, 4)
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT 
    CASE 
      WHEN NOW() < '2026-02-18T00:00:00Z'::timestamp WITH TIME ZONE 
      THEN true 
      ELSE false 
    END as is_active,
    CASE 
      WHEN NOW() < '2026-02-18T00:00:00Z'::timestamp WITH TIME ZONE 
      THEN GREATEST(0, CEIL(EXTRACT(EPOCH FROM ('2026-02-18T00:00:00Z'::timestamp WITH TIME ZONE - NOW())) / 86400))::INTEGER
      ELSE 0 
    END as days_left,
    CASE 
      WHEN NOW() < '2026-02-18T00:00:00Z'::timestamp WITH TIME ZONE 
      THEN 0.0 
      ELSE 0.08 
    END as platform_fee;
$$;

-- ============================================================================
-- 4. RLS Policies
-- ============================================================================

-- Promotion status view is readable by everyone
CREATE POLICY "Promotion status is viewable by everyone"
  ON public.promotion_status FOR SELECT
  USING (true);

-- Grant execute on function
GRANT EXECUTE ON FUNCTION public.get_active_promotions() TO authenticated, anon;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

