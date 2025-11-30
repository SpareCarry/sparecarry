# Beta Launch Rehearsal Guide

**Complete "day-zero" beta launch rehearsal for SpareCarry**

**Last Updated**: 2024-12-19  
**Version**: 1.0.0

---

## 🎯 Overview

This guide provides a complete dry-run of the beta launch process. Execute all steps in order to ensure readiness for actual launch.

**Duration**: 4-6 hours  
**Team Required**: DEV + QA + PM  
**Environment**: Staging only (no production changes)

---

## 📋 Pre-Rehearsal Checklist

Before starting, ensure:

- [ ] All team members available
- [ ] Staging environment accessible
- [ ] Test accounts created
- [ ] All scripts tested locally
- [ ] Communication channels ready (Slack, email)
- [ ] Documentation reviewed

---

## 🚀 Rehearsal Flow

```
┌─────────────────────────────────────────────────────────────┐
│              BETA LAUNCH REHEARSAL FLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Phase 1: Pre-Rehearsal Setup                               │
│  Phase 2: Script Execution                                      │
│  Phase 3: Build Verification                                 │
│  Phase 4: Deployment Dry-Run                                 │
│  Phase 5: Service Verification                               │
│  Phase 6: Go/No-Go Decision                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Pre-Rehearsal Setup

### Step 1.1: Environment Preparation

```bash
# Pull latest code
git pull origin main

# Install dependencies
pnpm install

# Verify environment files
ls -la .env.staging
```

**Checklist**:

- [ ] Code up to date
- [ ] Dependencies installed
- [ ] `.env.staging` exists
- [ ] All team members have access

---

### Step 1.2: Team Briefing

**Agenda**:

1. Review rehearsal objectives
2. Assign roles:
   - **DEV**: Script execution, build verification
   - **QA**: Testing, validation
   - **PM**: Documentation, coordination
3. Review timeline
4. Set up communication channels

**Checklist**:

- [ ] All team members briefed
- [ ] Roles assigned
- [ ] Timeline agreed
- [ ] Communication channels ready

---

## Phase 2: Script Execution

### Step 2.1: Preflight Check

```bash
# Run preflight check
pnpm preflight:beta
```

**Expected Output**:

- ✅ All required files exist
- ✅ Build scripts configured
- ✅ Fastlane lanes configured
- ✅ GitHub workflows exist
- ✅ Dependencies installed
- ✅ Environment variables validated

**Checklist**:

- [ ] Preflight check passes
- [ ] All items green
- [ ] No critical failures
- [ ] Warnings reviewed

---

### Step 2.2: Environment Validation

```bash
# Validate environment variables
pnpm validate:env staging
```

**Expected Output**:

- ✅ All required variables present
- ✅ Format validation passes
- ✅ No missing variables

**Checklist**:

- [ ] Environment validation passes
- [ ] All required variables set
- [ ] Format validation passes
- [ ] Optional variables noted

---

### Step 2.3: Database Migration

```bash
# Run database migrations
pnpm db:migrate:staging
```

**Expected Output**:

- ✅ Schema applied successfully
- ✅ Storage buckets created
- ✅ Realtime configured
- ✅ Migrations applied
- ✅ Meetup locations seeded

**Checklist**:

- [ ] Migrations complete
- [ ] Tables created
- [ ] RLS policies enabled
- [ ] Storage buckets created
- [ ] No migration errors

---

### Step 2.4: Database Seeding

```bash
# Seed test data
pnpm db:seed:staging
```

**Expected Output**:

- ✅ 5 test users created
- ✅ 3 test trips created
- ✅ 5 test requests created
- ✅ 3 test matches created
- ✅ Test messages created
- ✅ Test delivery created

**Checklist**:

- [ ] Seed complete
- [ ] Test data created
- [ ] Test credentials available
- [ ] Data visible in Supabase Dashboard

---

### Step 2.5: Build Verification

```bash
# Build web application
pnpm build:staging

# Validate export
pnpm validate:export

