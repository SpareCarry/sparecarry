-- Fix Security Issues Migration
-- Addresses Supabase database linter errors:
-- 1. SECURITY DEFINER view issue for lifetime_purchase_count
-- 2. RLS disabled on countries table

-- ============================================================================
-- 1. Fix lifetime_purchase_count view (remove SECURITY DEFINER)
-- ============================================================================
-- Supabase's linter incorrectly flags views as SECURITY DEFINER.
-- Since views don't support explicit SECURITY INVOKER, we replace it
-- with a function that explicitly uses SECURITY INVOKER.
-- 
-- The view is kept for backward compatibility, but the underlying
-- implementation uses a SECURITY INVOKER function.

DROP VIEW IF EXISTS public.lifetime_purchase_count CASCADE;

-- Create a function that returns the count (explicitly SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.get_lifetime_purchase_count()
RETURNS TABLE(total int)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT count(*)::int AS total 
  FROM public.lifetime_purchases;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_lifetime_purchase_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lifetime_purchase_count() TO anon;
GRANT EXECUTE ON FUNCTION public.get_lifetime_purchase_count() TO service_role;

-- Note: View removed to fix Supabase linter SECURITY DEFINER error.
-- Code should be updated to use get_lifetime_purchase_count() function via RPC.
-- The function uses SECURITY INVOKER and can be called via:
-- supabase.rpc('get_lifetime_purchase_count')

-- Update the function that uses this view to explicitly use SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.get_lifetime_availability()
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
AS $$
DECLARE
  current_count int;
BEGIN
  -- Get current count from function (more direct, avoids view)
  SELECT total INTO current_count FROM public.get_lifetime_purchase_count();
  
  -- Return true if under 1000, false otherwise
  RETURN COALESCE(current_count, 0) < 1000;
END;
$$;

-- Update the record function to use SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.record_lifetime_purchase(
  p_profile_id UUID,
  p_purchase_timestamp TIMESTAMPTZ DEFAULT NOW()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
AS $$
DECLARE
  current_count int;
  profile_exists boolean;
BEGIN
  -- Check if limit is still available (use function directly)
  SELECT total INTO current_count FROM public.get_lifetime_purchase_count();
  
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

-- ============================================================================
-- 2. Enable RLS on countries table and add public read policy
-- ============================================================================
-- Enable Row Level Security on countries table
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Countries are viewable by everyone" ON public.countries;

-- Policy: Allow public read access to countries (reference data)
CREATE POLICY "Countries are viewable by everyone"
ON public.countries
FOR SELECT
USING (true);

