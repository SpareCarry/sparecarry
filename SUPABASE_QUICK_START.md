# Supabase Quick Start Guide

**Project**: SpareCarry  
**Project URL**: https://gujyzwqcwecbeznlablx.supabase.co

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Apply Migrations via Supabase Dashboard

1. **Go to Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard/project/gujyzwqcwecbeznlablx
   - Click "SQL Editor" in left sidebar

2. **Apply Each Migration** (in order):
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run"
   - Repeat for:
     - `002_rls_policies.sql`
     - `003_seed_data.sql`
     - `004_auth_integration.sql`

3. **Verify**:
   - Go to "Table Editor"
   - You should see 7 tables with data

---

### Step 2: Environment is Already Configured ✅

Your `.env.staging` file already has:
- ✅ Supabase URL
- ✅ Anon Key
- ✅ Service Role Key

---

### Step 3: Test the Setup

```bash
# Verify environment
pnpm validate:env staging

# Test database connection
node scripts/setup-supabase.js
```

---

## 📋 What Was Created

### Database Tables
- ✅ `users` - User profiles
- ✅ `trips` - Traveler trips
- ✅ `requests` - Delivery requests
- ✅ `matches` - Trip-request matches
- ✅ `messages` - Chat messages
- ✅ `disputes` - Dispute records
- ✅ `payments` - Payment records

### Security
- ✅ Row Level Security (RLS) on all tables
- ✅ Policies for user access control
- ✅ Admin override policies

### Test Data
- ✅ 5 test users
- ✅ 3 test trips
- ✅ 5 test requests
- ✅ 3 test matches
- ✅ 10 test messages
- ✅ 1 test dispute
- ✅ 3 test payments

### Authentication
- ✅ Auto-create user profile on signup
- ✅ Default role assignment
- ✅ Admin role management

---

## 🎯 Next Steps

1. **Apply Migrations** (see Step 1 above)
2. **Create Auth Users** (optional):
   - Go to Authentication → Users
   - Create users matching test emails
3. **Start App**:
   ```bash
   pnpm dev
   ```

---

## 📚 Files Created

- `supabase/migrations/001_initial_schema.sql` - Table definitions
- `supabase/migrations/002_rls_policies.sql` - Security policies
- `supabase/migrations/003_seed_data.sql` - Test data
- `supabase/migrations/004_auth_integration.sql` - Auth hooks
- `scripts/setup-supabase.sh` - Bash setup script
- `scripts/setup-supabase.js` - Node.js setup script
- `.env.staging` - Environment configuration

---

## ✅ Ready to Use!

Once migrations are applied, your SpareCarry backend is fully functional!