# Build mobile applications
pnpm mobile:build:staging
```

**Expected Output**:

- ✅ Build completes successfully
- ✅ `out/` directory created
- ✅ Export validation passes
- ✅ Mobile builds complete
- ✅ Capacitor sync successful

**Checklist**:

- [ ] Web build successful
- [ ] Export validation passes
- [ ] Mobile builds successful
- [ ] No build errors
- [ ] Build artifacts generated

---

### Step 2.6: Mobile Build Verification

```bash
# Verify iOS build (after Xcode build)
pnpm verify:mobile ios path/to/app.ipa

# Verify Android build (after Android Studio build)
pnpm verify:mobile android path/to/app.aab
```

**Expected Output**:

- ✅ Bundle ID/Package name correct (staging suffix)
- ✅ Version numbers correct
- ✅ Signing valid
- ✅ Environment variables embedded

**Checklist**:

- [ ] iOS build verified
- [ ] Android build verified
- [ ] All checks pass
- [ ] Staging identifiers correct

---

## Phase 3: Build Verification

### Step 3.1: Web Build Verification

```bash
# Start local server
pnpm start

# Or deploy to staging
# (Via GitHub Actions or manual Vercel deploy)
```

**Verification**:

1. Open staging URL in browser
2. Verify homepage loads
3. Check browser console for errors
4. Test critical flows:
   - Sign up
   - Login
   - Create trip
   - Create request

**Checklist**:

- [ ] Web app accessible
- [ ] No console errors
- [ ] Critical flows work
- [ ] Environment variables loaded
- [ ] Feature flags work

---

### Step 3.2: iOS Build Verification

**Steps**:

1. Open Xcode project: `pnpm mobile:ios`
2. Select "Any iOS Device" or simulator
3. Build and run
4. Verify app launches
5. Test critical flows

**Checklist**:

- [ ] App builds successfully
- [ ] App launches without crashes
- [ ] Environment variables correct
- [ ] API endpoints point to staging
- [ ] Critical flows work

---

### Step 3.3: Android Build Verification

**Steps**:

1. Open Android Studio project: `pnpm mobile:android`
2. Select device/emulator
3. Build and run
4. Verify app launches
5. Test critical flows

**Checklist**:

- [ ] App builds successfully
- [ ] App launches without crashes
- [ ] Environment variables correct
- [ ] API endpoints point to staging
- [ ] Critical flows work

---

## Phase 4: Deployment Dry-Run

### Step 4.1: Web Deployment (Dry-Run)

**Option A: GitHub Actions (Dry-Run)**

```bash
# Create a test branch
git checkout -b rehearsal/staging-deploy

# Push to trigger workflow (or trigger manually)
git push origin rehearsal/staging-deploy

# Monitor workflow execution
# (Go to GitHub Actions dashboard)
```

**Option B: Manual Vercel Deploy (Dry-Run)**

```bash
# Deploy to staging (not production)
vercel --env-file=.env.staging

