# CarrySpace Mobile App - Complete Setup

Your Next.js static export is now ready to be wrapped into production iOS and Android apps using Capacitor.

## ✅ What's Already Configured

- ✅ Capacitor initialized with app name "CarrySpace" and ID "com.carryspace.app"
- ✅ iOS and Android platforms added
- ✅ Push notification permissions configured
- ✅ Camera, location, and storage permissions set
- ✅ Capacitor push notification plugin integrated
- ✅ Expo push notification service integration code provided
- ✅ Build scripts ready

## 🚀 Quick Start

### 1. Build & Sync (One Command)
```bash
npm run mobile:setup
```

This will:
- Build your Next.js app (`npm run build`)
- Copy web assets from `out/` to native projects
- Sync Capacitor configuration

### 2. Open Native Projects

**iOS** (macOS only):
```bash
npm run mobile:ios
# Or manually:
npx cap open ios
```

**Android**:
```bash
npm run mobile:android
# Or manually:
npx cap open android
```

## 📱 Platform-Specific Setup

### iOS Setup

1. **Open in Xcode**:
   ```bash
   npx cap open ios
   ```

2. **Configure Signing**:
   - Select "App" target in Xcode
   - Go to "Signing & Capabilities"
   - Select your Team (Apple Developer Account required)
   - Xcode will auto-create provisioning profile

3. **Enable Push Notifications**:
   - In "Signing & Capabilities", click "+ Capability"
   - Add "Push Notifications"
   - Add "Background Modes" → Enable "Remote notifications"

4. **Build & Test**:
   - Select simulator or connected device
   - Press ⌘R to run

### Android Setup

1. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

2. **Configure Firebase** (for push notifications):
   - Create Firebase project: https://console.firebase.google.com
   - Download `google-services.json`
   - Place in `android/app/` folder
   - Sync Gradle files

3. **Configure Signing** (for production):
   ```bash
   # Create keystore (one-time, store securely!)
   keytool -genkey -v -keystore carryspace-release.keystore \
     -alias carryspace -keyalg RSA -keysize 2048 -validity 10000
   ```

   Update `android/app/build.gradle`:
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

4. **Build & Test**:
   - Select emulator or connected device
   - Click Run ▶️

## 🔔 Push Notifications

### Using Expo Push Notification Service

**Backend Setup**:

1. Create Expo account: https://expo.dev
2. Get access token: https://expo.dev/accounts/[account]/settings/access-tokens
3. Install Expo Server SDK:
   ```bash
   npm install expo-server-sdk
   ```

4. **Backend API Example** (`app/api/notifications/send-expo-push/route.ts`):
   ```typescript
   import { Expo } from 'expo-server-sdk';
   
   const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
   
   export async function POST(request: Request) {
     const { token, title, body, data } = await request.json();
     
     if (!Expo.isExpoPushToken(token)) {
       return Response.json({ error: 'Invalid token' }, { status: 400 });
     }
     
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
     
     return Response.json({ success: true, tickets });
   }
   ```

**Client Setup**:

The client code is ready in `lib/notifications/expo-push-service.ts`. Use it like this:

```typescript
import { 
  registerForExpoPushNotifications, 
  setupExpoPushNotificationListeners 
} from '@/lib/notifications/expo-push-service';

// On app start
setupExpoPushNotificationListeners();

// When user logs in
const token = await registerForExpoPushNotifications();
if (token) {
  // Send token to your backend
  await fetch('/api/notifications/register-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}
```

### Using Firebase Cloud Messaging (Alternative)

If you prefer FCM directly:

1. Setup Firebase (see Android Setup above)
2. Use Capacitor Push Notifications plugin directly
3. Send notifications via Firebase Admin SDK from backend

## 🏗️ Building for Production

### iOS App Store

1. **Archive**:
   - Open in Xcode: `npx cap open ios`
   - Select "Any iOS Device"
   - Product → Archive
   - Wait for archive to complete

