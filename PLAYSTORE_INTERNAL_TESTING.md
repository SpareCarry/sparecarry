# Play Store Internal Testing Deployment Guide

This guide explains how to deploy SpareCarry to Google Play Store Internal Testing for beta testing.

## Prerequisites

1. **Google Play Console Account**
   - Active Google Play Developer account ($25 one-time fee)
   - App created in Play Console

2. **Service Account**
   - Create service account in Google Cloud Console
   - Grant Play Console API access
   - Download JSON key file

3. **Android Keystore**
   - Release keystore file (`.keystore` or `.jks`)
   - Keystore password
   - Key alias and password

4. **Android SDK**
   - Android SDK installed
   - Java Development Kit (JDK) 17+

5. **Fastlane**
   - Fastlane installed (`sudo gem install fastlane`)

## Setup

### 1. Configure Play Console

1. Log in to [Google Play Console](https://play.google.com/console)
2. Create a new app (if not exists):
   - App name: SpareCarry
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free

3. Complete app details:
   - App icon
   - Feature graphic
   - Screenshots
   - Store listing

### 2. Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Play Android Developer API
4. Create service account:
   - Go to IAM & Admin > Service Accounts
   - Create service account
   - Grant "Service Account User" role
5. Create JSON key:
   - Click on service account
   - Keys > Add Key > Create new key > JSON
   - Download JSON file
6. Link service account to Play Console:
   - Go to Play Console > Setup > API access
   - Link service account
   - Grant permissions

### 3. Create Android Keystore

If you don't have a keystore:

```bash
keytool -genkey -v -keystore release.keystore \
  -alias staging -keyalg RSA -keysize 2048 \
  -validity 10000 -storepass <password> \
  -keypass <password>
```

Store the keystore securely and never commit it to git.

### 4. Configure Fastlane

The Fastlane configuration is in `android/fastlane/`:

- **Appfile**: Package name
- **Fastfile**: Build and deployment lanes

### 5. Set Environment Variables

For staging builds, set:
```bash
export NEXT_PUBLIC_APP_ENV=staging
export GOOGLE_PLAY_JSON_KEY_FILE=/path/to/service-account.json
export KEYSTORE_PASSWORD=your-keystore-password
export KEY_PASSWORD=your-key-password
export KEY_ALIAS=staging
```

### 6. Configure GitHub Secrets

Add these secrets to GitHub repository:
- `STAGING_GOOGLE_PLAY_JSON` (base64-encoded service account JSON)
- `STAGING_ANDROID_KEYSTORE` (base64-encoded keystore file)
- `STAGING_KEYSTORE_PASSWORD`
- `STAGING_KEY_PASSWORD`
- `STAGING_KEY_ALIAS`

## Deployment

### Automated (GitHub Actions)

1. Push to `staging` branch or trigger workflow manually
2. Select "Deploy to Staging" workflow
3. Choose platform: `android`
4. Workflow will:
   - Build Next.js app
   - Sync Capacitor
   - Build Android AAB
   - Upload to Play Console Internal Testing

### Manual (Local)

```bash
# 1. Build Next.js app
pnpm mobile:build:staging

# 2. Navigate to Android directory
cd android

# 3. Run Fastlane staging beta lane
fastlane android beta_staging
```

## Fastlane Lanes

### `beta_staging`

Builds and uploads staging build to Internal Testing:
- Cleans previous builds
- Builds staging release AAB
- Uploads to Internal Testing track
- Includes changelog

### `beta`

Builds and uploads production build to Internal Testing:
- Same as `beta_staging` but uses production environment

### `release`

Builds and uploads to Production:
- Builds release AAB
- Uploads to Production track
- Sets release status to "draft" (manual review required)

## Build Variants

The Android project uses build variants:
- `debug` - Development builds
- `stagingRelease` - Staging builds
- `release` - Production builds

Staging builds use the `stagingRelease` variant configured in `android/app/build.gradle`.

## Version Management

Version is managed in `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        versionCode 1
        versionName "1.0.0"
    }
}
```

Increment `versionCode` for each upload. Update `versionName` for major releases.

## Internal Testing Setup

1. Go to Play Console > Testing > Internal testing
2. Create internal testing track (if not exists)
3. Add testers:
   - Email addresses
   - Google Groups
   - Google+ Communities
4. Upload build to track
5. Testers receive email notification

## Changelog

Add changelog when deploying:
```bash
export CHANGELOG="Staging build - Fixed match creation bug"
fastlane android beta_staging
```

Or in GitHub Actions, it's auto-generated with date.

## Troubleshooting

### Build Fails

1. **Gradle Errors**
   - Clean project: `./gradlew clean`
   - Invalidate caches in Android Studio
   - Check `build.gradle` syntax

2. **Signing Errors**
   - Verify keystore file exists
   - Check keystore password is correct
   - Ensure key alias matches

3. **Fastlane Errors**
   - Check Fastlane logs: `fastlane android beta_staging --verbose`
   - Verify environment variables are set
   - Check service account JSON is valid

### Upload Fails

1. **Authentication Errors**
   - Verify service account JSON is valid
   - Check service account has Play Console access
   - Ensure API is enabled in Google Cloud Console

2. **Permission Errors**
   - Verify service account has "Release Manager" role
   - Check app exists in Play Console
   - Ensure app is not in draft state

3. **Network Errors**
   - Check internet connection
   - Verify Play Console API is accessible
   - Try uploading from Play Console web UI

### Play Console Issues

1. **Build Not Appearing**
   - Wait 5-10 minutes for processing
   - Check email for processing errors
   - Verify build is valid (not expired)

2. **Testers Can't Install**
   - Verify tester is added to group
   - Check build is assigned to track
   - Ensure tester accepted invitation
   - Verify device compatibility

## Best Practices

1. **Version Management**
   - Use semantic versioning (e.g., 1.0.0)
   - Increment version code for each upload
   - Document changes in changelog

2. **Testing**
   - Test on multiple devices
   - Test critical flows before uploading
   - Monitor Sentry for errors

3. **Security**
   - Never commit keystore or service account JSON
   - Use GitHub Secrets for sensitive data
   - Rotate keys periodically
   - Use separate keystores for staging/production

4. **Communication**
   - Notify testers of new builds
   - Document known issues
   - Collect feedback systematically

## Next Steps

- [ ] Set up closed testing track
- [ ] Create beta testing guidelines
- [ ] Set up feedback collection system
- [ ] Monitor Play Console analytics

