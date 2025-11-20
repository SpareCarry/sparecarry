# Mobile Deployment Automation Guide

**Date**: November 20, 2025  
**Status**: ✅ **MOBILE DEPLOYMENT AUTOMATION COMPLETE**

---

## Overview

SpareCarry uses Fastlane and GitHub Actions to automate iOS TestFlight and Android Play Store deployments. This guide covers setup, configuration, and usage.

---

## 1. Architecture

### Components

- **Fastlane** - Automation tool for iOS and Android
- **GitHub Actions** - CI/CD workflows
- **App Store Connect API** - iOS deployment
- **Google Play Console API** - Android deployment

### File Structure

```
ios/fastlane/
├── Fastfile          # iOS automation lanes
├── Appfile           # iOS app configuration
└── Matchfile         # Code signing (optional)

android/fastlane/
├── Fastfile          # Android automation lanes
└── Appfile           # Android app configuration

.github/workflows/
└── mobile-deploy.yml # GitHub Actions workflow

scripts/release/
├── android-release.sh
├── ios-release.sh
└── README.md
```

---

## 2. Fastlane Configuration

### iOS Fastfile

**Lanes:**
- `beta` - Build and upload to TestFlight
- `release` - Build and upload to App Store
- `build_only` - Build without uploading
- `clean` - Clean build artifacts

**Usage:**
```bash
cd ios
fastlane ios beta      # Upload to TestFlight
fastlane ios release   # Upload to App Store
fastlane ios build_only # Build only
```

### Android Fastfile

**Lanes:**
- `beta` - Build and upload to Internal Testing
- `release` - Build and upload to Production
- `build_only` - Build without uploading
- `clean` - Clean build artifacts

**Usage:**
```bash
cd android
fastlane android beta      # Upload to Internal Testing
fastlane android release   # Upload to Production
fastlane android build_only # Build only
```

---

## 3. App Store Connect Setup

### Create API Key

1. **Go to App Store Connect**
   - Navigate to: https://appstoreconnect.apple.com
   - Go to Users and Access → Keys

2. **Create New Key**
   - Click "+" to create new key
   - Name: "SpareCarry CI/CD"
   - Access: App Manager or Admin
   - Click "Generate"

