# Notification Setup Checklist

Use this checklist to track your progress on setting up notifications.

## ✅ Completed Setup

- [x] **Expo Project Created** - Project ID: `252620b4-c84e-4dd5-9d76-31bfd5e22854`
- [x] **EAS Configuration** - `eas.json` created with project ID
- [x] **Notification Service Code** - All notification endpoints and services implemented
- [x] **Auto Token Registration** - Code added to automatically register push tokens on native platforms
- [x] **Test Scripts Created** - `scripts/test-notifications.js` and `scripts/verify-notification-setup.js`
- [x] **Postman Collection** - `NOTIFICATION_TEST_COLLECTION.postman_collection.json`
- [x] **Documentation** - Setup guides created

## 🔲 Environment Variables (Set in Vercel)

### Required Variables

- [ ] **`EXPO_ACCESS_TOKEN`** - Set in Vercel
  - Get from: https://expo.dev/accounts/[account]/settings/access-tokens
  - ✅ Already in `.env.local` (value: `WPGnB7vBBa8jcne3iCw_9RBGOUlKjv5Dq-CU_-ru`)

- [ ] **`RESEND_API_KEY`** - Set in Vercel
  - Get from: https://resend.com/api-keys
  - ✅ Already in `.env.local` (value: `3dnauYJh_NoHEaVRYikMs4D4i96q4i9MD`)

- [ ] **`NOTIFICATIONS_EMAIL_FROM`** - Set in Vercel
  - Format: `SpareCarry <notifications@sparecarry.com>`
  - ✅ Already in `.env.local` (value: `SpareCarry <notifications@sparecarry.com>`)
  - ⚠️ **Action Required**: Add this to Vercel environment variables

### How to Check

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these three variables are set
3. Make sure they're set for **ALL environments** (Production, Preview, Development)

## 🔲 Supabase Verification

### Required Columns

- [ ] **`profiles.expo_push_token`** - Column exists
  - ✅ Defined in schema: `supabase/schema.sql` line 51
  - ⚠️ **Action Required**: Verify in Supabase dashboard

- [ ] **`profiles.push_notifications_enabled`** - Column exists
  - ✅ Defined in schema: `supabase/schema.sql` line 52
  - ⚠️ **Action Required**: Verify in Supabase dashboard

- [ ] **`users.email`** - Column exists
  - ✅ Defined in schema: `supabase/schema.sql` line 18
  - ⚠️ **Action Required**: Verify in Supabase dashboard

### How to Verify

**Option 1: Use Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Table Editor**
4. Check `profiles` table - should have `expo_push_token` and `push_notifications_enabled` columns
5. Check `users` table - should have `email` column

**Option 2: Run Verification Script**
```bash
node scripts/verify-notifications-setup.js
```

**Option 3: SQL Query**
Run this in Supabase SQL Editor:
```sql
-- Check profiles columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('expo_push_token', 'push_notifications_enabled');

-- Check users columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'email';
```

## 🔲 Test Notification Flows

### Option 1: Use Test Script

```bash
# Test both push and email
node scripts/test-notifications.js --type=both --recipientId=USER_ID_HERE

# Test push only
node scripts/test-notifications.js --type=push --recipientId=USER_ID_HERE

# Test email only
node scripts/test-notifications.js --type=email --recipientId=USER_ID_HERE
```

**Prerequisites:**
- User must be authenticated (or use a test user ID)
- For push: User must have `expo_push_token` in profiles
- For email: User must have `email` in users table

### Option 2: Use Postman

1. Import `NOTIFICATION_TEST_COLLECTION.postman_collection.json` into Postman
2. Set environment variables:
   - `base_url` = Your Vercel URL (e.g., `https://sparecarry.vercel.app`)
   - `match_id` = A test match ID
   - `recipient_id` = A test user ID
3. Run the requests:
   - **Send Message Notification**
   - **Send Match Notification**
   - **Send Counter Offer Notification**

### Option 3: Manual Test

**Send Message Notification:**
```bash
curl -X POST https://your-app.vercel.app/api/notifications/send-message \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "matchId": "test-match-id",
    "recipientId": "user-id-here",
    "senderName": "Test User",
    "messagePreview": "This is a test notification"
  }'
```

## 🔲 Environment-Specific Setup

### Local Environment ✅

- [x] `.env.local` file created with all variables
- [x] `EXPO_ACCESS_TOKEN` set
- [x] `RESEND_API_KEY` set
- [x] `NOTIFICATIONS_EMAIL_FROM` set

### Vercel Production ⚠️

- [ ] Environment variables set in Vercel dashboard
- [ ] All variables set for Production environment
- [ ] Variables set for Preview environment
- [ ] Variables set for Development environment

## 📋 Quick Verification

Run this command to verify everything:

```bash
node scripts/verify-notifications-setup.js
```

This will check:
- ✅ Environment variables are set
- ✅ Supabase schema has required columns
- ✅ Supabase has users with emails and profiles with tokens

## 🎉 When Complete

Once all checkboxes are marked:

1. ✅ Environment variables set in all environments
2. ✅ Supabase schema verified
3. ✅ Test notifications working
4. ✅ Both push and email channels verified

**Your notification system is fully operational!** 🚀