# Verify deployment
curl https://staging.sparecarry.com/api/health
```

**Checklist**:

- [ ] Deployment successful
- [ ] Staging URL accessible
- [ ] Health check passes
- [ ] No deployment errors
- [ ] Rollback plan ready

---

### Step 4.2: iOS TestFlight Upload (Dry-Run)

**Option A: Fastlane (Dry-Run)**

```bash
cd ios
fastlane ios beta_staging --dry_run
```

**Option B: Manual Xcode (Dry-Run)**

1. Open Xcode
2. Product → Archive
3. Window → Organizer
4. Select archive
5. **DO NOT** distribute (dry-run only)
6. Verify archive created

**Checklist**:

- [ ] Archive created successfully
- [ ] Build number correct
- [ ] Version number correct
- [ ] Signing valid
- [ ] Ready for actual upload

---

### Step 4.3: Android Play Store Upload (Dry-Run)

**Option A: Fastlane (Dry-Run)**

```bash
cd android
fastlane android beta_staging --dry_run
```

**Option B: Manual (Dry-Run)**

1. Build AAB in Android Studio
2. **DO NOT** upload to Play Console
3. Verify AAB created
4. Verify signing valid

**Checklist**:

- [ ] AAB created successfully
- [ ] Build number correct
- [ ] Version number correct
- [ ] Signing valid
- [ ] Ready for actual upload

---

## Phase 5: Service Verification

### Step 5.1: Health Check

```bash
# Check health endpoint
curl https://staging.sparecarry.com/api/health | jq .
```

**Expected Response**:

```json
{
  "status": "ok",
  "services": {
    "supabase": { "status": "ok" },
    "stripe": { "status": "ok" },
    "sentry": { "status": "ok" },
    "unleash": { "status": "ok" },
    "env": { "status": "ok" }
  }
}
```

**Checklist**:

- [ ] Health check returns 200 OK
- [ ] All services show "ok"
- [ ] No degraded services
- [ ] Response time < 1 second

---

### Step 5.2: Sentry Verification

```bash
# Test error endpoint (staging only)
curl https://staging.sparecarry.com/api/health/error-test?type=sentry
```

**Steps**:

1. Trigger test error
2. Check Sentry Dashboard
3. Verify error captured
4. Verify source maps available
5. Verify PII redaction working

**Checklist**:

- [ ] Error captured in Sentry
- [ ] Source maps available
- [ ] PII redaction working
- [ ] Performance traces visible
- [ ] Release tracked

---

### Step 5.3: Feature Flags Verification

```bash
# Check feature flag config
grep "NEXT_PUBLIC_UNLEASH" .env.staging
```

**Steps**:

1. Go to Unleash Dashboard
2. Verify flags configured
3. Test flag toggling
4. Verify flags load in app
5. Test fallback behavior

**Checklist**:

- [ ] Flags load in app
- [ ] Flags toggle correctly
- [ ] Fallback works
- [ ] Environment-specific flags work
- [ ] Admin UI accessible

---

### Step 5.4: Stripe Webhooks Verification

```bash
# Test webhook (using Stripe CLI)
stripe listen --forward-to https://staging.sparecarry.com/api/webhooks/stripe
stripe trigger payment_intent.succeeded
```

**Steps**:

1. Trigger test webhook event
2. Verify webhook received
3. Verify signature verification works
4. Verify event processed
5. Check Stripe Dashboard

**Checklist**:

- [ ] Webhook endpoint configured
- [ ] Webhook events received
- [ ] Signature verification works
- [ ] Events processed correctly
- [ ] No failed deliveries

---

### Step 5.5: Load Testing

```bash
# Run load tests
pnpm loadtest
```

**Expected Output**:

- ✅ Load tests complete
- ✅ Thresholds met (p95 < 500ms, error rate < 0.5%)
- ✅ No critical failures

**Checklist**:

- [ ] Load tests complete
- [ ] Performance acceptable
- [ ] Error rate < 0.5%
- [ ] Response times acceptable
- [ ] No timeouts

---

## Phase 6: Go/No-Go Decision

### Step 6.1: Review Results

**Review all results from previous phases**:

- [ ] Preflight check: ✅ PASS
- [ ] Environment validation: ✅ PASS
- [ ] Database migration: ✅ PASS
- [ ] Database seeding: ✅ PASS
- [ ] Build verification: ✅ PASS
- [ ] Mobile builds: ✅ PASS
- [ ] Health check: ✅ PASS
- [ ] Sentry: ✅ PASS
- [ ] Feature flags: ✅ PASS
- [ ] Stripe webhooks: ✅ PASS
- [ ] Load tests: ✅ PASS

---

### Step 6.2: Go/No-Go Checklist

**All items must be GREEN for GO decision**:

#### Critical (Must Pass)

- [ ] **Security**: No critical vulnerabilities
- [ ] **Builds**: All builds successful
- [ ] **Services**: All services healthy
- [ ] **Database**: Migrations and seed complete
- [ ] **Environment**: All variables configured
- [ ] **Health Check**: All services OK

#### Important (Should Pass)

- [ ] **Tests**: All tests passing
- [ ] **Linting**: No critical lint errors
- [ ] **Type Checking**: 100% type coverage
- [ ] **Performance**: Load tests pass
- [ ] **Documentation**: Complete

#### Nice to Have

- [ ] **Coverage**: Test coverage > 80%
- [ ] **Load Tests**: All thresholds met
- [ ] **Mobile E2E**: All tests passing

---

### Step 6.3: Decision Matrix

| Criteria      | Status | Weight    | Score |
| ------------- | ------ | --------- | ----- |
| Security      | ✅/❌  | Critical  | 10    |
| Builds        | ✅/❌  | Critical  | 10    |
| Services      | ✅/❌  | Critical  | 10    |
| Database      | ✅/❌  | Critical  | 10    |
| Environment   | ✅/❌  | Critical  | 10    |
| Tests         | ✅/❌  | Important | 5     |
| Performance   | ✅/❌  | Important | 5     |
| Documentation | ✅/❌  | Important | 5     |

**Scoring**:

- **80+ points**: ✅ **GO** - Ready for beta launch
- **60-79 points**: ⚠️ **CONDITIONAL GO** - Address issues before launch
- **< 60 points**: ❌ **NO-GO** - Fix critical issues first

---

### Step 6.4: Communication

**If GO**:

1. Notify team: "Rehearsal complete - Ready for beta launch"
2. Schedule actual launch date
3. Prepare launch announcement
4. Finalize tester list

**If NO-GO**:

1. Document issues found
2. Prioritize fixes
3. Schedule follow-up rehearsal
4. Update timeline

---

## 📊 Rehearsal Results Template

```markdown
# Beta Launch Rehearsal Results

