# Beta Launch Integrator - Master Guide

**Complete step-by-step guide from scratch to beta launch**

**Last Updated**: 2024-12-19  
**Version**: 1.0.0

---

## 🎯 Overview

This document combines all beta launch procedures into a single, executable flow. Follow these steps in order to launch SpareCarry to beta testing.

```
┌─────────────────────────────────────────────────────────────┐
│                    BETA LAUNCH FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Setup → 2. Validate → 3. Build → 4. Deploy → 5. Verify │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pull    │→ │ Preflight│→ │  Build   │→ │  Deploy  │   │
│  │   Repo   │  │   Check  │  │  Mobile  │  │ Staging  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Health  │→ │  Load    │→ │ TestFlight│→ │  Verify │   │
│  │  Check   │  │   Test   │  │  / Play  │  │ Sentry   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ **Git** installed and configured
- ✅ **Node.js** 18+ and **pnpm** installed
- ✅ **Supabase CLI** (optional, for direct DB access)
- ✅ **Fastlane** installed (for mobile deployment)
- ✅ **Xcode** (for iOS builds) or **Android Studio** (for Android builds)
- ✅ **Access to**:
  - GitHub repository
  - Supabase Dashboard (staging project)
  - Vercel Dashboard (staging project)
  - App Store Connect (for TestFlight)
  - Google Play Console (for Internal Testing)
  - Sentry Dashboard
  - Unleash Dashboard (if using)

---

## 🚀 Step-by-Step Execution

### Phase 1: Initial Setup

#### Step 1.1: Pull Repository

```bash
# Clone or pull latest code
git clone https://github.com/your-org/sparecarry.git
cd sparecarry

# Or if already cloned
git pull origin main
git checkout main
```

**Verification**:

- [ ] Repository is up to date
- [ ] On correct branch (usually `main` or `staging`)

---

#### Step 1.2: Install Dependencies

```bash
# Install all dependencies
pnpm install

# Verify installation
pnpm list --depth=0
```

**Verification**:

- [ ] No installation errors
- [ ] All dependencies listed in `package.json` are installed

---

#### Step 1.3: Create Environment Files

```bash
# Copy environment template
cp .env.local.example .env.local
cp .env.local.example .env.staging

# Edit .env.staging with staging values
# (See STAGING_DB_SETUP.md for required variables)
```

**Required Variables** (see `GITHUB_SECRETS_MAPPING.md` for full list):

- `NEXT_PUBLIC_APP_ENV=staging`
- `NEXT_PUBLIC_APP_URL=https://staging.sparecarry.com`
- `NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- `STAGING_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
- `STRIPE_SECRET_KEY=sk_test_...`
- `NEXT_PUBLIC_SENTRY_DSN=https://...@...ingest.sentry.io/...`
- `NEXT_PUBLIC_UNLEASH_URL=https://unleash.example.com`
- `NEXT_PUBLIC_UNLEASH_CLIENT_KEY=your-key`

**Verification**:

- [ ] `.env.staging` file exists
- [ ] All required variables are set
- [ ] No secrets committed to git

---

### Phase 2: Validation

#### Step 2.1: Run Preflight Check

```bash
# Run comprehensive preflight check
pnpm preflight:beta
```

**What it checks**:

- Environment files exist
- Required scripts exist
- Fastlane configuration
- GitHub workflows
- Dependencies installed
- Environment variables validated

**Verification**:

- [ ] All checks pass (green ✅)
- [ ] No critical failures (red ❌)
- [ ] Warnings reviewed (yellow ⚠️)

---

#### Step 2.2: Validate Environment Variables

```bash
# Validate all environment variables
pnpm validate:env staging
```

**What it validates**:

- Core application variables
- Supabase configuration
- Stripe keys (test mode for staging)
- Sentry DSN format
- Unleash configuration
- Push notification keys
- OAuth credentials

**Verification**:

- [ ] All required variables pass
- [ ] Optional variables noted
- [ ] Format validation passes

---

#### Step 2.3: Verify Code Quality

```bash
# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Run tests
pnpm test

# Run E2E tests (if applicable)
pnpm test:e2e
```

**Verification**:

- [ ] TypeScript compiles without errors
- [ ] Linting passes
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)

---

