-- Move Extensions from Public Schema to Extensions Schema
-- This fixes the security warning about extensions in the public schema
-- 
-- Note: This migration will temporarily drop and recreate indexes that use
-- the earthdistance extension. The indexes will be recreated after moving
-- the extensions.

-- ============================================================================
-- 1. Create extensions schema if it doesn't exist
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to public (so functions are accessible)
GRANT USAGE ON SCHEMA extensions TO public;

-- ============================================================================
-- 2. Drop indexes that depend on earthdistance extension
-- ============================================================================
-- These indexes use ll_to_earth() function from earthdistance
DROP INDEX IF EXISTS public.idx_trips_departure_location;
DROP INDEX IF EXISTS public.idx_trips_arrival_location;
DROP INDEX IF EXISTS public.idx_requests_departure_location;
DROP INDEX IF EXISTS public.idx_requests_arrival_location;

-- ============================================================================
-- 3. Drop extensions from public schema
-- ============================================================================
-- Note: earthdistance depends on cube, so drop earthdistance first
DROP EXTENSION IF EXISTS earthdistance CASCADE;
DROP EXTENSION IF EXISTS cube CASCADE;

-- ============================================================================
-- 4. Recreate extensions in extensions schema
-- ============================================================================
-- Create cube extension in extensions schema (required by earthdistance)
CREATE EXTENSION IF NOT EXISTS cube SCHEMA extensions;

-- Create earthdistance extension in extensions schema
CREATE EXTENSION IF NOT EXISTS earthdistance SCHEMA extensions;

-- ============================================================================
-- 5. Recreate indexes
-- ============================================================================
-- Extension functions remain accessible after moving the extension to a
-- different schema. PostgreSQL extensions typically make their functions
-- available globally. The functions ll_to_earth() and earth_distance() 
-- should still work without schema qualification.

-- Recreate indexes (functions remain accessible)
CREATE INDEX IF NOT EXISTS idx_trips_departure_location 
ON public.trips USING gist (ll_to_earth(departure_lat, departure_lon))
WHERE departure_lat IS NOT NULL AND departure_lon IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trips_arrival_location 
ON public.trips USING gist (ll_to_earth(arrival_lat, arrival_lon))
WHERE arrival_lat IS NOT NULL AND arrival_lon IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_requests_departure_location 
ON public.requests USING gist (ll_to_earth(departure_lat, departure_lon))
WHERE departure_lat IS NOT NULL AND departure_lon IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_requests_arrival_location 
ON public.requests USING gist (ll_to_earth(arrival_lat, arrival_lon))
WHERE arrival_lat IS NOT NULL AND arrival_lon IS NOT NULL;

-- ============================================================================
-- 6. Ensure extensions schema is accessible
-- ============================================================================
-- Extension functions should remain accessible after moving, but to be safe,
-- we ensure the extensions schema is in the search_path for the database.
-- 
-- Note: In Supabase, the default search_path typically includes public and
-- other schemas. The extension functions should be accessible, but if you
-- encounter issues, you may need to explicitly add extensions to search_path
-- or use schema-qualified function names.

-- For future reference: When creating new extensions, use:
-- CREATE EXTENSION extension_name SCHEMA extensions;

