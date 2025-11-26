# SpareCarry E2E Test Implementation Summary

## Overview

A comprehensive Playwright E2E testing environment has been created for SpareCarry with two testing modes:

1. **Fast Mode (Default)**: Pre-authenticated sessions for rapid testing
2. **Full Auth Mode**: Real authentication flows for comprehensive auth testing

## Implementation Details

### 1. Test Configuration System

**File**: `tests/e2e/config/test-config.ts`

- Mode switching via `PLAYWRIGHT_TEST_MODE` environment variable
- Default: `fast` mode
- Configuration object for timeouts and settings
- Helper functions to check current mode

**Usage**:
```bash
# Fast mode (default)
npm run test:e2e
# or explicitly
PLAYWRIGHT_TEST_MODE=fast npm run test:e2e

# Full auth mode
PLAYWRIGHT_TEST_MODE=full npm run test:e2e
```

### 2. Enhanced Test User Factory

**File**: `tests/e2e/setup/testUserFactory.ts`

Predefined users for common scenarios:

- `USER_NO_SUB` - No subscription
- `USER_MONTHLY` - Monthly subscription ($6.99/month)
- `USER_YEARLY` - Yearly subscription ($59/year)
- `USER_LIFETIME` - Lifetime Pro ($100 one-time)
- `USER_SAILOR` - Verified sailor/traveler
- `USER_VETERAN` - High-rating user with referrals
- `USER_NEW` - New user for onboarding tests

**Custom User Creation**:
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

### 3. Pre-Authenticated Session Helpers

**File**: `tests/e2e/setup/authSession.ts`

Helper functions for fast mode:

- `setupAuthenticatedSession()` - Set up pre-authenticated session
- `startFromHome()` - Start test from home screen with authenticated user
- `startFromProfile()` - Start test from profile screen
- `switchToUser()` - Switch to different user mid-test (for multi-user scenarios)

**Usage**:
```typescript
// Start from home with authenticated user
await startFromHome(page, USER_A);

// Switch to different user
await switchToUser(page, USER_B);
```

### 4. Comprehensive Mock System

**Files**:
- `tests/e2e/helpers/supabase-mocks.ts` - Base Supabase mocks
- `tests/e2e/helpers/comprehensive-mocks.ts` - Comprehensive feature mocks

**Mocked Endpoints**:

#### Supabase Auth
- `**/auth/v1/otp**` - Magic link sign-in
- `**/auth/v1/user**` - Get user info
- `**/auth/v1/token**` - Session refresh

#### Supabase REST API
- `**/rest/v1/users**` - User data
- `**/rest/v1/profiles**` - User profiles
- `**/rest/v1/trips**` - Traveler trips
- `**/rest/v1/requests**` - Delivery requests
- `**/rest/v1/matches**` - Trip-request matches
- `**/rest/v1/conversations**` - Chat conversations
- `**/rest/v1/messages**` - Chat messages

#### Stripe
- `**/api/checkout/**` - Checkout session creation
- `**/api/webhooks/stripe**` - Webhook processing

#### RPC Functions
- `**/rest/v1/rpc/get_lifetime_availability**` - Lifetime subscription availability

### 5. Shared Test Setup

**File**: `tests/e2e/setup/testSetup.ts`

Standardized `beforeEach` hook:

- `beforeEachSetup()` - Complete test setup with mode support
- `setupTestEnvironment()` - Base environment setup
- `setupFastMode()` - Fast mode setup
- `setupFullAuthMode()` - Full auth mode setup
- Helper functions for waiting and cleanup

**Usage**:
```typescript
test.beforeEach(async ({ page, context }) => {
  await beforeEachSetup(page, context, {
    mode: 'fast', // or 'full' or 'auto'
    user: USER_A, // optional: pre-authenticate specific user
  });
});
```

### 6. Example Tests

**File**: `tests/e2e/examples/fast-mode-example.spec.ts`

Complete examples demonstrating:

- Fast mode testing
- Multi-user interactions
- Subscription testing
- Profile testing
- Job posting flows
- User switching mid-test

## File Structure

```
tests/e2e/
├── config/
│   └── test-config.ts              # Test mode configuration
├── setup/
│   ├── testSetup.ts                # Shared beforeEach hooks
│   ├── testUsers.ts                # Basic test users (USER_A, USER_B, USER_C)
│   ├── testUserFactory.ts          # Enhanced user factory with all subscription types
│   ├── authSession.ts              # Pre-authenticated session helpers
│   └── supabaseHelpers.ts          # Supabase mocking utilities
├── helpers/
│   ├── supabase-mocks.ts           # Base Supabase endpoint mocks
│   └── comprehensive-mocks.ts      # Comprehensive feature mocks
├── examples/
│   └── fast-mode-example.spec.ts   # Example tests
├── flows/                          # Feature flow tests (existing)
├── lifetime/                       # Lifetime subscription tests (existing)
├── README.md                       # Quick start guide
├── E2E_TEST_GUIDE.md              # Comprehensive testing guide
└── IMPLEMENTATION_SUMMARY.md       # This file
```

