-- Quick Migration Status Check - All Results in One Query
-- Run this to see the complete status of all migrations

SELECT 
  'Core Tables (001_initial_schema)' as migration,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') 
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trips')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'requests')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'matches')
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END as status

UNION ALL

SELECT 
  'Location Fields (add-location-fields)',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'departure_location'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'requests' AND column_name = 'departure_location'
    )
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END

UNION ALL

SELECT 
  'Lifetime Pro (add-lifetime-pro)',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'lifetime_pro'
    )
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END

UNION ALL

SELECT 
  'Supporter Tier (add-supporter-tier)',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'supporter_status'
    )
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END

UNION ALL

SELECT 
  'Lifetime Access System (add-lifetime-access-system)',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'lifetime_purchases'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'lifetime_active'
    )
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END

UNION ALL

SELECT 
  'Referrals (005_create_referrals)',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'referrals'
    )
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END

UNION ALL

SELECT 
  'Group Buys & Waitlist (006_add_group_buys_waitlist)',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'group_buys'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'waitlist'
    )
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END

UNION ALL

SELECT 
  'Preferred Methods Fix (fix-rls-add-preferred-methods)',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_schema = 'public' 
      AND table_name = 'requests' 
      AND constraint_name = 'requests_preferred_method_check'
    )
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END

UNION ALL

SELECT 
  'Tier 1 Features (tier1_schema)',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'badges'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'user_badges'
    )
    THEN '✅ Applied'
    ELSE '❌ Not Applied'
  END

ORDER BY migration;

