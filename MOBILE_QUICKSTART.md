# CarrySpace Mobile App - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Prerequisites Check
- ✅ Node.js installed
- ✅ Next.js app built (`out/` folder exists)
- ✅ Xcode (macOS) or Android Studio installed

### Step 1: Build & Sync
```bash
# Build Next.js static export
npm run build

# Sync Capacitor (copies web assets to native projects)
npx cap sync
```

### Step 2: Open Native Projects

**iOS (macOS only)**:
```bash
npx cap open ios
```

**Android**:
```bash
npx cap open android
```

### Step 3: Configure Signing

**iOS**:
1. In Xcode, select "App" target
2. Go to "Signing & Capabilities"
3. Select your Team (Apple Developer Account)
4. Enable "Push Notifications" capability

**Android**:
1. Create keystore (one-time):
   ```bash
   keytool -genkey -v -keystore carryspace-release.keystore -alias carryspace -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Update `android/app/build.gradle` with signing config (see full guide)

### Step 4: Test Locally

**iOS Simulator**:
- Run in Xcode (⌘R)

**Android Emulator**:
- Run in Android Studio (▶️)

## 📱 Push Notifications Setup

### Option 1: Expo Push Notification Service (Recommended)

1. **Create Expo Account**: https://expo.dev
2. **Get Access Token**: https://expo.dev/accounts/[account]/settings/access-tokens
3. **Backend Setup**: Install `expo-server-sdk` in your backend
4. **Send Notifications**: Use Expo's API from your backend

See `lib/notifications/expo-push-service.ts` for integration code.

### Option 2: Firebase Cloud Messaging (FCM)

1. **Create Firebase Project**: https://console.firebase.google.com
2. **Download `google-services.json`**: Place in `android/app/`
3. **Configure iOS**: Upload APNs certificate to Firebase
4. **Send Notifications**: Use Firebase Admin SDK from your backend

## 🏗️ Building for Production

### iOS
1. Open in Xcode: `npx cap open ios`
2. Select "Any iOS Device"
3. Product → Archive
4. Distribute to App Store Connect

### Android
1. Open in Android Studio: `npx cap open android`
2. Build → Generate Signed Bundle / APK
3. Select "Android App Bundle"
4. Upload to Google Play Console

## 📚 Full Documentation

For detailed instructions, see:
- **Complete Guide**: `docs/MOBILE_DEPLOYMENT.md`
- **Capacitor Docs**: https://capacitorjs.com/docs
- **Expo Push**: https://docs.expo.dev/push-notifications/overview/

## 🔧 Troubleshooting

**"out folder not found"**:
```bash
npm run build
```

**"Module not found"**:
```bash
npm install
npx cap sync
```

**Push notifications not working**:
- Check permissions are granted
- Verify backend is sending correct token format
- Check device logs for errors

## ✅ Checklist

Before submitting to stores:
- [ ] App builds successfully
- [ ] Push notifications tested on real device
- [ ] Icons and splash screens configured
- [ ] App signing configured
- [ ] Privacy policy URL set
- [ ] App description and screenshots ready

---

**Need Help?** See `docs/MOBILE_DEPLOYMENT.md` for complete instructions.

