-- Migration Status Check Script
-- Run this in Supabase SQL Editor to see which migrations have been applied
-- This helps you identify where to continue after a connection error

-- ============================================================================
-- 1. Check Core Tables (001_initial_schema.sql)
-- ============================================================================
SELECT 
  'Core Tables' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') 
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trips')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'requests')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'matches')
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END as status;

-- ============================================================================
-- 2. Check Location Fields (add-location-fields.sql)
-- ============================================================================
SELECT 
  'Location Fields' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'trips' 
      AND column_name = 'departure_location'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'requests' 
      AND column_name = 'departure_location'
    )
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END as status;

-- ============================================================================
-- 3. Check Lifetime Pro Fields (add-lifetime-pro.sql)
-- ============================================================================
SELECT 
  'Lifetime Pro Fields' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'lifetime_pro'
    )
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END as status;

-- ============================================================================
-- 4. Check Supporter Tier Fields (add-supporter-tier.sql)
-- ============================================================================
SELECT 
  'Supporter Tier Fields' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'supporter_status'
    )
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END as status;

-- ============================================================================
-- 5. Check Lifetime Access System (add-lifetime-access-system.sql)
-- ============================================================================
SELECT 
  'Lifetime Access System' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'lifetime_purchases'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'lifetime_active'
    )
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END as status;

-- ============================================================================
-- 6. Check Referrals (005_create_referrals.sql)
-- ============================================================================
SELECT 
  'Referrals Table' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'referrals'
    )
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END as status;

-- ============================================================================
-- 7. Check Group Buys (006_add_group_buys_waitlist.sql)
-- ============================================================================
SELECT 
  'Group Buys & Waitlist' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'group_buys'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'waitlist'
    )
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END as status;

-- ============================================================================
-- 8. Check Preferred Methods Fix (fix-rls-add-preferred-methods.sql)
-- ============================================================================
SELECT 
  'Preferred Methods Constraint' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      AND table_name = 'requests' 
      AND constraint_name = 'requests_preferred_method_check'
    )
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END as status;

-- ============================================================================
-- 9. Check Tier 1 Features (tier1_schema.sql)
-- ============================================================================
SELECT 
  'Tier 1 Features' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'badges'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_badges'
    )
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END as status;

-- ============================================================================
-- 10. List All Public Tables (Overview)
-- ============================================================================
SELECT 
  'All Public Tables' as check_type,
  string_agg(table_name, ', ' ORDER BY table_name) as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- ============================================================================
-- 11. Check Extensions
-- ============================================================================
SELECT 
  'Extensions' as check_type,
  string_agg(extname, ', ' ORDER BY extname) as status
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'cube', 'earthdistance', 'postgis');

