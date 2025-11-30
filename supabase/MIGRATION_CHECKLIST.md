# Migration Checklist

Use this checklist to track which migrations have been applied.

## Core Schema Migrations

- [ ] **001_initial_schema.sql** - Core tables
  - Applied on: ****\_\_\_****
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ****\_\_\_****

- [ ] **002_rls_policies.sql** - RLS policies
  - Applied on: ****\_\_\_****
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ****\_\_\_****

- [ ] **003_seed_data.sql** - Test data (optional)
  - Applied on: ****\_\_\_****
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ****\_\_\_****

- [ ] **004_auth_integration.sql** - Auth setup
  - Applied on: ****\_\_\_****
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ****\_\_\_****

## Feature Migrations

- [ ] **005_create_referrals.sql** - Referral system
  - Applied on: ****\_\_\_****
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ****\_\_\_****

- [ ] **006_add_group_buys_waitlist.sql** - Group buys
  - Applied on: ****\_\_\_****
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ****\_\_\_****

- [ ] **add-supporter-tier.sql** - Supporter tier
  - Applied on: ****\_\_\_****
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ****\_\_\_****

- [ ] **add-lifetime-access-system.sql** - Lifetime access
  - Applied on: ****\_\_\_****
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ****\_\_\_****

- [ ] **add-lifetime-pro.sql** - Lifetime Pro
  - Applied on: ****\_\_\_****
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ****\_\_\_****

- [ ] **add-location-fields.sql** - Location fields
  - Applied on: ****\_\_\_****
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ****\_\_\_****

- [ ] **fix-rls-add-preferred-methods.sql** - RLS fixes
  - Applied on: ****\_\_\_****
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ****\_\_\_****

## Tier 1 Features (Optional)

- [ ] **tier1_schema.sql** - Badges, photos, safety
  - Applied on: ****\_\_\_****
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ****\_\_\_****

---

## Quick Verification Queries

Run these in SQL Editor to verify migrations:

### Check if core tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'trips', 'requests', 'matches', 'messages', 'disputes', 'payments')
ORDER BY table_name;
```

### Check if location fields exist:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'trips'
AND column_name LIKE '%location%' OR column_name LIKE '%lat%' OR column_name LIKE '%lon%';
```

### Check if lifetime fields exist:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND column_name LIKE '%lifetime%';
```

### Check if supporter fields exist:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND column_name LIKE '%supporter%';
```

---

## Current Status

**Last migration attempted**: ****\_\_\_****

**Connection error occurred on**: ****\_\_\_****

**Next migration to apply**: ****\_\_\_****