### Phase 3: Database Setup

#### Step 3.1: Create Staging Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Configure:
   - **Name**: `sparecarry-staging`
   - **Database Password**: Generate strong password
   - **Region**: Choose closest to staging server
4. Wait for project creation (2-3 minutes)
5. Get credentials:
   - Project URL: `https://xxxxx.supabase.co`
   - Service Role Key: From Settings → API

**Verification**:

- [ ] Project created successfully
- [ ] Credentials saved to `.env.staging`
- [ ] Can access Supabase Dashboard

---

#### Step 3.2: Run Database Migrations

```bash
# Run all migrations
pnpm db:migrate:staging
```

**What it does**:

- Applies main schema (`supabase/schema.sql`)
- Sets up storage buckets
- Configures realtime
- Applies additional migrations
- Seeds meetup locations

**Verification**:

- [ ] All migrations applied successfully
- [ ] Tables created in Supabase Dashboard
- [ ] RLS policies enabled
- [ ] Storage buckets created

---

#### Step 3.3: Seed Test Data

```bash
# Seed staging database with test data
pnpm db:seed:staging

# Or with reset (deletes existing data first)
pnpm db:seed:staging --reset
```

**What it creates**:

- 5 test users (travelers, requesters, sailor)
- 3 test trips
- 5 test requests
- 3 test matches
- Test messages and conversations
- 1 test delivery with dispute

**Verification**:

- [ ] Test data created successfully
- [ ] Can log in with test credentials
- [ ] Data visible in Supabase Dashboard

**Test Credentials**:

```
Traveler 1: test-traveler1@sparecarry.test / Test123!@#
Requester 1: test-requester1@sparecarry.test / Test123!@#
```

---

### Phase 4: Build Verification

#### Step 4.1: Build Web Application

```bash
# Build for staging
pnpm build:staging

# Validate static export
pnpm validate:export
```

**Verification**:

- [ ] Build completes without errors
- [ ] `out/` folder created
- [ ] Static export validation passes
- [ ] No missing assets

---

#### Step 4.2: Build Mobile Applications

```bash
# Build iOS and Android for staging
pnpm mobile:build:staging
```

**What it does**:

- Builds Next.js app for staging
- Validates export
- Injects environment variables into Capacitor
- Syncs with native projects

**Verification**:

- [ ] Build completes successfully
- [ ] `out/` folder exists
- [ ] Capacitor sync successful
- [ ] Native projects updated

---

#### Step 4.3: Verify Mobile Builds

```bash
# Verify iOS IPA (after building in Xcode)
pnpm verify:mobile ios path/to/app.ipa

# Verify Android AAB (after building in Android Studio)
pnpm verify:mobile android path/to/app.aab
```

**What it verifies**:

- Bundle ID / Package name (staging suffix)
- Version numbers
- Code signing / Certificates
- Environment variables (if jadx available)

**Verification**:

- [ ] All checks pass
- [ ] Staging identifiers correct
- [ ] Signing valid
- [ ] Environment variables embedded

---

### Phase 5: Staging Deployment

#### Step 5.1: Deploy Web to Staging

**Option A: Automated (GitHub Actions)**

```bash
# Push to staging branch (triggers workflow)
git push origin staging

# Or trigger manually in GitHub Actions
```

**Option B: Manual (Vercel)**

```bash
# Deploy to Vercel
vercel --prod --env-file=.env.staging
```

**Verification**:

- [ ] Deployment successful
- [ ] Staging URL accessible
- [ ] Environment variables loaded
- [ ] No build errors

---

#### Step 5.2: Build Mobile Apps for Staging

**iOS (Xcode)**:

```bash
# Open in Xcode
pnpm mobile:ios

# In Xcode:
# 1. Select "Any iOS Device" or simulator
# 2. Product → Archive
# 3. Distribute App → TestFlight
# 4. Upload to TestFlight
```

**Android (Android Studio or Fastlane)**:

```bash
# Option 1: Fastlane
cd android
fastlane android beta_staging

# Option 2: Android Studio
pnpm mobile:android
# Then: Build → Generate Signed Bundle / APK
```

**Verification**:

- [ ] Builds complete successfully
- [ ] Artifacts generated (IPA/AAB)
- [ ] Version numbers correct
- [ ] Signing valid

