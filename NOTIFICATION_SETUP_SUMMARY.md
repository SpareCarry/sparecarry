# Notification Setup - Quick Summary

## ✅ What's Been Done

1. **Schema Verified**: Confirmed Supabase has:
   - `profiles.expo_push_token` and `profiles.push_notifications_enabled`
   - `users.email`

2. **Auto Token Registration**: Updated `NotificationSetup` component to automatically register Expo push tokens when users log in on native platforms

3. **Permission Request Fixed**: Updated `NotificationPermissionRequest` component to use the correct Expo push service for native platforms

4. **Setup Guide Created**: Comprehensive guide in `NOTIFICATION_SETUP_GUIDE.md`

5. **Test Tools Created**:
   - Test script: `scripts/test-notifications.js`
   - Postman collection: `NOTIFICATION_TEST_COLLECTION.postman_collection.json`

## 🚀 Next Steps (You Need to Do)

### 1. Get Your Tokens

**Expo Access Token:**
- Go to: https://expo.dev/accounts/[your-account]/settings/access-tokens
- Create a new token with "Access to Expo's services" scope
- Copy the token

**Resend API Key:**
- Go to: https://resend.com/api-keys
- Create a new API key with "Send emails" permission
- Copy the API key

### 2. Set Environment Variables

**Local Development (.env.local):**
```bash
EXPO_ACCESS_TOKEN=your_expo_access_token_here
RESEND_API_KEY=your_resend_api_key_here
NOTIFICATIONS_EMAIL_FROM=SpareCarry <notifications@sparecarry.com>  # Optional
```

**Vercel (Staging/Production):**
- Go to Vercel project → Settings → Environment Variables
- Add `EXPO_ACCESS_TOKEN`, `RESEND_API_KEY`, and optionally `NOTIFICATIONS_EMAIL_FROM`
- Redeploy

**EAS Build (if using):**
```bash
eas secret:create --scope project --name EXPO_ACCESS_TOKEN --value your_token
eas secret:create --scope project --name RESEND_API_KEY --value your_key
```

### 3. Verify Database

Run this SQL in Supabase to verify columns exist:
```sql
-- Check profiles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('expo_push_token', 'push_notifications_enabled');

-- Check users table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'email';
```

### 4. Test

**Using the test script:**
```bash
node scripts/test-notifications.js --type=both --recipientId=your-user-id
```

**Using Postman:**
- Import `NOTIFICATION_TEST_COLLECTION.postman_collection.json`
- Set variables: `base_url`, `recipient_id`, `match_id`
- Run the requests

**Manual test:**
1. Log in to the app on a native device
2. Grant notification permissions
3. Check Supabase `profiles` table - should see `expo_push_token` populated
4. Send a test notification via API

## 📋 Checklist

- [ ] Get Expo Access Token
- [ ] Get Resend API Key
- [ ] Set `EXPO_ACCESS_TOKEN` in `.env.local`
- [ ] Set `RESEND_API_KEY` in `.env.local`
- [ ] Set environment variables in Vercel (if deploying)
- [ ] Set EAS secrets (if using EAS Build)
- [ ] Verify Supabase schema has required columns
- [ ] Test push notifications
- [ ] Test email notifications
- [ ] Monitor logs for errors

## 📚 Documentation

- Full setup guide: `NOTIFICATION_SETUP_GUIDE.md`
- Test script: `scripts/test-notifications.js`
- Postman collection: `NOTIFICATION_TEST_COLLECTION.postman_collection.json`

## 🔍 Troubleshooting

**Push notifications not working?**
- Check `EXPO_ACCESS_TOKEN` is set
- Verify user has `expo_push_token` in profiles
- Check `push_notifications_enabled` is `true`
- Check Expo status: https://status.expo.dev

**Email notifications not working?**
- Check `RESEND_API_KEY` is set
- Verify user has `email` in users table
- Check Resend dashboard for delivery status
- Verify domain is verified in Resend (if using custom domain)

## 🎉 Once Complete

Your notifications will automatically:
- Register push tokens when users log in on native apps
- Send push notifications via Expo
- Send email notifications via Resend
- Fallback to email if push token is unavailable
- Work in all environments (local, staging, production)

