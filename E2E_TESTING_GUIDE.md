# Complete E2E Testing Guide

## Automated Testing Setup

Now you can test 100% of the app automatically! No more manual testing for every change.

## Available Test Commands

### Run All Tests (Unit + E2E)

```bash
pnpm test:all
```

Runs all unit tests (Vitest) and all E2E tests (Playwright).

### Run E2E Tests Only

```bash
pnpm test:e2e
```

Runs all E2E tests with Playwright.

### Run E2E Tests with UI (Visual)

```bash
pnpm test:e2e:ui
```

Opens Playwright UI where you can:

- See tests running in real-time
- Watch the browser
- Debug failures visually
- Re-run individual tests

### Run E2E Tests in Headed Mode (See Browser)

```bash
pnpm test:e2e:headed
```

Runs tests with visible browser window so you can watch what's happening.

### Run Specific Test Files

```bash
pnpm test:e2e tests/e2e/auth-flow.spec.ts
```

Run only auth flow tests.

### Run Auth Flow Tests Only

```bash
npm run test:e2e:auth
```

Runs only authentication-related E2E tests.

## What Gets Tested

### Auth Flow Tests (`tests/e2e/auth-flow.spec.ts`)

- ✅ Landing page buttons (Plane/Boat) navigate to login
- ✅ Magic link request with correct email
- ✅ Magic link callback handling
- ✅ Authentication error handling
- ✅ Redirect parameter preservation

### Complete App Flow Tests (`tests/e2e/complete-app-flow.spec.ts`)

- ✅ Full user journey: landing → auth → home
- ✅ All buttons on landing page work
- ✅ Auth callback handles all scenarios

### Existing Tests

- ✅ Auth page display (`tests/e2e/auth.spec.ts`)
- ✅ Feed browsing (`tests/e2e/feed.spec.ts`)
- ✅ Payment flow (`tests/e2e/full-payment-flow.spec.ts`)

## Test Configuration

Tests run against:

- **Base URL**: `http://localhost:3000` (or `PLAYWRIGHT_TEST_BASE_URL` env var)
- **Browsers**: Chromium, Firefox, WebKit (Safari)
- **Auto-start server**: Dev server starts automatically if not running
- **Retries**: 2 retries on failure (CI mode)

## CI/CD Integration

Tests are ready for CI/CD:

- Set `CI=true` environment variable
- Tests will retry on failure
- Single worker for stability
- Video/screenshots on failure

## Adding New Tests

### Example: Test a New Feature

```typescript
// tests/e2e/my-feature.spec.ts
import { test, expect } from "@playwright/test";

test.describe("My Feature", () => {
  test("should work correctly", async ({ page }) => {
    await page.goto("http://localhost:3000");
    // Your test here
    await expect(page.getByText("Expected text")).toBeVisible();
  });
});
```

## Tips

1. **Use Visual UI for Debugging**: Run `pnpm test:e2e:ui` to see tests visually
2. **Watch Browser**: Use `pnpm test:e2e:headed` to see what's happening
3. **Isolate Tests**: Use `test.only()` to run one test
4. **Debug Mode**: Use `await page.pause()` in test to pause execution

## Troubleshooting

### Tests Fail to Start

- Make sure dev server is running or tests will auto-start it
- Check port 3000 is available

### Tests Timeout

- Increase timeout in test: `test.setTimeout(60000)`
- Check if server is responding

### Auth Tests Fail

- Make sure Supabase redirect URLs are configured
- Check environment variables are set

## Next Steps

1. **Run all tests**: `pnpm test:all`
2. **Add more tests** for features you want to protect
3. **Run in CI/CD** to catch issues early

No more manual testing! 🎉
