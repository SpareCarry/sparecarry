# Apply Supabase Migrations - Step by Step Guide

**Status**: ⚠️ Tables not yet created in Supabase  
**Action Required**: Apply 4 migration files via Supabase Dashboard

---

## Quick Steps (5 minutes)

### Step 1: Open Supabase Dashboard

1. Go to: **https://supabase.com/dashboard/project/gujyzwqcwecbeznlablx**
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"** button

### Step 2: Apply Migration 1 - Initial Schema

1. Open file: `supabase/migrations/001_initial_schema.sql`
2. **Copy the entire contents** of the file
3. **Paste into SQL Editor**
4. Click **"Run"** button (or press Ctrl+Enter)
5. Wait for "Success" message

**Expected Result**: Creates 7 tables (users, trips, requests, matches, messages, disputes, payments)

### Step 3: Apply Migration 2 - RLS Policies

1. Open file: `supabase/migrations/002_rls_policies.sql`
2. **Copy the entire contents**
3. **Paste into SQL Editor** (new query)
4. Click **"Run"**
5. Wait for "Success" message

**Expected Result**: Enables Row Level Security on all tables

### Step 4: Apply Migration 3 - Seed Data

1. Open file: `supabase/migrations/003_seed_data.sql`
2. **Copy the entire contents**
3. **Paste into SQL Editor** (new query)
4. Click **"Run"**
5. Wait for "Success" message

**Expected Result**: Inserts test data (5 users, 3 trips, 5 requests, 3 matches, 10 messages, 1 dispute, 3 payments)

### Step 5: Apply Migration 4 - Auth Integration

1. Open file: `supabase/migrations/004_auth_integration.sql`
2. **Copy the entire contents**
3. **Paste into SQL Editor** (new query)
4. Click **"Run"**
5. Wait for "Success" message

**Expected Result**: Sets up auth triggers and admin functions

---

## Verify Setup

After applying all migrations, verify in Supabase Dashboard:

1. Click **"Table Editor"** in left sidebar
2. You should see 7 tables:
   - ✅ users
   - ✅ trips
   - ✅ requests
   - ✅ matches
   - ✅ messages
   - ✅ disputes
   - ✅ payments

3. Or run this command locally:
   ```bash
   node scripts/setup-supabase.js
   ```

---

## Troubleshooting

### Error: "relation already exists"
- Some tables may already exist
- This is OK - the migrations use `CREATE TABLE IF NOT EXISTS`
- Continue with next migration

### Error: "permission denied"
- Make sure you're logged into Supabase Dashboard
- You need project owner/admin access

### Error: "syntax error"
- Check that you copied the entire file
- Make sure no text was cut off
- Try copying again

---

## Migration Files Location

All migration files are in: `supabase/migrations/`

- `001_initial_schema.sql` - Creates all tables
- `002_rls_policies.sql` - Security policies
- `003_seed_data.sql` - Test data
- `004_auth_integration.sql` - Auth setup

---

## After Migrations Are Applied

Once all migrations are applied, you can:

1. **Verify setup**:
   ```bash
   node scripts/setup-supabase.js
   ```

2. **Seed additional data** (optional):
   ```bash
   node scripts/seed-staging-data.js
   ```

3. **Check table contents**:
   - Go to Supabase Dashboard → Table Editor
   - Click on any table to see rows

---

**Last Updated**: 2024-12-19

