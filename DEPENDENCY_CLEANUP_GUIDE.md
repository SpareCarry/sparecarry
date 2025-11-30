# Dependency Cleanup and Fix Guide

## Problem Summary

- Sentry causing version conflicts and broken UI
- Dev server showing errors
- Styling/layout broken
- Inconsistent dependency versions

## Solution Applied

### 1. ✅ Removed Sentry from Dependencies

**Changes Made**:

- Removed `@sentry/nextjs` from `package.json` dependencies
- Removed `@sentry/cli` from `pnpm.onlyBuiltDependencies`
- Made all Sentry imports optional/dynamic

**Why**: Sentry was causing build conflicts and breaking the UI. It's now optional - only works if installed separately.

### 2. ✅ Updated Next.js Version

**Changes Made**:

- Updated `next` from `14.1.0` to `14.2.5` (as per your context)
- Updated `eslint-config-next` to `14.2.5`

### 3. ✅ Made Sentry Imports Optional

**Files Modified**:

- `sentry.client.config.ts` - Now uses dynamic import with client-side check
- `sentry.server.config.ts` - Now uses dynamic import
- `sentry.edge.config.ts` - Now uses dynamic import
- `app/api/health/route.ts` - Removed direct Sentry import, uses dynamic import
- `lib/logger/index.ts` - Already uses dynamic imports ✅

**Result**: Sentry won't break the build if not installed.

### 4. ✅ Verified React & TailwindCSS Versions

**Current Versions**:

- `react`: `18.2.0` ✅
- `react-dom`: `18.2.0` ✅
- `tailwindcss`: `3.4.18` ✅
- `next`: `14.2.5` ✅

All versions are compatible.

### 5. ✅ Fixed Next.js Config

**Changes Made**:

- Removed Sentry from webpack externals (no longer needed)
- Kept Capacitor externals (still needed)

## Clean Installation Steps

### Step 1: Clean Dependencies

**Option A: Use PowerShell Script (Recommended)**

```powershell
.\scripts\clean-dependencies.ps1
```

**Option B: Manual Cleanup**

```powershell
# Stop any running dev servers
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Remove dependencies
Remove-Item -Recurse -Force node_modules
Remove-Item -Force pnpm-lock.yaml
Remove-Item -Recurse -Force .next
```

### Step 2: Reinstall Dependencies

```powershell
npx pnpm install
```

### Step 3: Test Dev Server

```powershell
npx pnpm dev
```

The dev server should start without errors.

### Step 4: Verify UI

1. Open `http://localhost:3000`
2. Check that:
   - Page loads without errors
   - Styling is correct (TailwindCSS working)
   - No console errors
   - Layout renders properly

## Optional: Re-enable Sentry (If Needed)

If you want to use Sentry later:

1. **Install Sentry**:

   ```powershell
   npx pnpm add @sentry/nextjs
   ```

2. **Add DSN to `.env.local`**:

   ```env
   NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```

3. **Restart dev server**:
   ```powershell
   npx pnpm dev
   ```

Sentry will automatically initialize if DSN is provided.

## Troubleshooting

### Issue: `pnpm dev` still shows errors

**Solution**:

1. Clear `.next` cache: `Remove-Item -Recurse -Force .next`
2. Restart dev server: `npx pnpm dev`

### Issue: Styling still broken

**Solution**:

1. Verify `tailwind.config.ts` is correct (already verified ✅)
2. Check `postcss.config.mjs` is correct (already verified ✅)
3. Ensure `app/globals.css` imports Tailwind
4. Restart dev server

### Issue: Module not found errors

**Solution**:

1. Run: `npx pnpm install --force`
2. Clear cache: `Remove-Item -Recurse -Force .next`
3. Restart dev server

## Files Changed

### Modified

- `package.json` - Removed Sentry, updated Next.js
- `sentry.client.config.ts` - Made optional with dynamic import
- `sentry.server.config.ts` - Made optional with dynamic import
- `sentry.edge.config.ts` - Made optional with dynamic import
- `app/api/health/route.ts` - Removed direct Sentry import
- `next.config.mjs` - Removed Sentry from webpack externals

### Created

- `scripts/clean-dependencies.ps1` - Cleanup script
- `DEPENDENCY_CLEANUP_GUIDE.md` - This guide

### Verified (No Changes Needed)

- `tailwind.config.ts` ✅
- `postcss.config.mjs` ✅
- `lib/logger/index.ts` ✅ (already uses dynamic imports)

## Expected Results

After cleanup and reinstall:

✅ `pnpm dev` starts without errors
✅ UI renders correctly with TailwindCSS
✅ No Sentry-related errors
✅ All imports resolve correctly
✅ Styling and layout work as intended

## Next Steps

1. **Run cleanup script**: `.\scripts\clean-dependencies.ps1`
2. **Reinstall**: `npx pnpm install`
3. **Test**: `npx pnpm dev`
4. **Verify**: Open `http://localhost:3000` and check UI

---

**Status**: ✅ All fixes applied. Ready for clean reinstall.
