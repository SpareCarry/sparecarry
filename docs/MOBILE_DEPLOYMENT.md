# Mobile App Deployment Guide - CarrySpace

Complete guide for deploying CarrySpace as production-ready iOS and Android apps using Capacitor.

## Prerequisites

- ✅ Next.js static export built (`npm run build` creates `out/` folder)
- ✅ Capacitor installed and configured
- ✅ Xcode (for iOS) - macOS only
- ✅ Android Studio (for Android)
- ✅ Apple Developer Account ($99/year) - for iOS App Store
- ✅ Google Play Developer Account ($25 one-time) - for Android Play Store

## 1. Capacitor Configuration

The project is already configured with:
- **App Name**: CarrySpace
- **App ID**: com.carryspace.app
- **Web Directory**: `out/` (Next.js static export)
- **Platforms**: iOS and Android

### Verify Configuration

Check `capacitor.config.ts`:
```typescript
{
  appId: "com.carryspace.app",
  appName: "CarrySpace",
  webDir: "out",
  bundledWebRuntime: false,
  // ... other config
}
```

## 2. Platform Setup

### iOS Setup

1. **Sync Capacitor**:
   ```bash
   npm run build
   npx cap sync ios
   ```

2. **Open in Xcode**:
   ```bash
   npx cap open ios
   ```

3. **Configure Signing**:
   - Select the "App" target in Xcode
   - Go to "Signing & Capabilities"
   - Select your Team (Apple Developer Account)
   - Xcode will automatically create a provisioning profile

4. **Configure Push Notifications**:
   - In Xcode, go to "Signing & Capabilities"
   - Click "+ Capability"
   - Add "Push Notifications"
   - Add "Background Modes" → Enable "Remote notifications"

5. **Update Info.plist** (if needed):
   The file is located at `ios/App/App/Info.plist`
   - Ensure `NSUserNotificationsUsageDescription` is set
   - Add any required permissions

### Android Setup

1. **Sync Capacitor**:
   ```bash
   npm run build
   npx cap sync android
   ```

2. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

3. **Configure Signing**:
   - Create a keystore file (one-time):
     ```bash
     keytool -genkey -v -keystore carryspace-release.keystore -alias carryspace -keyalg RSA -keysize 2048 -validity 10000
     ```
   - Store the keystore file securely (never commit to git)
   - Update `android/app/build.gradle`:
     ```gradle
     android {
         signingConfigs {
             release {
                 storeFile file('../../carryspace-release.keystore')
                 storePassword 'YOUR_STORE_PASSWORD'
                 keyAlias 'carryspace'
                 keyPassword 'YOUR_KEY_PASSWORD'
             }
         }
         buildTypes {
             release {
                 signingConfig signingConfigs.release
             }
         }
     }
     ```

4. **Configure Push Notifications**:
   - Firebase Cloud Messaging (FCM) is required for Android push notifications
   - Create a Firebase project at https://console.firebase.google.com
   - Download `google-services.json` and place it in `android/app/`
   - Update `android/build.gradle`:
     ```gradle
     dependencies {
         classpath 'com.google.gms:google-services:4.4.0'
     }
     ```
   - Update `android/app/build.gradle`:
     ```gradle
     apply plugin: 'com.google.gms.google-services'
     ```

## 3. Push Notifications Setup

### Using Expo Push Notification Service (Recommended)

Expo's push notification service works as a backend service and doesn't require the full Expo SDK.

#### Backend Setup

1. **Create Expo Account**:
   - Sign up at https://expo.dev
   - Get your Access Token from https://expo.dev/accounts/[account]/settings/access-tokens

2. **Install Expo Server SDK** (in your backend):
   ```bash
   npm install expo-server-sdk
   ```

3. **Backend Example** (`app/api/notifications/send-push/route.ts`):
   ```typescript
   import { Expo } from 'expo-server-sdk';
   
   const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
   
   export async function POST(request: Request) {
     const { token, title, body, data } = await request.json();
     
     const messages = [{
       to: token,
       sound: 'default',
       title,
       body,
       data,
     }];
     
     const chunks = expo.chunkPushNotifications(messages);
     const tickets = [];
     
     for (const chunk of chunks) {
       try {
         const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
         tickets.push(...ticketChunk);
       } catch (error) {
         console.error(error);
       }
     }
     
     return Response.json({ success: true });
   }
   ```

#### Client Setup

The client-side code is already set up in:
- `lib/notifications/capacitor-notifications.ts` - Capacitor push notification handling
- `lib/notifications/expo-push-service.ts` - Expo service integration

**Register for Push Notifications** (in your app):
```typescript
import { registerForExpoPushNotifications, setupExpoPushNotificationListeners } from '@/lib/notifications/expo-push-service';

// On app start
setupExpoPushNotificationListeners();

// When user logs in
const token = await registerForExpoPushNotifications();
if (token) {
  // Send token to your backend
  await fetch('/api/notifications/register-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}
```

### Using Firebase Cloud Messaging (FCM) Directly

If you prefer not to use Expo's service:

1. **Setup Firebase** (as described in Android Setup)
2. **Use Capacitor Push Notifications Plugin** directly
3. **Send notifications via Firebase Admin SDK** from your backend

## 4. Icons and Splash Screens

### Generate Icons

