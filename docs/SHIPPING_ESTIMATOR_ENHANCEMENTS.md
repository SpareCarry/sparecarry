# Shipping Cost Estimator Enhancements

## Overview

The Shipping Cost Estimator has been upgraded with hybrid platform fees, premium discounts, karma points, and enhanced UI messaging.

## Features Implemented

### 1. Hybrid Platform Fee System

**Formula:**

- Free users: `platform_fee = $3 + (8% * base_price)`
- Premium users: `platform_fee = $0 + (4% * base_price)` (flat fee waived, % fee halved)

**Implementation:**

- Fees are baked into final prices (invisible to user)
- Prices rounded to nearest $0.50 increment
- Premium discount applied automatically for premium subscribers

**Files:**

- `src/constants/shippingFees.ts` - Fee constants and calculation
- `src/utils/shippingEstimator.ts` - Updated price calculations

### 2. Premium Price Card

**Display Logic:**

- **Non-premium users**: See standard prices + separate "Premium Prices" card showing what they'd pay as premium
- **Premium users**: See discounted prices with "Premium discount applied! No site fees" message

**UI Components:**

- Standard price cards (teal for plane, blue for boat)
- Premium price card (purple gradient) - only visible to non-premium users
- Clear messaging: "Premium discount applied! No site fees"

**Files:**

- `app/shipping-estimator/page.tsx` - UI implementation

### 3. Karma Bonus System

**Calculation:**

- Formula: `karma_points = (weight * 10) + (platform_fee * 2)`
- Points awarded when delivery is completed
- Stored in `users.karma_points` column

**UI Features:**

- Toggle: "I want to earn karma points"
- Notification: "You helped a traveller! +X karma points"
- Points passed via prefill data to job creation

**Files:**

- `src/utils/karma.ts` - Karma calculation
- `src/utils/awardKarma.ts` - Award points on delivery completion
- `supabase/migrations/20251124093736_add_karma_points.sql` - Database migration

### 4. Subscription Integration

**Status Checking:**

- Checks `users.subscription_status` (active, trialing)
- Checks `profiles.lifetime_active` for lifetime Pro
- Checks `users.supporter_status` for supporters
- Works offline with safe defaults (defaults to free user pricing)

**Premium Benefits:**

- Flat fee waived ($0 instead of $3)
- Percentage fee halved (4% instead of 8%)
- Displayed as "Premium discount applied! No site fees"

**Files:**

- `src/utils/subscriptionUtils.ts` - Subscription status checking

### 5. UI Messaging

**Free Users:**

- "SpareCarry Plane: $XX"
- "No site fees"
- "You save $YY"

**Premium Users:**

- "SpareCarry Plane: $XX"
- "Premium discount applied! No site fees"
- "You save $YY"

**Premium Price Card (Non-premium only):**

- "Premium Prices" header
- "Upgrade to Pro" badge
- Shows plane and boat prices with premium discount
- "Premium discount applied! No site fees" on each price

## Database Changes

### Migration: `20251124093736_add_karma_points.sql`

```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS karma_points INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_karma_points ON public.users(karma_points);
```

## Testing

### Unit Tests

**Platform Fees (`tests/shippingFees.test.ts`):**

- ✅ Fee calculation for free users
- ✅ Premium discount (flat waived + % halved)
- ✅ Rounding to $0.50 increments
- ✅ Edge cases (zero price, small prices)

**Karma (`tests/karma.test.ts`):**

- ✅ Karma point calculation
- ✅ Formatting for display
- ✅ Edge cases (zero weight, zero fee)

### E2E Tests (`tests/e2e/shipping-estimator.spec.ts`)

- ✅ Basic estimator functionality
- ✅ "No site fees" display
- ✅ Savings > 20% validation
- ✅ Premium Price card for non-premium users
- ✅ Premium discount calculation
- ✅ Karma toggle and notification
- ✅ Job creation with prefill data

## Usage Examples

### Free User Experience

1. User fills estimator form
2. Sees standard SpareCarry prices with "No site fees"
3. Sees Premium Price card showing discounted prices
4. Can toggle "I want to earn karma points"
5. Creates job with prefill data including karma points

### Premium User Experience

1. User fills estimator form
2. Sees discounted SpareCarry prices
3. Sees "Premium discount applied! No site fees" message
4. No Premium Price card (already has premium)
5. Can toggle karma points
6. Creates job with prefill data

## Integration Points

### Job Creation

When user clicks "Create SpareCarry Job from This Estimate":

- Prefill data includes:
  - Package dimensions and weight
  - Origin/destination countries
  - Estimated karma points (if enabled)
  - Platform fees (for karma calculation)
  - SpareCarry prices

### Delivery Completion

When a delivery is completed:

- Call `awardKarmaPoints()` with:
  - User ID
  - Weight
  - Platform fee
  - Pre-calculated karma points
- Updates `users.karma_points` in Supabase

## Future Enhancements

1. **Karma Leaderboard**: Display top karma earners
2. **Karma Rewards**: Exchange karma for credits or badges
3. **Premium Analytics**: Show premium users their total savings
4. **Dynamic Pricing**: Adjust fees based on route popularity
5. **Karma History**: Track karma points over time

## Files Modified

### Core Logic

- `src/constants/shippingFees.ts` - Fee constants and calculation
- `src/utils/shippingEstimator.ts` - Price calculations with premium support
- `src/utils/karma.ts` - Karma calculation
- `src/utils/awardKarma.ts` - Award karma on delivery
- `src/utils/subscriptionUtils.ts` - Subscription status checking

### UI Components

- `app/shipping-estimator/page.tsx` - Main estimator page with Premium card
- `components/forms/post-request-form.tsx` - Handle karma from prefill

### Database

- `supabase/migrations/20251124093736_add_karma_points.sql` - Add karma_points column

### Tests

- `tests/shippingFees.test.ts` - Platform fee tests
- `tests/karma.test.ts` - Karma calculation tests
- `tests/e2e/shipping-estimator.spec.ts` - E2E tests

## Verification Checklist

- [x] Hybrid platform fee calculated correctly
- [x] Premium discount: flat waived + % halved
- [x] Premium Price card shows for non-premium users only
- [x] Premium users see "Premium discount applied! No site fees"
- [x] Free users see "No site fees"
- [x] Karma points calculated and displayed
- [x] Karma toggle works
- [x] Subscription status checked correctly
- [x] Offline mode works (defaults to free pricing)
- [x] All tests passing
- [x] TypeScript compiles without errors
- [x] No linter errors
