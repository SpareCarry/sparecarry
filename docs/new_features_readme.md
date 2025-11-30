# New Features Documentation

**Date**: January 2025  
**Version**: 1.0

This document describes all newly implemented features and how to test them locally.

---

## Table of Contents

1. [Trust & Safety](#trust--safety)
2. [Smart Matching](#smart-matching)
3. [Watchlist / Wishlist](#watchlist--wishlist)
4. [Top / Active Routes](#top--active-routes)
5. [Photo Upload Improvements](#photo-upload-improvements)
6. [Cancellation Reasons](#cancellation-reasons)
7. [Payout ETA Estimator](#payout-eta-estimator)
8. [Message Auto-Translate](#message-auto-translate)
9. [SpareCarry Tips](#sparecarry-tips)
10. [Testing Guide](#testing-guide)

---

## Trust & Safety

### Features

- **Trust Badges**: ID verified, email verified, phone verified, premium member
- **Reliability Score**: 0-100 score based on completed deliveries, ratings, cancellations
- **Verification Hooks**: Integration with Stripe Identity for ID verification

### Components

- `components/TrustBadges.tsx` - Displays trust badges for users
- `lib/trust/reliability-score.ts` - Calculates reliability scores
- `lib/trust/verification.ts` - Handles verification processes

### Database Changes

- Added columns to `users` table: `id_verified`, `email_verified`, `phone_verified`, `premium_member`, `reliability_score`
- Added function `calculate_reliability_score()` and `update_user_reliability_score()`
- Triggers automatically update scores on delivery completion or cancellation

### How to Test

1. **View Trust Badges**:
   - Navigate to any user profile
   - Trust badges should display if user has verifications
   - Reliability score badge shows score and level

2. **Verify Email**:
   - Sign up with email
   - Verify email via Supabase Auth
   - Check `users.email_verified` updates to `true`

3. **Reliability Score**:
   - Complete a delivery
   - Check `users.reliability_score` updates
   - Score should increase with more completions

### Integration Points

- Add `<TrustBadges />` to profile pages
- Add `<TrustBadges />` to traveler cards in feed
- Display reliability score in user profiles

---

## Smart Matching

### Features

- **Automatic Match Suggestions**: Finds matching trips/requests with confidence scores
- **Confidence Levels**: High, medium, low based on route, date, capacity match
- **Precomputed Matches**: Materialized view `matched_candidates` for performance

### Components

- `lib/matching/smart-matching.ts` - Core matching service
- `components/matching/SuggestedMatches.tsx` - UI component for suggestions

### Database Changes

- Created materialized view `matched_candidates`
- Function `refresh_matched_candidates()` to update matches
- Indexes on route matching fields

### How to Test

1. **View Suggested Matches**:
   - Create a request or trip
   - Navigate to detail page
   - Suggested matches should appear below
   - Matches show confidence level and score

2. **Match Quality**:
   - Create exact route match → Should show "High Match"
   - Create nearby route match → Should show "Good Match"
   - Create partial match → Should show "Possible Match"

3. **Refresh Matches**:
   - Run SQL: `SELECT refresh_matched_candidates();`
   - New matches should appear

### Integration Points

- Add `<SuggestedMatches />` to request detail pages
- Add `<SuggestedMatches />` to trip detail pages
- Clicking match navigates to message/contact flow

---

## Watchlist / Wishlist

### Features

- **Save Routes**: Watch for trips/requests on specific routes
- **Save Items**: Watch for specific items
- **Notifications**: Get notified when matches appear (via in-app notifications)

### Components

- `components/WatchlistButton.tsx` - Toggle button to add/remove from watchlist
- `app/watchlist/page.tsx` - Watchlist screen showing saved items

### Database Changes

- Created `watchlists` table with `user_id`, `type`, `payload` (JSONB)
- RLS policies for user-owned watchlists

### How to Test

1. **Add to Watchlist**:
   - Navigate to any trip or request
   - Click "Watch" button
   - Item should be added to watchlist

2. **View Watchlist**:
   - Navigate to `/watchlist`
   - See all saved routes and items
   - Click "View" to see item details
   - Click trash icon to remove

3. **Notifications**:
   - Add route to watchlist
   - Create matching trip/request
   - Should receive notification (when notification system is implemented)

### Integration Points

- Add `<WatchlistButton />` to feed cards
- Add `<WatchlistButton />` to trip/request detail pages
- Link to watchlist in navigation

---

## Top / Active Routes

### Features

- **Trending Routes**: Shows most active routes in last 30 days
- **Route Statistics**: Post count, match count, last activity
- **Materialized View**: Precomputed for performance

### Components

- `components/TopRoutes.tsx` - Displays top routes

### Database Changes

- Created materialized view `top_routes`
- Function `refresh_top_routes()` to update
- Function `route_hash()` to generate route identifiers

### How to Test

1. **View Top Routes**:
   - Navigate to home page or shipping estimator
   - Top routes component should display
   - Shows routes sorted by activity

2. **Refresh Routes**:
   - Run SQL: `SELECT refresh_top_routes();`
   - View should update with latest data

### Integration Points

- Add `<TopRoutes />` to home page
- Add `<TopRoutes />` to shipping estimator page
- Click route to filter feed by route

---

## Photo Upload Improvements

### Features

- **Multi-Photo Support**: Up to 4 photos (increased from previous limit)
- **Client-Side Compression**: Reduces file size before upload
- **Thumbnails**: Lazy-loaded thumbnails for better performance

### Components

- Enhanced `modules/tier1Features/photos/PhotoUploader.tsx`
- Compression function added

### Changes

- Updated `maxPhotos` to 4
- Added `compressImage()` function for client-side compression
- Images compressed to max 1920px width, 80% quality

### How to Test

1. **Upload Multiple Photos**:
   - Navigate to post request form
   - Upload up to 4 photos
   - Verify all photos display as thumbnails

2. **Compression**:
   - Upload large image (>5MB)
   - Check file size is reduced
   - Verify image quality is acceptable

3. **Save to Database**:
   - Submit form with photos
   - Check `requests.item_photos` array contains URLs
   - Verify URLs are accessible

---

## Cancellation Reasons

### Features

- **Reason Selection**: Required reason when canceling trip/request/match
- **Category-Based**: Reasons filtered by entity type (trip/request/match)
- **Optional Notes**: Free-text notes for "other" reason

### Components

- `components/cancellation/CancellationReasonModal.tsx` - Modal for reason selection

### Database Changes

- Created `cancellation_reasons` lookup table
- Created `cancellations` table to store cancellation records
- Pre-seeded with common reasons

### How to Test

1. **Cancel with Reason**:
   - Navigate to trip/request detail
   - Click cancel button
   - Modal should appear with reason options
   - Select reason and confirm
   - Check `cancellations` table has record

2. **Required Notes**:
   - Select "Other" reason
   - Notes field should be required
   - Cannot submit without notes

3. **Reason Categories**:
   - Cancel trip → Should show traveler/external/other reasons
   - Cancel request → Should show requester/external/other reasons

### Integration Points

- Add cancellation modal to cancel flows
- Update cancel buttons to show modal
- Display cancellation reasons in admin dashboard

---

## Payout ETA Estimator

### Features

- **ETA Calculation**: Estimates payout time based on confirmation and payment method
- **Method-Specific**: Different ETAs for Stripe Connect, bank transfer, etc.
- **Weekend Handling**: Adjusts for weekends

### Components

- `utils/payoutEstimator.ts` - Calculation logic
- `components/payout/PayoutETA.tsx` - Display component

### How to Test

1. **View Payout ETA**:
   - Navigate to match/job detail after delivery confirmation
   - Payout ETA component should display
   - Shows estimated hours/days until payout

2. **Different Methods**:
   - Test with Stripe Connect → Should show 2-3 days
   - Test with bank transfer → Should show 3-5 days
   - Test with other → Should show 5-7 days

3. **Weekend Adjustment**:
   - Confirm delivery on Friday
   - ETA should account for weekend
   - Should not show Saturday/Sunday as payout date

### Integration Points

- Add `<PayoutETA />` to match detail pages
- Show after delivery confirmation
- Update when payout is received

---

## Message Auto-Translate

### Features

- **Auto-Translation**: Automatically translates messages to user's language
- **Opt-In Toggle**: User can enable/disable in profile
- **Client-Side**: Translations done client-side for privacy

### Components

- Enhanced `components/messaging/MessageThread.tsx`
- `lib/translation/auto-translate.ts` - Translation service

### Database Changes

- Added `auto_translate_messages` to `profiles` table

### How to Test

1. **Enable Auto-Translate**:
   - Navigate to message thread
   - Click auto-translate toggle
   - Setting should save to profile

2. **View Translations**:
   - Enable auto-translate
   - Receive message in different language
   - Translation should appear below original
   - Own messages should not be translated

3. **Toggle Off**:
   - Disable auto-translate
   - Translations should disappear
   - Setting should persist

### Integration Points

- Toggle in message thread header
- Translations appear inline below messages
- Respects user privacy (client-side only)

---

## SpareCarry Tips

### Features

- **Contextual Tooltips**: Helpful tips throughout the app
- **Dismissible**: Users can dismiss tips
- **Context-Aware**: Tips shown based on current page/feature

### Components

- `components/TipsTooltip.tsx` - Tooltip component
- `assets/data/tips.json` - Tips data

### How to Test

1. **View Tips**:
   - Navigate to shipping estimator
   - Look for tip icon (info icon)
   - Click to see tip
   - Tip should display helpful information

2. **Dismiss Tips**:
   - Click "Don't show again" in tip
   - Tip should not appear again
   - Check localStorage for dismissed tips

3. **Different Contexts**:
   - Tips appear in shipping estimator
   - Tips appear in post forms
   - Tips appear in messaging
   - Each context shows relevant tips

### Integration Points

- Add `<TipsTooltip tipId="..." />` throughout app
- Tips appear near relevant features
- Dismissed tips stored in localStorage

---

## Testing Guide

### Unit Tests

```bash
# Run unit tests
pnpm test

# Run specific test file
pnpm test tests/unit/lib/matching/smart-matching.test.ts
pnpm test tests/unit/utils/payoutEstimator.test.ts
```

### E2E Tests

```bash
# Run E2E tests
pnpm test:e2e

# Run specific test suite
pnpm test:e2e tests/e2e/trust-badges.spec.ts
pnpm test:e2e tests/e2e/watchlist.spec.ts
pnpm test:e2e tests/e2e/suggested-matches.spec.ts
```

### Manual Testing Checklist

#### Trust & Safety

- [ ] Trust badges display on profiles
- [ ] Reliability score updates after delivery
- [ ] Email verification works
- [ ] ID verification (Stripe Identity) works

#### Smart Matching

- [ ] Suggested matches appear on request/trip pages
- [ ] Confidence scores are accurate
- [ ] Clicking match navigates correctly

#### Watchlist

- [ ] Can add routes to watchlist
- [ ] Can add items to watchlist
- [ ] Watchlist page displays saved items
- [ ] Can remove from watchlist

#### Top Routes

- [ ] Top routes display on home page
- [ ] Routes sorted by activity
- [ ] Clicking route filters feed

#### Photo Upload

- [ ] Can upload up to 4 photos
- [ ] Images are compressed
- [ ] Thumbnails display correctly
- [ ] URLs saved to database

#### Cancellation Reasons

- [ ] Modal appears when canceling
- [ ] Reason selection works
- [ ] Notes required for "other"
- [ ] Cancellation saved to database

#### Payout ETA

- [ ] ETA displays after delivery confirmation
- [ ] Different methods show different ETAs
- [ ] Weekend adjustment works

#### Message Translation

- [ ] Toggle works
- [ ] Translations appear
- [ ] Own messages not translated
- [ ] Setting persists

#### Tips

- [ ] Tips appear in relevant contexts
- [ ] Can dismiss tips
- [ ] Dismissed tips don't reappear

---

## Database Migration

### Running the Migration

1. **Open Supabase SQL Editor**
2. **Run the migration**:

   ```sql
   -- Copy and paste contents of:
   -- supabase/migrations/20250102000000_add_trust_match_watchlist.sql
   ```

3. **Refresh Materialized Views**:

   ```sql
   SELECT refresh_top_routes();
   SELECT refresh_matched_candidates();
   ```

4. **Update Existing Users** (optional):
   ```sql
   -- Update reliability scores for existing users
   SELECT update_user_reliability_score(id) FROM public.users;
   ```

### Verification

Run the audit script to verify:

```sql
-- Run supabase_audit.sql
-- Should show all new tables, columns, and functions
```

---

## Known Issues & Limitations

1. **Watchlist JSONB Comparison**:
   - UNIQUE constraint on JSONB is complex
   - Handled via application logic
   - May allow duplicates in edge cases

2. **Translation Service**:
   - Uses basic fallback if LibreTranslate not configured
   - For production, configure LibreTranslate or use paid service

3. **Materialized Views**:
   - Need to be refreshed periodically
   - Set up cron job to refresh every hour

4. **Photo Compression**:
   - Client-side only (browser-based)
   - May not work in all browsers
   - Consider server-side compression for production

---

## Next Steps

1. **Configure LibreTranslate** (optional):
   - Set `NEXT_PUBLIC_LIBRETRANSLATE_URL` in `.env.local`
   - Or use alternative translation service

2. **Set Up Cron Jobs**:
   - Refresh `top_routes` every hour
   - Refresh `matched_candidates` every 30 minutes
   - Update reliability scores daily

3. **Add Notifications**:
   - Implement watchlist match notifications
   - Use Supabase real-time or push notifications

4. **Enhance Matching**:
   - Add geohash-based proximity matching
   - Improve confidence scoring algorithm
   - Add ML-based matching (future)

---

## Support

For issues or questions:

- Check `IMPLEMENTATION_AUDIT_LOG.md` for file changes
- Review migration SQL for database changes
- Check test files for usage examples

---

**Document Version**: 1.0  
**Last Updated**: January 2025
