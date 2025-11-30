-- Fix Function Search Path Warnings
-- Sets explicit search_path for all functions to prevent security issues
-- Also moves extensions from public schema to extensions schema

-- ============================================================================
-- 1. Fix update_updated_at_column function
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. Fix handle_new_user function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, 'requester');
    
    INSERT INTO public.profiles (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. Fix handle_new_match function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_match()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.conversations (match_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. Fix add_referral_credit function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.add_referral_credit(user_id UUID, amount DECIMAL)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.users
  SET referral_credits = referral_credits + amount
  WHERE id = user_id;
END;
$$;

-- ============================================================================
-- 5. Fix use_referral_credit function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.use_referral_credit(user_id UUID, amount DECIMAL)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_balance DECIMAL;
BEGIN
  SELECT referral_credits INTO current_balance
  FROM public.users
  WHERE id = user_id;
  
  IF current_balance IS NULL OR current_balance < amount THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.users
  SET referral_credits = referral_credits - amount
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$;

-- ============================================================================
-- 6. Fix update_user_delivery_stats function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_user_delivery_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Update requester stats
    UPDATE public.users
    SET completed_deliveries_count = completed_deliveries_count + 1
    WHERE id = (SELECT user_id FROM public.requests WHERE id = NEW.request_id);
    
    -- Update traveler stats
    UPDATE public.users
    SET completed_deliveries_count = completed_deliveries_count + 1
    WHERE id = (SELECT user_id FROM public.trips WHERE id = NEW.trip_id);
    
    -- Update average rating (if ratings exist)
    UPDATE public.users u
    SET average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM public.ratings r
      JOIN public.matches m ON m.id = r.match_id
      WHERE (m.request_id IN (SELECT id FROM public.requests WHERE user_id = u.id)
        OR m.trip_id IN (SELECT id FROM public.trips WHERE user_id = u.id))
    )
    WHERE id IN (
      SELECT user_id FROM public.requests WHERE id = NEW.request_id
      UNION
      SELECT user_id FROM public.trips WHERE id = NEW.trip_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 7. Fix check_and_award_trusted_traveller function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_and_award_trusted_traveller()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  badge_uuid UUID;
BEGIN
  -- Get the trusted_traveller badge ID
  SELECT id INTO badge_uuid FROM public.badges WHERE slug = 'trusted_traveller' LIMIT 1;
  
  -- Check if user already has the badge
  IF NOT EXISTS (
    SELECT 1 FROM public.user_badges 
    WHERE user_id = NEW.user_id AND badge_id = badge_uuid
  ) THEN
    -- If completed_jobs_count >= 3, award the badge
    IF NEW.completed_jobs_count >= 3 THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (NEW.user_id, badge_uuid)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 8. Fix handle_user_update function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.users
    SET
        email = NEW.email,
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- 9. Fix assign_admin_role function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.assign_admin_role(user_email TEXT)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role
    FROM public.users
    WHERE id = auth.uid();
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can assign admin role';
    END IF;
    
    -- Assign admin role
    UPDATE public.users
    SET role = 'admin'
    WHERE email = user_email;
    
    RETURN TRUE;
END;
$$;

-- ============================================================================
-- 10. Fix get_lifetime_purchase_count function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_lifetime_purchase_count()
RETURNS TABLE(total int)
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT count(*)::int AS total 
  FROM public.lifetime_purchases;
$$;

-- ============================================================================
-- 11. Fix get_lifetime_availability function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_lifetime_availability()
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_count int;
BEGIN
  -- Get current count from function (more direct, avoids view)
  SELECT total INTO current_count FROM public.get_lifetime_purchase_count();
  
  -- Return true if under 100, false otherwise
  RETURN COALESCE(current_count, 0) < 100;
END;
$$;

-- ============================================================================
-- 12. Fix record_lifetime_purchase function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.record_lifetime_purchase(
  p_profile_id UUID,
  p_purchase_timestamp TIMESTAMPTZ DEFAULT NOW()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_count int;
  profile_exists boolean;
BEGIN
  -- Check if limit is still available (use function directly)
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

-- ============================================================================
-- 13. Move extensions from public schema to extensions schema
-- ============================================================================
-- Note: Extensions cannot be easily moved once created. The recommended approach
-- is to drop and recreate them in the extensions schema, but this may cause
-- data loss. For now, we'll document this as a known issue.
-- 
-- To properly fix this, you would need to:
-- 1. Drop the extensions (if not in use)
-- 2. Create extensions schema: CREATE SCHEMA IF NOT EXISTS extensions;
-- 3. Recreate extensions in extensions schema: CREATE EXTENSION cube SCHEMA extensions;
-- 
-- However, if these extensions are already in use, this migration will fail.
-- Check if extensions are actually being used before running this.

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Attempt to move cube extension (will fail if in use - comment out if needed)
-- DROP EXTENSION IF EXISTS cube CASCADE;
-- CREATE EXTENSION IF NOT EXISTS cube SCHEMA extensions;

-- Attempt to move earthdistance extension (will fail if in use - comment out if needed)
-- DROP EXTENSION IF EXISTS earthdistance CASCADE;
-- CREATE EXTENSION IF NOT EXISTS earthdistance SCHEMA extensions;

-- Note: The extension warnings are informational. If the extensions are not actively
-- being used in your queries, you can safely ignore these warnings or manually
-- move them during a maintenance window when the database is not in use.

