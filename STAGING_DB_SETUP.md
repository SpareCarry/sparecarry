# Staging Database Setup Guide

Complete guide for setting up and managing the SpareCarry staging database.

**Last Updated**: 2024-12-19  
**Version**: 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Running Migrations](#running-migrations)
5. [Seeding Test Data](#seeding-test-data)
6. [How Staging Differs from Production](#how-staging-differs-from-production)
7. [Required Environment Variables](#required-environment-variables)
8. [Expected Final State](#expected-final-state)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The staging database is a separate Supabase project used for beta testing. It contains:

- **Full production schema** (all tables, indexes, RLS policies)
- **Test data** (users, trips, requests, matches)
- **Isolated from production** (separate project, separate data)

### Key Features

- ✅ Complete schema matching production
- ✅ Row Level Security (RLS) enabled
- ✅ Test users with known credentials
- ✅ Sample trips and requests
- ✅ Test matches and conversations
- ✅ Mock payment and dispute data

---

## Prerequisites

### Required Tools

- **Supabase CLI** (optional, for direct DB access):
  ```bash
  npm install -g supabase
  ```

- **psql** (optional, for direct PostgreSQL access):
  ```bash
  # macOS
  brew install postgresql
  
  # Linux
  sudo apt-get install postgresql-client
  
  # Windows
  # Download from: https://www.postgresql.org/download/windows/
  ```

### Required Access

- **Supabase Staging Project**: Create at [supabase.com](https://supabase.com)
- **Service Role Key**: Get from Supabase Dashboard → Settings → API
- **Database Password**: Get from Supabase Dashboard → Settings → Database

---

## Initial Setup

### 1. Create Staging Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Configure:
   - **Name**: `sparecarry-staging`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your staging server
4. Wait for project to be created (2-3 minutes)

### 2. Get Credentials

From Supabase Dashboard → Settings → API:

- **Project URL**: `https://xxxxx.supabase.co`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret!)

From Supabase Dashboard → Settings → Database:

- **Database Password**: The password you set during creation
- **Connection String**: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

### 3. Configure Environment Variables

Add to `.env.staging`:

```env
# Supabase Staging
STAGING_SUPABASE_URL=https://xxxxx.supabase.co
STAGING_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STAGING_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# For direct database access (optional)
SUPABASE_DB_PASSWORD=your-database-password
```

---

## Running Migrations

### Automated (Recommended)

```bash
# Run all migrations
pnpm db:migrate:staging

# Or directly
./scripts/migrate-staging-db.sh
```

**What it does:**
1. Checks for required environment variables
2. Applies schema (`supabase/schema.sql`)
3. Sets up storage buckets (`supabase/storage-setup.sql`)
4. Configures realtime (`supabase/realtime-setup.sql`)
5. Applies migrations (`supabase/migrations/*.sql`)
6. Seeds meetup locations (`supabase/seed-meetup-locations.sql`)

### Manual (Alternative)

If automated script doesn't work:

1. **Go to Supabase Dashboard → SQL Editor**
2. **Run each file in order:**
   - `supabase/schema.sql`
   - `supabase/storage-setup.sql`
   - `supabase/realtime-setup.sql`
   - `supabase/migrations/add-supporter-tier.sql`
   - `supabase/seed-meetup-locations.sql`

3. **Verify tables created:**
   - Go to **Table Editor**
   - Should see: `users`, `profiles`, `trips`, `requests`, `matches`, `conversations`, `messages`, `deliveries`, `ratings`, `meetup_locations`

---

## Seeding Test Data

### Automated (Recommended)

```bash
# Seed staging database
pnpm db:seed:staging

# Or directly
node scripts/seed-staging-data.js
```

**What it creates:**
- ✅ **5 test users** (travelers, requesters, sailor)
- ✅ **3 test trips** (plane and boat)
- ✅ **5 test requests** (various items)
- ✅ **3 test matches** (pending, chatting, escrow_paid)
- ✅ **Test messages** (conversation threads)
- ✅ **1 test delivery** (with dispute)

**Test User Credentials:**
```
Traveler 1: test-traveler1@sparecarry.test / Test123!@#
Traveler 2: test-traveler2@sparecarry.test / Test123!@#
Requester 1: test-requester1@sparecarry.test / Test123!@#
Requester 2: test-requester2@sparecarry.test / Test123!@#
Sailor 1: test-sailor1@sparecarry.test / Test123!@#
```

### Manual Verification

After seeding, verify in Supabase Dashboard:

1. **Users Table**: Should have 5 users
2. **Trips Table**: Should have 3 trips
3. **Requests Table**: Should have 5 requests
4. **Matches Table**: Should have 3 matches
5. **Messages Table**: Should have messages
6. **Deliveries Table**: Should have 1 delivery with dispute

---

## How Staging Differs from Production

### Database

| Aspect | Staging | Production |
|--------|---------|------------|
| **Project** | Separate Supabase project | Production Supabase project |
| **Data** | Test data only | Real user data |
| **Schema** | Same as production | Same as staging |
| **RLS Policies** | Enabled (same as production) | Enabled |
| **Backups** | Optional | Required (nightly) |

### Environment Variables

- **Staging**: Uses `STAGING_*` prefixed variables
- **Production**: Uses `PRODUCTION_*` or unprefixed variables
- **Isolation**: Complete separation (different projects)

### Test Data

- **Staging**: Pre-populated with test users and data
- **Production**: Empty (users sign up organically)
- **Credentials**: Known test credentials in staging

### Stripe

- **Staging**: Uses Stripe test mode (`sk_test_`, `pk_test_`)
- **Production**: Uses Stripe live mode (`sk_live_`, `pk_live_`)
- **Webhooks**: Separate webhook endpoints

---

## Required Environment Variables

### For Migrations

```env
# Required
STAGING_SUPABASE_URL=https://xxxxx.supabase.co
STAGING_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional (for direct DB access)
SUPABASE_DB_PASSWORD=your-database-password
```

### For Seeding

```env
# Required
STAGING_SUPABASE_URL=https://xxxxx.supabase.co
STAGING_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note**: Service Role Key bypasses RLS, required for seeding.

---

## Expected Final State

### Tables Created

After migrations, you should have:

- ✅ `users` - User accounts
- ✅ `profiles` - Extended user profiles
- ✅ `trips` - Traveler trips
- ✅ `requests` - Delivery requests
- ✅ `matches` - Trip-request matches
- ✅ `conversations` - Chat threads
- ✅ `messages` - Chat messages
- ✅ `deliveries` - Delivery proof
- ✅ `ratings` - User ratings
- ✅ `meetup_locations` - Pre-seeded locations (20 locations)

### Data Counts (After Seeding)

```json
{
  "users": 5,
  "profiles": 5,
  "trips": 3,
  "requests": 5,
  "matches": 3,
  "conversations": 3,
  "messages": 6,
  "deliveries": 1,
  "meetup_locations": 20
}
```

### Sample Data Structure

**Users:**
- 2 travelers (can create trips)
- 2 requesters (can create requests)
- 1 sailor (can create boat trips)

**Trips:**
- 2 plane trips (San Francisco → Grenada, Miami → Barbados)
- 1 boat trip (Rodney Bay → Grenada)

**Requests:**
- Marine battery (West Marine)
- Winch handle (SVB)
- Emergency prop seal (Amazon)
- Foul weather jacket (West Marine)
- VHF radio (SVB)

**Matches:**
- 1 pending match
- 1 chatting match
- 1 escrow_paid match (with dispute)

---

## Troubleshooting

### Migration Fails

**Error**: "Permission denied" or "RLS policy violation"

**Solution**: 
- Ensure you're using `SERVICE_ROLE_KEY` (not anon key)
- Service role key bypasses RLS
- Check key is correct in `.env.staging`

### Seed Script Fails

**Error**: "User already exists"

**Solution**:
- Script checks if tables are empty before inserting
- If data exists, it skips insertion
- To reset: Delete all data manually or recreate project

**Error**: "Foreign key constraint violation"

**Solution**:
- Ensure migrations ran successfully
- Check that all tables exist
- Verify foreign key relationships

### Connection Issues

**Error**: "Connection refused" or "Timeout"

**Solution**:
- Verify `STAGING_SUPABASE_URL` is correct
- Check network connectivity
- Ensure Supabase project is active (not paused)

### RLS Policy Issues

**Error**: "New row violates row-level security policy"

**Solution**:
- This is expected for client-side operations
- Service role key should bypass RLS
- Check that you're using service role key for seeding

---

## Verification Checklist

After setup, verify:

- [ ] All tables created (check Table Editor)
- [ ] RLS policies enabled (check Authentication → Policies)
- [ ] Storage buckets created (check Storage)
- [ ] Realtime enabled (check Database → Replication)
- [ ] Test users can log in
- [ ] Test data visible in app
- [ ] Matches can be created
- [ ] Messages can be sent

---

## Next Steps

1. **Run Health Check**: `curl https://staging.sparecarry.com/api/health`
2. **Test Login**: Use test user credentials
3. **Create Test Match**: Use test trip and request
4. **Verify Payments**: Test with Stripe test cards
5. **Check Sentry**: Verify errors are logged

---

## Support

For issues:
- **Supabase Dashboard**: Check logs and errors
- **SQL Editor**: Run queries to debug
- **Health Check**: `/api/health` endpoint

---

**Last Updated**: 2024-12-19  
**Version**: 1.0.0