3. **Download Key**
   - Download the `.p8` file immediately (can't download again)
   - Note the Key ID and Issuer ID

4. **Configure Environment Variables**
   ```bash
   export APP_STORE_CONNECT_API_KEY_ID="ABC123DEFG"
   export APP_STORE_CONNECT_ISSUER_ID="12345678-1234-1234-1234-123456789012"
   export APP_STORE_CONNECT_KEY_PATH="/path/to/AuthKey_ABC123DEFG.p8"
   ```

### Manual Signing Setup

1. **Xcode Configuration**
   - Open `ios/App/App.xcworkspace` in Xcode
   - Select project → Signing & Capabilities
   - Enable "Automatically manage signing"
   - Select your team
   - Ensure Bundle Identifier: `com.carryspace.app`

2. **Provisioning Profile**
   - Xcode will automatically create provisioning profile
   - Note the profile name for Fastlane

---

## 4. Google Play Console Setup

### Create Service Account

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com
   - Create new project or select existing

2. **Enable Google Play Android Developer API**
   - Go to APIs & Services → Library
   - Search for "Google Play Android Developer API"
   - Click "Enable"

3. **Create Service Account**
   - Go to IAM & Admin → Service Accounts
   - Click "Create Service Account"
   - Name: "SpareCarry CI/CD"
   - Click "Create and Continue"
   - Skip role assignment (we'll do this in Play Console)
   - Click "Done"

4. **Create JSON Key**
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Select JSON format
   - Download the JSON file

5. **Link Service Account to Play Console**
   - Go to Play Console: https://play.google.com/console
   - Go to Setup → API access
   - Under "Service accounts", click "Link service account"
   - Enter the service account email
   - Grant permissions:
     - View app information
     - Manage production releases
     - Manage testing track releases

6. **Configure Environment Variable**
   ```bash
   export GOOGLE_PLAY_JSON_KEY_FILE="/path/to/google-play-service-account.json"
   ```

---

## 5. GitHub Secrets Configuration

### Required Secrets

Add these secrets in GitHub repository settings (Settings → Secrets and variables → Actions):

#### iOS Secrets

- `APPLE_ID` - Your Apple ID email
- `APPLE_TEAM_ID` - Your Apple Team ID (found in App Store Connect)
- `APP_STORE_CONNECT_KEY_ID` - API Key ID
- `APP_STORE_CONNECT_ISSUER_ID` - Issuer ID
- `APP_STORE_CONNECT_KEY` - Contents of `.p8` file (base64 encoded)
- `IOS_PROVISIONING_PROFILE_NAME` - Provisioning profile name (if using manual signing)

#### Android Secrets

- `GOOGLE_PLAY_JSON` - Contents of service account JSON file (base64 encoded)
- `ANDROID_KEYSTORE` - Keystore file (base64 encoded)
- `KEYSTORE_PASSWORD` - Keystore password
- `KEY_PASSWORD` - Key password
- `KEY_ALIAS` - Key alias (usually "release")

#### Shared Secrets

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `NEXT_PUBLIC_APP_URL` - App URL
- `RELEASE_APPROVERS` - Comma-separated list of GitHub usernames for manual approval

### Encoding Secrets

**Base64 Encode Files:**
```bash
# iOS .p8 file
base64 -i AuthKey_KEYID.p8 | pbcopy

# Android keystore
base64 -i release.keystore | pbcopy

# Google Play JSON
base64 -i google-play-service-account.json | pbcopy
```

---

## 6. GitHub Actions Workflow

### Workflow File

`.github/workflows/mobile-deploy.yml`

### Usage

1. **Go to Actions Tab**
   - Navigate to repository → Actions

2. **Select "Mobile Deployment"**
   - Click "Run workflow"
   - Select platform: `android`, `ios`, or `both`
   - Select track: `beta` or `release`
   - (Optional) Enter version number
   - Click "Run workflow"

### Workflow Steps

**Android:**
1. Checkout code
2. Setup Node.js and install dependencies
3. Build Next.js app
4. Validate export
5. Setup Java and Android SDK
6. Sync Capacitor
7. Setup signing (keystore)
8. Setup Google Play service account
9. Install Fastlane
10. Run Fastlane lane
11. Upload artifacts

**iOS:**
1. Checkout code
2. Setup Node.js and install dependencies
3. Build Next.js app
4. Validate export
5. Install CocoaPods
6. Sync Capacitor
7. Install Fastlane
8. Setup App Store Connect API key
9. **Manual approval** (for production releases)
10. Run Fastlane lane
11. Upload artifacts

### Manual Approval

Production releases require manual approval:
- Workflow pauses and creates an issue
- Approvers (from `RELEASE_APPROVERS` secret) must approve
- Workflow continues after approval

---

## 7. Local Release Scripts

### Android Release

**Beta:**
```bash
chmod +x scripts/release/android-release.sh
export GOOGLE_PLAY_JSON_KEY_FILE=/path/to/key.json
./scripts/release/android-release.sh beta
```

**Release:**
```bash
./scripts/release/android-release.sh release
```

### iOS Release

**Beta:**
```bash
chmod +x scripts/release/ios-release.sh
export APPLE_ID=your-apple-id@example.com
export APPLE_TEAM_ID=your-team-id
./scripts/release/ios-release.sh beta
```

**Release:**
```bash
./scripts/release/ios-release.sh release
```

---

## 8. Build Artifacts

### Android

**Location:**
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

**Upload:**
- Automatically uploaded to Play Console via Fastlane
- Also available as GitHub Actions artifact

### iOS

**Location:**
- IPA: `ios/App/App/Build/App.ipa`
- dSYM: `ios/App/App/Build/App.app.dSYM.zip`

**Upload:**
- Automatically uploaded to TestFlight/App Store via Fastlane
- Also available as GitHub Actions artifact

---

## 9. Safety Features

### Production Release Protection

1. **Manual Approval Required**
   - Production releases require manual approval in GitHub Actions
   - Approvers must be in `RELEASE_APPROVERS` secret

2. **Default to Beta**
   - Workflow defaults to beta track
   - Production requires explicit selection

3. **No Auto-Submission**
   - iOS: `submit_for_review: false` (manual review)
   - Android: `release_status: "draft"` (manual review)

### Best Practices

1. **Always Test Beta First**
   - Upload to TestFlight/Internal Testing first
   - Test thoroughly before production

2. **Version Management**
   - Build numbers auto-increment
   - Version numbers should be managed manually

3. **Code Signing**
   - Keep signing certificates secure
   - Use separate certificates for CI/CD

---

## 10. Troubleshooting

### iOS Issues

**Error: Provisioning profile not found**
- Solution: Configure signing in Xcode
- Ensure team is selected
- Check Bundle Identifier matches

**Error: App Store Connect authentication failed**
- Solution: Verify API key file exists
- Check Key ID and Issuer ID
- Ensure API key has correct permissions

**Error: Build failed**
- Solution: Check Xcode version compatibility
- Verify workspace file exists
- Check for code signing errors

### Android Issues

**Error: Keystore not found**
- Solution: Ensure keystore file exists
- Check `keystore.properties` configuration
- Verify keystore path

**Error: Google Play authentication failed**
- Solution: Verify JSON key file path
- Check service account permissions
- Ensure API is enabled

**Error: Build failed**
- Solution: Check Gradle version
- Verify Android SDK is installed
- Check for signing configuration errors

---

## 11. Advanced Configuration

### Custom Fastlane Lanes

Add custom lanes to Fastfiles:

```ruby
# ios/fastlane/Fastfile
lane :custom_lane do
  # Your custom steps
end
```

### Environment-Specific Builds

Use different configurations for staging/production:

```ruby
lane :beta do
  ENV["ENVIRONMENT"] = "staging"
  build_app(...)
end
```

### Notifications

Add Slack/email notifications:

```ruby
slack(
  message: "Build uploaded successfully",
  success: true
)
```

---

## 12. CI/CD Integration

### Automatic Deployment on Tag

Add to `.github/workflows/mobile-deploy.yml`:

```yaml
on:
  push:
    tags:
      - 'v*'
```

### Branch-Based Deployment

- `main` branch → Production
- `develop` branch → Beta

---

## 13. Version Management

### Build Numbers

- Automatically incremented using `number_of_commits`
- Can be overridden manually

### Version Numbers

- Managed manually in Xcode (iOS) or `build.gradle` (Android)
- Should follow semantic versioning: `MAJOR.MINOR.PATCH`

---

## 14. Security Checklist

- [ ] API keys stored as GitHub secrets
- [ ] Keystore files encrypted
- [ ] Service accounts have minimal permissions
- [ ] Code signing certificates secured
- [ ] Manual approval required for production
- [ ] No secrets in code or logs

---

## 15. Summary

✅ **Mobile Deployment Automation Complete**

- Fastlane configured for iOS and Android
- GitHub Actions workflow for automated deployment
- Local release scripts for manual deployment
- Comprehensive documentation
- Safety features (manual approval, beta defaults)
- Production-ready deployment pipeline

**Status**: Ready for automated mobile deployments.

---

**Last Updated**: November 20, 2025