---

### Phase 6: Service Verification

#### Step 6.1: Health Check

```bash
# Check health endpoint
curl https://staging.sparecarry.com/api/health

# Or in browser
open https://staging.sparecarry.com/api/health
```

**Expected Response**:

```json
{
  "status": "ok",
  "timestamp": "2024-12-19T...",
  "environment": "staging",
  "services": {
    "supabase": { "status": "ok", "message": "..." },
    "stripe": { "status": "ok", "message": "..." },
    "sentry": { "status": "ok", "message": "..." },
    "unleash": { "status": "ok", "message": "..." },
    "env": { "status": "ok", "message": "..." }
  }
}
```

**Verification**:

- [ ] Health check returns `200 OK`
- [ ] All services show `"status": "ok"`
- [ ] No degraded services

---

#### Step 6.2: Verify Sentry Integration

1. Go to [Sentry Dashboard](https://sentry.io)
2. Navigate to staging project
3. Check:
   - Errors are being captured
   - Performance data is flowing
   - Source maps uploaded
   - Environment is `staging`

**Verification**:

- [ ] Sentry dashboard accessible
- [ ] Test error captured (use `/api/health/error-test`)
- [ ] Performance traces visible
- [ ] Source maps working

---

#### Step 6.3: Verify Feature Flags

1. Go to Unleash Dashboard (or LaunchDarkly)
2. Verify flags are configured:
   - `enable_push_notifications` (off by default)
   - `email_notifications` (off by default)
   - `dispute_refund_flow` (off by default)
   - `FF_STAGING_ONLY` (on for staging)

**Verification**:

- [ ] Feature flag service accessible
- [ ] Flags configured correctly
- [ ] Client can fetch flags
- [ ] Fallback logic works

---

#### Step 6.4: Verify Stripe Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Webhooks
3. Verify:
   - Webhook endpoint configured: `https://staging.sparecarry.com/api/webhooks/stripe`
   - Events are being received
   - Signature verification working

**Verification**:

- [ ] Webhook endpoint configured
- [ ] Test events received
- [ ] Signature verification passes
- [ ] Events processed correctly

---

### Phase 7: Load Testing

#### Step 7.1: Run Load Tests

```bash
# Run load tests against staging
pnpm loadtest

# Or manually
cd load-tests
k6 run scenarios/steady.js --env STAGING_URL=https://staging.sparecarry.com
```

**What it tests**:

- Browse scenarios
- Post request flow
- Match flow
- Chat flow
- Payment flow (mocked)

**Verification**:

- [ ] Load tests complete
- [ ] Thresholds met (p95 < 500ms, error rate < 0.5%)
- [ ] No critical failures
- [ ] Performance acceptable

---

### Phase 8: Mobile Submission

#### Step 8.1: Submit to TestFlight (iOS)

**Option A: Fastlane**

```bash
cd ios
fastlane ios beta_staging
```

**Option B: Manual**

1. Open Xcode
2. Product → Archive
3. Window → Organizer
4. Select archive → Distribute App
5. TestFlight → Upload
6. Wait for processing (10-30 minutes)
7. Add to TestFlight group

**Verification**:

- [ ] Build uploaded successfully
- [ ] Processing complete
- [ ] Available in TestFlight
- [ ] Testers can install

---

#### Step 8.2: Submit to Play Store (Android)

**Option A: Fastlane**

```bash
cd android
fastlane android beta_staging
```

**Option B: Manual**

1. Go to [Play Console](https://play.google.com/console)
2. Navigate to Internal Testing
3. Create new release
4. Upload AAB file
5. Add release notes
6. Review and publish

**Verification**:

- [ ] AAB uploaded successfully
- [ ] Release created
- [ ] Available to testers
- [ ] Testers can install

---

### Phase 9: Post-Deployment Verification

#### Step 9.1: Verify Web Staging

```bash
# Test critical flows
curl https://staging.sparecarry.com/api/health
curl https://staging.sparecarry.com/api/auth/signup -X POST -d '{"email":"test@example.com","password":"test123"}'
```

**Checklist**:

- [ ] Homepage loads
- [ ] Authentication works
- [ ] API endpoints respond
- [ ] Database queries work
- [ ] No console errors

---

#### Step 9.2: Verify Mobile Apps

**iOS (TestFlight)**:

- [ ] App installs successfully
- [ ] App launches without crashes
- [ ] Login works
- [ ] Core features functional
- [ ] Push notifications work (if enabled)

**Android (Play Store)**:

- [ ] App installs successfully
- [ ] App launches without crashes
- [ ] Login works
- [ ] Core features functional
- [ ] Push notifications work (if enabled)

---

#### Step 9.3: Monitor Sentry

1. Go to Sentry Dashboard
2. Check:
   - Error rate < 0.1%
   - No critical errors
   - Performance metrics normal
   - No PII leakage

**Verification**:

- [ ] Error rate acceptable
- [ ] No critical issues
- [ ] Performance normal
- [ ] PII filtering working

---

### Phase 10: Rollback (If Needed)

#### Step 10.1: Determine if Rollback Needed

**Rollback triggers**:

- Critical bugs affecting > 10% of users
- Security vulnerabilities
- Data corruption
- Service outages > 5 minutes

---

#### Step 10.2: Execute Rollback

**Web (Vercel)**:

```bash
# Promote previous deployment
# Or via Vercel Dashboard → Deployments → Promote
```

**Database**:

```bash
# Rollback last migration
pnpm db:rollback:staging
```

**Mobile**:

- **iOS**: Remove build from TestFlight, notify testers
- **Android**: Deactivate release in Play Console, activate previous

**Verification**:

- [ ] Rollback completed
- [ ] Services restored
- [ ] Users notified
- [ ] Monitoring shows improvement

---

## 📊 Verification Checklist

### Pre-Launch

- [ ] Preflight check passes
- [ ] Environment variables validated
- [ ] Database migrations applied
- [ ] Test data seeded
- [ ] Web build successful
- [ ] Mobile builds successful
- [ ] Health check passes
- [ ] Sentry configured
- [ ] Feature flags configured
- [ ] Stripe webhooks configured

### Post-Launch

- [ ] Web staging accessible
- [ ] Mobile apps installable
- [ ] Health check returns OK
- [ ] Sentry error rate < 0.1%
- [ ] Load tests pass
- [ ] Testers can access apps
- [ ] No critical errors
- [ ] Performance acceptable

---

## 🔄 Quick Reference Commands

```bash
# Setup
pnpm install
cp .env.local.example .env.staging

# Validation
pnpm preflight:beta
pnpm validate:env staging

# Database
pnpm db:migrate:staging
pnpm db:seed:staging
pnpm db:rollback:staging  # If needed

# Build
pnpm build:staging
pnpm mobile:build:staging
pnpm verify:mobile ios path/to/app.ipa
pnpm verify:mobile android path/to/app.aab

# Deploy
# (Via GitHub Actions or manual)

# Verify
curl https://staging.sparecarry.com/api/health
pnpm loadtest
```

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: Preflight check fails

- **Solution**: Check error messages, fix missing files/variables

**Issue**: Database migration fails

- **Solution**: Check Supabase credentials, verify SQL syntax

**Issue**: Mobile build fails

- **Solution**: Check Capacitor sync, verify native project configs

**Issue**: Health check fails

- **Solution**: Check service credentials, verify network connectivity

**Issue**: Sentry not capturing errors

- **Solution**: Verify DSN, check source maps, verify initialization

---

## 📚 Related Documentation

- **BETA_LAUNCH_CHECKLIST.md**: Detailed checklist
- **STAGING_DB_SETUP.md**: Database setup guide
- **FINAL_READINESS_SWEEP.md**: Readiness assessment
- **RELEASE_NOTES_TEMPLATE.md**: Release notes format
- **GITHUB_SECRETS_MAPPING.md**: Secrets configuration

---

## ✅ Final Status

After completing all steps:

- ✅ **Web**: Deployed to staging
- ✅ **Mobile**: Available in TestFlight / Play Store
- ✅ **Database**: Migrated and seeded
- ✅ **Services**: All verified and working
- ✅ **Monitoring**: Sentry configured
- ✅ **Testing**: Load tests passed

**Ready for beta testing!** 🚀

---

**Last Updated**: 2024-12-19  
**Version**: 1.0.0
