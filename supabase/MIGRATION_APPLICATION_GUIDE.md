# Supabase Migration Application Guide

## Migration Order (Apply in this sequence)

Apply these migrations **one at a time** in the Supabase SQL Editor. Wait for each to complete successfully before moving to the next.

### Core Schema Migrations (Required First)

1. **001_initial_schema.sql** - Creates core tables (users, trips, requests, matches, messages, disputes, payments)
2. **002_rls_policies.sql** - Sets up Row Level Security policies
3. **003_seed_data.sql** - Optional: Adds test data
4. **004_auth_integration.sql** - Auth triggers and functions

### Feature Migrations (Can be applied in any order after core)

5. **005_create_referrals.sql** - Referral system
6. **006_add_group_buys_waitlist.sql** - Group buys and waitlist features
7. **add-supporter-tier.sql** - Supporter subscription tier
8. **add-lifetime-access-system.sql** - Lifetime access system (uses profiles table)
9. **add-lifetime-pro.sql** - Lifetime Pro tier (uses users table)
10. **add-location-fields.sql** - Location fields for trips and requests
11. **fix-rls-add-preferred-methods.sql** - Fixes RLS and adds preferred method options

### Tier 1 Features (Optional)

12. **tier1_schema.sql** - Badges, photos, safety scores, traveller stats

---

## How to Apply Migrations

### Step 1: Open Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"** button

### Step 2: Apply Each Migration

For each migration file:

1. Open the migration file from `supabase/migrations/`
2. **Copy the entire contents** (Ctrl+A, Ctrl+C)
3. **Paste into SQL Editor** (Ctrl+V)
4. Click **"Run"** button (or press Ctrl+Enter)
5. **Wait for success message** - Look for green checkmark or "Success" message
6. **Check for errors** - If you see red error messages, note them down

### Step 3: Verify After Each Migration

After running each migration, verify it worked:

- Check the **Table Editor** to see if new tables/columns were created
- Look for any error messages in the SQL Editor output
- If you see "relation already exists" - that's OK, the migration is idempotent

---

## Troubleshooting Connection Errors

### If you get "Connection failed" error:

1. **Check your internet connection**
   - Make sure you have a stable internet connection
   - Try refreshing the Supabase dashboard

2. **Verify Supabase project is accessible**
   - Go to your Supabase project dashboard
   - Check if the project is active (not paused)
   - Verify you're logged in with the correct account

3. **Try smaller chunks**
   - If a migration is very large, try splitting it into smaller parts
   - Run one section at a time (e.g., just the ALTER TABLE statements first)

4. **Check for syntax errors**
   - Make sure you copied the entire file
   - Check for any missing semicolons
   - Verify no text was cut off when copying

5. **Wait and retry**
   - Sometimes Supabase has temporary connection issues
   - Wait 30-60 seconds and try again
   - Close and reopen the SQL Editor

6. **Use Supabase CLI (Alternative)**
   ```bash
   # If you have Supabase CLI installed
   supabase db push
   ```

### If you get "relation already exists" error:

- **This is OK!** The migrations use `IF NOT EXISTS` clauses
- The migration has already been applied
- Continue with the next migration

### If you get "permission denied" error:

- Make sure you're logged into Supabase Dashboard
- You need project owner/admin access
- Check your account permissions

### If you get "column already exists" error:

- The column has already been added
- This is safe to ignore
- Continue with the next migration

---

## Quick Status Check

Run this query in SQL Editor to see which tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Run this to see which columns exist in a specific table:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'  -- Change 'users' to any table name
ORDER BY ordinal_position;
```

---

## Migration Dependencies

Some migrations depend on others:

- **add-lifetime-access-system.sql** requires `profiles` table (from schema.sql or 001_initial_schema.sql)
- **add-lifetime-pro.sql** requires `users` table
- **add-location-fields.sql** requires `trips` and `requests` tables
- **fix-rls-add-preferred-methods.sql** requires `requests` table

Make sure core migrations (001-004) are applied first!

---

## Resume After Connection Error

If you got a connection error mid-migration:

1. **Check which migration was running** - Look at your browser history or notes
2. **Verify what was applied** - Use the status check queries above
3. **Continue from where you left off** - Re-run the migration that failed (it's safe, they're idempotent)
4. **If unsure, start from the last successful migration** - Re-run it to be safe

---

## Need Help?

If you continue to have issues:

1. Check the Supabase status page: https://status.supabase.com
2. Review the error message carefully - it often tells you what went wrong
3. Try running the migration in smaller chunks
4. Check the Supabase logs in the Dashboard

---

**Last Updated**: 2024-12-19
