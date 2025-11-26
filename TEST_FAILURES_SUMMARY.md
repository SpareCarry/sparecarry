# Test Failures Summary

## Overview
- **Total Tests**: 108
- **Passed**: 89 ✅
- **Failed**: 19 ❌
- **Success Rate**: 82.4%

## Critical Issues

### 1. Missing API Routes (3 test suites failing)
These routes are expected but don't exist:
- ❌ `app/api/matches/auto-match/route.ts` - Missing
- ❌ `app/api/payments/create-intent/route.ts` - Missing  
- ❌ `app/api/payments/auto-release/route.ts` - Returns 404 instead of 401
- ❌ `app/api/subscriptions/create-checkout/route.ts` - Returns 404 instead of 400

**Impact**: 3 test suites can't run, 4 integration tests failing

### 2. Missing Platform Fee Module
- ❌ `lib/pricing/platform-fee.ts` - Missing
- Function `calculatePlatformFee` returns 0 instead of calculated fees

**Impact**: 9 shipping fee tests failing, 3 Stripe fee tests failing

### 3. Missing Next.js Navigation Mock
- ❌ `useSearchParams` not mocked in test setup
- Component `PostRequestForm` uses `useSearchParams` but mock doesn't export it

**Impact**: 3 component tests failing

## Detailed Failures

### Failed Test Suites (3)
1. `tests/integration/api/matches/auto-match.test.ts` - Route doesn't exist
2. `tests/integration/api/payments/create-intent.test.ts` - Route doesn't exist
3. `tests/unit/lib/pricing/platform-fee.test.ts` - Module doesn't exist

### Failed Tests (19)

#### Shipping Fees (9 failures)
- All `calculatePlatformFee` tests failing - function returns 0
- All `validatePlatformFeeCoversStripe` tests failing - depends on platform fee

#### Stripe Fees (3 failures)
- All `validatePlatformFeeCoversStripe` tests failing

#### Integration API Tests (4 failures)
- `auto-release.test.ts` - Expected 401, got 404 (route missing)
- `payment-flow.test.ts` - Expected non-404, got 404 (routes missing)
- `subscription-flow.test.ts` - Expected 400, got 404 (route missing)

#### Component Tests (3 failures)
- `post-request-form.test.tsx` - All 3 tests failing due to missing `useSearchParams` mock

## Next Steps

1. **Create missing API routes**
2. **Create platform fee module**
3. **Fix Next.js navigation mocks**
4. **Re-run tests to verify fixes**

