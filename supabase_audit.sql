-- ============================================================================
-- SpareCarry Database Audit Script
-- ============================================================================
-- Purpose: Check current state of Supabase database
--          Identify missing tables, columns, policies, functions
--          Suggest SQL statements to create missing items
--
-- Usage: Run this script in Supabase SQL Editor
--        Review output for missing items
--        Apply suggested SQL statements as needed
--
-- Version: 1.0
-- Date: January 2025
-- ============================================================================

-- ============================================================================
-- 1. CHECK TABLES
-- ============================================================================

DO $$
DECLARE
    required_tables TEXT[] := ARRAY[
        'users',
        'profiles',
        'trips',
        'requests',
        'matches',
        'conversations',
        'messages',
        'deliveries',
        'ratings',
        'referrals',
        'group_buys',
        'waitlist',
        'meetup_locations',
        'analytics_events',
        'countries',
        'lifetime_purchases'
    ];
    existing_tables TEXT[];
    missing_tables TEXT[];
    tbl_name TEXT;
BEGIN
    -- Get existing tables
    SELECT ARRAY_AGG(t.table_name::TEXT)
    INTO existing_tables
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE';

    -- Find missing tables
    FOREACH tbl_name IN ARRAY required_tables
    LOOP
        IF NOT (tbl_name = ANY(existing_tables)) THEN
            missing_tables := array_append(missing_tables, tbl_name);
        END IF;
    END LOOP;

    -- Output results
    RAISE NOTICE '=== TABLE AUDIT ===';
    RAISE NOTICE 'Required tables: %', array_length(required_tables, 1);
    RAISE NOTICE 'Existing tables: %', COALESCE(array_length(existing_tables, 1), 0);
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE 'MISSING TABLES: %', missing_tables;
        RAISE NOTICE 'Action: Run supabase/schema.sql to create missing tables';
    ELSE
        RAISE NOTICE '✅ All required tables exist';
    END IF;
END $$;

-- ============================================================================
-- 2. CHECK COLUMNS FOR KEY TABLES
-- ============================================================================

-- Check users table columns
DO $$
DECLARE
    required_columns TEXT[] := ARRAY[
        'id', 'email', 'role', 'stripe_customer_id', 'subscription_status',
        'subscription_current_period_end', 'referral_code', 'referred_by',
        'referral_credits', 'completed_deliveries_count', 'average_rating',
        'total_referrals_count', 'created_at', 'updated_at'
    ];
    existing_columns TEXT[];
    missing_columns TEXT[];
    col_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = 'users') THEN
        SELECT ARRAY_AGG(c.column_name::TEXT)
        INTO existing_columns
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = 'users';

        FOREACH col_name IN ARRAY required_columns
        LOOP
            IF NOT (col_name = ANY(existing_columns)) THEN
                missing_columns := array_append(missing_columns, col_name);
            END IF;
        END LOOP;

        RAISE NOTICE '=== USERS TABLE COLUMNS ===';
        IF array_length(missing_columns, 1) > 0 THEN
            RAISE NOTICE 'MISSING COLUMNS: %', missing_columns;
        ELSE
            RAISE NOTICE '✅ All required columns exist';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  users table does not exist';
    END IF;
END $$;

-- Check requests table columns (location, shipping, premium features)
DO $$
DECLARE
    required_columns TEXT[] := ARRAY[
        'id', 'user_id', 'title', 'description', 'from_location', 'to_location',
        'deadline_earliest', 'deadline_latest', 'max_reward', 'item_photos',
        'dimensions_cm', 'weight_kg', 'value_usd', 'preferred_method',
        'emergency', 'purchase_retailer', 'purchase_link', 'status',
        'created_at', 'updated_at'
    ];
    existing_columns TEXT[];
    missing_columns TEXT[];
    col_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = 'requests') THEN
        SELECT ARRAY_AGG(c.column_name::TEXT)
        INTO existing_columns
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = 'requests';

        FOREACH col_name IN ARRAY required_columns
        LOOP
            IF NOT (col_name = ANY(existing_columns)) THEN
                missing_columns := array_append(missing_columns, col_name);
            END IF;
        END LOOP;

        RAISE NOTICE '=== REQUESTS TABLE COLUMNS ===';
        IF array_length(missing_columns, 1) > 0 THEN
            RAISE NOTICE 'MISSING COLUMNS: %', missing_columns;
        ELSE
            RAISE NOTICE '✅ All required columns exist';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  requests table does not exist';
    END IF;
