# React Version Conflict Fix

## Problem
Metro bundler was resolving React 18.3.1 from pnpm's node_modules instead of React 19.1.0 from local `apps/mobile/node_modules`, causing `Cannot read property 'ReactCurrentDispatcher' of undefined` errors.

## Root Cause
1. pnpm creates symlinks in workspace root `node_modules` pointing to its store
2. Metro's resolver was finding React through pnpm symlinks when resolving dependencies like `@tanstack/react-query`
3. Even though local `apps/mobile/node_modules` has React 19.1.0, Metro was resolving React 18.3.1 from pnpm

## Solution Applied

### 1. Metro Config Blocklist
Added aggressive blocklist to prevent Metro from resolving through pnpm:
```javascript
config.resolver.blockList = [
  /.*[\\/]\.pnpm[\\/].*/,  // Block all .pnpm paths
  new RegExp(workspaceNodeModules + '.*'),  // Block workspace root node_modules
  /.*react@18\.3\.1.*/,  // Block any React 18.3.1 paths
];
```

### 2. Custom Resolver for React
Intercept ALL React-related module resolutions and force them to use local node_modules:
- `react`
- `react/jsx-runtime`
- `react/jsx-dev-runtime`
- `react-dom`
- `react-dom/client`

### 3. Post-Resolution Verification
After default resolver runs, check if the resolved path is from pnpm and redirect to local if needed.

## Verification

Run this command to verify React 19.1.0 is installed correctly:
```bash
cd apps/mobile
pnpm verify-react
```

Expected output:
```
✅ React 19.1.0 found in local node_modules
✅ React version is correct
✅ React is a real directory (not a symlink)
```

## If Issues Persist

1. **Clear Metro cache**:
   ```bash
   cd apps/mobile
   pnpm clear-cache
   ```

2. **Reinstall React locally**:
   ```bash
   cd apps/mobile
   npm install react@19.1.0 react-dom@19.1.0
   ```

3. **Verify no pnpm symlinks**:
   ```bash
   cd apps/mobile
   node scripts/verify-react-version.js
   ```

4. **Check Metro logs** for any React resolution warnings

## Notes

- The app uses npm for `apps/mobile` to avoid pnpm symlink issues
- React 19.1.0 is required for Expo SDK 54 compatibility
- All React-dependent packages must resolve React from local node_modules

