# SpareCarry Setup Checklist

**Date**: January 2025  
**Version**: 1.0  
**Purpose**: Complete setup guide for SpareCarry deployment

---

## Table of Contents

1. [Accounts & APIs](#accounts--apis)
2. [Supabase Backend Setup](#supabase-backend-setup)
3. [Frontend Dependencies](#frontend-dependencies)
4. [Testing Coverage](#testing-coverage)
5. [Mobile Platform Requirements](#mobile-platform-requirements)
6. [Other Tools & Services](#other-tools--services)
7. [Pre-Launch Checklist](#pre-launch-checklist)

---

## Accounts & APIs

### ✅ Currently Used & Setup Status

#### 1. Supabase

**Status**: ✅ Required  
**Purpose**: Database, authentication, storage

**Setup Steps**:

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get project URL and anon key from Settings → API
4. Get service role key from Settings → API (keep secret!)

**Environment Variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Configuration**:

- ✅ Run `supabase/schema.sql` in SQL Editor
- ✅ Run `supabase/storage-setup.sql` for storage buckets
- ✅ Enable Row Level Security (RLS) on all tables
- ✅ Configure authentication providers (Magic Link, Google, Apple)

**Missing**: None (required for core functionality)

---

#### 2. Stripe

**Status**: ✅ Required  
**Purpose**: Payments, subscriptions, Connect

**Setup Steps**:

1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard → Developers → API keys
3. Create products and prices for subscriptions:
   - SpareCarry Pro Monthly ($6.99/month)
   - SpareCarry Pro Yearly ($59/year)
   - Supporter Tier (variable pricing)
4. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
5. Get webhook signing secret

**Environment Variables**:

```env
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
STRIPE_SUPPORTER_PRICE_ID=price_...
```

**Configuration**:

- ✅ Enable Stripe Connect (for traveler payouts)
- ✅ Enable Stripe Identity (for KYC verification)
- ✅ Configure webhook events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `payment_intent.succeeded`

**Missing**: None (required for payments)

---

#### 3. Geoapify API

**Status**: ✅ Required  
**Purpose**: Location autocomplete and geocoding

**Setup Steps**:

1. Create account at [geoapify.com](https://geoapify.com)
2. Get API key from dashboard
3. Choose plan (Free tier: 3,000 requests/day)

**Environment Variables**:

```env
NEXT_PUBLIC_GEOAPIFY_KEY=your_geoapify_key
```

**Configuration**:

- ✅ Service integrated in `lib/services/location.ts`
- ✅ Caching enabled (24-hour TTL)
- ✅ Debouncing enabled (300ms delay)

**Missing**: None (required for location features)

---

#### 4. Google Maps API

**Status**: ⚠️ Optional (Recommended)  
**Purpose**: Interactive maps, distance calculations

**Setup Steps**:

1. Create account at [Google Cloud Console](https://console.cloud.google.com)
2. Enable Maps JavaScript API
3. Enable Places API
4. Enable Distance Matrix API
5. Create API key and restrict to your domain

**Environment Variables**:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

**Configuration**:

- ✅ Used in `LocationDraggablePicker.tsx`
- ✅ Used in `LocationMapPreview.tsx`
- ✅ Used for distance calculations

**Missing**: Optional (fallback to Geoapify if not set)

---

#### 5. Resend

**Status**: ⚠️ Optional (Recommended)  
**Purpose**: Transactional email

**Setup Steps**:

1. Create account at [resend.com](https://resend.com)
2. Get API key from dashboard
3. Verify domain (for production)

**Environment Variables**:

```env
RESEND_API_KEY=re_...
NOTIFICATIONS_EMAIL_FROM=SpareCarry <notifications@sparecarry.com>
```

**Configuration**:

- ✅ Email templates ready
- ✅ Welcome emails
- ✅ Match notifications
- ✅ Delivery confirmations

**Missing**: Optional (can use Supabase email if not set)

---

#### 6. Expo Push Notifications

**Status**: ⚠️ Optional (For Mobile)  
**Purpose**: Mobile push notifications

**Setup Steps**:

1. Create account at [expo.dev](https://expo.dev)
2. Get access token
3. Configure push notification certificates (iOS/Android)

**Environment Variables**:

```env
EXPO_ACCESS_TOKEN=your_expo_token
FCM_SERVER_KEY=your_fcm_key (Android)
```

**Configuration**:

- ✅ Capacitor push notifications plugin installed
- ✅ Database field: `profiles.expo_push_token`

**Missing**: Optional (mobile app works without push)

---

#### 7. Google Analytics

**Status**: ⚠️ Optional (Recommended)  
**Purpose**: Web analytics

**Setup Steps**:

1. Create account at [analytics.google.com](https://analytics.google.com)
2. Create property for your domain
3. Get Measurement ID (G-XXXXXXX)

**Environment Variables**:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXX
```

**Configuration**:

- ✅ Analytics tracking in `lib/analytics/tracking.ts`
- ✅ Events tracked: post_created, message_sent, etc.

**Missing**: Optional (internal analytics available)

---

#### 8. Meta Pixel

**Status**: ⚠️ Optional  
**Purpose**: Facebook/Instagram advertising tracking

**Setup Steps**:

1. Create pixel in Facebook Business Manager
2. Get Pixel ID

**Environment Variables**:

```env
NEXT_PUBLIC_META_PIXEL_ID=your_pixel_id
```

**Missing**: Optional (for advertising only)

---

#### 9. Sentry

**Status**: ⚠️ Optional (Recommended)  
**Purpose**: Error tracking and monitoring

**Setup Steps**:

1. Create account at [sentry.io](https://sentry.io)
2. Create project for Next.js
3. Get DSN

**Configuration**:

- ✅ Package installed: `@sentry/nextjs`
- ✅ Configuration in `sentry.client.config.ts` and `sentry.server.config.ts`

**Environment Variables**:

```env
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_auth_token
```

**Missing**: Optional (recommended for production)

---

### ❌ Missing Accounts/APIs

#### 1. Allianz Travel Insurance API

**Status**: ❌ Missing  
**Purpose**: Insurance integration for cargo coverage

**Required For**: Insurance feature (currently placeholder)

**Setup Steps**:

1. Contact Allianz for API access
2. Get API credentials
3. Integrate quote generation endpoint
4. Integrate policy creation endpoint
5. Integrate claims submission endpoint

**Environment Variables** (when available):

```env
ALLIANZ_API_KEY=your_allianz_key
ALLIANZ_API_URL=https://api.allianz.com
```

**Impact**: Insurance feature not functional (placeholder only)

---

#### 2. Courier Rate APIs

**Status**: ⚠️ Partial  
**Purpose**: Real-time courier rate calculations

**Current**: Placeholder calculations in `lib/services/shipping.ts`

**Required APIs**:

- DHL API
- FedEx API
- UPS API

**Setup Steps**:

1. Create accounts with each courier
2. Get API credentials
3. Integrate rate calculation endpoints
4. Update `lib/services/shipping.ts`

**Impact**: Shipping estimator uses estimated rates (not real-time)

---

#### 3. Unleash Feature Flags

**Status**: ⚠️ Partial  
**Purpose**: Feature flag management

**Setup Steps**:

1. Create account at [unleash.io](https://www.unleash.io) or self-host
2. Get API URL and client key
3. Configure feature flags

**Environment Variables**:

```env
NEXT_PUBLIC_UNLEASH_URL=https://your-unleash-instance.com
NEXT_PUBLIC_UNLEASH_CLIENT_KEY=your_client_key
```

**Impact**: Feature flags not functional (optional)

---

## Supabase Backend Setup

### Database Tables

**Status**: ✅ Complete  
**Schema File**: `supabase/schema.sql`

**Core Tables** (15 total):

1. ✅ `users` - User accounts and subscriptions
2. ✅ `profiles` - Extended user information
3. ✅ `trips` - Traveler trips
4. ✅ `requests` - Delivery requests
5. ✅ `matches` - Trip-request matches
6. ✅ `conversations` - Chat threads
7. ✅ `messages` - Individual messages
8. ✅ `deliveries` - Delivery proof
9. ✅ `ratings` - User ratings
10. ✅ `referrals` - Referral tracking
11. ✅ `group_buys` - Group buy coordination
12. ✅ `meetup_locations` - Pre-seeded locations (20 locations)
13. ✅ `analytics_events` - Feature usage tracking
14. ✅ `countries` - Country reference data
15. ✅ `lifetime_purchases` - Lifetime Pro purchases

**Setup Steps**:

1. ✅ Run `supabase/schema.sql` in SQL Editor
2. ✅ Verify all tables created
3. ✅ Check indexes created
4. ✅ Verify RLS policies enabled

---

### Row Level Security (RLS) Policies

**Status**: ✅ Complete  
**Policies File**: Included in `supabase/schema.sql`

**All Tables Have RLS Enabled**:

- ✅ `users` - Users can view/update own data
- ✅ `profiles` - Public read, private write
- ✅ `trips` - Public read, private write
- ✅ `requests` - Public read, private write
- ✅ `matches` - Viewable by participants only
- ✅ `conversations` - Viewable by participants only
- ✅ `messages` - Viewable by conversation participants only
- ✅ `deliveries` - Viewable by match participants only
- ✅ `ratings` - Public read, private write
- ✅ `referrals` - Viewable by participants only
- ✅ `group_buys` - Public read, authenticated write
- ✅ `waitlist` - Public read/write
- ✅ `meetup_locations` - Public read
- ✅ `analytics_events` - Authenticated write
- ✅ `countries` - Public read
- ✅ `lifetime_purchases` - Authenticated write

**Setup Steps**:

1. ✅ RLS enabled on all tables
2. ✅ Policies created for SELECT, INSERT, UPDATE, DELETE
3. ✅ Test policies with different user roles

---

### Database Functions

**Status**: ✅ Complete

**Functions** (12 total):

1. ✅ `update_updated_at_column()` - Auto-update timestamps
2. ✅ `handle_new_user()` - Auto-create profile on signup
3. ✅ `handle_new_match()` - Auto-create conversation on match
4. ✅ `add_referral_credit()` - Award referral credits
5. ✅ `use_referral_credit()` - Deduct referral credits
6. ✅ `update_user_delivery_stats()` - Update user stats
7. ✅ `check_and_award_trusted_traveller()` - Badge awards
8. ✅ `get_lifetime_purchase_count()` - Lifetime availability check
9. ✅ `get_lifetime_availability()` - Check if lifetime available
10. ✅ `record_lifetime_purchase()` - Record lifetime purchase
11. ✅ `handle_user_update()` - User update handler
12. ✅ `assign_admin_role()` - Admin role assignment

**Setup Steps**:

1. ✅ All functions created
2. ✅ Search path set for security
3. ✅ Permissions granted
4. ✅ Test functions with sample data

---

### Database Extensions

**Status**: ✅ Complete

**Extensions**:

1. ✅ `uuid-ossp` - UUID generation (in `public` schema)
2. ✅ `cube` - Distance calculations (in `extensions` schema)
3. ✅ `earthdistance` - Geographic distance (in `extensions` schema)

**Setup Steps**:

1. ✅ Extensions created in correct schemas
2. ✅ GIST indexes recreated after extension move
3. ✅ Permissions granted

---

### Storage Buckets

**Status**: ✅ Complete  
**Schema File**: `supabase/storage-setup.sql`

**Buckets**:

1. ✅ `item-photos` - Item photos (public read, authenticated write)
2. ✅ `avatars` - User avatars (public read, authenticated write)
3. ✅ `delivery-proof` - Delivery proof photos (private, participants only)

**Setup Steps**:

1. ✅ Run `supabase/storage-setup.sql`
2. ✅ Verify buckets created
3. ✅ Check RLS policies on buckets
4. ✅ Test file upload/download

---

### Migrations

**Status**: ✅ Complete  
**Directory**: `supabase/migrations/`

**Migrations** (18 total):

1. ✅ `001_initial_schema.sql`
2. ✅ `002_rls_policies.sql`
3. ✅ `003_seed_data.sql`
4. ✅ `004_auth_integration.sql`
5. ✅ `005_create_referrals.sql`
6. ✅ `006_add_group_buys_waitlist.sql`
7. ✅ `20250101000000_fix_security_issues.sql`
8. ✅ `20250101000001_fix_function_search_path.sql`
9. ✅ `20250101000002_move_extensions_to_extensions_schema.sql`
10. ✅ `20251124092302_countries.sql`
11. ✅ `20251124093736_add_karma_points.sql`
12. ✅ `20251125000000_add_plane_trip_fields.sql`
13. ✅ `20251125000001_add_post_request_fields.sql`
14. ✅ `20251125000002_add_post_messages.sql`
15. ✅ `20251125000003_add_analytics_events.sql`
16. ✅ `add-lifetime-access-system.sql`
17. ✅ `add-location-fields.sql`
18. ✅ `add-supporter-tier.sql`

**Setup Steps**:

1. ✅ All migrations applied
2. ✅ Verify no migration errors
3. ✅ Check database state matches schema

---

## Frontend Dependencies

### Core Dependencies

**Status**: ✅ Complete  
**File**: `package.json`

**Key Dependencies**:

- ✅ Next.js 14.2.5
- ✅ React 18.3.1
- ✅ TypeScript 5.9.3
- ✅ Tailwind CSS 3.4.18
- ✅ Supabase JS 2.83.0
- ✅ Stripe JS 2.4.0
- ✅ React Hook Form 7.49.3
- ✅ Zod 3.22.4
- ✅ Capacitor 5.5.0 (mobile)

**Setup Steps**:

1. ✅ Run `pnpm install`
2. ✅ Verify all dependencies installed
3. ✅ Check for security vulnerabilities: `pnpm audit`

---

### Development Dependencies

**Status**: ✅ Complete

**Testing**:

- ✅ Playwright 1.40.0 (E2E)
- ✅ Vitest 1.0.4 (Unit)
- ✅ Testing Library (React, Jest DOM, User Event)
- ✅ Detox 20.14.0 (Mobile E2E)

**Linting**:

- ✅ ESLint 8.56.0
- ✅ Prettier 3.2.4
- ✅ TypeScript ESLint

**Setup Steps**:

1. ✅ All dev dependencies installed
2. ✅ Run `pnpm lint` to verify
3. ✅ Run `pnpm typecheck` to verify

---

## Testing Coverage

### Unit Tests

**Status**: ✅ Complete  
**Framework**: Vitest  
**Test Files**: 13 files

**Coverage**:

- ✅ Karma calculation (`tests/karma.test.ts`)
- ✅ Shipping fees (`tests/shippingFees.test.ts`)
- ✅ Stripe fees (`tests/stripeFees.test.ts`)
- ✅ Country validation (`tests/validateCountry.test.ts`)
- ✅ Countries data (`tests/countries.test.ts`)
- ✅ Platform fees (`tests/unit/lib/pricing/platform-fee.test.ts`)
- ✅ Match scoring (`tests/unit/lib/matching/match-score.test.ts`)

**Setup Steps**:

1. ✅ Run `pnpm test` to verify
2. ✅ Check test coverage: `pnpm coverage`

---

### Integration Tests

**Status**: ✅ Complete  
**Framework**: Vitest  
**Test Files**: 6 files

**Coverage**:

- ✅ Subscription flow
- ✅ Payment flow
- ✅ Auto-release
- ✅ Payment intent creation
- ✅ Notifications
- ✅ Auto-matching

**Setup Steps**:

1. ✅ Run `pnpm test` to verify
2. ✅ Check integration test results

---

### E2E Tests

**Status**: ✅ Complete  
**Framework**: Playwright  
**Test Files**: 30+ files

**Coverage**:

- ✅ Authentication flow
- ✅ Subscription flow
- ✅ Shipping estimator
- ✅ Location system
- ✅ Photo upload
- ✅ Complete app flow
- ✅ Payment flow
- ✅ Feed functionality
- ✅ Trusted traveller
- ✅ Item safety
- ✅ Auto-category
- ✅ Lifetime Pro purchases

**Setup Steps**:

1. ✅ Install Playwright: `pnpm playwright:install`
2. ✅ Run E2E tests: `pnpm test:e2e`
3. ✅ Verify all tests pass

**Missing**: None (comprehensive coverage)

---

### Mobile E2E Tests

**Status**: ⚠️ Partial  
**Framework**: Detox

**Setup Steps**:

1. ✅ Detox installed
2. ⚠️ iOS/Android simulators configured
3. ⚠️ Run `pnpm e2e:build:ios` or `pnpm e2e:build:android`
4. ⚠️ Run `pnpm e2e:ios` or `pnpm e2e:android`

**Missing**: iOS/Android build configuration (requires Xcode/Android Studio)

---

## Mobile Platform Requirements

### iOS

**Status**: ⚠️ Partial

**Requirements**:

- ✅ Capacitor iOS plugin installed
- ⚠️ Xcode installed (macOS only)
- ⚠️ Apple Developer account ($99/year)
- ⚠️ iOS certificates configured
- ⚠️ App Store Connect account

**Setup Steps**:

1. ✅ Run `pnpm mobile:build`
2. ⚠️ Open Xcode: `pnpm capacitor:ios`
3. ⚠️ Configure signing certificates
4. ⚠️ Build and test on simulator
5. ⚠️ Submit to App Store

**Missing**: Xcode setup, Apple Developer account, App Store submission

---

### Android

**Status**: ⚠️ Partial

**Requirements**:

- ✅ Capacitor Android plugin installed
- ⚠️ Android Studio installed
- ⚠️ Android SDK configured
- ⚠️ Google Play Developer account ($25 one-time)
- ⚠️ Signing keys configured

**Setup Steps**:

1. ✅ Run `pnpm mobile:build`
2. ⚠️ Open Android Studio: `pnpm capacitor:android`
3. ⚠️ Configure signing keys
4. ⚠️ Build and test on emulator
5. ⚠️ Submit to Google Play

**Missing**: Android Studio setup, Google Play account, Play Store submission

---

## Other Tools & Services

### Domain & Hosting

**Status**: ⚠️ Required

**Requirements**:

- ⚠️ Domain name (e.g., sparecarry.com)
- ⚠️ Hosting provider (Vercel, Netlify, AWS, etc.)
- ⚠️ SSL certificate
- ⚠️ DNS configuration

**Recommended**: Vercel (Next.js optimized)

**Missing**: Domain registration, hosting setup

---

### Email Service

**Status**: ⚠️ Optional (Recommended)

**Options**:

1. Resend (recommended)
2. SendGrid
3. Mailgun
4. Supabase Email (limited)

**Missing**: Resend account (optional, can use Supabase email)

---

### Monitoring & Analytics

**Status**: ⚠️ Optional (Recommended)

**Tools**:

1. Sentry (error tracking) - ⚠️ Account needed
2. Google Analytics - ⚠️ Account needed
3. Meta Pixel - ⚠️ Account needed
4. Internal analytics - ✅ Built-in

**Missing**: Sentry account (optional)

---

### CI/CD

**Status**: ⚠️ Optional (Recommended)

**Options**:

1. GitHub Actions
2. Vercel (automatic)
3. CircleCI
4. GitLab CI

**Missing**: CI/CD pipeline setup (optional)

---

## Pre-Launch Checklist

### Backend

- [x] Supabase project created and configured
- [x] All database tables created
- [x] RLS policies enabled and tested
- [x] Database functions created
- [x] Storage buckets created
- [x] All migrations applied
- [ ] Test with production data
- [ ] Backup strategy configured

### Frontend

- [x] All dependencies installed
- [x] Environment variables configured
- [x] Build succeeds: `pnpm build`
- [x] Type checking passes: `pnpm typecheck`
- [x] Linting passes: `pnpm lint`
- [ ] Production build tested
- [ ] Performance optimized

### Payments

- [x] Stripe account created
- [x] Products and prices created
- [x] Webhook endpoint configured
- [x] Test payments working
- [ ] Production Stripe keys configured
- [ ] Webhook signature verified

### Location Services

- [x] Geoapify API key configured
- [x] Location service tested
- [ ] Google Maps API key configured (optional)
- [ ] Location features tested in production

### Testing

- [x] Unit tests passing
- [x] Integration tests passing
- [x] E2E tests passing
- [ ] Mobile E2E tests passing
- [ ] Cross-browser testing
- [ ] Performance testing

### Security

- [x] RLS policies enabled
- [x] Input validation implemented
- [x] API keys secured
- [x] HTTPS configured
- [ ] Security audit completed
- [ ] Penetration testing (optional)

### Monitoring

- [ ] Sentry configured (optional)
- [ ] Google Analytics configured (optional)
- [ ] Error logging tested
- [ ] Performance monitoring active

### Mobile Apps

- [x] Capacitor configured
- [ ] iOS app built and tested
- [ ] Android app built and tested
- [ ] App Store submission (iOS)
- [ ] Play Store submission (Android)

### Documentation

- [x] README.md complete
- [x] Setup guide complete
- [x] API documentation (if needed)
- [ ] User documentation
- [ ] Admin documentation

### Legal & Compliance

- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] GDPR compliance
- [ ] CCPA compliance
- [ ] Insurance coverage (if applicable)

---

## Quick Start Commands

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run database migrations
# (In Supabase SQL Editor, run supabase/schema.sql)

# Start development server
pnpm dev

# Run tests
pnpm test              # Unit tests
pnpm test:e2e          # E2E tests
pnpm test:all          # All tests

# Build for production
pnpm build

# Build mobile apps
pnpm mobile:build
pnpm capacitor:ios     # Open in Xcode
pnpm capacitor:android # Open in Android Studio
```

---

## Support & Resources

**Documentation**:

- `README.md` - Project overview
- `SETUP.md` - Detailed setup guide
- `SpareCarry_CompleteAppOverview.md` - Complete app documentation

**Support**:

- Email: support@sparecarry.com
- GitHub Issues: For bug reports
- Documentation: See `/docs` directory

---

**Document Version**: 1.0  
**Last Updated**: January 2025