## Key Features

### Fast Mode Benefits

✅ **Speed**: Tests run 5-10x faster by skipping auth flows  
✅ **Deterministic**: Pre-authenticated sessions are reliable  
✅ **CI/CD Ready**: Fast execution for continuous integration  
✅ **Feature Focused**: Test features without auth complexity  

### Full Auth Mode Benefits

✅ **Comprehensive**: Real authentication flows  
✅ **Auth Testing**: Complete login/signup/magic link testing  
✅ **Onboarding**: Test complete user onboarding flows  
✅ **Real-World**: Tests mirror actual user experience  

### Multi-User Support

✅ **User Switching**: Switch between users mid-test  
✅ **Interaction Testing**: Test user-to-user interactions  
✅ **Role-Based**: Different roles with different permissions  
✅ **Subscription States**: Different subscription tiers  

## Testing Workflows

### Fast Mode Workflow

1. `beforeEachSetup()` sets up mocks
2. `startFromHome()` pre-authenticates user and navigates to home
3. Test executes without auth delays
4. Fast, deterministic results

### Full Auth Mode Workflow

1. `beforeEachSetup()` sets up mocks
2. Test navigates to login/signup
3. Test completes real auth flows
4. Test continues with authenticated user
5. Slower but comprehensive

## Coverage

✅ **Authentication**: Fast mode (pre-auth) + Full auth mode  
✅ **Subscriptions**: Monthly, yearly, lifetime  
✅ **User Roles**: Requester, traveler, sailor, admin  
✅ **Job Posting**: Trips and requests  
✅ **Messaging**: Conversations and messages  
✅ **Payments**: Stripe checkout and webhooks  
✅ **Profile Management**: Settings and preferences  
✅ **Multi-User**: User interactions and switching  
✅ **Lifetime Limits**: Early-bird conditions and limits  

## Usage Examples

### Fast Mode Test

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
    await expect(page.locator('text=SpareCarry')).toBeVisible();
  });
});
```

### Multi-User Test

```typescript
import { test, expect } from '@playwright/test';
import { beforeEachSetup } from '../setup/testSetup';
import { startFromHome, switchToUser } from '../setup/authSession';
import { USER_A, USER_B } from '../setup/testUsers';

test.describe('Multi-User', () => {
  test.beforeEach(async ({ page, context }) => {
    await beforeEachSetup(page, context);
  });

  test('should test interaction', async ({ page }) => {
    await startFromHome(page, USER_A);
    // Create request as User A
    await switchToUser(page, USER_B);
    // Claim request as User B
  });
});
```

### Full Auth Mode Test

```typescript
import { test, expect } from '@playwright/test';
import { beforeEachSetup } from '../setup/testSetup';

test.describe('Auth Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    await beforeEachSetup(page, context, { mode: 'full' });
  });

  test('should login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("Send magic link")');
    // Continue with login flow
  });
});
```

## Next Steps

### For Developers

1. **Read the Guide**: See `E2E_TEST_GUIDE.md` for comprehensive documentation
2. **Review Examples**: Check `examples/fast-mode-example.spec.ts` for working examples
3. **Use Fast Mode**: Default to fast mode for most tests
4. **Add Tests**: Use the established patterns for new features

### For CI/CD

1. **Set Mode**: `PLAYWRIGHT_TEST_MODE=fast` for faster builds
2. **Run Tests**: `npm run test:e2e` in CI pipeline
3. **View Results**: Check Playwright HTML reports

### For Manual Testing

1. **Use UI Mode**: `npx playwright test --ui` for interactive testing
2. **Debug Tests**: `npx playwright test --debug` for step-by-step debugging
3. **Headed Mode**: `npx playwright test --headed` to see browser

## Maintenance

### Adding New Mocks

Add to `helpers/comprehensive-mocks.ts`:

```typescript
export async function mockNewEndpoint(page: Page) {
  await page.route('**/api/new-endpoint**', async (route) => {
    // Mock logic
  });
}
```

### Adding New Test Users

Add to `setup/testUserFactory.ts`:

```typescript
export const USER_NEW_TYPE = createTestUser({
  prefix: 'newtype',
  role: 'requester',
  subscription: 'monthly',
});
```

### Updating Test Setup

Modify `setup/testSetup.ts` to update shared setup logic.

## Support

- **Documentation**: `E2E_TEST_GUIDE.md`
- **Examples**: `examples/fast-mode-example.spec.ts`
- **Quick Start**: `README.md`
- **Playwright Docs**: https://playwright.dev

