# Release Scripts

Helper scripts for building and deploying mobile apps locally.

## Prerequisites

### Android

1. **Google Play Service Account JSON**
   - Create a service account in Google Play Console
   - Download the JSON key file
   - Set environment variable:
     ```bash
     export GOOGLE_PLAY_JSON_KEY_FILE=/path/to/google-play-service-account.json
     ```

2. **Android Keystore**
   - Create a release keystore (if not already created):
     ```bash
     keytool -genkey -v -keystore android/app/release.keystore \
       -alias release -keyalg RSA -keysize 2048 -validity 10000
     ```
   - Create `android/keystore.properties`:
     ```properties
     storePassword=your-store-password
     keyPassword=your-key-password
     keyAlias=release
     storeFile=app/release.keystore
     ```

3. **Fastlane**
   ```bash
   sudo gem install fastlane
   ```

### iOS

1. **App Store Connect API Key**
   - Create an API key in App Store Connect
   - Download the `.p8` key file
   - Note the Key ID and Issuer ID
   - Set environment variables:
     ```bash
     export APPLE_ID=your-apple-id@example.com
     export APPLE_TEAM_ID=your-team-id
     export APP_STORE_CONNECT_API_KEY_ID=your-key-id
     export APP_STORE_CONNECT_ISSUER_ID=your-issuer-id
     export APP_STORE_CONNECT_KEY_PATH=/path/to/AuthKey_KEYID.p8
     ```

2. **Code Signing**
   - Configure in Xcode (manual signing) OR
   - Use Fastlane Match (see Fastlane documentation)

3. **Fastlane**
   ```bash
   sudo gem install fastlane
   ```

## Usage

### Android

**Beta (Internal Testing):**
```bash
chmod +x scripts/release/android-release.sh
export GOOGLE_PLAY_JSON_KEY_FILE=/path/to/key.json
./scripts/release/android-release.sh beta
```

**Release (Production):**
```bash
./scripts/release/android-release.sh release
```

### iOS

**Beta (TestFlight):**
```bash
chmod +x scripts/release/ios-release.sh
export APPLE_ID=your-apple-id@example.com
export APPLE_TEAM_ID=your-team-id
./scripts/release/ios-release.sh beta
```

**Release (App Store):**
```bash
./scripts/release/ios-release.sh release
```

## Build Artifacts

### Android
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

### iOS
- IPA: `ios/App/App/Build/App.ipa`
- dSYM: `ios/App/App/Build/App.app.dSYM.zip`

## Troubleshooting

### Android

**Error: Keystore not found**
- Ensure `android/keystore.properties` exists
- Check that keystore path is correct

**Error: Google Play authentication failed**
- Verify JSON key file path
- Check service account has correct permissions
- Ensure JSON key is valid

### iOS

**Error: Provisioning profile not found**
- Configure signing in Xcode
- Ensure provisioning profile is installed
- Check team ID matches

**Error: App Store Connect authentication failed**
- Verify API key file exists
- Check Key ID and Issuer ID
- Ensure API key has correct permissions

## Manual Steps

If scripts fail, you can run steps manually:

### Android
```bash
cd android
fastlane android beta  # or release
```

### iOS
```bash
cd ios
fastlane ios beta  # or release
```

