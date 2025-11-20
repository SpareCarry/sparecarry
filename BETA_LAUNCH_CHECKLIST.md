# Beta Launch Checklist

Complete checklist for launching SpareCarry to beta testing on iOS TestFlight and Android Play Store Internal Testing.

**Last Updated**: 2024-12-19  
**Version**: 1.0.0

---

## Table of Contents

1. [Pre-Beta Audit](#pre-beta-audit)
2. [Environment Setup](#environment-setup)
3. [Security Verification](#security-verification)
4. [Code Quality Checks](#code-quality-checks)
5. [Staging Deployment](#staging-deployment)
6. [Mobile Build Verification](#mobile-build-verification)
7. [Service Integration Verification](#service-integration-verification)
8. [TestFlight Submission](#testflight-submission)
9. [Play Store Submission](#play-store-submission)
10. [Post-Deployment Verification](#post-deployment-verification)
11. [Tester QA Script](#tester-qa-script)
12. [Rollback Plan](#rollback-plan)
13. [Critical Path Checklist](#critical-path-checklist)

---

## Pre-Beta Audit

### Green Light Criteria

All items must pass before proceeding to beta launch.

#### 1. Security Audit ✅

```bash
# Run security checks
pnpm audit
pnpm audit --production

# Check for exposed secrets
grep -r "sk_live\|pk_live\|SUPABASE_SERVICE_ROLE" --exclude-dir=node_modules --exclude-dir=.git
```

**Checklist:**
- [ ] No critical security vulnerabilities
- [ ] No secrets committed to repository
- [ ] All API routes have rate limiting
- [ ] All API routes have input validation
- [ ] All API routes have authentication guards
- [ ] File uploads have MIME type validation
- [ ] Stripe webhooks have signature verification
- [ ] PII redaction enabled in Sentry
- [ ] Error messages don't leak sensitive data

#### 2. Environment Configuration ✅

```bash
# Verify staging environment
pnpm env:sync staging

# Check required variables
node -e "
const fs = require('fs');
const env = fs.readFileSync('.env.staging', 'utf-8');
const required = [
  'NEXT_PUBLIC_APP_ENV=staging',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SENTRY_DSN',
];
required.forEach(v => {
  if (!env.includes(v)) console.error('Missing:', v);
});
"
```

**Checklist:**
- [ ] `.env.staging` file exists and is complete
- [ ] All `NEXT_PUBLIC_*` variables set
- [ ] Supabase staging project configured
- [ ] Stripe test mode keys configured
- [ ] Sentry staging project configured
- [ ] Unleash staging environment configured
- [ ] Vercel staging project configured
- [ ] GitHub Secrets configured (see `GITHUB_SECRETS_MAPPING.md`)

#### 3. Mobile Build Configuration ✅

```bash
# Verify iOS configuration
cd ios
fastlane ios build_staging --dry_run || echo "Fastlane configured"

# Verify Android configuration
cd android
fastlane android build_staging --dry_run || echo "Fastlane configured"
```

**Checklist:**
- [ ] iOS provisioning profiles valid
- [ ] Android keystore created and secured
- [ ] App Store Connect app created
- [ ] Google Play Console app created
- [ ] Fastlane configured for both platforms
- [ ] Build scripts tested locally
- [ ] Capacitor config correct (`webDir: "out"`)

#### 4. Preflight Check ✅

```bash
# Run comprehensive preflight
pnpm preflight:beta
```

**Expected Output:**
- ✅ All required files exist
- ✅ Build scripts configured
- ✅ Fastlane lanes configured
- ✅ GitHub workflows exist
- ✅ Dependencies installed

---

## Environment Setup

### 1. Create Staging Environment File

```bash
# Copy template
cp .env.local.example .env.staging

# Edit with staging values
# Use your preferred editor to fill in:
# - Supabase staging URL and keys
# - Stripe test mode keys
# - Sentry staging DSN
# - Unleash staging URL and keys
# - App URLs
```

### 2. Configure GitHub Secrets

Go to: **Repository Settings > Secrets and variables > Actions**

**Required Secrets (Staging):**
```bash
# Supabase
STAGING_SUPABASE_URL
STAGING_SUPABASE_ANON_KEY
STAGING_SUPABASE_SERVICE_ROLE_KEY

# Stripe
STAGING_STRIPE_SECRET_KEY
STAGING_STRIPE_PUBLISHABLE_KEY
STAGING_STRIPE_WEBHOOK_SECRET

# Sentry
STAGING_SENTRY_DSN
SENTRY_AUTH_TOKEN
SENTRY_ORG
SENTRY_PROJECT_STAGING

# Feature Flags
STAGING_UNLEASH_URL
STAGING_UNLEASH_CLIENT_KEY

# App URLs
STAGING_APP_URL

# iOS
STAGING_APPLE_ID
STAGING_APPLE_TEAM_ID
STAGING_APP_STORE_CONNECT_KEY_ID
STAGING_APP_STORE_CONNECT_ISSUER_ID
STAGING_APP_STORE_CONNECT_KEY (base64 .p8 file)
STAGING_IOS_PROVISIONING_PROFILE_NAME

# Android
STAGING_ANDROID_KEYSTORE (base64 keystore)
STAGING_KEYSTORE_PASSWORD
STAGING_KEY_PASSWORD
STAGING_KEY_ALIAS
STAGING_GOOGLE_PLAY_JSON (base64 service account)

# Vercel
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID_STAGING
```

See `GITHUB_SECRETS_MAPPING.md` for complete mapping.

### 3. Verify Environment Sync

```bash
# Sync environment variables
pnpm env:sync staging

# Verify output
cat .env.build | grep NEXT_PUBLIC_APP_ENV
# Should output: NEXT_PUBLIC_APP_ENV=staging
```

---

## Security Verification

### 1. API Route Security

```bash
# Check all API routes have security wrappers
grep -r "withApiErrorHandler\|rateLimit\|assertAuthenticated\|validateRequestBody" app/api --include="*.ts" | wc -l
# Should match number of API route files
```

**Manual Verification:**
- [ ] All routes use `withApiErrorHandler`
- [ ] All routes have `rateLimit`
- [ ] Authenticated routes have `assertAuthenticated`
- [ ] All routes have `validateRequestBody` with Zod schemas
- [ ] No raw `console.error` (use `logger.error`)

### 2. Input Validation

```bash
# Verify Zod schemas exist
ls lib/zod/api-schemas.ts
grep -c "Schema" lib/zod/api-schemas.ts
```

**Checklist:**
- [ ] All API routes have Zod schemas
- [ ] Request bodies validated
- [ ] Query parameters validated
- [ ] File uploads validated (MIME, size, extension)

### 3. Error Handling

```bash
# Check error sanitization
grep -r "error.stack\|console.error" app/api --include="*.ts" | grep -v "logger.error\|safeLog"
# Should return no results
```

**Checklist:**
- [ ] No raw error stacks returned
- [ ] All errors sanitized
- [ ] PII redacted in logs
- [ ] Error messages user-friendly

### 4. Secrets Management

```bash
# Verify no secrets in code
grep -r "sk_live\|pk_live\|SUPABASE_SERVICE_ROLE" --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md"
# Should return no results
```

**Checklist:**
- [ ] No hardcoded secrets
- [ ] All secrets in environment variables
- [ ] GitHub Secrets configured
- [ ] `.env.staging` not committed (in `.gitignore`)

---

## Code Quality Checks

### 1. Run All Tests

```bash
# Unit and integration tests
pnpm test

# E2E tests
pnpm test:e2e

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Type coverage
pnpm typecheck:coverage
```

**Checklist:**
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Type coverage > 95%

### 2. Build Verification

```bash
# Build staging
pnpm build:staging

# Validate export
pnpm validate:export

# Check output
ls -la out/ | head -20
```

**Checklist:**
- [ ] Build completes without errors
- [ ] Static export validates
- [ ] `out/` directory created
- [ ] No build warnings

### 3. Mobile Build Verification

```bash
# iOS build
pnpm mobile:build:staging
cd ios && fastlane ios build_staging

# Android build
cd android && fastlane android build_staging
```

**Checklist:**
- [ ] iOS build succeeds
- [ ] Android build succeeds
- [ ] Environment variables injected
- [ ] Capacitor sync completes

---

## Staging Deployment

### 1. Pre-Deployment

```bash
# Final preflight
pnpm preflight:beta

# Generate release notes
pnpm release:notes HEAD~10 HEAD > RELEASE_NOTES.md

# Bump version (if needed)
pnpm version:bump patch
```

### 2. Deploy Web to Staging

**Option A: Automated (GitHub Actions)**

```bash
# Push to staging branch
git checkout staging
git merge develop
git push origin staging

# Monitor deployment
# Go to: GitHub Actions > "Deploy Web to Staging"
```

**Option B: Manual (Vercel)**

```bash
# Build
pnpm build:staging

# Deploy
vercel --prod --env staging
```

**Verification:**
```bash
# Check staging URL
curl -I https://staging.sparecarry.com

# Should return: HTTP/2 200
```

**Checklist:**
- [ ] Web deployed to staging
- [ ] Staging URL accessible
- [ ] No console errors
- [ ] API endpoints respond
- [ ] Sentry initialized
- [ ] Feature flags working

### 3. Build Mobile Apps

**Option A: Automated (GitHub Actions)**

1. Go to: **GitHub Actions > "Build Mobile for Staging"**
2. Click **"Run workflow"**
3. Select platform: `both`
4. Monitor build progress
5. Download artifacts when complete

**Option B: Manual (Fastlane)**

```bash
# iOS
cd ios
fastlane ios deploy_staging

# Android
cd android
fastlane android deploy_staging
```

**Checklist:**
- [ ] iOS build completes
- [ ] Android build completes
- [ ] Build artifacts generated
- [ ] Version numbers incremented
- [ ] Changelog included

---

## Mobile Build Verification

### 1. iOS Build Verification

```bash
# Check build output
ls -la ios/App/App/Build/*.ipa

# Verify Info.plist
plutil -p ios/App/App/Info.plist | grep -E "CFBundleVersion|CFBundleShortVersionString"
```

**Checklist:**
- [ ] IPA file generated
- [ ] Build number incremented
- [ ] Version number correct
- [ ] Provisioning profile valid
- [ ] Code signing successful

### 2. Android Build Verification

```bash
# Check build output
ls -la android/app/build/outputs/bundle/stagingRelease/*.aab

# Verify version
grep -A 2 "versionCode\|versionName" android/app/build.gradle
```

**Checklist:**
- [ ] AAB file generated
- [ ] Version code incremented
- [ ] Version name correct
- [ ] Keystore signing successful
- [ ] Build variant: `stagingRelease`

### 3. Environment Injection Verification

```bash
# Check Capacitor config
grep -A 10 "Environment" capacitor.config.ts

# Should show staging environment variables
```

**Checklist:**
- [ ] Environment variables injected
- [ ] `NEXT_PUBLIC_APP_ENV=staging` set
- [ ] API URLs point to staging
- [ ] Sentry DSN is staging
- [ ] Feature flags use staging environment

---

## Service Integration Verification

### 1. Sentry Verification

**Setup:**
1. Go to Sentry dashboard
2. Select staging project
3. Check configuration

**Verification:**
```bash
# Check Sentry config
grep "NEXT_PUBLIC_SENTRY_DSN" .env.staging

# Test error capture (staging only)
curl -X GET "https://staging.sparecarry.com/api/health/error-test?type=sentry"
```

**Checklist:**
- [ ] Sentry DSN configured
- [ ] Environment set to "staging"
- [ ] Release tracking enabled
- [ ] Sourcemaps uploaded
- [ ] Test error captured in Sentry
- [ ] Performance monitoring enabled
- [ ] PII redaction working

**Verify in Sentry Dashboard:**
- [ ] Errors appear in Issues
- [ ] Performance data in Performance
- [ ] Releases tracked
- [ ] Sourcemaps available

### 2. Feature Flags Verification

**Setup:**
1. Go to Unleash dashboard
2. Select staging environment
3. Create/verify flags

**Verification:**
```bash
# Check feature flag config
grep "NEXT_PUBLIC_UNLEASH" .env.staging

# Test in browser console (on staging)
# window.__UNLEASH__ should exist
```

**Checklist:**
- [ ] Unleash URL configured
- [ ] Client key configured
- [ ] Flags load in app
- [ ] `FF_STAGING_ONLY` flag exists
- [ ] Flags toggle correctly
- [ ] Fallback to safe defaults works

**Test Flags:**
```typescript
// In browser console on staging
// Check if flags are loaded
localStorage.getItem('sparecarry_feature_flags')

// Should return JSON with flags
```

### 3. Stripe Webhooks Verification

**Setup:**
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://staging.sparecarry.com/api/webhooks/stripe`
3. Select events to listen to
4. Copy webhook signing secret

**Verification:**
```bash
# Check webhook secret
grep "STRIPE_WEBHOOK_SECRET" .env.staging

# Test webhook (use Stripe CLI)
stripe listen --forward-to https://staging.sparecarry.com/api/webhooks/stripe
stripe trigger payment_intent.succeeded
```

**Checklist:**
- [ ] Webhook endpoint configured
- [ ] Webhook secret set
- [ ] Signature verification working
- [ ] Test events received
- [ ] Events processed correctly
- [ ] Error handling for invalid events

**Verify in Stripe Dashboard:**
- [ ] Webhook events received
- [ ] Events processed successfully
- [ ] No failed deliveries

### 4. Supabase Verification

**Setup:**
1. Go to Supabase Dashboard
2. Select staging project
3. Verify configuration

**Verification:**
```bash
# Check Supabase config
grep "NEXT_PUBLIC_SUPABASE" .env.staging

# Test connection (in app)
# Should connect without errors
```

**Checklist:**
- [ ] Supabase URL configured
- [ ] Anon key configured
- [ ] Service role key configured (server-only)
- [ ] Database accessible
- [ ] Authentication working
- [ ] Storage accessible
- [ ] Realtime working

**Verify in Supabase Dashboard:**
- [ ] Database tables exist
- [ ] RLS policies configured
- [ ] Storage buckets configured
- [ ] Authentication providers configured

---

## TestFlight Submission

### 1. Prepare for Submission

```bash
# Ensure latest build
cd ios
fastlane ios deploy_staging

# Or use GitHub Actions artifact
# Download from: GitHub Actions > Artifacts > ios-staging-ipa
```

### 2. Upload to TestFlight

**Option A: Automated (Fastlane)**

```bash
cd ios
fastlane ios deploy_staging
# Automatically uploads to TestFlight
```

**Option B: Manual (Xcode)**

1. Open Xcode
2. Product > Archive
3. Distribute App > App Store Connect
4. Upload > Next
5. Select provisioning profile
6. Upload

### 3. Configure TestFlight

1. Go to **App Store Connect > TestFlight**
2. Wait for build processing (5-10 minutes)
3. Add build to internal testing:
   - Select build
   - Click "Add to Internal Testing"
   - Add testers (up to 100)
4. Add build to external testing (optional):
   - Create external testing group
   - Add build
   - Submit for Beta App Review (first time only)

### 4. TestFlight Checklist

- [ ] Build uploaded successfully
- [ ] Build processing complete
- [ ] Internal testers added
- [ ] External testing group created (if needed)
- [ ] Beta App Review submitted (first time)
- [ ] Testers notified
- [ ] TestFlight link shared

### 5. TestFlight Links

**Internal Testing:**
- Testers receive email invitation
- Or use TestFlight app with Apple ID

**External Testing:**
- Public TestFlight link (after Beta App Review approval)
- Share link with beta testers

---

## Play Store Submission

### 1. Prepare for Submission

```bash
# Ensure latest build
cd android
fastlane android deploy_staging

# Or use GitHub Actions artifact
# Download from: GitHub Actions > Artifacts > android-staging-aab
```

### 2. Upload to Play Store

**Option A: Automated (Fastlane)**

```bash
cd android
fastlane android deploy_staging
# Automatically uploads to Internal Testing
```

**Option B: Manual (Play Console)**

1. Go to **Play Console > Internal testing**
2. Click **"Create new release"**
3. Upload AAB file
4. Add release notes
5. Review and publish

### 3. Configure Internal Testing

1. Go to **Play Console > Testing > Internal testing**
2. Create internal testing track (if not exists)
3. Add testers:
   - Email addresses
   - Google Groups
   - Google+ Communities
4. Upload build to track
5. Review and publish

### 4. Play Store Checklist

- [ ] AAB uploaded successfully
- [ ] Release notes added
- [ ] Internal testing track configured
- [ ] Testers added
- [ ] Build published
- [ ] Testers notified
- [ ] Play Store link shared

### 5. Play Store Links

**Internal Testing:**
- Testers receive email invitation
- Or use opt-in URL: `https://play.google.com/apps/internaltest/[test-id]`

---

## Post-Deployment Verification

### 1. Web Staging Verification

**URL**: `https://staging.sparecarry.com`

**Checklist:**
- [ ] Homepage loads
- [ ] No console errors
- [ ] API endpoints respond
- [ ] Authentication works
- [ ] Feature flags load
- [ ] Sentry initialized
- [ ] Analytics tracking

**Test Critical Flows:**
```bash
# Sign up
curl -X POST https://staging.sparecarry.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Should return: 200 OK or 201 Created
```

- [ ] Sign up flow works
- [ ] Login flow works
- [ ] Trip creation works
- [ ] Request creation works
- [ ] Match creation works
- [ ] Payment flow works (test mode)
- [ ] Chat works

### 2. iOS TestFlight Verification

**Installation:**
1. Install TestFlight app
2. Accept invitation
3. Install SpareCarry beta

**Checklist:**
- [ ] App installs successfully
- [ ] App launches without crashes
- [ ] Splash screen displays
- [ ] Environment variables correct
- [ ] API endpoints point to staging
- [ ] Push notifications work
- [ ] Feature flags work

**Test Critical Flows:**
- [ ] Sign up
- [ ] Login
- [ ] Create trip
- [ ] Create request
- [ ] Match creation
- [ ] Payment (test mode)
- [ ] Chat
- [ ] Push notifications

### 3. Android Play Store Verification

**Installation:**
1. Accept invitation
2. Install from Play Store

**Checklist:**
- [ ] App installs successfully
- [ ] App launches without crashes
- [ ] Splash screen displays
- [ ] Environment variables correct
- [ ] API endpoints point to staging
- [ ] Push notifications work
- [ ] Feature flags work

**Test Critical Flows:**
- [ ] Sign up
- [ ] Login
- [ ] Create trip
- [ ] Create request
- [ ] Match creation
- [ ] Payment (test mode)
- [ ] Chat
- [ ] Push notifications

### 4. Monitoring Verification

**Sentry:**
- [ ] Errors appear in Issues
- [ ] Performance data tracked
- [ ] Releases tracked
- [ ] Sourcemaps available
- [ ] User context set

**Analytics:**
- [ ] Events tracked in Google Analytics
- [ ] Events tracked in Meta Pixel
- [ ] Custom events firing

**Telemetry:**
- [ ] User events tracked
- [ ] Performance metrics tracked
- [ ] API latency tracked

---

## Tester QA Script

Provide this script to beta testers for systematic testing.

### Functional Testing

#### 1. Onboarding
- [ ] Sign up with email
- [ ] Verify email (if required)
- [ ] Complete profile
- [ ] Onboarding flow completes

#### 2. Authentication
- [ ] Login with email/password
- [ ] Login with Google (if available)
- [ ] Login with Apple (iOS only)
- [ ] Logout works
- [ ] Session persists after app close

#### 3. Trip Creation (Travelers)
- [ ] Create plane trip
- [ ] Create boat trip
- [ ] Add route (from/to)
- [ ] Add dates
- [ ] Add capacity
- [ ] Save trip
- [ ] Trip appears in list

#### 4. Request Creation (Requesters)
- [ ] Create delivery request
- [ ] Add item details
- [ ] Add route (from/to)
- [ ] Add deadline
- [ ] Add weight
- [ ] Set reward amount
- [ ] Save request
- [ ] Request appears in list

#### 5. Matching
- [ ] View available trips/requests
- [ ] Match appears when criteria met
- [ ] Accept match
- [ ] Match status updates
- [ ] Notification received (if enabled)

#### 6. Payment (Test Mode)
- [ ] Initiate payment
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Complete payment
- [ ] Payment confirmation received
- [ ] Escrow created

#### 7. Chat
- [ ] Send message
- [ ] Receive message
- [ ] Message appears in chat
- [ ] Notifications work (if enabled)

#### 8. Profile
- [ ] View profile
- [ ] Edit profile
- [ ] Update settings
- [ ] View trip/request history

### Performance Testing

#### 1. App Launch
- [ ] Cold start < 3 seconds
- [ ] Warm start < 1 second
- [ ] No crashes on launch

#### 2. Navigation
- [ ] Page transitions smooth
- [ ] No lag when scrolling
- [ ] Images load quickly
- [ ] No memory leaks

#### 3. API Response
- [ ] API calls complete < 2 seconds
- [ ] No timeout errors
- [ ] Error handling works

#### 4. Battery Usage
- [ ] Battery drain reasonable
- [ ] No excessive background activity

### UX Testing

#### 1. Design
- [ ] UI matches design
- [ ] Colors correct
- [ ] Fonts readable
- [ ] Icons display correctly

#### 2. Responsiveness
- [ ] Works on different screen sizes
- [ ] Landscape mode works (if supported)
- [ ] Keyboard doesn't cover inputs

#### 3. Accessibility
- [ ] Text readable
- [ ] Buttons tappable
- [ ] Error messages clear
- [ ] Loading states visible

#### 4. Edge Cases
- [ ] Offline handling
- [ ] Poor network handling
- [ ] Invalid input handling
- [ ] Error recovery

### Device-Specific Testing

#### iOS
- [ ] Works on iPhone (various models)
- [ ] Works on iPad (if supported)
- [ ] Push notifications work
- [ ] App Store guidelines compliance

#### Android
- [ ] Works on various Android versions
- [ ] Works on different screen sizes
- [ ] Push notifications work
- [ ] Play Store guidelines compliance

### Feedback Collection

**Report Issues:**
- [ ] Use TestFlight/Play Store feedback
- [ ] Or email: [support email]
- [ ] Include: device, OS version, steps to reproduce

**Report Bugs:**
- [ ] Screenshot/video if possible
- [ ] Error message (if any)
- [ ] Steps to reproduce
- [ ] Expected vs actual behavior

---

## Rollback Plan

### Immediate Rollback (Critical Issues)

#### Web Rollback
```bash
# Option 1: Revert Vercel deployment
vercel rollback

# Option 2: Deploy previous build
git checkout [previous-commit]
pnpm build:staging
vercel --prod
```

#### Mobile Rollback
1. **Stop distributing current build**
   - TestFlight: Remove from testing groups
   - Play Store: Unpublish from Internal Testing

2. **Push hotfix (if possible)**
   ```bash
   # Fix issue
   git checkout -b hotfix/critical-issue
   # Make fix
   git commit -m "fix: critical issue"
   git push origin hotfix/critical-issue
   
   # Deploy
   cd ios && fastlane ios deploy_staging
   cd android && fastlane android deploy_staging
   ```

3. **Or wait for next build**
   - Notify testers of delay
   - Provide timeline for fix

### Gradual Rollback

#### Feature Flag Rollback
```bash
# Disable feature flag in Unleash
# Go to Unleash dashboard
# Toggle FF_STAGING_ONLY to OFF
```

#### Partial Rollback
- Reduce rollout percentage
- Monitor metrics
- Fix issues
- Resume rollout when stable

### Communication Plan

1. **Notify Testers**
   - Email: "Beta build issue - temporary rollback"
   - Include: issue description, timeline for fix

2. **Update Status**
   - GitHub: Create issue
   - Status page: Update status
   - Slack: Notify team

3. **Investigation**
   - Review Sentry errors
   - Check logs
   - Reproduce issue
   - Identify root cause

4. **Fix and Redeploy**
   - Fix issue
   - Test fix
   - Deploy new build
   - Notify testers

---

## Critical Path Checklist

### Pre-Launch (Must Complete)

- [ ] **Security Audit** - All checks pass
- [ ] **Environment Setup** - All variables configured
- [ ] **Code Quality** - All tests pass
- [ ] **Build Verification** - Web and mobile build successfully
- [ ] **Service Integration** - Sentry, Feature Flags, Stripe verified
- [ ] **Preflight Check** - `pnpm preflight:beta` passes

### Launch Day

- [ ] **Deploy Web** - Staging web deployed and verified
- [ ] **Build Mobile** - iOS and Android builds complete
- [ ] **Upload to Stores** - TestFlight and Play Store
- [ ] **Configure Testing** - Testers added, groups configured
- [ ] **Post-Deployment** - All services verified

### Post-Launch (First 24 Hours)

- [ ] **Monitor Sentry** - No critical errors
- [ ] **Collect Feedback** - Tester feedback received
- [ ] **Address Issues** - Critical issues fixed
- [ ] **Update Status** - Team notified of status

### First Week

- [ ] **Regular Monitoring** - Daily Sentry checks
- [ ] **Feedback Review** - Review and prioritize feedback
- [ ] **Performance Review** - Check performance metrics
- [ ] **Plan Next Release** - Based on feedback

---

## Quick Reference Commands

### Pre-Deployment
```bash
pnpm preflight:beta
pnpm test
pnpm build:staging
pnpm validate:export
```

### Deployment
```bash
# Web
git push origin staging

# Mobile (iOS)
cd ios && fastlane ios deploy_staging

# Mobile (Android)
cd android && fastlane android deploy_staging
```

### Verification
```bash
# Check staging URL
curl -I https://staging.sparecarry.com

# Test Sentry
curl https://staging.sparecarry.com/api/health/error-test?type=sentry

# Check version
pnpm version:bump --dry-run
```

### Rollback
```bash
# Web
vercel rollback

# Mobile
# Stop distributing in TestFlight/Play Store
# Or push hotfix
```

---

## Support Contacts

- **GitHub Issues**: [Link to issues]
- **Slack Channel**: [Link to channel]
- **Email**: [Support email]
- **Status Page**: [Link to status page]

---

## Version History

- **v1.0.0** (2024-12-19) - Initial beta launch checklist

---

**✅ Ready for Beta Launch!**

Follow this checklist step-by-step to ensure a smooth beta launch. Good luck! 🚀
