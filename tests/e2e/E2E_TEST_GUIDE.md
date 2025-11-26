# SpareCarry E2E Testing Guide

Comprehensive guide for running and writing E2E tests for SpareCarry.

## Table of Contents

- [Test Modes](#test-modes)
- [Quick Start](#quick-start)
- [Writing Tests](#writing-tests)
- [Test Users](#test-users)
- [Mocks and Fixtures](#mocks-and-fixtures)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Test Modes

SpareCarry E2E tests support two modes:

### Fast Mode (Default)

- **Pre-authenticated sessions**: Users are automatically authenticated
- **Skip auth flows**: Login/signup/magic link flows are bypassed
- **Fast execution**: Tests start directly from the home screen
- **Use for**: Feature testing, regression testing, CI/CD

**Run fast mode:**
```bash
PLAYWRIGHT_TEST_MODE=fast npm run test:e2e
# or just (default)
npm run test:e2e
```

### Full Auth Mode

- **Real authentication**: Tests use actual login/signup flows
- **Complete auth testing**: Magic links, OTP, session management
- **Slower execution**: Includes full authentication workflows
- **Use for**: Auth flow testing, onboarding flows, signup flows

**Run full auth mode:**
```bash
PLAYWRIGHT_TEST_MODE=full npm run test:e2e
```

## Quick Start

### 1. Set Up Test Environment

Tests are configured in `tests/e2e/`. The main files are:

- `config/test-config.ts` - Test mode configuration
- `setup/testSetup.ts` - Shared test setup hooks
- `setup/testUserFactory.ts` - Test user creation
- `setup/authSession.ts` - Pre-authenticated session helpers
- `helpers/supabase-mocks.ts` - Supabase endpoint mocks
- `helpers/comprehensive-mocks.ts` - Comprehensive feature mocks

### 2. Write Your First Test (Fast Mode)

```typescript
import { test, expect } from '@playwright/test';
import { beforeEachSetup } from '../setup/testSetup';
import { startFromHome } from '../setup/authSession';
import { USER_A } from '../setup/testUserFactory';

test.describe('My Feature Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    await beforeEachSetup(page, context, { mode: 'fast' });
  });

  test('should test my feature', async ({ page }) => {
    // Start from home with authenticated user
    await startFromHome(page, USER_A);

    // Your test code here
    await expect(page.locator('text=SpareCarry')).toBeVisible();
  });
});
```

### 3. Write Your First Test (Full Auth Mode)

```typescript
import { test, expect } from '@playwright/test';
import { beforeEachSetup } from '../setup/testSetup';

test.describe('Auth Flow Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    await beforeEachSetup(page, context, { mode: 'full' });
  });

  test('should complete login flow', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill in email
    await page.fill('input[type="email"]', 'test@example.com');

    // Click send magic link
    await page.click('button:has-text("Send magic link")');

    // Verify magic link sent
    await expect(page.locator('text=Check your email')).toBeVisible();
  });
});
```

## Writing Tests

### Fast Mode Tests

Use fast mode for feature testing when you don't need to test auth flows:

```typescript
import { test, expect } from '@playwright/test';
import { beforeEachSetup } from '../setup/testSetup';
import { startFromHome, startFromProfile } from '../setup/authSession';
import { USER_A, USER_MONTHLY, USER_LIFETIME } from '../setup/testUserFactory';

test.describe('Feature Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    await beforeEachSetup(page, context);
  });

  test('should load home page', async ({ page }) => {
    await startFromHome(page, USER_A);
    await expect(page.locator('text=SpareCarry')).toBeVisible();
  });

  test('should display subscription options', async ({ page }) => {
    await startFromProfile(page, USER_A);
    await expect(page.locator('text=SpareCarry Pro')).toBeVisible();
  });
});
```

### Multi-User Tests

Test interactions between multiple users:

```typescript
import { test, expect } from '@playwright/test';
import { beforeEachSetup } from '../setup/testSetup';
import { startFromHome, switchToUser } from '../setup/authSession';
import { USER_A, USER_B } from '../setup/testUserFactory';

test.describe('Multi-User Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    await beforeEachSetup(page, context);
  });

  test('should test user interaction', async ({ page }) => {
    // Start as User A
    await startFromHome(page, USER_A);
    
    // Create a request as User A
    await page.click('text=Post Request');
    // ... fill form ...

    // Switch to User B
    await switchToUser(page, USER_B);
    
    // Claim request as User B
    await page.click('text=Browse');
    // ... claim request ...
  });
});
```

### Full Auth Mode Tests

Use full auth mode for testing authentication flows:

```typescript
import { test, expect } from '@playwright/test';
import { beforeEachSetup } from '../setup/testSetup';

test.describe('Auth Flow Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    await beforeEachSetup(page, context, { mode: 'full' });
    // Clear auth state
    await context.clearCookies();
  });

  test('should complete signup flow', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'newuser@test.com');
    await page.click('button:has-text("Send magic link")');
    // ... continue with signup flow ...
  });
});
```

## Test Users

### Predefined Users

The test suite includes predefined users for common scenarios:

- `USER_A` - Basic requester user
- `USER_B` - Basic traveler user
- `USER_NO_SUB` - User with no subscription
- `USER_MONTHLY` - User with monthly subscription
- `USER_YEARLY` - User with yearly subscription
- `USER_LIFETIME` - User with lifetime Pro
- `USER_SAILOR` - Verified sailor/traveler
- `USER_VETERAN` - High-rating user with referrals
- `USER_NEW` - New user for onboarding tests

### Creating Custom Users

Create users with specific attributes:

```typescript
import { createTestUser } from '../setup/testUserFactory';

const customUser = createTestUser({
  prefix: 'myuser',
  role: 'requester',
  subscription: 'monthly',
  lifetimePro: false,
  verifiedSailor: false,
  completedDeliveries: 5,
  averageRating: 4.8,
});
```

### Subscription Types

- `'none'` - No subscription
- `'monthly'` - Monthly subscription ($6.99/month)
- `'yearly'` - Yearly subscription ($59/year)
- `'lifetime'` - Lifetime Pro ($100 one-time)

### User Roles

- `'requester'` - Creates delivery requests
- `'traveler'` - Claims requests and delivers items
- `'sailor'` - Verified traveler (boats/ships)
- `'admin'` - Administrator

## Mocks and Fixtures

### Supabase Mocks

All Supabase endpoints are automatically mocked:

- **Auth endpoints**: `/auth/v1/otp`, `/auth/v1/user`, `/auth/v1/token`
- **REST API**: `/rest/v1/users`, `/rest/v1/profiles`, `/rest/v1/trips`, `/rest/v1/requests`, etc.
- **RPC functions**: `get_lifetime_availability`, etc.

### Stripe Mocks

Stripe checkout and webhook endpoints are mocked:

- **Checkout**: `/api/checkout/**`
- **Webhooks**: `/api/webhooks/stripe`

### Custom Test Data

Provide custom test data for mocks:

```typescript
import { setupComprehensiveMocks } from '../helpers/comprehensive-mocks';

await setupComprehensiveMocks(page, {
  testData: {
    trips: [
      {
        id: 'trip_1',
        user_id: USER_A.id,
        from: 'New York',
        to: 'London',
        status: 'active',
      },
    ],
    requests: [
      {
        id: 'req_1',
        user_id: USER_B.id,
        from: 'New York',
        to: 'London',
        status: 'open',
      },
    ],
  },
});
```

## Best Practices

### 1. Use Fast Mode by Default

Use fast mode for most tests. Only use full auth mode when testing auth flows specifically.

### 2. Start from Home

In fast mode, use `startFromHome()` to start tests from the home screen with an authenticated user.

### 3. Use Descriptive Test Names

```typescript
// Good
test('should display subscription options for monthly user', async ({ page }) => {
  // ...
});

// Bad
test('subscription test', async ({ page }) => {
  // ...
});
```

### 4. Clean Up Between Tests

The `beforeEachSetup` hook automatically cleans up state, but be mindful of test isolation.

### 5. Wait for Elements

Always wait for elements to be visible before interacting:

```typescript
// Good
await expect(page.locator('button')).toBeVisible();
await page.click('button');

// Bad
await page.click('button'); // May fail if not visible
```

### 6. Use Multiple Test Users

Test multi-user scenarios with different users:

```typescript
test('should handle request claiming', async ({ page }) => {
  await startFromHome(page, USER_A);
  // Create request...
  
  await switchToUser(page, USER_B);
  // Claim request...
});
```

## Troubleshooting

### Tests Failing in Fast Mode

**Problem**: Tests show "Please log in" even in fast mode.

**Solution**: Ensure you're using `startFromHome()` or `setupUserMocks()` before navigation:

```typescript
await startFromHome(page, USER_A);
// or
await setupUserMocks(page, USER_A);
await page.goto('/home');
```

### Tests Timing Out

**Problem**: Tests timing out waiting for elements.

**Solution**: Increase timeout or check if element selectors are correct:

```typescript
await expect(page.locator('text=Loading')).toBeVisible({ timeout: 10000 });
```

### Auth Mocks Not Working

**Problem**: Authentication mocks not returning user data.

**Solution**: Ensure `setupSupabaseMocks()` is called in `beforeEach`:

```typescript
test.beforeEach(async ({ page, context }) => {
  await beforeEachSetup(page, context);
});
```

### Network Requests Not Mocked

**Problem**: Real network requests being made instead of mocks.

**Solution**: Ensure comprehensive mocks are set up:

```typescript
import { setupComprehensiveMocks } from '../helpers/comprehensive-mocks';
await setupComprehensiveMocks(page);
```

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

### Run Specific Test File

```bash
npx playwright test tests/e2e/examples/fast-mode-example.spec.ts
```

### Run in UI Mode

```bash
npx playwright test --ui
```

### Run in Headed Mode

```bash
npx playwright test --headed
```

### Run in Specific Browser

```bash
npx playwright test --project=chromium
```

### Debug Tests

```bash
npx playwright test --debug
```

## Examples

See `tests/e2e/examples/fast-mode-example.spec.ts` for complete examples of:

- Fast mode tests
- Multi-user interaction tests
- Subscription testing
- Profile testing
- Job posting flows

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review example tests
3. Check Playwright documentation
4. Review test configuration files

