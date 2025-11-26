-- Lifetime Access System Migration
-- Adds lifetime purchase tracking, availability checks, and RPC function
-- Idempotent: safe to run multiple times

-- ============================================================================
-- 1. Add lifetime fields to profiles table
-- ============================================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS lifetime_active BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS lifetime_purchase_at TIMESTAMPTZ DEFAULT NULL;

-- Index for lifetime queries
CREATE INDEX IF NOT EXISTS idx_profiles_lifetime_active 
ON public.profiles(lifetime_active) 
WHERE lifetime_active = true;

-- ============================================================================
-- 2. Create lifetime_purchases table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lifetime_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id) -- One lifetime purchase per profile
);

-- Index for counting queries
CREATE INDEX IF NOT EXISTS idx_lifetime_purchases_created_at 
ON public.lifetime_purchases(created_at);

-- ============================================================================
-- 3. Create view for lifetime purchase count
-- ============================================================================
CREATE OR REPLACE VIEW public.lifetime_purchase_count AS
SELECT count(*)::int AS total 
FROM public.lifetime_purchases;

-- ============================================================================
-- 4. Create RPC function to check availability
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_lifetime_availability()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count int;
BEGIN
  -- Get current count from view
  SELECT total INTO current_count FROM public.lifetime_purchase_count;
  
  -- Return true if under 1000, false otherwise
  RETURN COALESCE(current_count, 0) < 1000;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_lifetime_availability() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lifetime_availability() TO anon;

-- ============================================================================
-- 5. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on lifetime_purchases table
ALTER TABLE public.lifetime_purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own lifetime purchase
CREATE POLICY "Users can insert their own lifetime purchase"
ON public.lifetime_purchases
FOR INSERT
TO authenticated
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can view their own lifetime purchase
CREATE POLICY "Users can view their own lifetime purchase"
ON public.lifetime_purchases
FOR SELECT
TO authenticated
USING (
  profile_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Service role can view all (for webhook processing)
CREATE POLICY "Service role can view all lifetime purchases"
ON public.lifetime_purchases
FOR SELECT
TO service_role
USING (true);

-- Policy: Service role can insert (for webhook processing)
CREATE POLICY "Service role can insert lifetime purchases"
ON public.lifetime_purchases
FOR INSERT
TO service_role
WITH CHECK (true);

-- Grant access to view
GRANT SELECT ON public.lifetime_purchase_count TO authenticated;
GRANT SELECT ON public.lifetime_purchase_count TO anon;

-- ============================================================================
-- 6. Helper function to safely record lifetime purchase
-- ============================================================================
CREATE OR REPLACE FUNCTION public.record_lifetime_purchase(
  p_profile_id UUID,
  p_purchase_timestamp TIMESTAMPTZ DEFAULT NOW()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count int;
  profile_exists boolean;
BEGIN
  -- Check if limit is still available
  SELECT total INTO current_count FROM public.lifetime_purchase_count;
  
  IF COALESCE(current_count, 0) >= 1000 THEN
    -- Limit reached, don't record
    RETURN false;
  END IF;
  
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_profile_id) INTO profile_exists;
  
  IF NOT profile_exists THEN
    RETURN false;
  END IF;
  
  -- Check if user already has lifetime (idempotent)
  IF EXISTS(SELECT 1 FROM public.profiles WHERE id = p_profile_id AND lifetime_active = true) THEN
    RETURN true; -- Already has lifetime, return success
  END IF;
  
  -- Insert purchase record (will fail if duplicate due to UNIQUE constraint)
  BEGIN
    INSERT INTO public.lifetime_purchases (profile_id, created_at)
    VALUES (p_profile_id, p_purchase_timestamp)
    ON CONFLICT (profile_id) DO NOTHING;
    
    -- Update profile
    UPDATE public.profiles
    SET 
      lifetime_active = true,
      lifetime_purchase_at = p_purchase_timestamp
    WHERE id = p_profile_id;
    
    RETURN true;
  EXCEPTION
    WHEN others THEN
      -- Log error but don't throw
      RETURN false;
  END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.record_lifetime_purchase(UUID, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_lifetime_purchase(UUID, TIMESTAMPTZ) TO authenticated;

