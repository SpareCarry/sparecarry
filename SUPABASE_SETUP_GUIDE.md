# Supabase Schema Setup Guide

## Problem: Column "from_location" does not exist

This error occurs when your database has existing tables that don't match the full schema. Here's how to fix it:

## Option 1: Check What Exists (Recommended First Step)

1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/migration-check.sql` to see what tables and columns already exist
3. This will show you what's missing

## Option 2: Safe Migration (If you have existing data)

If you have existing data you want to keep:

1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/safe-migration.sql`
3. This will add missing columns without deleting data
4. Then try running the full `schema.sql` again

## Option 3: Reset and Start Fresh (Development Only)

⚠️ **WARNING: This will DELETE ALL DATA!**

Only use this if:
- You're in development and don't have important data
- You want to start completely fresh
- You've made a backup first

Steps:
1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/reset-schema.sql` (this drops all tables)
3. Then run `supabase/schema.sql` (this creates everything fresh)

## Option 4: Step-by-Step Creation

If you want more control, create tables one at a time:

1. First, create base tables (users, profiles)
2. Then create dependent tables (trips, requests)
3. Then create indexes
4. Then create RLS policies
5. Then create triggers and functions

## Recommended Approach

**For Development:**
- Use Option 3 (Reset) if you don't have important data
- Clean slate, everything works

**For Production or with existing data:**
- Use Option 1 first to check what exists
- Use Option 2 to add missing columns
- Then run the full schema.sql

## Common Issues

### Issue: "column X does not exist"
**Solution:** The table exists but is missing that column. Run `safe-migration.sql` first.

### Issue: "relation X already exists"
**Solution:** The table already exists. Use `CREATE TABLE IF NOT EXISTS` (which is already in schema.sql).

### Issue: "foreign key constraint fails"
**Solution:** Tables are being created in wrong order. The fixed schema.sql has the correct order now.

## Need Help?

1. Run `migration-check.sql` and share the results
2. I can create a custom migration based on what you have
3. Or use the reset script if you're okay losing data

## Direct Database Connection

Unfortunately, I cannot directly connect to your Supabase database. However, I can:
- Create migration scripts based on what you tell me exists
- Help debug errors from SQL queries you run
- Provide step-by-step instructions

To help me create a custom migration:
1. Run `migration-check.sql`
2. Share the output with me
3. I'll create a custom migration script for you

