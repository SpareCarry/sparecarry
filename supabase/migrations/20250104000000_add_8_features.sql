-- Migration: Add 8 new features
-- 1. Yachtie/Digital Nomad mode
-- 2. Imperial units preference
-- 3. Route match notifications
-- 4. Size tier tracking

-- Add is_boater to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_boater'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN is_boater BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add boat_name to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'boat_name'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN boat_name TEXT;
  END IF;
END $$;

-- Add prefer_imperial_units to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'prefer_imperial_units'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN prefer_imperial_units BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add notify_route_matches to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'notify_route_matches'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN notify_route_matches BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add size_tier to requests
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'requests' 
    AND column_name = 'size_tier'
  ) THEN
    ALTER TABLE public.requests 
    ADD COLUMN size_tier TEXT CHECK (size_tier IN ('small', 'medium', 'large', 'extra_large'));
  END IF;
END $$;

-- Add preferred_currency to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'preferred_currency'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN preferred_currency TEXT DEFAULT 'USD';
  END IF;
END $$;

-- Create index for route match notifications
CREATE INDEX IF NOT EXISTS idx_profiles_notify_route_matches 
ON public.profiles(notify_route_matches) 
WHERE notify_route_matches = true;

-- Create index for size tier
CREATE INDEX IF NOT EXISTS idx_requests_size_tier 
ON public.requests(size_tier);