END $$;

-- Check trips table columns (location, shipping estimator, premium)
DO $$
DECLARE
    required_columns TEXT[] := ARRAY[
        'id', 'user_id', 'type', 'from_location', 'to_location',
        'flight_number', 'departure_date', 'eta_window_start', 'eta_window_end',
        'spare_kg', 'spare_volume_liters', 'max_dimensions', 'can_oversize',
        'status', 'created_at', 'updated_at'
    ];
    existing_columns TEXT[];
    missing_columns TEXT[];
    col_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = 'trips') THEN
        SELECT ARRAY_AGG(c.column_name::TEXT)
        INTO existing_columns
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = 'trips';

        FOREACH col_name IN ARRAY required_columns
        LOOP
            IF NOT (col_name = ANY(existing_columns)) THEN
                missing_columns := array_append(missing_columns, col_name);
            END IF;
        END LOOP;

        RAISE NOTICE '=== TRIPS TABLE COLUMNS ===';
        IF array_length(missing_columns, 1) > 0 THEN
            RAISE NOTICE 'MISSING COLUMNS: %', missing_columns;
        ELSE
            RAISE NOTICE '✅ All required columns exist';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  trips table does not exist';
    END IF;
END $$;

-- Check matches table columns (premium, emergency, restricted items)
DO $$
DECLARE
    required_columns TEXT[] := ARRAY[
        'id', 'trip_id', 'request_id', 'group_buy_id', 'status',
        'reward_amount', 'platform_fee_percent', 'escrow_payment_intent_id',
        'insurance_policy_number', 'insurance_premium', 'conversation_id',
        'delivered_at', 'created_at', 'updated_at'
    ];
    existing_columns TEXT[];
    missing_columns TEXT[];
    col_name TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = 'matches') THEN
        SELECT ARRAY_AGG(c.column_name::TEXT)
        INTO existing_columns
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = 'matches';

        FOREACH col_name IN ARRAY required_columns
        LOOP
            IF NOT (col_name = ANY(existing_columns)) THEN
                missing_columns := array_append(missing_columns, col_name);
            END IF;
        END LOOP;

        RAISE NOTICE '=== MATCHES TABLE COLUMNS ===';
        IF array_length(missing_columns, 1) > 0 THEN
            RAISE NOTICE 'MISSING COLUMNS: %', missing_columns;
        ELSE
            RAISE NOTICE '✅ All required columns exist';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  matches table does not exist';
    END IF;
END $$;

-- ============================================================================
-- 3. CHECK ROW LEVEL SECURITY (RLS)
-- ============================================================================

DO $$
DECLARE
    required_tables TEXT[] := ARRAY[
        'users', 'profiles', 'trips', 'requests', 'matches', 'conversations',
        'messages', 'deliveries', 'ratings', 'referrals', 'group_buys',
        'waitlist', 'meetup_locations', 'analytics_events', 'countries',
        'lifetime_purchases'
    ];
    tables_without_rls TEXT[];
    tbl_name TEXT;
BEGIN
    FOREACH tbl_name IN ARRAY required_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = tbl_name) THEN
            -- Check if RLS is enabled via pg_class
            IF NOT EXISTS (
                SELECT 1 FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public'
                AND c.relname = tbl_name
                AND c.relrowsecurity = true
            ) THEN
                tables_without_rls := array_append(tables_without_rls, tbl_name);
            END IF;
        END IF;
    END LOOP;

    RAISE NOTICE '=== ROW LEVEL SECURITY (RLS) ===';
    IF array_length(tables_without_rls, 1) > 0 THEN
        RAISE NOTICE 'TABLES WITHOUT RLS: %', tables_without_rls;
        RAISE NOTICE 'Action: Run ALTER TABLE statements to enable RLS';
    ELSE
        RAISE NOTICE '✅ RLS enabled on all tables';
    END IF;
