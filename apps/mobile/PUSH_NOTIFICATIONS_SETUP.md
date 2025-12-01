# Push Notifications Setup Guide

## Overview

Your app uses **Expo Push Notification Service**, which is the recommended approach. For Android, you need to provide Firebase Cloud Messaging (FCM) credentials, but Expo handles all the complexity.

## Quick Setup (5 minutes)

### Step 1: Get FCM Credentials

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Create or select a project**
3. **Add Android app**:
   - Package name: `com.sparecarry.app`
   - Download `google-services.json` (you'll need this later)
4. **Get FCM Server Key**:
   - Go to Project Settings → Cloud Messaging
   - Copy the "Server key" (you'll need this for Expo)

### Step 2: Configure Expo Credentials

```bash
cd apps/mobile
npx expo credentials:manager
```

1. Select **Android**
2. Choose **Push Notifications**
3. Upload your FCM credentials:
   - FCM Server Key (from Firebase Console)
   - Or let Expo guide you through the process

### Step 3: Verify Environment Variables

Make sure your `.env.local` (in `apps/mobile/`) has:

```env
EXPO_PUBLIC_EAS_PROJECT_ID=252620b4-c84e-4dd5-9d76-31bfd5e22854
```

This is already set in your `app.json`, but you can also set it as an environment variable.

### Step 4: Test

1. Build and run your app on a physical device
2. Check the console - the warning should disappear
3. Push notifications should work!

## Why Firebase?

Even though you're using Expo's push notification service, Android requires FCM (Firebase Cloud Messaging) credentials because:
- Google requires all Android push notifications to go through FCM
- Expo uses FCM under the hood for Android
- You just need to provide the credentials - Expo handles everything else

## Alternative: Direct FCM (Not Recommended)

If you want to use Firebase directly instead of Expo's service, you'd need to:
1. Install Firebase SDK
2. Configure `google-services.json` in your Android project
3. Write custom notification handling code
4. Handle iOS separately (APNs)

**This is more complex and not recommended** - Expo's service is much simpler!

## Troubleshooting

### Warning: "Firebase not configured"

This is normal if you haven't set up FCM credentials yet. Follow Step 2 above.

### Warning: "EAS_PROJECT_ID not set"

Make sure `EXPO_PUBLIC_EAS_PROJECT_ID` is set. It's already in your `app.json`:
```json
"extra": {
  "eas": {
    "projectId": "252620b4-c84e-4dd5-9d76-31bfd5e22854"
  }
}
```

### Push notifications not working

1. Make sure you're testing on a **physical device** (not emulator)
2. Check that permissions are granted
3. Verify FCM credentials are uploaded to Expo
4. Check that `EXPO_PUBLIC_EAS_PROJECT_ID` is set correctly

## Backend Integration

Your backend is already set up! Just use the Expo Server SDK:

```typescript
import { Expo } from "expo-server-sdk";

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

// Send notification
const messages = [{
  to: userExpoPushToken,
  sound: "default",
  title: "New Match!",
  body: "You have a new delivery match",
  data: { matchId: "123" }
}];

const chunks = expo.chunkPushNotifications(messages);
for (const chunk of chunks) {
  await expo.sendPushNotificationsAsync(chunk);
}
```

## Summary

✅ **Use Expo Push Notification Service** (already set up)  
✅ **Provide FCM credentials** (one-time setup)  
✅ **That's it!** Expo handles the rest

The warning you're seeing is just a reminder that FCM credentials need to be configured. Once you upload them via `expo credentials:manager`, the warning will disappear and push notifications will work.

