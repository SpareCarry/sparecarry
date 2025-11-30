# Staging Environment Setup

This document describes how to set up and deploy the SpareCarry app to the staging environment for beta testing.

## Overview

The staging environment is a production-like environment used for:

- Beta testing on iOS TestFlight and Android Play Store Internal Testing
- Integration testing with real services (Supabase, Stripe, etc.)
- Performance monitoring and telemetry collection
- Feature flag testing and gradual rollouts

## Environment Configuration

### 1. Environment Variables

Create a `.env.staging` file in the project root with the following variables:

```bash
# Copy the template
cp .env.local.example .env.staging
```

Required variables:

- `NEXT_PUBLIC_APP_ENV=staging`
- `NEXT_PUBLIC_APP_URL=https://staging.sparecarry.com`
- `NEXT_PUBLIC_SUPABASE_URL` - Staging Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Staging Supabase anon key
- `STRIPE_SECRET_KEY` - Stripe test mode secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe test mode publishable key
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry staging DSN
- `NEXT_PUBLIC_UNLEASH_URL` - Unleash staging server URL
- `NEXT_PUBLIC_UNLEASH_CLIENT_KEY` - Unleash staging client key

See `.env.staging` for the complete list.

### 2. Supabase Staging Project

1. Create a new Supabase project for staging
2. Copy the database schema from production
3. Set up Row Level Security (RLS) policies
4. Configure storage buckets
5. Set up authentication providers

### 3. Stripe Test Mode

1. Use Stripe test mode keys (prefixed with `sk_test_` and `pk_test_`)
2. Configure test webhooks pointing to staging URL
3. Set up test products and prices

### 4. Sentry Staging Project

1. Create a new Sentry project for staging
2. Configure environment as "staging"
3. Set up alert rules for staging-specific thresholds

### 5. Feature Flags (Unleash)

1. Deploy Unleash server or use Unleash Cloud
2. Create staging environment
3. Configure feature flags for beta features

## Build Commands

### Web Build

```bash
# Build for staging
pnpm build:staging

# Validate export
pnpm validate:export
```

### Mobile Builds

```bash
# iOS staging build
pnpm mobile:build:staging

# Android staging build
pnpm mobile:build:staging
```

The mobile build scripts will:

1. Build Next.js with staging environment
2. Validate static export
3. Inject environment variables into Capacitor config
4. Sync Capacitor native projects

## Deployment

### Automated Deployment (GitHub Actions)

The staging deployment workflow (`.github/workflows/deploy_staging.yml`) runs on:

- Push to `staging` or `develop` branches
- Manual workflow dispatch

To trigger manually:

1. Go to GitHub Actions
2. Select "Deploy to Staging"
3. Click "Run workflow"
4. Choose platform (web, android, ios, or all)

### Manual Deployment

#### iOS TestFlight

```bash
cd ios
fastlane ios beta_staging
```

#### Android Play Store Internal Testing

```bash
cd android
fastlane android beta_staging
```

## Testing

### Pre-Deployment Checklist

- [ ] All tests pass (`pnpm test`)
- [ ] E2E tests pass (`pnpm test:e2e`)
- [ ] Build completes without errors
- [ ] Static export validates
- [ ] Environment variables are correctly injected
- [ ] Feature flags are configured
- [ ] Sentry is initialized
- [ ] Telemetry is working

### Post-Deployment Verification

1. **Web**: Visit staging URL and verify:
   - App loads correctly
   - API endpoints respond
   - Feature flags work
   - Telemetry events are sent

2. **iOS TestFlight**:
   - Install build from TestFlight
   - Verify app launches
   - Test critical flows (signup, login, match creation)
   - Check Sentry for errors

3. **Android Play Store**:
   - Install build from Internal Testing
   - Verify app launches
   - Test critical flows
   - Check Sentry for errors

## Monitoring

### Sentry

- **Dashboard**: https://sentry.io/organizations/your-org/projects/staging/
- **Alerts**: Configure alerts for error rates > 1%
- **Performance**: Monitor p95 response times

### Telemetry

Events tracked:

- `user.signup`
- `user.login`
- `match.created`
- `trade.initiated`
- `dispute.submitted`
- `performance.metric`

View telemetry in Sentry breadcrumbs and custom events.

## Feature Flags

Staging feature flags (via Unleash):

- `enable_push_notifications` - Enable push notifications
- `email_notifications` - Enable email notifications
- `dispute_refund_flow` - Enable dispute/refund flow
- `emergency_toggle_push` - Emergency push toggle
- `notifications_v1` - New notifications system
- `new_match_flow` - New match creation flow
- `payment_ux_improvements` - Payment UX improvements

Toggle flags in Unleash dashboard or via API.

## Troubleshooting

### Build Failures

1. Check environment variables are set
2. Verify Supabase/Stripe keys are valid
3. Check Capacitor sync completed
4. Review build logs for errors

### Mobile Build Issues

1. Verify keystore/credentials are correct
2. Check provisioning profiles are valid
3. Ensure Fastlane is configured correctly
4. Review native build logs

### Telemetry Not Working

1. Verify Sentry DSN is correct
2. Check network requests in browser DevTools
3. Verify telemetry is initialized in app
4. Check Sentry dashboard for events

## Next Steps

- [ ] Set up production environment
- [ ] Configure production deployment pipeline
- [ ] Set up monitoring dashboards
- [ ] Create runbooks for common issues