END $$;

-- ============================================================================
-- 4. CHECK RLS POLICIES
-- ============================================================================

DO $$
DECLARE
    required_tables TEXT[] := ARRAY[
        'users', 'profiles', 'trips', 'requests', 'matches', 'conversations',
        'messages', 'deliveries', 'ratings', 'referrals', 'group_buys',
        'waitlist', 'meetup_locations'
    ];
    tables_without_policies TEXT[];
    tbl_name TEXT;
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '=== RLS POLICIES ===';
    
    FOREACH tbl_name IN ARRAY required_tables
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_name = tbl_name) THEN
            SELECT COUNT(*)
            INTO policy_count
            FROM pg_policies p
            WHERE p.schemaname = 'public' AND p.tablename = tbl_name;

            IF policy_count = 0 THEN
                tables_without_policies := array_append(tables_without_policies, tbl_name);
            END IF;
        END IF;
    END LOOP;

    IF array_length(tables_without_policies, 1) > 0 THEN
        RAISE NOTICE 'TABLES WITHOUT POLICIES: %', tables_without_policies;
        RAISE NOTICE 'Action: Create policies using CREATE POLICY statements';
    ELSE
        RAISE NOTICE '✅ Policies exist for all tables';
    END IF;
END $$;

-- ============================================================================
-- 5. CHECK DATABASE FUNCTIONS
-- ============================================================================

DO $$
DECLARE
    required_functions TEXT[] := ARRAY[
        'update_updated_at_column',
        'handle_new_user',
        'handle_new_match',
        'add_referral_credit',
        'use_referral_credit',
        'update_user_delivery_stats',
        'check_and_award_trusted_traveller',
        'get_lifetime_purchase_count',
        'get_lifetime_availability',
        'record_lifetime_purchase',
        'handle_user_update',
        'assign_admin_role'
    ];
    existing_functions TEXT[];
    missing_functions TEXT[];
    func_name TEXT;
BEGIN
    SELECT ARRAY_AGG(r.routine_name::TEXT)
    INTO existing_functions
    FROM information_schema.routines r
    WHERE r.routine_schema = 'public'
    AND r.routine_type = 'FUNCTION';

    FOREACH func_name IN ARRAY required_functions
    LOOP
        IF NOT (func_name = ANY(existing_functions)) THEN
            missing_functions := array_append(missing_functions, func_name);
        END IF;
    END LOOP;

    RAISE NOTICE '=== DATABASE FUNCTIONS ===';
    IF array_length(missing_functions, 1) > 0 THEN
        RAISE NOTICE 'MISSING FUNCTIONS: %', missing_functions;
        RAISE NOTICE 'Action: Create functions using CREATE FUNCTION statements';
    ELSE
        RAISE NOTICE '✅ All required functions exist';
    END IF;
END $$;

-- ============================================================================
-- 6. CHECK DATABASE EXTENSIONS
-- ============================================================================

DO $$
DECLARE
    required_extensions TEXT[] := ARRAY['uuid-ossp', 'cube', 'earthdistance'];
    existing_extensions TEXT[];
    missing_extensions TEXT[];
    ext_name TEXT;
BEGIN
    SELECT ARRAY_AGG(e.extname::TEXT)
    INTO existing_extensions
    FROM pg_extension e;

    FOREACH ext_name IN ARRAY required_extensions
    LOOP
        IF NOT (ext_name = ANY(existing_extensions)) THEN
            missing_extensions := array_append(missing_extensions, ext_name);
        END IF;
    END LOOP;

    RAISE NOTICE '=== DATABASE EXTENSIONS ===';
    IF array_length(missing_extensions, 1) > 0 THEN
        RAISE NOTICE 'MISSING EXTENSIONS: %', missing_extensions;
        RAISE NOTICE 'Action: Run CREATE EXTENSION statements';
    ELSE
        RAISE NOTICE '✅ All required extensions exist';
    END IF;
END $$;

-- ============================================================================
-- 7. CHECK INDEXES
-- ============================================================================

