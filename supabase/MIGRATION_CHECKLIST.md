# Migration Checklist

Use this checklist to track which migrations have been applied.

## Core Schema Migrations

- [ ] **001_initial_schema.sql** - Core tables
  - Applied on: ___________
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ___________

- [ ] **002_rls_policies.sql** - RLS policies
  - Applied on: ___________
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ___________

- [ ] **003_seed_data.sql** - Test data (optional)
  - Applied on: ___________
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ___________

- [ ] **004_auth_integration.sql** - Auth setup
  - Applied on: ___________
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ___________

## Feature Migrations

- [ ] **005_create_referrals.sql** - Referral system
  - Applied on: ___________
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ___________

- [ ] **006_add_group_buys_waitlist.sql** - Group buys
  - Applied on: ___________
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ___________

- [ ] **add-supporter-tier.sql** - Supporter tier
  - Applied on: ___________
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ___________

- [ ] **add-lifetime-access-system.sql** - Lifetime access
  - Applied on: ___________
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ___________

- [ ] **add-lifetime-pro.sql** - Lifetime Pro
  - Applied on: ___________
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ___________

- [ ] **add-location-fields.sql** - Location fields
  - Applied on: ___________
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ___________

- [ ] **fix-rls-add-preferred-methods.sql** - RLS fixes
  - Applied on: ___________
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ___________

## Tier 1 Features (Optional)

- [ ] **tier1_schema.sql** - Badges, photos, safety
  - Applied on: ___________
  - Status: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Error
  - Notes: ___________

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

**Last migration attempted**: ___________

**Connection error occurred on**: ___________

**Next migration to apply**: ___________

