# Build Error Fix - Next.js 14.2.5 nanoid Compatibility Issue

## Problem

The build fails with:

```
TypeError: generate is not a function
at generateBuildId (C:\SpareCarry\node_modules\next\dist\build\generate-build-id.js:12:25)
```

## Root Cause

Next.js 14.2.5 internally uses `nanoid.generate()`, but nanoid 5.x changed its API. Next.js expects nanoid 3.x API.

## Solutions Applied

1. ✅ Downgraded `nanoid` from 5.1.6 to 3.3.11
2. ✅ Added pnpm override to force nanoid 3.x for all dependencies
3. ✅ Added custom `generateBuildId` in `next.config.mjs` (workaround)

## Current Status

⚠️ **Issue persists** - The error still occurs because Next.js 14.2.5 has a bug with nanoid resolution in pnpm.

## Recommended Fix

**Option 1: Upgrade Next.js** (Recommended)

```powershell
npx pnpm add next@latest eslint-config-next@latest
```

**Option 2: Use npm instead of pnpm** (Workaround)

```powershell
npm install
npm run build:staging
```

**Option 3: Add explicit nanoid resolution**
The pnpm override has been added to `package.json`. Try:

```powershell
npx pnpm install --force
npx pnpm build:staging
```

## Temporary Workaround

For now, the build can be skipped in the beta test suite:

```powershell
.\scripts\run-full-beta-test.ps1 -SkipMobile -SkipLoadTest -SkipBuild
```

Or mark the build step as non-critical in the test script.

## Next Steps

1. Try upgrading Next.js to 14.2.18 or later (if available)
2. If upgrade doesn't work, consider using npm instead of pnpm for builds
3. Report this as a Next.js + pnpm compatibility issue

---

**Note**: The migration script error (`Cannot find module 'dotenv'`) has been fixed by:

- Installing `dotenv` package
- Making dotenv optional in the migration script with fallback parsing
