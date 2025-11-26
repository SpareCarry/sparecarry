# SpareCarry E2E Test Suite

Comprehensive end-to-end testing for SpareCarry with fast and full auth modes.

## Features

✅ **Fast Mode (Default)**: Pre-authenticated sessions for rapid testing  
✅ **Full Auth Mode**: Real authentication flows for comprehensive auth testing  
✅ **Multi-User Testing**: Test interactions between multiple users  
✅ **Comprehensive Mocks**: All Supabase endpoints and Stripe payments mocked  
✅ **Subscription Testing**: Monthly, yearly, and lifetime subscription flows  
✅ **Role-Based Testing**: Requester, traveler, sailor, and admin roles  
✅ **Feature Coverage**: Home, profile, jobs, messaging, payments, subscriptions  

## Quick Start

### Run All Tests (Fast Mode)

```bash
npm run test:e2e
# or
PLAYWRIGHT_TEST_MODE=fast npm run test:e2e
```

### Run Full Auth Mode

```bash
PLAYWRIGHT_TEST_MODE=full npm run test:e2e
```

### Run with UI

```bash
npx playwright test --ui
```

## Test Modes

### Fast Mode (Default)

- Pre-authenticated sessions
- Skips login/signup flows
- Tests start from home screen
- Fast execution for CI/CD

**Use for**: Feature testing, regression testing, daily development

### Full Auth Mode

- Real authentication flows
- Complete login/signup testing
- Magic link and OTP flows
- Slower but comprehensive

**Use for**: Auth flow testing, onboarding flows, signup flows

## Project Structure

```
tests/e2e/
├── config/               # Test configuration
│   └── test-config.ts   # Fast/full auth mode switching
├── setup/               # Test setup and helpers
│   ├── testSetup.ts     # Shared beforeEach hooks
│   ├── testUsers.ts     # Basic test users
│   ├── testUserFactory.ts  # User factory with all subscription types
│   ├── authSession.ts   # Pre-authenticated session helpers
│   └── supabaseHelpers.ts  # Supabase mocking utilities
├── helpers/             # Mock helpers
│   ├── supabase-mocks.ts      # Base Supabase mocks
│   └── comprehensive-mocks.ts # Comprehensive feature mocks
├── examples/            # Example tests
│   └── fast-mode-example.spec.ts
├── flows/               # Feature flow tests
├── lifetime/            # Lifetime subscription tests
└── E2E_TEST_GUIDE.md    # Comprehensive testing guide
```

## Test Organization

### Feature Tests

- `flows/auth.spec.ts` - Authentication flows
- `flows/jobs.spec.ts` - Job posting and management
- `flows/profile.spec.ts` - Profile and settings
- `flows/messaging.spec.ts` - Messaging between users
- `subscription-flow.spec.ts` - Subscription management
- `lifetime/*.spec.ts` - Lifetime subscription flows

### Example Tests

See `examples/fast-mode-example.spec.ts` for examples of:
- Fast mode testing
- Multi-user interactions
- Subscription testing
- Profile testing

## Test Users

Predefined users for common scenarios:

- `USER_A` - Basic requester
- `USER_B` - Basic traveler
- `USER_MONTHLY` - Monthly subscription user
- `USER_YEARLY` - Yearly subscription user
- `USER_LIFETIME` - Lifetime Pro user
- `USER_SAILOR` - Verified sailor/traveler
- `USER_VETERAN` - High-rating user with referrals

See `setup/testUserFactory.ts` for creating custom users.

## Writing Tests

### Fast Mode Example

```typescript
import { test, expect } from '@playwright/test';
import { beforeEachSetup } from '../setup/testSetup';
import { startFromHome } from '../setup/authSession';
import { USER_A } from '../setup/testUsers';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page, context }) => {
    await beforeEachSetup(page, context);
  });

  test('should test feature', async ({ page }) => {
    await startFromHome(page, USER_A);
    // Your test code
  });
});
```

### Full Auth Mode Example

```typescript
import { test, expect } from '@playwright/test';
import { beforeEachSetup } from '../setup/testSetup';

test.describe('Auth Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    await beforeEachSetup(page, context, { mode: 'full' });
  });

  test('should login', async ({ page }) => {
    await page.goto('/login');
    // Test login flow
  });
});
```

See `E2E_TEST_GUIDE.md` for comprehensive documentation.

## Configuration

### Environment Variables

- `PLAYWRIGHT_TEST_MODE` - Set to `fast` or `full` (default: `fast`)
- `PLAYWRIGHT_TEST_BASE_URL` - Base URL for tests (default: `http://localhost:3000`)

### Playwright Config

See `playwright.config.ts` for full configuration.

## Coverage

✅ Authentication flows  
✅ User profiles and settings  
✅ Subscription management (monthly/yearly/lifetime)  
✅ Job posting (trips and requests)  
✅ Messaging between users  
✅ Payment flows  
✅ Multi-user interactions  
✅ Role-based access  
✅ Referral program  
✅ Lifetime subscription limits  

## Troubleshooting

### Tests Failing

1. Ensure test server is running: `npm run dev`
2. Check test mode: `PLAYWRIGHT_TEST_MODE=fast`
3. Verify mocks are set up in `beforeEach`
4. Check browser console for errors

### Auth Issues

- In fast mode: Use `startFromHome()` to pre-authenticate
- In full auth mode: Ensure auth state is cleared before tests

See `E2E_TEST_GUIDE.md` for detailed troubleshooting.

## Contributing

When adding new tests:

1. Use fast mode by default
2. Use `beforeEachSetup()` for setup
3. Use `startFromHome()` for fast mode tests
4. Create test users with `testUserFactory` if needed
5. Add mocks in `helpers/comprehensive-mocks.ts` if needed

## Resources

- [E2E Test Guide](./E2E_TEST_GUIDE.md) - Comprehensive testing guide
- [Playwright Documentation](https://playwright.dev)
- [Example Tests](./examples/fast-mode-example.spec.ts)

