# SpareCarry E2E Testing Quick Start

Get started with SpareCarry E2E tests in 5 minutes.

## Prerequisites

1. SpareCarry app running at `http://localhost:3000`
2. Node.js and npm installed
3. Playwright installed (`npm install`)

## Run Your First Test

### 1. Fast Mode (Recommended)

```bash
# Run all tests in fast mode (default)
npm run test:e2e

# Or explicitly
PLAYWRIGHT_TEST_MODE=fast npm run test:e2e
```

### 2. Full Auth Mode

```bash
# Run all tests in full auth mode
PLAYWRIGHT_TEST_MODE=full npm run test:e2e
```

### 3. Run with UI

```bash
# Interactive UI mode
npx playwright test --ui
```

### 4. Run Specific Test

```bash
# Run example tests
npx playwright test tests/e2e/examples/fast-mode-example.spec.ts

# Run subscription tests
npx playwright test tests/e2e/subscription-flow.spec.ts
```

## Write Your First Test

Create `tests/e2e/my-first-test.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import { beforeEachSetup } from "./setup/testSetup";
import { startFromHome } from "./setup/authSession";
import { USER_A } from "./setup/testUsers";

test.describe("My First Test", () => {
  test.beforeEach(async ({ page, context }) => {
    // Set up test environment (fast mode by default)
    await beforeEachSetup(page, context);
  });

  test("should load home page", async ({ page }) => {
    // Start from home with authenticated user (skips login)
    await startFromHome(page, USER_A);

    // Verify page loaded
    await expect(page.locator("text=SpareCarry")).toBeVisible();
  });
});
```

Run it:

```bash
npx playwright test tests/e2e/my-first-test.spec.ts
```

## Test Modes Explained

### Fast Mode (Default)

✅ **Pre-authenticated**: Users are automatically logged in  
✅ **Fast**: Tests run 5-10x faster  
✅ **Feature Focused**: Test features without auth delays  
✅ **Use For**: Daily development, CI/CD, feature testing

```typescript
// Fast mode - start from home with authenticated user
await startFromHome(page, USER_A);
```

### Full Auth Mode

✅ **Real Auth**: Complete login/signup flows  
✅ **Comprehensive**: Test actual authentication  
✅ **Slower**: Includes full auth workflows  
✅ **Use For**: Auth flow testing, onboarding, signup

```typescript
// Full auth mode - test real login flow
await page.goto("/login");
await page.fill('input[type="email"]', "test@example.com");
await page.click('button:has-text("Send magic link")');
```

## Available Test Users

Import from `setup/testUsers` or `setup/testUserFactory`:

```typescript
// Basic users
import { USER_A, USER_B, USER_C } from "./setup/testUsers";

// Subscription users
import {
  USER_NO_SUB, // No subscription
  USER_MONTHLY, // Monthly subscription
  USER_YEARLY, // Yearly subscription
  USER_LIFETIME, // Lifetime Pro
  USER_SAILOR, // Verified sailor
  USER_VETERAN, // High-rating user
  USER_NEW, // New user
} from "./setup/testUserFactory";
```

## Common Patterns

### Test Profile Page

```typescript
import { startFromProfile } from "./setup/authSession";

test("should show profile", async ({ page }) => {
  await startFromProfile(page, USER_A);
  await expect(page.locator("text=Profile")).toBeVisible();
});
```

### Test Subscription Flow

```typescript
import { USER_MONTHLY } from "./setup/testUserFactory";

test("should show subscription status", async ({ page }) => {
  await startFromProfile(page, USER_MONTHLY);
  await expect(page.locator("text=/active/i")).toBeVisible();
});
```

### Multi-User Test

```typescript
import { switchToUser } from "./setup/authSession";
import { USER_A, USER_B } from "./setup/testUsers";

test("should switch users", async ({ page }) => {
  await startFromHome(page, USER_A);
  // ... do something as User A ...

  await switchToUser(page, USER_B);
  // ... do something as User B ...
});
```

## Next Steps

1. ✅ **Run Example Tests**: `npx playwright test tests/e2e/examples/fast-mode-example.spec.ts`
2. ✅ **Read Full Guide**: See `E2E_TEST_GUIDE.md` for comprehensive documentation
3. ✅ **Check Examples**: Review `examples/fast-mode-example.spec.ts` for patterns
4. ✅ **Write Your Tests**: Use the patterns above for your features

## Troubleshooting

### "Please log in" showing up

**Solution**: Use `startFromHome()` or `setupUserMocks()` before navigation:

```typescript
await startFromHome(page, USER_A);
// or
await setupUserMocks(page, USER_A);
await page.goto("/home");
```

### Tests timing out

**Solution**: Increase timeout or check selectors:

```typescript
await expect(page.locator("text=Loading")).toBeVisible({ timeout: 10000 });
```

### Need help?

- Check `E2E_TEST_GUIDE.md` for detailed documentation
- Review example tests in `examples/`
- Check Playwright docs: https://playwright.dev

## Resources

- 📖 **Full Guide**: `E2E_TEST_GUIDE.md`
- 💡 **Examples**: `examples/fast-mode-example.spec.ts`
- 📋 **Summary**: `IMPLEMENTATION_SUMMARY.md`
- 🚀 **Quick Start**: This file

Happy Testing! 🎉
