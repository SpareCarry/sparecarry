-- Update Lifetime Access Limit from 1000 to 100
-- This migration updates all database functions to use the new limit

-- ============================================================================
-- 1. Update get_lifetime_availability() function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_lifetime_availability()
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  current_count int;
BEGIN
  -- Get current count from function
  SELECT total INTO current_count FROM public.get_lifetime_purchase_count();
  
  -- Return true if under 100, false otherwise
  RETURN COALESCE(current_count, 0) < 100;
END;
$$;

-- ============================================================================
-- 2. Update record_lifetime_purchase() function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.record_lifetime_purchase(
  p_profile_id UUID,
  p_purchase_timestamp TIMESTAMPTZ DEFAULT NOW()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  current_count int;
  profile_exists boolean;
BEGIN
  -- Check if limit is still available
  SELECT total INTO current_count FROM public.get_lifetime_purchase_count();
  
  IF COALESCE(current_count, 0) >= 100 THEN
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

