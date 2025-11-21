# Notification Setup Guide

This guide will help you configure Expo push notifications and Resend email notifications for SpareCarry.

## Prerequisites

- Expo account (created at https://expo.dev)
- Resend account (created at https://resend.com)
- Supabase project with the schema applied

## Step 1: Get Expo Access Token

1. Go to https://expo.dev and sign in
2. Navigate to your account settings: https://expo.dev/accounts/[your-account]/settings/access-tokens
3. Click "Create Token"
4. Name it "SpareCarry Production" (or similar)
5. Select scope: "Access to Expo's services"
6. Copy the token (you won't be able to see it again)

## Step 2: Get Resend API Key

1. Go to https://resend.com and sign in
2. Navigate to API Keys: https://resend.com/api-keys
3. Click "Create API Key"
4. Name it "SpareCarry Production" (or similar)
5. Select permission: "Send emails"
6. Copy the API key (you won't be able to see it again)

### Optional: Verify Email Domain

1. In Resend, go to Domains: https://resend.com/domains
2. Add your domain (e.g., `sparecarry.com`)
3. Add the DNS records provided by Resend to your domain
4. Wait for verification (usually takes a few minutes)
5. Update `NOTIFICATIONS_EMAIL_FROM` to use your verified domain

## Step 3: Configure Environment Variables

### Local Development

Create a `.env.local` file in the project root:

```bash
# Expo Push Notification Service
EXPO_ACCESS_TOKEN=your_expo_access_token_here

# Resend API Key for Email Notifications
RESEND_API_KEY=your_resend_api_key_here

# Optional: Custom email "from" address
# Default: "SpareCarry <notifications@sparecarry.com>"
NOTIFICATIONS_EMAIL_FROM=SpareCarry <notifications@sparecarry.com>
```

### Vercel (Staging/Production)

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add each variable:
   - `EXPO_ACCESS_TOKEN` = your Expo token
   - `RESEND_API_KEY` = your Resend API key
   - `NOTIFICATIONS_EMAIL_FROM` = (optional) your custom from address
4. Select the environments (Production, Preview, Development)
5. Redeploy your application

### EAS Build (for Native Apps)

If you're using EAS Build for native app builds:

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Set secrets for your project
eas secret:create --scope project --name EXPO_ACCESS_TOKEN --value your_expo_access_token_here
eas secret:create --scope project --name RESEND_API_KEY --value your_resend_api_key_here
```

## Step 4: Verify Supabase Schema

Make sure your Supabase database has the required columns:

1. **profiles table**:
   - `expo_push_token` (TEXT) - Stores the Expo push token
   - `push_notifications_enabled` (BOOLEAN) - User preference for push notifications

2. **users table**:
   - `email` (TEXT) - User's email address for email notifications

You can verify this by running the schema SQL in your Supabase SQL Editor, or check that these columns exist in your database.

## Step 5: Test the Setup

### Test Push Notifications

1. **Register a push token** (happens automatically when user logs in on native app):
   - Open the app on a native device (iOS/Android)
   - Log in
   - Grant notification permissions when prompted
   - The token will be automatically registered

2. **Send a test push notification**:
   ```bash
   # Using curl
   curl -X POST http://localhost:3000/api/notifications/send-message \
     -H "Content-Type: application/json" \
     -H "Cookie: your-auth-cookie" \
     -d '{
       "matchId": "test-match-id",
       "recipientId": "user-id-with-push-token",
       "senderName": "Test User",
       "messagePreview": "This is a test message"
     }'
   ```

   Or use the test script: `node scripts/test-notifications.js`

### Test Email Notifications

1. **Verify user has email**:
   - Check that the user has an email in the `users` table
   - Email notifications will automatically fallback if push token is not available

2. **Send a test email**:
   ```bash
   # Using curl
   curl -X POST http://localhost:3000/api/notifications/send-message \
     -H "Content-Type: application/json" \
     -H "Cookie: your-auth-cookie" \
     -d '{
       "matchId": "test-match-id",
       "recipientId": "user-id-with-email",
       "senderName": "Test User",
       "messagePreview": "This is a test message"
     }'
   ```

## Step 6: Monitor and Debug

### Check Logs

- **Local**: Check your terminal/console for errors
- **Vercel**: Check Vercel logs in the dashboard
- **Supabase**: Check Supabase logs in the dashboard

### Common Issues

1. **Push notifications not working**:
   - Verify `EXPO_ACCESS_TOKEN` is set correctly
   - Check that the user has `expo_push_token` in their profile
   - Verify `push_notifications_enabled` is `true`
   - Check Expo push service status: https://status.expo.dev

2. **Email notifications not working**:
   - Verify `RESEND_API_KEY` is set correctly
   - Check that the user has an `email` in the `users` table
   - Verify your domain is verified in Resend (if using custom domain)
   - Check Resend dashboard for delivery status

3. **Token registration failing**:
   - Check that the user is authenticated
   - Verify the `/api/notifications/register-token` endpoint is accessible
   - Check browser/device console for errors

## API Endpoints

### Register Push Token
```
POST /api/notifications/register-token
Body: { expoPushToken: string, enableNotifications?: boolean }
```

### Send Message Notification
```
POST /api/notifications/send-message
Body: { matchId: string, recipientId: string, senderName?: string, messagePreview?: string }
```

### Send Match Notification
```
POST /api/notifications/send-match
Body: { matchId: string, recipientId: string }
```

### Send Counter Offer Notification
```
POST /api/notifications/send-counter-offer
Body: { matchId: string, recipientId: string, amount: number }
```

## Next Steps

Once everything is configured:

1. ✅ Test push notifications on a real device
2. ✅ Test email notifications
3. ✅ Monitor error logs for any issues
4. ✅ Set up alerts for notification failures (optional)
5. ✅ Configure notification preferences UI (already implemented)

## Support

- Expo Push Notifications: https://docs.expo.dev/push-notifications/overview/
- Resend Documentation: https://resend.com/docs
- Supabase Documentation: https://supabase.com/docs

