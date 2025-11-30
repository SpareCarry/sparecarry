# Staging → Beta Launch Automation Pack

Complete automation pack for deploying SpareCarry to staging and beta testing.

## 📦 What's Included

### 1. GitHub Actions Workflows

- **`.github/workflows/ci.yml`** - Updated with lint, typecheck, and tests
- **`.github/workflows/staging-web-deploy.yml`** - Automated web deployment to Vercel staging
- **`.github/workflows/staging-mobile-build.yml`** - Automated mobile builds for iOS and Android
- **`.github/workflows/sentry-release.yml`** - Automatic Sentry release creation and sourcemap upload

### 2. Fastlane Configuration

- **`ios/fastlane/Fastfile`** - Enhanced with `build_staging`, `deploy_staging`, and `beta` lanes
- **`android/fastlane/Fastfile`** - Enhanced with `build_staging`, `deploy_staging`, and `beta` lanes
- **`ios/fastlane/Appfile`** - iOS app configuration
- **`android/fastlane/Appfile`** - Android app configuration

### 3. Build Scripts

- **`scripts/version-bump.js`** - Automatic version bumping
- **`scripts/release-notes.js`** - Generate release notes from git commits
- **`scripts/sync-env-build.js`** - Sync environment variables to build
- **`scripts/preflight-beta.js`** - Pre-deployment validation

### 4. Environment Configuration

- **`.env.staging`** - Staging environment template
- **`GITHUB_SECRETS_MAPPING.md`** - Complete mapping of GitHub Secrets to env vars
- **`scripts/inject-env-capacitor.js`** - Inject env vars into Capacitor config

### 5. Sentry Integration

- **`sentry.client.config.ts`** - Enhanced client configuration with environment support
- **`sentry.server.config.ts`** - Enhanced server configuration with PII redaction
- Automatic release creation in workflows
- Sourcemap upload for web and native

### 6. Feature Flags

- **`FEATURE_FLAG_STAGING_SETUP.md`** - Complete guide for `FF_STAGING_ONLY` flag
- Gradual rollout strategy
- Monitoring and rollback plans

### 7. Documentation

- **`BETA_LAUNCH_CHECKLIST.md`** - Complete pre-deployment and deployment checklist
- **`STAGING_SETUP.md`** - Staging environment setup guide
- **`TESTFLIGHT_DEPLOYMENT.md`** - iOS TestFlight deployment guide
- **`PLAYSTORE_INTERNAL_TESTING.md`** - Android Play Store deployment guide

## 🚀 Quick Start

### 1. Set Up Environment

```bash
# Copy staging template
cp .env.local.example .env.staging

# Fill in required values
# See .env.staging for all required variables
```

### 2. Configure GitHub Secrets

See `GITHUB_SECRETS_MAPPING.md` for complete list of required secrets.

### 3. Run Preflight Check

```bash
pnpm preflight:beta
```

### 4. Deploy to Staging

**Web:**

```bash
# Push to staging branch triggers automatic deployment
git push origin staging
```

**Mobile:**

```bash
# iOS
cd ios && fastlane ios deploy_staging

# Android
cd android && fastlane android deploy_staging
```

## 📋 Package.json Scripts

- `pnpm build:staging` - Build web for staging
- `pnpm mobile:build:staging` - Build mobile for staging
- `pnpm preflight:beta` - Run beta preflight check
- `pnpm version:bump [major|minor|patch]` - Bump version
- `pnpm release:notes [from] [to]` - Generate release notes
- `pnpm env:sync [staging|production]` - Sync environment variables

## 🔧 Fastlane Lanes

### iOS

- `fastlane ios build_staging` - Build only (no upload)
- `fastlane ios deploy_staging` - Build and upload to TestFlight
- `fastlane ios beta` - Production beta build

### Android

- `fastlane android build_staging` - Build only (no upload)
- `fastlane android deploy_staging` - Build and upload to Play Store
- `fastlane android beta` - Production beta build

## 📊 Monitoring

### Sentry

- Automatic release creation
- Sourcemap upload
- Error tracking
- Performance monitoring

### Telemetry

- User events
- Performance metrics
- API latency
- Mobile app performance

## 🎯 Feature Flags

### FF_STAGING_ONLY

- Enable features only in staging
- Gradual rollout support
- Automatic environment detection

See `FEATURE_FLAG_STAGING_SETUP.md` for complete setup.

## ✅ Pre-Deployment Checklist

1. [ ] Run `pnpm preflight:beta`
2. [ ] All tests pass
3. [ ] Environment variables configured
4. [ ] GitHub Secrets set
5. [ ] Fastlane configured
6. [ ] Sentry projects created
7. [ ] Feature flags configured

## 🚢 Deployment Workflow

1. **Pre-Deployment**
   - Run preflight check
   - Run tests
   - Build locally

2. **Deploy Web**
   - Push to staging branch
   - Monitor GitHub Actions
   - Verify on Vercel

3. **Build Mobile**
   - Trigger mobile build workflow
   - Or run Fastlane locally
   - Download artifacts

4. **Upload to Stores**
   - TestFlight (iOS)
   - Play Store Internal Testing (Android)

5. **Post-Deployment**
   - Verify deployments
   - Monitor Sentry
   - Collect feedback

## 📚 Documentation

- **BETA_LAUNCH_CHECKLIST.md** - Complete deployment checklist
- **STAGING_SETUP.md** - Staging environment setup
- **TESTFLIGHT_DEPLOYMENT.md** - iOS deployment guide
- **PLAYSTORE_INTERNAL_TESTING.md** - Android deployment guide
- **FEATURE_FLAG_STAGING_SETUP.md** - Feature flag setup
- **GITHUB_SECRETS_MAPPING.md** - Secrets configuration

## 🔐 Security

- All secrets stored in GitHub Secrets
- Environment-specific configurations
- PII redaction in Sentry
- Secure key storage

## 🎉 Ready for Beta!

All automation is in place. Follow the checklist in `BETA_LAUNCH_CHECKLIST.md` to launch your beta!

---

**Last Updated**: [Date]
**Version**: 1.0.0