2. **Distribute**:
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Follow wizard to upload

3. **Submit**:
   - Go to https://appstoreconnect.apple.com
   - Complete app information, screenshots, description
   - Submit for review

### Google Play Store

1. **Build AAB**:
   - Open in Android Studio: `npx cap open android`
   - Build → Generate Signed Bundle / APK
   - Select "Android App Bundle"
   - Choose release keystore
   - Build completes → AAB file created

2. **Upload**:
   - Go to https://play.google.com/console
   - Create app or select existing
   - Production → Create new release
   - Upload AAB file
   - Complete store listing
   - Submit for review

## 📋 Pre-Deployment Checklist

- [ ] App builds successfully (`npm run build`)
- [ ] Capacitor sync works (`npx cap sync`)
- [ ] Icons and splash screens configured
- [ ] Push notifications tested on real device
- [ ] App signing configured (iOS & Android)
- [ ] Environment variables set for production
- [ ] Privacy policy URL is valid
- [ ] Terms of service URL is valid
- [ ] App description and screenshots ready
- [ ] Age rating completed (iOS & Android)

## 🧪 Testing

### Test Push Notifications

1. **Register device**:
   - Open app on physical device
   - Grant notification permissions
   - Check console/logs for push token

2. **Send test notification**:
   ```bash
   # Using Expo CLI
   npx expo send-notification \
     --to YOUR_EXPO_PUSH_TOKEN \
     --title "Test" \
     --body "Hello from CarrySpace!"
   ```

### Test PWA Features

- ✅ Offline functionality
- ✅ Install prompt
- ✅ Service worker
- ✅ Fonts and CSS render correctly
- ✅ All static pages load

## 📁 Project Structure

```
.
├── out/                    # Next.js static export (web assets)
├── ios/                    # iOS native project
│   └── App/
│       └── App/
│           └── Info.plist  # iOS configuration
├── android/                # Android native project
│   └── app/
│       └── src/
│           └── main/
│               └── AndroidManifest.xml  # Android configuration
├── capacitor.config.ts     # Capacitor configuration
├── lib/
│   └── notifications/
│       ├── capacitor-notifications.ts    # Capacitor push notifications
│       └── expo-push-service.ts         # Expo service integration
└── docs/
    └── MOBILE_DEPLOYMENT.md  # Complete deployment guide
```

## 🔧 Troubleshooting

### Build Issues

**"out folder not found"**:
```bash
npm run build
```

**"Module not found"**:
```bash
npm install
npx cap sync
```

**"Capacitor CLI not found"**:
```bash
npm install -g @capacitor/cli
# Or use npx (recommended)
npx cap sync
```

### Push Notification Issues

**iOS**:
- Ensure Push Notifications capability enabled in Xcode
- Check APNs certificate is valid
- Verify device token is received (check logs)

**Android**:
- Ensure `google-services.json` is in `android/app/`
- Check Firebase project configuration
- Verify FCM token is received (check logs)

### Performance Issues

- Use production build: `npm run build` (not `npm run dev`)
- Check bundle size in build output
- Enable production optimizations in `next.config.js`

## 📚 Additional Resources

- **Complete Guide**: `docs/MOBILE_DEPLOYMENT.md`
- **Quick Start**: `MOBILE_QUICKSTART.md`
- **Capacitor Docs**: https://capacitorjs.com/docs
- **Expo Push**: https://docs.expo.dev/push-notifications/overview/
- **Firebase Setup**: https://firebase.google.com/docs/cloud-messaging

## 🎯 Next Steps

1. ✅ Build and sync: `npm run mobile:setup`
2. ✅ Open in Xcode/Android Studio
3. ✅ Configure signing
4. ✅ Test on device
5. ✅ Setup push notifications backend
6. ✅ Build for production
7. ✅ Submit to stores

---

**Ready to deploy?** Follow the step-by-step guide in `docs/MOBILE_DEPLOYMENT.md`!