DO $$
DECLARE
    required_indexes TEXT[] := ARRAY[
        'idx_users_role', 'idx_users_email',
        'idx_profiles_user_id', 'idx_profiles_stripe_account_id',
        'idx_trips_user_id', 'idx_trips_type', 'idx_trips_from_location',
        'idx_trips_to_location', 'idx_trips_departure_date', 'idx_trips_status',
        'idx_requests_user_id', 'idx_requests_from_location',
        'idx_requests_to_location', 'idx_requests_deadline_latest',
        'idx_requests_status', 'idx_matches_trip_id', 'idx_matches_request_id',
        'idx_matches_status', 'idx_messages_conversation_id',
        'idx_messages_sender_id', 'idx_messages_created_at'
    ];
    existing_indexes TEXT[];
    missing_indexes TEXT[];
    idx_name TEXT;
BEGIN
    SELECT ARRAY_AGG(i.indexname::TEXT)
    INTO existing_indexes
    FROM pg_indexes i
    WHERE i.schemaname = 'public';

    FOREACH idx_name IN ARRAY required_indexes
    LOOP
        IF NOT (idx_name = ANY(existing_indexes)) THEN
            missing_indexes := array_append(missing_indexes, idx_name);
        END IF;
    END LOOP;

    RAISE NOTICE '=== DATABASE INDEXES ===';
    IF array_length(missing_indexes, 1) > 0 THEN
        RAISE NOTICE 'MISSING INDEXES: %', missing_indexes;
        RAISE NOTICE 'Action: Create indexes using CREATE INDEX statements';
    ELSE
        RAISE NOTICE '✅ All required indexes exist';
    END IF;
END $$;

-- ============================================================================
-- 8. CHECK TRIGGERS
-- ============================================================================

DO $$
DECLARE
    required_triggers TEXT[] := ARRAY[
        'update_users_updated_at', 'update_profiles_updated_at',
        'update_trips_updated_at', 'update_requests_updated_at',
        'update_matches_updated_at', 'update_conversations_updated_at',
        'update_deliveries_updated_at', 'on_auth_user_created',
        'on_match_created', 'update_delivery_stats_trigger'
    ];
    existing_triggers TEXT[];
    missing_triggers TEXT[];
    trigger_name TEXT;
BEGIN
    SELECT ARRAY_AGG(t.trigger_name::TEXT)
    INTO existing_triggers
    FROM information_schema.triggers t
    WHERE t.trigger_schema = 'public';

    FOREACH trigger_name IN ARRAY required_triggers
    LOOP
        IF NOT (trigger_name = ANY(existing_triggers)) THEN
            missing_triggers := array_append(missing_triggers, trigger_name);
        END IF;
    END LOOP;

    RAISE NOTICE '=== DATABASE TRIGGERS ===';
    IF array_length(missing_triggers, 1) > 0 THEN
        RAISE NOTICE 'MISSING TRIGGERS: %', missing_triggers;
        RAISE NOTICE 'Action: Create triggers using CREATE TRIGGER statements';
    ELSE
        RAISE NOTICE '✅ All required triggers exist';
    END IF;
END $$;

-- ============================================================================
-- 9. CHECK STORAGE BUCKETS
-- ============================================================================

DO $$
DECLARE
    required_buckets TEXT[] := ARRAY['item-photos', 'avatars', 'delivery-proof'];
    existing_buckets TEXT[];
    missing_buckets TEXT[];
    bucket_name TEXT;
BEGIN
    -- Note: This requires storage API access
    -- For manual check, use Supabase Dashboard → Storage
    
    RAISE NOTICE '=== STORAGE BUCKETS ===';
    RAISE NOTICE 'Required buckets: item-photos, avatars, delivery-proof';
    RAISE NOTICE 'Action: Check Supabase Dashboard → Storage';
    RAISE NOTICE 'Or run: supabase/storage-setup.sql';
END $$;

-- ============================================================================
-- 10. SUMMARY REPORT (as table for visibility)
-- ============================================================================

