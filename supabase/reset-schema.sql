-- ============================================================================
-- RESET SCHEMA - DANGER: This will DROP ALL TABLES AND DATA!
-- ============================================================================
-- ⚠️  WARNING: This will DELETE ALL DATA in your database!
-- ⚠️  Only run this if you want to start fresh or are in development!
-- ⚠️  Make a backup first if you have important data!
-- ============================================================================

-- Disable RLS temporarily
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.group_buys DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.meetup_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.waitlist DISABLE ROW LEVEL SECURITY;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS public.deliveries CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.ratings CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.requests CASCADE;
DROP TABLE IF EXISTS public.group_buys CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.meetup_locations CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.waitlist CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_trips_updated_at ON public.trips;
DROP TRIGGER IF EXISTS update_group_buys_updated_at ON public.group_buys;
DROP TRIGGER IF EXISTS update_requests_updated_at ON public.requests;
DROP TRIGGER IF EXISTS update_referrals_updated_at ON public.referrals;
DROP TRIGGER IF EXISTS update_matches_updated_at ON public.matches;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
DROP TRIGGER IF EXISTS update_deliveries_updated_at ON public.deliveries;
DROP TRIGGER IF EXISTS update_meetup_locations_updated_at ON public.meetup_locations;

-- Now run the full schema.sql to recreate everything fresh

