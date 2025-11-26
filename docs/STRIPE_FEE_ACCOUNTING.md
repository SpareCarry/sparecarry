# Stripe Fee Accounting

## Overview

The Shipping Cost Estimator internally accounts for Stripe payment processing fees (2.9% + $0.30) while keeping the displayed UX unchanged. This allows accurate net revenue tracking without showing fees to users.

## Implementation

### Stripe Fee Calculation

**Formula:**
```
stripe_fee = (transaction_amount * 2.9%) + $0.30
```

**Where:**
- `transaction_amount` = base_price + platform_fee (total amount charged to user)

### Net Revenue Calculation

**Formula:**
```
net_revenue = platform_fee - stripe_fee
```

**Example:**
- Base price: $100
- Platform fee (free user): $3 + (8% * $100) = $11
- Transaction amount: $100 + $11 = $111
- Stripe fee: (111 * 2.9%) + $0.30 = $3.52
- Net revenue: $11.00 - $3.52 = $7.48

### Platform Fee Coverage Validation

The system validates that platform fees cover Stripe fees:

```typescript
validatePlatformFeeCoversStripe(platformFee, transactionAmount)
```

**Free Users:**
- Platform fee: $3 + 8% of base price
- Typically covers Stripe fees for transactions > $10

**Premium Users:**
- Platform fee: 4% of base price (flat fee waived)
- May not cover Stripe fees for very small transactions (< $20)
- This is acceptable as premium users pay subscription fees

## Internal Tracking

### Data Included in Estimate Result

```typescript
interface ShippingEstimateResult {
  // ... existing fields ...
  stripeFeePlane?: number;      // Internal Stripe fee (not shown to user)
  stripeFeeBoat?: number;        // Internal Stripe fee (not shown to user)
  netRevenuePlane?: number;     // Platform fee - Stripe fee (not shown to user)
  netRevenueBoat?: number;       // Platform fee - Stripe fee (not shown to user)
}
```

### Prefill Data

When creating a job from estimator, prefill data includes:
- `stripeFeePlane` / `stripeFeeBoat` - For internal tracking
- `netRevenuePlane` / `netRevenueBoat` - For revenue analytics

## User Experience

**No Changes to Display:**
- Users see the same prices as before
- "No site fees" messaging remains
- Premium discount display unchanged
- Karma points calculation unchanged

**Internal Only:**
- Stripe fees calculated but not displayed
- Net revenue tracked for analytics
- Validation warnings logged to console (development)

## Revenue Tracking

### Utility Functions

**`prepareRevenueData()`** - Prepares revenue data object:
```typescript
const revenueData = prepareRevenueData(
  transactionAmount,
  platformFee,
  'plane',
  isPremium
);
```

**`logRevenueData()`** - Logs revenue for analytics:
```typescript
logRevenueData(revenueData);
```

### Future Integration

Revenue data can be:
1. Stored in Supabase `transactions` table (if exists)
2. Sent to analytics service (PostHog, Mixpanel)
3. Used for financial reporting
4. Tracked for margin analysis

## Testing

### Unit Tests

**`tests/stripeFees.test.ts`** - 15 tests covering:
- Stripe fee calculation
- Net revenue calculation
- Platform fee coverage validation
- Edge cases (small/large transactions)

**`tests/shippingFees.test.ts`** - Updated to include:
- Platform fee coverage validation
- Integration with Stripe fees

### E2E Tests

**`tests/e2e/shipping-estimator.spec.ts`** - Validates:
- Net revenue included in prefill data
- Stripe fee calculation correct
- Displayed prices unchanged

## Files Modified

### Core Logic
- `src/constants/shippingFees.ts` - Added Stripe fee constants and calculations
- `src/utils/shippingEstimator.ts` - Added Stripe fee and net revenue calculations
- `src/utils/revenueTracking.ts` - New utility for revenue data tracking

### UI Components
- `app/shipping-estimator/page.tsx` - Passes Stripe/net revenue in prefill data

### Tests
- `tests/stripeFees.test.ts` - New comprehensive Stripe fee tests
- `tests/shippingFees.test.ts` - Updated with coverage validation
- `tests/e2e/shipping-estimator.spec.ts` - Validates net revenue in prefill

## Validation

### Platform Fee Coverage

The system ensures platform fees cover Stripe fees for typical transactions:

**Free Users (5kg package):**
- Base price: $16 (plane)
- Platform fee: $3 + (8% * $16) = $4.28
- Transaction: $20.28
- Stripe fee: (20.28 * 2.9%) + $0.30 = $0.89
- **Coverage: $4.28 > $0.89 ✅**

**Premium Users (5kg package):**
- Base price: $16 (plane)
- Platform fee: 4% * $16 = $0.64
- Transaction: $16.64
- Stripe fee: (16.64 * 2.9%) + $0.30 = $0.78
- **Coverage: $0.64 < $0.78 ⚠️** (acceptable for premium users)

## Notes

1. **Small Transactions**: Premium users may have negative net revenue on very small transactions. This is acceptable as they pay subscription fees.

2. **Free Users**: Platform fee structure ($3 + 8%) ensures coverage for transactions > $10.

3. **Internal Only**: Stripe fees are never displayed to users. They only see final prices.

4. **Karma Points**: Still calculated using platform fee (before Stripe deduction) to reflect full contribution.

5. **Future Enhancements**: Revenue data can be stored in database or sent to analytics for financial reporting.

