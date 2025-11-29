# Variant Violation Fix - Verification Checklist

## Pre-Verification

1. **Reinstall dependencies** (if needed):
   ```bash
   cd C:\SpareCarry
   pnpm install
   ```

## Verification Steps

### 1. Check React Resolution Path
```bash
cd C:\SpareCarry\apps\mobile
node -e "console.log('React from:', require.resolve('react'))"
```

**Expected**: Should show path containing `apps\mobile\node_modules\react` or `apps/mobile/node_modules/react`

**If it shows root node_modules**: The fix may need pnpm reinstall

### 2. Verify pnpm Dependency Tree
```bash
cd C:\SpareCarry
pnpm why react | Select-Object -First 20
```

**Expected**: Should show React 18.3.1 resolved consistently

### 3. Start Metro Bundler
```bash
cd C:\SpareCarry\apps\mobile
npx expo start -c
```

**Expected**:
- ✅ Bundling completes successfully
- ✅ No "Unable to resolve" errors
- ✅ QR code displays

### 4. Check Console Logs (in Metro output)

Look for these log messages:
```
=== REACT RESOLUTION CHECK ===
React resolved from: ...apps/mobile/node_modules/react...
React version: 18.3.1
Is React from mobile app node_modules? true
✅ React singleton check initialized
```

**If you see**: `⚠️ WARNING: Multiple React instances detected!`
- This means the fix didn't work completely
- Check Metro config and pnpm overrides

### 5. Load App in Expo Go

**Expected**:
- ✅ No red error screen
- ✅ No "Variant Violation" error
- ✅ App loads and renders
- ✅ Navigation works
- ✅ UI components display correctly

### 6. Test Hook Usage

Navigate to pages that use:
- `@sparecarry/ui` components (LocationInput, etc.)
- `@sparecarry/hooks` (useAuth, useLocation, etc.)

**Expected**:
- ✅ Components render without errors
- ✅ Hooks work correctly
- ✅ No "Invalid hook call" errors

## Success Criteria

- [ ] React resolves from mobile app's node_modules
- [ ] Single React instance (no warnings in console)
- [ ] Bundling succeeds without errors
- [ ] App loads in Expo Go without variant violation
- [ ] UI components render correctly
- [ ] Hooks work as expected

## If Issues Persist

1. **Clear all caches**:
   ```bash
   cd C:\SpareCarry\apps\mobile
   Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue
   npx expo start -c
   ```

2. **Full reinstall**:
   ```bash
   cd C:\SpareCarry
   Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force apps/mobile/node_modules -ErrorAction SilentlyContinue
   Remove-Item pnpm-lock.yaml -ErrorAction SilentlyContinue
   pnpm install
   ```

3. **Check Metro config**:
   - Verify `extraNodeModules` has explicit React mappings
   - Verify `nodeModulesPaths` has mobile app's node_modules first

4. **Check pnpm overrides**:
   - Verify global `react: 18.3.1` override exists
   - Verify `react-dom: 18.3.1` override exists