**Date**: YYYY-MM-DD
**Team**: [Names]
**Duration**: X hours

## Results Summary

- ✅ Passed: X
- ⚠️ Warnings: X
- ❌ Failed: X

## Phase Results

### Phase 1: Pre-Rehearsal Setup

- Status: ✅/❌
- Notes: ...

### Phase 2: Script Execution

- Status: ✅/❌
- Notes: ...

### Phase 3: Build Verification

- Status: ✅/❌
- Notes: ...

### Phase 4: Deployment Dry-Run

- Status: ✅/❌
- Notes: ...

### Phase 5: Service Verification

- Status: ✅/❌
- Notes: ...

### Phase 6: Go/No-Go Decision

- Decision: ✅ GO / ❌ NO-GO
- Score: X/100
- Notes: ...

## Issues Found

1. Issue description
   - Severity: Critical/High/Medium/Low
   - Status: Fixed/Pending
   - Owner: [Name]

## Next Steps

1. Action item
2. Action item
3. Action item
```

---

## 🆘 Troubleshooting During Rehearsal

### Issue: Preflight Check Fails

**Solution**:

1. Review error messages
2. Fix missing files/variables
3. Re-run preflight check
4. Document fixes

---

### Issue: Database Migration Fails

**Solution**:

1. Check Supabase credentials
2. Verify SQL syntax
3. Check database connection
4. Review migration logs
5. Rollback if needed: `pnpm db:rollback:staging`

---

### Issue: Build Fails

**Solution**:

1. Check build logs
2. Verify dependencies installed
3. Check environment variables
4. Review TypeScript errors
5. Fix and rebuild

---

### Issue: Health Check Fails

**Solution**:

1. Check service credentials
2. Verify network connectivity
3. Check service status
4. Review error logs
5. Test individual services

---

## ✅ Post-Rehearsal Actions

### Immediate (Within 24 Hours)

- [ ] Document all issues found
- [ ] Prioritize fixes
- [ ] Update documentation
- [ ] Share results with team

### Short-Term (Within 1 Week)

- [ ] Fix all critical issues
- [ ] Re-run failed tests
- [ ] Update scripts if needed
- [ ] Schedule follow-up rehearsal (if needed)

### Long-Term (Before Launch)

- [ ] Complete all fixes
- [ ] Final rehearsal (if needed)
- [ ] Finalize launch date
- [ ] Prepare launch materials

---

## 📚 Related Documentation

- **BETA_LAUNCH_CHECKLIST.md**: Detailed launch checklist
- **BETA_LAUNCH_INTEGRATOR.md**: Master launch guide
- **QA_SIMULATION.md**: QA testing manual
- **STAGING_DB_SETUP.md**: Database setup guide

---

**Last Updated**: 2024-12-19  
**Version**: 1.0.0
