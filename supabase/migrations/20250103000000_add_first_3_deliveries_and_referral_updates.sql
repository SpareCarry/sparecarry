-- Migration: First 3 Deliveries Free + $25 Referral Credit Updates
-- Adds completed_deliveries to profiles and referral_credit_cents
-- Updates referral logic to award $25 on first paid delivery only

-- Add completed_deliveries to profiles if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'completed_deliveries'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN completed_deliveries INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add referral_credit_cents to profiles if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'referral_credit_cents'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN referral_credit_cents INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add first_paid_delivery_completed_at to referrals table if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'referrals' 
    AND column_name = 'first_paid_delivery_completed_at'
  ) THEN
    ALTER TABLE public.referrals 
    ADD COLUMN first_paid_delivery_completed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Sync completed_deliveries from users to profiles
UPDATE public.profiles p
SET completed_deliveries = COALESCE(u.completed_deliveries_count, 0)
FROM public.users u
WHERE p.user_id = u.id;

-- Function to update completed_deliveries in profiles when users.completed_deliveries_count changes
CREATE OR REPLACE FUNCTION sync_completed_deliveries_to_profiles()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.completed_deliveries_count IS DISTINCT FROM NEW.completed_deliveries_count) THEN
    UPDATE public.profiles
    SET completed_deliveries = NEW.completed_deliveries_count
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS sync_completed_deliveries_trigger ON public.users;
CREATE TRIGGER sync_completed_deliveries_trigger
  AFTER UPDATE OF completed_deliveries_count ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_completed_deliveries_to_profiles();

-- Update the delivery stats function to also update profiles.completed_deliveries
CREATE OR REPLACE FUNCTION update_user_delivery_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update requester stats
    UPDATE public.users
    SET completed_deliveries_count = completed_deliveries_count + 1
    WHERE id = (SELECT user_id FROM public.requests WHERE id = NEW.request_id);
    
    -- Update traveler stats
    UPDATE public.users
    SET completed_deliveries_count = completed_deliveries_count + 1
    WHERE id = (SELECT user_id FROM public.trips WHERE id = NEW.trip_id);
    
    -- Update profiles.completed_deliveries for requester
    UPDATE public.profiles
    SET completed_deliveries = completed_deliveries + 1
    WHERE user_id = (SELECT user_id FROM public.requests WHERE id = NEW.request_id);
    
    -- Update profiles.completed_deliveries for traveler
    UPDATE public.profiles
    SET completed_deliveries = completed_deliveries + 1
    WHERE user_id = (SELECT user_id FROM public.trips WHERE id = NEW.trip_id);
    
    -- Update average rating (if ratings exist)
    UPDATE public.users u
    SET average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM public.ratings r
      WHERE r.ratee_id = u.id
    )
    WHERE u.id IN (
      SELECT user_id FROM public.requests WHERE id = NEW.request_id
      UNION
      SELECT user_id FROM public.trips WHERE id = NEW.trip_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to process referral credits on first paid delivery
CREATE OR REPLACE FUNCTION process_referral_credits_on_paid_delivery()
RETURNS TRIGGER AS $$
DECLARE
  traveler_user_id UUID;
  requester_user_id UUID;
  traveler_profile RECORD;
  requester_profile RECORD;
  platform_fee_amount NUMERIC;
  reward_amount NUMERIC;
  is_traveler_first_paid BOOLEAN;
  is_requester_first_paid BOOLEAN;
BEGIN
  -- Only process when match is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get user IDs
    SELECT user_id INTO traveler_user_id FROM public.trips WHERE id = NEW.trip_id;
    SELECT user_id INTO requester_user_id FROM public.requests WHERE id = NEW.request_id;
    
    -- Get reward amount
    reward_amount := NEW.reward_amount;
    
    -- Calculate platform fee (simplified - actual calculation happens in app)
    -- For now, we'll check if this is their first paid delivery by checking completed_deliveries
    -- The app will pass platform_fee > 0 to indicate it's a paid delivery
    
    -- Get profiles
    SELECT * INTO traveler_profile FROM public.profiles WHERE user_id = traveler_user_id;
    SELECT * INTO requester_profile FROM public.profiles WHERE user_id = requester_user_id;
    
    -- Check if this is first paid delivery
    -- The trigger runs AFTER update_user_delivery_stats, which increments completed_deliveries
    -- So when this trigger runs:
    -- - If they just completed delivery #1, completed_deliveries = 1 (free)
    -- - If they just completed delivery #2, completed_deliveries = 2 (free)
    -- - If they just completed delivery #3, completed_deliveries = 3 (free)
    -- - If they just completed delivery #4, completed_deliveries = 4 (first paid!)
    -- So we check if completed_deliveries = 4 to detect first paid delivery
    is_traveler_first_paid := (traveler_profile.completed_deliveries = 4);
    is_requester_first_paid := (requester_profile.completed_deliveries = 4);
    
    -- Process referral credits for traveler (if they have a referrer and this is first paid)
    IF is_traveler_first_paid AND traveler_user_id IS NOT NULL THEN
      -- Check if traveler was referred
      IF EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = traveler_user_id AND referred_by IS NOT NULL
      ) THEN
        DECLARE
          traveler_referrer_id UUID;
        BEGIN
          SELECT referred_by INTO traveler_referrer_id 
          FROM public.users WHERE id = traveler_user_id;
          
          IF traveler_referrer_id IS NOT NULL THEN
            -- Award $25 (2500 cents) to both traveler and referrer
            UPDATE public.profiles
            SET referral_credit_cents = referral_credit_cents + 2500
            WHERE user_id = traveler_user_id;
            
            UPDATE public.profiles
            SET referral_credit_cents = referral_credit_cents + 2500
            WHERE user_id = traveler_referrer_id;
          END IF;
        END;
      END IF;
    END IF;
    
    -- Process referral credits for requester (if they have a referrer and this is first paid)
    IF is_requester_first_paid AND requester_user_id IS NOT NULL THEN
      -- Check if requester was referred
      IF EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = requester_user_id AND referred_by IS NOT NULL
      ) THEN
        DECLARE
          requester_referrer_id UUID;
        BEGIN
          SELECT referred_by INTO requester_referrer_id 
          FROM public.users WHERE id = requester_user_id;
          
          IF requester_referrer_id IS NOT NULL THEN
            -- Award $25 (2500 cents) to both requester and referrer
            UPDATE public.profiles
            SET referral_credit_cents = referral_credit_cents + 2500
            WHERE user_id = requester_user_id;
            
            UPDATE public.profiles
            SET referral_credit_cents = referral_credit_cents + 2500
            WHERE user_id = requester_referrer_id;
          END IF;
        END;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for referral credits (runs after delivery stats update)
DROP TRIGGER IF EXISTS process_referral_credits_trigger ON public.matches;
CREATE TRIGGER process_referral_credits_trigger
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION process_referral_credits_on_paid_delivery();

-- Function to add referral credit cents to profiles
CREATE OR REPLACE FUNCTION add_referral_credit_cents(user_id UUID, amount_cents INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET referral_credit_cents = COALESCE(referral_credit_cents, 0) + amount_cents
  WHERE profiles.user_id = add_referral_credit_cents.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

