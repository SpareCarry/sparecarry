-- ============================================================================
-- SAFE MIGRATION SCRIPT
-- ============================================================================
-- This script adds missing columns to existing tables
-- Run this if you have existing tables but missing columns
-- ============================================================================

-- Check and add from_location to trips if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'trips' 
        AND column_name = 'from_location'
    ) THEN
        ALTER TABLE public.trips ADD COLUMN from_location TEXT;
        RAISE NOTICE 'Added from_location column to trips table';
    END IF;
END $$;

-- Check and add to_location to trips if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'trips' 
        AND column_name = 'to_location'
    ) THEN
        ALTER TABLE public.trips ADD COLUMN to_location TEXT;
        RAISE NOTICE 'Added to_location column to trips table';
    END IF;
END $$;

-- Check and add from_location to requests if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'requests' 
        AND column_name = 'from_location'
    ) THEN
        ALTER TABLE public.requests ADD COLUMN from_location TEXT;
        RAISE NOTICE 'Added from_location column to requests table';
    END IF;
END $$;

-- Check and add to_location to requests if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'requests' 
        AND column_name = 'to_location'
    ) THEN
        ALTER TABLE public.requests ADD COLUMN to_location TEXT;
        RAISE NOTICE 'Added to_location column to requests table';
    END IF;
END $$;

-- Check and add from_location to group_buys if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'group_buys' 
        AND column_name = 'from_location'
    ) THEN
        ALTER TABLE public.group_buys ADD COLUMN from_location TEXT;
        RAISE NOTICE 'Added from_location column to group_buys table';
    END IF;
END $$;

-- Check and add to_location to group_buys if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'group_buys' 
        AND column_name = 'to_location'
    ) THEN
        ALTER TABLE public.group_buys ADD COLUMN to_location TEXT;
        RAISE NOTICE 'Added to_location column to group_buys table';
    END IF;
END $$;

-- Create indexes only if they don't exist (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_trips_from_location ON public.trips(from_location);
CREATE INDEX IF NOT EXISTS idx_trips_to_location ON public.trips(to_location);
CREATE INDEX IF NOT EXISTS idx_requests_from_location ON public.requests(from_location);
CREATE INDEX IF NOT EXISTS idx_requests_to_location ON public.requests(to_location);

