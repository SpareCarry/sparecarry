# Quick Test Setup Guide

## One-Time Setup (Required)

**Install Playwright browsers:**
```bash
pnpm exec playwright install
```

Or just Chromium (smaller download):
```bash
pnpm exec playwright install chromium
```

## Run Tests

### Unit & Integration Tests (Vitest)
```bash
pnpm test
```
Runs all `.test.ts` files (excludes Playwright `.spec.ts` files)

### E2E Tests (Playwright)
```bash
pnpm test:e2e
```
Runs all `.spec.ts` files in `tests/e2e/`

### All Tests
```bash
pnpm test:all
```
Runs both unit/integration + E2E tests

### E2E with Visual UI (Best for Debugging)
```bash
pnpm test:e2e:ui
```
Opens Playwright UI where you can watch tests run visually

## Test File Types

- **`.test.ts`** - Unit/Integration tests (Vitest) - in `tests/unit/` and `tests/integration/`
- **`.spec.ts`** - E2E tests (Playwright) - in `tests/e2e/`

Vitest automatically excludes `.spec.ts` files, so they only run with Playwright.

## Troubleshooting

### "Executable doesn't exist"
Run: `pnpm exec playwright install`

### Tests not running
- Make sure dev server is running: `pnpm dev`
- Or Playwright will auto-start it

### Mock errors
The mock setup uses inline mocks if the real mock client isn't available. This should work automatically.

