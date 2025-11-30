# TestFlight Deployment Guide

This guide explains how to deploy SpareCarry to iOS TestFlight for beta testing.

## Prerequisites

1. **Apple Developer Account**
   - Active Apple Developer Program membership ($99/year)
   - App Store Connect access

2. **App Store Connect API Key**
   - Create API key in App Store Connect
   - Download `.p8` key file
   - Note Key ID and Issuer ID

3. **Xcode**
   - Latest Xcode installed
   - Command Line Tools installed

4. **Fastlane**
   - Fastlane installed (`sudo gem install fastlane`)
   - CocoaPods installed (`sudo gem install cocoapods`)

## Setup

### 1. Configure App Store Connect

1. Log in to [App Store Connect](https://appstoreconnect.apple.com)
2. Create a new app (if not exists):
   - Bundle ID: `com.carryspace.app`
   - App Name: SpareCarry
   - Primary Language: English

### 2. Configure Fastlane

The Fastlane configuration is in `ios/fastlane/`:

- **Appfile**: App identifier and Apple ID
- **Fastfile**: Build and deployment lanes
- **Matchfile**: Code signing (optional)

### 3. Set Environment Variables

For staging builds, set:

```bash
export NEXT_PUBLIC_APP_ENV=staging
export APPLE_ID=your-apple-id@example.com
export APPLE_TEAM_ID=your-team-id
export APP_STORE_CONNECT_KEY_ID=your-key-id
export APP_STORE_CONNECT_ISSUER_ID=your-issuer-id
export BUNDLE_IDENTIFIER=com.carryspace.app
export IOS_PROVISIONING_PROFILE_NAME="SpareCarry Staging"
```

### 4. Configure GitHub Secrets

Add these secrets to GitHub repository:

- `STAGING_APPLE_ID`
- `STAGING_APPLE_TEAM_ID`
- `STAGING_APP_STORE_CONNECT_KEY_ID`
- `STAGING_APP_STORE_CONNECT_ISSUER_ID`
- `STAGING_APP_STORE_CONNECT_KEY` (base64-encoded .p8 file)
- `STAGING_IOS_PROVISIONING_PROFILE_NAME`

## Deployment

### Automated (GitHub Actions)

1. Push to `staging` branch or trigger workflow manually
2. Select "Deploy to Staging" workflow
3. Choose platform: `ios`
4. Workflow will:
   - Build Next.js app
   - Sync Capacitor
   - Build iOS app
   - Upload to TestFlight

### Manual (Local)

```bash
# 1. Build Next.js app
pnpm mobile:build:staging

# 2. Navigate to iOS directory
cd ios

# 3. Run Fastlane staging beta lane
fastlane ios beta_staging
```

## Fastlane Lanes

### `beta_staging`

Builds and uploads staging build to TestFlight:

- Increments build number
- Builds app with staging environment
- Uploads to TestFlight
- Does not submit for review

### `beta`

Builds and uploads production build to TestFlight:

- Same as `beta_staging` but uses production environment

### `release`

Builds and uploads to App Store:

- Increments version and build number
- Uploads to App Store Connect
- Does not submit for review (manual step)

## Build Number Management

Build numbers are auto-incremented using:

```ruby
increment_build_number(
  build_number: number_of_commits
)
```

This uses the number of git commits as the build number.

## TestFlight Configuration

### Internal Testing

1. Go to TestFlight in App Store Connect
2. Add internal testers (up to 100)
3. Select build to test
4. Testers receive email notification

### External Testing

1. Create external testing group
2. Add testers (up to 10,000)
3. Submit for Beta App Review (first time only)
4. Once approved, testers can install without review

## Changelog

Add changelog when deploying:

```bash
export CHANGELOG="Staging build - Fixed match creation bug"
fastlane ios beta_staging
```

Or in GitHub Actions, it's auto-generated with date.

## Troubleshooting

### Build Fails

1. **Code Signing Issues**
   - Verify provisioning profile is valid
   - Check bundle identifier matches
   - Ensure certificates are installed

2. **Xcode Build Errors**
   - Clean build folder: `Product > Clean Build Folder`
   - Delete derived data
   - Reinstall CocoaPods: `pod install`

3. **Fastlane Errors**
   - Check Fastlane logs: `fastlane ios beta_staging --verbose`
   - Verify environment variables are set
   - Check App Store Connect API key permissions

### Upload Fails

1. **Authentication Errors**
   - Verify App Store Connect API key is valid
   - Check key has correct permissions
   - Ensure key file path is correct

2. **Network Errors**
   - Check internet connection
   - Verify App Store Connect is accessible
   - Try uploading from Xcode Organizer

### TestFlight Processing

1. **Build Not Appearing**
   - Wait 5-10 minutes for processing
   - Check email for processing errors
   - Verify build is valid (not expired)

2. **Testers Can't Install**
   - Verify tester is added to group
   - Check build is assigned to group
   - Ensure tester accepted TestFlight invitation

## Best Practices

1. **Version Management**
   - Use semantic versioning (e.g., 1.0.0)
   - Increment build number for each upload
   - Document changes in changelog

2. **Testing**
   - Test on multiple devices
   - Test critical flows before uploading
   - Monitor Sentry for errors

3. **Communication**
   - Notify testers of new builds
   - Document known issues
   - Collect feedback systematically

4. **Security**
   - Never commit API keys or certificates
   - Use GitHub Secrets for sensitive data
   - Rotate keys periodically

## Next Steps

- [ ] Set up external testing group
- [ ] Create beta testing guidelines
- [ ] Set up feedback collection system
- [ ] Monitor TestFlight analytics
