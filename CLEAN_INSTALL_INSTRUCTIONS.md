# Clean Install Instructions for SpareCarry

## Quick Start

Follow these steps to get a clean, working development environment:

### Step 1: Clean Everything

```powershell
# Run the cleanup script
.\scripts\clean-dependencies.ps1
```

Or manually:

```powershell
# Stop Node processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Remove dependencies and caches
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
```

### Step 2: Reinstall Dependencies

```powershell
npx pnpm install
```

**Expected Output**:

- ✅ All packages install successfully
- ✅ No version conflicts
- ✅ No Sentry errors

### Step 3: Start Dev Server

```powershell
npx pnpm dev
```

**Expected Output**:

```
▲ Next.js 14.2.5
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in X.Xs
```

### Step 4: Verify UI

1. Open `http://localhost:3000` in your browser
2. Check:
   - ✅ Page loads without errors
   - ✅ Styling is correct (TailwindCSS working)
   - ✅ No console errors
   - ✅ Layout renders properly

## What Was Fixed

### ✅ Sentry Conflicts Resolved

- Removed from dependencies (now optional)
- All imports use dynamic loading
- Won't break build if not installed

### ✅ Versions Updated

- Next.js: `14.2.5` ✅
- React: `18.2.0` ✅
- React-DOM: `18.2.0` ✅
- TailwindCSS: `3.4.18` ✅

### ✅ Configuration Fixed

- Sentry configs use dynamic imports
- Next.js config cleaned
- TailwindCSS verified working

## Troubleshooting

### Issue: `pnpm install` fails

**Solution**:

```powershell
# Clear pnpm cache
pnpm store prune

# Try again
npx pnpm install
```

### Issue: Dev server won't start

**Solution**:

```powershell
# Clear Next.js cache
Remove-Item -Recurse -Force .next

# Restart
npx pnpm dev
```

### Issue: Styling still broken

**Solution**:

1. Verify `app/globals.css` has Tailwind imports (already verified ✅)
2. Check browser console for CSS errors
3. Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`
4. Restart dev server

### Issue: Module not found errors

**Solution**:

```powershell
# Force reinstall
npx pnpm install --force

# Clear cache
Remove-Item -Recurse -Force .next

# Restart
npx pnpm dev
```

## Verification Checklist

After installation, verify:

- [ ] `pnpm install` completes without errors
- [ ] `pnpm dev` starts successfully
- [ ] `http://localhost:3000` loads
- [ ] No console errors in browser
- [ ] TailwindCSS styling works
- [ ] Layout renders correctly
- [ ] No Sentry-related errors

## Optional: Re-enable Sentry

If you want Sentry later:

```powershell
# Install Sentry
npx pnpm add @sentry/nextjs

# Add to .env.local
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Restart dev server
npx pnpm dev
```

Sentry will automatically initialize with dynamic imports.

## Files Changed

See `FIX_SUMMARY.md` for complete list of changes.

---

**Status**: ✅ Ready for clean installation

**Next Step**: Run `.\scripts\clean-dependencies.ps1` then `npx pnpm install`
