import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration for E2E Tests
 * 
 * Run tests with:
 * - `npm run test:e2e` - Run all E2E tests
 * - `npm run test:e2e:ui` - Run with Playwright UI
 * - `npm run test:e2e:headed` - Run in headed mode
 * - `npm run test:e2e:auth` - Run only auth flow tests
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["json", { outputFile: "test-results-playwright.json" }],
    ["list"],
  ],
  timeout: 90000, // 90 second timeout per test (increased for slower pages)
  
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15000, // 15 second timeout for actions (increased)
    navigationTimeout: 45000, // 45 second timeout for navigation (increased)
  },
  
  // Global setup/teardown
  // globalSetup: "./tests/e2e/setup/global-setup.ts",
  // globalTeardown: "./tests/e2e/setup/global-teardown.ts",

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Only test on Chromium by default - add others when needed
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },
  ],

  // Start Next.js dev server before running tests
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