-- Create a summary table view
CREATE OR REPLACE VIEW audit_summary AS
WITH required_tables AS (
    SELECT unnest(ARRAY['users', 'profiles', 'trips', 'requests', 'matches', 'conversations', 'messages', 'deliveries', 'ratings', 'referrals', 'group_buys', 'waitlist', 'meetup_locations', 'analytics_events', 'countries', 'lifetime_purchases']) as table_name
),
existing_tables AS (
    SELECT t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
),
table_count AS (
    SELECT COUNT(*) as count
    FROM required_tables rt
    WHERE EXISTS (
        SELECT 1 FROM existing_tables et WHERE et.table_name = rt.table_name
    )
)
SELECT 
    'Tables' as category,
    (SELECT count FROM table_count) as existing_count,
    16 as required_count,
    CASE 
        WHEN (SELECT count FROM table_count) = 16 THEN '✅ Complete'
        ELSE '⚠️ Missing items'
    END as status
UNION ALL
SELECT 
    'RLS Policies' as category,
    COUNT(DISTINCT p.tablename) as existing_count,
    13 as required_count,
    CASE 
        WHEN COUNT(DISTINCT p.tablename) >= 13 THEN '✅ Complete'
        ELSE '⚠️ Missing policies'
    END as status
FROM pg_policies p
WHERE p.schemaname = 'public'
UNION ALL
SELECT 
    'Functions' as category,
    COUNT(*) FILTER (WHERE r.routine_name = ANY(ARRAY['update_updated_at_column', 'handle_new_user', 'handle_new_match', 'add_referral_credit', 'use_referral_credit', 'update_user_delivery_stats', 'check_and_award_trusted_traveller', 'get_lifetime_purchase_count', 'get_lifetime_availability', 'record_lifetime_purchase', 'handle_user_update', 'assign_admin_role'])) as existing_count,
    12 as required_count,
    CASE 
        WHEN COUNT(*) FILTER (WHERE r.routine_name = ANY(ARRAY['update_updated_at_column', 'handle_new_user', 'handle_new_match', 'add_referral_credit', 'use_referral_credit', 'update_user_delivery_stats', 'check_and_award_trusted_traveller', 'get_lifetime_purchase_count', 'get_lifetime_availability', 'record_lifetime_purchase', 'handle_user_update', 'assign_admin_role'])) = 12 THEN '✅ Complete'
        ELSE '⚠️ Missing functions'
    END as status
FROM information_schema.routines r
WHERE r.routine_schema = 'public'
UNION ALL
SELECT 
    'Extensions' as category,
    COUNT(*) FILTER (WHERE e.extname = ANY(ARRAY['uuid-ossp', 'cube', 'earthdistance'])) as existing_count,
    3 as required_count,
    CASE 
        WHEN COUNT(*) FILTER (WHERE e.extname = ANY(ARRAY['uuid-ossp', 'cube', 'earthdistance'])) = 3 THEN '✅ Complete'
        ELSE '⚠️ Missing extensions'
    END as status
FROM pg_extension e;

-- Display summary
SELECT * FROM audit_summary ORDER BY category;

-- ============================================================================
-- 11. FINAL SUMMARY NOTICES
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== AUDIT COMPLETE ===';
    RAISE NOTICE 'Check the summary table above for status of each category.';
    RAISE NOTICE '';
    RAISE NOTICE 'To fix missing items:';
    RAISE NOTICE '1. Run supabase/schema.sql for tables, columns, policies, functions';
    RAISE NOTICE '2. Run supabase/storage-setup.sql for storage buckets';
    RAISE NOTICE '3. Run individual migration files if needed';
    RAISE NOTICE '';
    RAISE NOTICE 'For detailed setup instructions, see:';
    RAISE NOTICE '- SpareCarry_SetupChecklist.md';
    RAISE NOTICE '- SpareCarry_CompleteAppOverview.md';
END $$;

-- ============================================================================
-- 11. SUGGESTED SQL STATEMENTS (if items are missing)
-- ============================================================================

-- Example: Enable RLS on a table (if missing)
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Example: Create a missing index (if missing)
-- CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Example: Create a missing function (if missing)
-- See supabase/schema.sql for function definitions

-- Example: Create a missing column (if missing)
-- ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS emergency BOOLEAN DEFAULT false;

-- ============================================================================
-- END OF AUDIT SCRIPT
-- ============================================================================

