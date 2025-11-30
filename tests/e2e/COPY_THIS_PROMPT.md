# Copy This Prompt for Next Session

````
CONTEXT: E2E Test Suite Fixes - Continuing from Previous Session

We've been fixing E2E test failures in a Playwright test suite. Here's where we left off:

## ✅ COMPLETED (155/161 tests passing - 96.3% pass rate)

All major test suites are fixed including:
- Promo Card Tests (6/6) ✅
- Pricing Estimator Promo (4/4) ✅
- Job Posting Flow - Prohibited Items ✅
- Edge Cases - Emergency Multiplier ✅
- Profile Flow (5/5) ✅
- Subscription Flow ✅
- Shipping Estimator (9/9) ✅
- All Lifetime Tests ✅
- Landing, Item Safety, Negative Tests ✅

## 🚧 REMAINING ISSUES (6 failures to fix)

### Priority 1: EASY FIX (3 tests) - idea-suggestion.spec.ts
**File**: `tests/e2e/flows/idea-suggestion.spec.ts`
**Issue**: Tests trying to manually login instead of using test mode
**Error**: `TimeoutError: page.fill: Timeout 15000ms exceeded` waiting for `input[type="password"]`
**Fix**: Replace manual login in beforeEach with:
```typescript
test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.unroute('**');
  await setupSupabaseMocks(page);
  await setupComprehensiveMocks(page);
  await enableTestMode(page, USER_A); // ADD THIS
});
````

Remove lines 5-19 (manual login code).

### Priority 2: Timeout Issues (2 tests)

1. **auto-category.spec.ts:46** - "should auto-detect clothing category"
   - Title input not found/visible
   - May need form loading wait or selector fix

2. **beta-testing-flow.spec.ts:76** - "should complete shipping estimator → job creation flow"
   - Country dropdown timeout in `selectCountry()` helper
   - May need timeout increase or better dropdown detection

### Priority 3: Verify (1 test)

- **jobs.spec.ts:156** - Should be passing, verify

## Key Files

- Documentation: `tests/e2e/TEST_FIXES_COMPLETE.md`
- Handoff details: `tests/e2e/HANDOFF_PROMPT.md`
- Quick start: `tests/e2e/CONTINUE_HERE.md`

## Test Infrastructure Available

- `enableTestMode(page, user)` - Authenticated test mode
- `waitForPageReady(page)` - Page load helper
- `selectCountry(page, inputId, countryName)` - Country selection
- `setupSupabaseMocks(page)` - API mocking

## Next Steps

1. Run `pnpm test:e2e --workers=1` to see current status
2. Fix idea-suggestion.spec.ts first (easiest - just add test mode setup)
3. Fix timeout issues in auto-category and beta-testing-flow
4. Verify all tests passing

## Goal

Get to 100% pass rate (161/161 tests passing). Currently at 96.3% (155/161).

Please start by running the full test suite to see current status, then fix the remaining failures starting with idea-suggestion tests.

```

```
