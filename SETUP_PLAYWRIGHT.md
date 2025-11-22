# Playwright Setup Guide

## Quick Setup

Playwright browsers need to be installed before running E2E tests:

```bash
pnpm exec playwright install
```

Or use the npm script:

```bash
npm run playwright:install
```

## First Time Running Tests

1. **Install Playwright browsers:**
   ```bash
   pnpm exec playwright install
   ```
   This downloads Chromium, Firefox, and WebKit browsers (~300MB).

2. **Run E2E tests:**
   ```bash
   pnpm test:e2e
   ```

3. **Or run with visual UI:**
   ```bash
   pnpm test:e2e:ui
   ```

## Troubleshooting

### Browsers Not Found

If you see "Executable doesn't exist", run:
```bash
pnpm exec playwright install
```

### Only Test on Chromium (Faster)

The config now only runs tests on Chromium by default. To test on all browsers, uncomment the Firefox and WebKit projects in `playwright.config.ts`.

### Install Only Chromium (Smaller Download)

```bash
pnpm exec playwright install chromium
```

This installs only Chromium (~100MB instead of ~300MB).

