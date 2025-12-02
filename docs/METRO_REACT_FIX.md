# Metro Bundler React Resolution Fix - Working State

**Date**: 2025-01-27  
**Commit**: 5316c65583f3f44071f598c929f5cf7b40b0c48f  
**Tag**: `working-metro-react-fix`

## Problem
The app was throwing "Invalid hook call" errors because multiple React instances were being loaded:
- React from `apps/mobile/node_modules/react` (19.1.0)
- React Native's renderer from pnpm store using potentially different React instance

## Root Cause
After upgrading to Expo SDK 54:
- React upgraded from 18.3.1 to 19.1.0
- React Native upgraded from 0.76.0 to 0.81.5
- React Native's renderer (from pnpm store) was resolving React differently, causing multiple instances

## Solution Applied

### 1. Metro Config (`apps/mobile/metro.config.js`)
- Updated `extraNodeModules` to point to `apps/mobile/node_modules/react`
- Added `resolveRequest` interceptor to catch ALL React imports and force them to use the single React instance
- Updated `nodeModulesPaths` to prioritize mobile app's node_modules

### 2. Package Versions
- `apps/mobile/package.json`: React 19.1.0, React Native 0.81.5
- `package.json`: React 19.1.0 (root dependencies)

## Key Files Modified
- `apps/mobile/metro.config.js` - Added resolveRequest interceptor
- `apps/mobile/package.json` - React 19.1.0, React Native 0.81.5
- `package.json` - React 19.1.0

## How to Restore This State

### Option 1: Using Git Tag (Recommended)
```bash
git checkout working-metro-react-fix
pnpm install
cd apps/mobile && npx expo start --clear
```

### Option 2: Using Commit Hash
```bash
git checkout 5316c65583f3f44071f598c929f5cf7b40b0c48f
pnpm install
cd apps/mobile && npx expo start --clear
```

### Option 3: Checkout Specific Files
If you only need to restore the Metro config:
```bash
git checkout working-metro-react-fix -- apps/mobile/metro.config.js
git checkout working-metro-react-fix -- apps/mobile/package.json
git checkout working-metro-react-fix -- package.json
pnpm install
cd apps/mobile && npx expo start --clear
```

## Key Metro Config Features

The critical fix is the `resolveRequest` interceptor:

```javascript
// Intercepts ALL React imports to force single instance
resolveRequest: (context, moduleName, platform) => {
  if (moduleName === "react" || moduleName.startsWith("react/")) {
    if (moduleName === "react") {
      return {
        filePath: path.resolve(mobileReactPath, "index.js"),
        type: "sourceFile",
      };
    } else if (moduleName === "react/jsx-runtime") {
      return {
        filePath: path.resolve(mobileReactPath, "jsx-runtime.js"),
        type: "sourceFile",
      };
    } else if (moduleName === "react/jsx-dev-runtime") {
      return {
        filePath: path.resolve(mobileReactPath, "jsx-dev-runtime.js"),
        type: "sourceFile",
      };
    }
  }
  // Use default resolution for everything else
  return context.resolveRequest(context, moduleName, platform);
}
```

## Verification Steps
After restoring, verify:
- ✅ No "Invalid hook call" errors
- ✅ App loads successfully
- ✅ Single React 19.1.0 instance confirmed in bundle
- ✅ React Native 0.81.5 renderer uses same React instance

## Important Notes
- **DO NOT remove the `resolveRequest` interceptor** - it's critical for ensuring single React instance
- React 19.1.0 is required for React Native 0.81.5 (Expo SDK 54)
- Always clear Metro cache after config changes: `npx expo start --clear`
- If you upgrade React or React Native in the future, verify the resolveRequest interceptor still works

## Troubleshooting
If you restore this state and still see errors:
1. Delete `apps/mobile/.expo` folder
2. Delete `node_modules` and reinstall: `pnpm install`
3. Clear Metro cache: `npx expo start --clear`
4. Verify React version: `cd apps/mobile && pnpm list react`

