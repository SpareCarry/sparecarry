-- Migration Check Script
-- This script checks what already exists and only creates what's missing
-- Run this FIRST to see what needs to be created/updated

-- Check if trips table exists and what columns it has
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'trips'
ORDER BY ordinal_position;

-- Check if requests table exists and what columns it has
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'requests'
ORDER BY ordinal_position;

-- Check if all required tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