Icons should be placed in:
- **iOS**: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- **Android**: `android/app/src/main/res/` (mipmap folders)

**Required Sizes**:
- iOS: 1024x1024 (App Store), 180x180 (iPhone), 167x167 (iPad)
- Android: 512x512 (Play Store), various mipmap sizes

**Generate using scripts**:
```bash
npm run generate:icons
npm run generate:splash
```

Or use online tools:
- https://www.appicon.co/
- https://icon.kitchen/

### Splash Screen

Splash screen configuration is in `capacitor.config.ts`:
```typescript
SplashScreen: {
  launchShowDuration: 2000,
  launchAutoHide: true,
  backgroundColor: "#14b8a6",
  // ...
}
```

Place splash images:
- **iOS**: `ios/App/App/Assets.xcassets/Splash.imageset/`
- **Android**: `android/app/src/main/res/drawable/splash.png`

## 5. Building for Production

### iOS Build

1. **Open in Xcode**:
   ```bash
   npx cap open ios
   ```

2. **Select "Any iOS Device"** as the build target

3. **Archive**:
   - Product → Archive
   - Wait for archive to complete

4. **Distribute**:
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Follow the wizard to upload

5. **Submit for Review**:
   - Go to https://appstoreconnect.apple.com
   - Select your app
   - Complete app information, screenshots, description
   - Submit for review

### Android Build

1. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

2. **Build AAB** (Android App Bundle):
   - Build → Generate Signed Bundle / APK
   - Select "Android App Bundle"
   - Select your keystore
   - Choose "release" build variant
   - Click "Finish"

3. **Upload to Play Store**:
   - Go to https://play.google.com/console
   - Create new app or select existing
   - Go to "Production" → "Create new release"
   - Upload the AAB file
   - Complete store listing, screenshots, description
   - Submit for review

## 6. Testing

### Local Testing

1. **iOS Simulator**:
   ```bash
   npm run build
   npx cap sync ios
   npx cap open ios
   # Run in Xcode simulator
   ```

2. **Android Emulator**:
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   # Run in Android Studio emulator
   ```

### Test Push Notifications

1. **Register device**:
   - Open app on device
   - Grant notification permissions
   - Check console for push token

2. **Send test notification**:
   ```bash
   # Using Expo CLI (if using Expo service)
   npx expo send-notification --to YOUR_EXPO_PUSH_TOKEN --title "Test" --body "Hello World"
   
   # Or use your backend API
   curl -X POST http://localhost:3000/api/notifications/send-push \
     -H "Content-Type: application/json" \
     -d '{"token":"YOUR_TOKEN","title":"Test","body":"Hello World"}'
   ```

### Test PWA Features

- ✅ Offline functionality
- ✅ Install prompt
- ✅ Service worker
- ✅ Fonts and CSS rendering
- ✅ Static pages load correctly

## 7. Environment Variables

### Required for Production

Create `.env.production`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
EXPO_ACCESS_TOKEN=your_expo_access_token  # For push notifications
```

**Note**: `NEXT_PUBLIC_*` variables are embedded in the build. Non-public variables should be handled server-side.

## 8. Troubleshooting

### Build Issues

**"out folder not found"**:
```bash
npm run build
npx cap sync
```

**"Module not found"**:
- Ensure all dependencies are installed: `npm install`
- Check that `out/` folder contains all static files

### Push Notification Issues

**iOS**: 
- Ensure Push Notifications capability is enabled
- Check that APNs certificate is valid
- Verify device token is being received

**Android**:
- Ensure `google-services.json` is in `android/app/`
- Check Firebase project configuration
- Verify FCM token is being received

### Performance Issues

- Enable production optimizations in `next.config.js`
- Use `npm run build` (not `npm run dev`)
- Check bundle size in build output

## 9. Deployment Checklist

### Pre-Deployment

- [ ] Build succeeds: `npm run build`
- [ ] Capacitor sync works: `npx cap sync`
- [ ] Icons and splash screens are correct
- [ ] Push notifications tested on real devices
- [ ] All environment variables set
- [ ] App signing configured (iOS & Android)
- [ ] Privacy policy and terms of service URLs are valid

### iOS App Store

- [ ] App Store Connect app created
- [ ] App information completed
- [ ] Screenshots uploaded (all required sizes)
- [ ] App description and keywords
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Age rating completed
- [ ] App reviewed and submitted

### Google Play Store

- [ ] Play Console app created
- [ ] Store listing completed
- [ ] Screenshots uploaded
- [ ] App description
- [ ] Privacy policy URL
- [ ] Content rating completed
- [ ] App reviewed and published

## 10. Post-Deployment

### Monitoring

- Monitor crash reports (Firebase Crashlytics recommended)
- Track push notification delivery rates
- Monitor app performance metrics
- Check user reviews and ratings

### Updates

To update the app:

1. Make changes to your Next.js app
2. Build: `npm run build`
3. Sync: `npx cap sync`
4. Build new version in Xcode/Android Studio
5. Increment version number
6. Submit update to stores

## Support

For issues or questions:
- Capacitor Docs: https://capacitorjs.com/docs
- Expo Push Notifications: https://docs.expo.dev/push-notifications/overview/
- Next.js Static Export: https://nextjs.org/docs/app/building-your-application/deploying/static-exports

