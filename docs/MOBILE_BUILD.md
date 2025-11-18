# Mobile Build Instructions for SpareCarry

This guide will help you build native iOS and Android apps from the SpareCarry Next.js codebase using Capacitor.

## Prerequisites

### For iOS (Mac only)
- macOS with Xcode 14+ installed
- Apple Developer account (free for development, $99/year for App Store)
- CocoaPods: `sudo gem install cocoapods`

### For Android
- Android Studio installed
- Java Development Kit (JDK) 17+
- Android SDK (installed via Android Studio)

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Icons and Splash Screens

First, create your source images:
- `public/icon-source.png` - 1024x1024px PNG with teal anchor logo
- `public/splash-source.png` - 2732x2732px PNG with teal anchor logo centered

Then generate all sizes:

```bash
# Install ImageMagick if needed (Mac)
brew install imagemagick

# Generate icons
node scripts/generate-icons.js

# Generate splash screens
node scripts/generate-splash.js
```

### 3. Build Next.js App

```bash
npm run build
```

This creates a static export in the `out` directory.

### 4. Sync with Capacitor

```bash
npm run capacitor:sync
```

This copies the web app to native projects and installs plugins.

## iOS Build

### 1. Open in Xcode

```bash
npm run capacitor:ios
```

Or manually:
```bash
npx cap open ios
```

### 2. Configure Signing

1. In Xcode, select the "App" project in the navigator
2. Select the "App" target
3. Go to "Signing & Capabilities"
4. Select your Team (Apple Developer account)
5. Xcode will automatically create a provisioning profile

### 3. Configure Push Notifications

1. In Xcode, select the "App" target
2. Go to "Signing & Capabilities"
3. Click "+ Capability"
4. Add "Push Notifications"
5. Add "Background Modes" and check "Remote notifications"

### 4. Add Notification Sounds

Copy sound files to `ios/App/App/`:
- `boat_horn.wav`
- `airplane_ding.wav`
- `foghorn.wav`
- `cash_register.wav`

Then add them to Xcode:
1. Right-click "App" folder → "Add Files to App"
2. Select all sound files
3. Check "Copy items if needed"
4. Ensure "App" target is selected

### 5. Build and Run

- **Simulator**: Product → Run (⌘R)
- **Device**: Connect iPhone, select device, then Product → Run

### 6. Create Archive for App Store

1. Product → Archive
2. Once archived, click "Distribute App"
3. Follow the App Store Connect wizard

## Android Build

### 1. Open in Android Studio

```bash
npm run capacitor:android
```

Or manually:
```bash
npx cap open android
```

### 2. Configure Gradle

Edit `android/app/build.gradle`:

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.sparecarry.app"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Add Notification Sounds

Copy sound files to `android/app/src/main/res/raw/`:
- `boat_horn.wav`
- `airplane_ding.wav`
- `foghorn.wav`
- `cash_register.wav`

### 4. Configure Firebase (for Push Notifications)

1. Create a Firebase project at https://console.firebase.google.com
2. Add Android app with package name: `com.sparecarry.app`
3. Download `google-services.json`
4. Place it in `android/app/`
5. Add to `android/app/build.gradle`:

```gradle
dependencies {
    // ... existing dependencies
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}

apply plugin: 'com.google.gms.google-services'
```

6. Add to `android/build.gradle`:

```gradle
dependencies {
    classpath 'com.google.gms:google-services:4.4.0'
}
```

### 5. Build APK

**Debug APK:**
```bash
cd android
./gradlew assembleDebug
```

APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

**Release APK:**
1. Generate keystore:
```bash
keytool -genkey -v -keystore sparecarry-release.keystore -alias sparecarry -keyalg RSA -keysize 2048 -validity 10000
```

2. Create `android/keystore.properties`:
```properties
storeFile=sparecarry-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=sparecarry
keyPassword=YOUR_KEY_PASSWORD
```

3. Update `android/app/build.gradle`:
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

4. Build:
```bash
./gradlew assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### 6. Build App Bundle (for Play Store)

```bash
./gradlew bundleRelease
```

AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

## Push Notifications Setup

### iOS (APNs)

1. In Apple Developer portal, create an APNs key
2. Download the `.p8` file
3. Configure in your backend (Expo Push Notification service or custom)

### Android (FCM)

1. Follow Firebase setup above
2. Get FCM server key from Firebase Console → Project Settings → Cloud Messaging
3. Configure in your backend

## Environment Variables

Create `.env.local` for mobile builds:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
NEXT_PUBLIC_EXPO_PROJECT_ID=your_expo_project_id
```

## Common Issues

### iOS: "No such module 'Capacitor'"
```bash
cd ios/App
pod install
```

### Android: Build fails
- Ensure Java 17+ is installed
- Check `android/gradle.properties` for correct SDK versions
- Clean build: `./gradlew clean`

### Push Notifications not working
- Verify permissions in `Info.plist` (iOS) and `AndroidManifest.xml` (Android)
- Check that sound files are included in the build
- Verify Firebase/APNs configuration

### Icons/Splash screens not showing
- Run `npm run capacitor:sync` after generating
- Check file paths match Capacitor config
- Verify images are included in Xcode/Android Studio projects

## Development Workflow

1. Make changes to Next.js app
2. Build: `npm run build`
3. Sync: `npm run capacitor:sync`
4. Test in Xcode/Android Studio
5. Repeat

## Testing on Devices

### iOS
1. Connect iPhone via USB
2. Trust computer on iPhone
3. Select device in Xcode
4. Click Run

### Android
1. Enable Developer Options on Android device
2. Enable USB Debugging
3. Connect via USB
4. Run: `adb devices` to verify connection
5. Click Run in Android Studio

## Publishing

### App Store (iOS)
1. Archive in Xcode
2. Upload via App Store Connect
3. Submit for review

### Play Store (Android)
1. Create app in Play Console
2. Upload AAB file
3. Fill out store listing
4. Submit for review

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Android Play Store Policies](https://play.google.com/about/developer-content-policy/)

