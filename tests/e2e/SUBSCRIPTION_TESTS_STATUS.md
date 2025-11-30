# Subscription Flow Tests - Status

## ✅ Passing Tests (6/8)

1. **should display subscription options on profile page** ✅
2. **should show lifetime option with early bird pricing** ✅
3. **should create checkout session for monthly subscription** ✅
4. **should create checkout session for yearly subscription** ✅
5. **should create checkout session for lifetime subscription** ✅
6. **should handle lifetime limit reached** ✅

## ❌ Failing Tests (2/8)

7. **should show active subscription status when user has subscription** ❌
   - Issue: Auth failing - showing login prompt
   - These tests use old `setupUserMocks()` instead of new `setupSubscriptionTest()` helper

8. **should show lifetime status when user has lifetime Pro** ❌
   - Issue: Auth failing - showing login prompt
   - These tests use old `setupUserMocks()` instead of new `setupSubscriptionTest()` helper

## Solution

The 2 failing tests need to be updated to use `setupSubscriptionTest()` helper instead of `setupUserMocks()`:

```typescript
// OLD (lines 520-550):
test("should show active subscription status", async ({ page }) => {
  await setupUserMocks(page, USER_A);
  await page.route("**/rest/v1/users**", ...);  // Manual mocking
  ...
});

// NEW (should be):
test("should show active subscription status", async ({ page }) => {
  const userWithSubscription = {
    ...USER_A,
    userData: {
      ...USER_A.userData,
      subscription_status: 'active',
    },
  };
  await setupSubscriptionTest(page, userWithSubscription);
  ...
});
```

## Files to Update

- `tests/e2e/subscription-flow.spec.ts` line 520-570 (active subscription test)
- `tests/e2e/subscription-flow.spec.ts` line 575-625 (lifetime user test)

Replace the old `setupUserMocks + manual page.route` pattern with `setupSubscriptionTest()`.

## Key Learning

The `setupSubscriptionTest()` helper provides:

- ✅ Test mode auth bypass
- ✅ Lifetime availability mocks
- ✅ Profile data mocks
- ✅ User data mocks
- ✅ Proper data structure for all user types

This is much more reliable than manually mocking each route.
