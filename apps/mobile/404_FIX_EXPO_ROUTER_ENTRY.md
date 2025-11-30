# Fixed: 404 Error - expo-router/entry Resolution

## Problem

Metro bundler was trying to resolve `expo-router/entry` from the **workspace root** (`C:\SpareCarry/.`) instead of from the **app directory** (`apps/mobile/`).

Error message:

```
Unable to resolve module ./node_modules/.pnpm/expo-router@6.0.15_@expo+me_1f449006d2befaab722153cc94c1ad25/node_modules/expo-router/entry from C:\SpareCarry/.
```

## Root Cause

1. Metro was resolving from workspace root instead of project root
2. The resolver was going through pnpm's `.pnpm` store
3. The `blockList` wasn't aggressive enough to prevent pnpm store resolution

## Fixes Applied

### 1. Enhanced expo-router/entry Resolution

- **Priority**: Always resolve from `apps/mobile/node_modules/expo-router/entry.js` first
- **Fallback**: Use `require.resolve` with explicit `paths` pointing to project `node_modules`
- **Blocking**: Prevent any resolution from pnpm store or workspace root

### 2. Improved Default Resolver

- **Context Fix**: Force resolution context to use `projectRoot` instead of workspace root
- **Post-Resolution Check**: Block ALL resolutions from `.pnpm` store (not just React)
- **Redirect**: Automatically redirect pnpm resolutions to local `node_modules`

### 3. Aggressive Blocking

- Block all `.pnpm` paths
- Block workspace root `node_modules` (except for `@sparecarry/*` packages)
- Log warnings when workspace resolution is used

## Testing

1. **Clear cache and restart**:

   ```bash
   pnpm start:clear
   ```

2. **Check Metro terminal** for:
   - ✅ `[Metro] ✅ Resolved expo-router/entry from project: ...`
   - ❌ No errors about pnpm store
   - ❌ No 404 errors

3. **On device**:
   - App should load successfully
   - No 404 error screen
   - Home screen displays

## Expected Behavior

When working correctly:

- Metro resolves `expo-router/entry` from `apps/mobile/node_modules/expo-router/entry.js`
- No pnpm store resolutions
- Bundle completes successfully
- App loads on device

## If Still Getting 404

1. **Verify entry file exists**:

   ```bash
   Test-Path node_modules/expo-router/entry.js
   # Should return: True
   ```

2. **Check Metro logs** for resolution messages:
   - Look for `[Metro] ✅ Resolved expo-router/entry`
   - Check for any `BLOCKED` or `⚠️` warnings

3. **Clear all caches**:
   ```bash
   pnpm clear-cache
   rm -rf .expo
   rm -rf node_modules/.cache
   pnpm start:clear
   ```
