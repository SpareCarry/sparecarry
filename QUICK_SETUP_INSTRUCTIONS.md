# Quick Setup Instructions - Apply Migrations to Supabase

**Status**: ⚠️ Tables need to be created in Supabase  
**Time Required**: 5 minutes  
**Difficulty**: Easy

---

## Step-by-Step Guide

### Step 1: Open Supabase Dashboard

1. Go to: **https://supabase.com/dashboard/project/gujyzwqcwecbeznlablx**
2. If prompted, log in to your Supabase account
3. You should see your project dashboard

### Step 2: Open SQL Editor

1. In the left sidebar, click **"SQL Editor"**
2. Click the **"New query"** button (top right)
3. You'll see a blank SQL editor

### Step 3: Apply Migration 1 - Create Tables

1. Open the file: `supabase/migrations/001_initial_schema.sql` in your code editor
2. **Select ALL** the text (Ctrl+A)
3. **Copy** it (Ctrl+C)
4. **Paste** it into the Supabase SQL Editor
5. Click the **"Run"** button (or press Ctrl+Enter)
6. Wait for the "Success" message

**What this does**: Creates all 7 tables (users, trips, requests, matches, messages, disputes, payments)

### Step 4: Apply Migration 2 - Security Policies

1. Click **"New query"** again (to start a fresh query)
2. Open: `supabase/migrations/002_rls_policies.sql`
3. **Copy ALL** the text
4. **Paste** into SQL Editor
5. Click **"Run"**

**What this does**: Enables Row Level Security (RLS) on all tables

### Step 5: Apply Migration 3 - Test Data

1. Click **"New query"** again
2. Open: `supabase/migrations/003_seed_data.sql`
3. **Copy ALL** the text
4. **Paste** into SQL Editor
5. Click **"Run"**

**What this does**: Inserts test data (5 users, 3 trips, 5 requests, etc.)

### Step 6: Apply Migration 4 - Auth Integration

1. Click **"New query"** again
2. Open: `supabase/migrations/004_auth_integration.sql`
3. **Copy ALL** the text
4. **Paste** into SQL Editor
5. Click **"Run"**

**What this does**: Sets up authentication triggers and admin functions

---

## Verify Tables Were Created

### Option 1: In Supabase Dashboard

1. Click **"Table Editor"** in the left sidebar
2. You should see 7 tables:
   - ✅ users
   - ✅ trips
   - ✅ requests
   - ✅ matches
   - ✅ messages
   - ✅ disputes
   - ✅ payments

### Option 2: Run Verification Script

In your terminal, run:

```bash
node scripts/verify-tables.js
```

This will check if all tables exist and show row counts.

---

## Troubleshooting

### "relation already exists" Error

- **Meaning**: Some tables already exist
- **Action**: This is OK! The migrations use `CREATE TABLE IF NOT EXISTS`
- **Solution**: Continue with the next migration

### "permission denied" Error

- **Meaning**: You don't have admin access
- **Action**: Make sure you're logged in as the project owner
- **Solution**: Check your Supabase account permissions

### "syntax error" Error

- **Meaning**: SQL file may be corrupted or incomplete
- **Action**: Make sure you copied the ENTIRE file
- **Solution**: Try copying again, check file size

### Can't See Tables in Table Editor

- **Possible causes**:
  1. Migrations haven't been applied yet → Apply them now
  2. Wrong project selected → Check project ID in URL
  3. Browser cache → Refresh the page
  4. RLS blocking view → Use service role key (already configured)

---

## Migration Files Location

All files are in: `supabase/migrations/`

- ✅ `001_initial_schema.sql` - Creates tables
- ✅ `002_rls_policies.sql` - Security policies
- ✅ `003_seed_data.sql` - Test data
- ✅ `004_auth_integration.sql` - Auth setup

---

## After Migrations Are Applied

Once all 4 migrations are applied successfully:

1. **Verify setup**:

   ```bash
   node scripts/verify-tables.js
   ```

2. **Check tables in Dashboard**:
   - Go to Table Editor
   - Click on any table to see data

3. **Test the app**:
   - Your app should now be able to connect to Supabase
   - All API routes should work

---

## Quick Reference

**Supabase Dashboard**: https://supabase.com/dashboard/project/gujyzwqcwecbeznlablx  
**SQL Editor**: Dashboard → SQL Editor → New query  
**Table Editor**: Dashboard → Table Editor

**Migration Order**:

1. 001_initial_schema.sql
2. 002_rls_policies.sql
3. 003_seed_data.sql
4. 004_auth_integration.sql

---

**Need Help?** If you encounter any errors, check the error message in Supabase SQL Editor and refer to the Troubleshooting section above.
