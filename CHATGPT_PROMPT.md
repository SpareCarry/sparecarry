# Expo React Native Error - PlatformConstants TurboModuleRegistry Issue

## Problem Summary

I have an Expo React Native app (SDK 54) in a pnpm monorepo that's failing with a `PlatformConstants` TurboModuleRegistry error when running in Expo Go. The error persists despite multiple attempts to fix version mismatches.

## Error Message

```
Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'PlatformConstants' could not be found. Verify that a module by this name is registered in the native binary.
```

The error occurs when the app tries to load, specifically when importing React Native modules that depend on PlatformConstants.

## Project Structure

- **Monorepo**: pnpm workspace
- **Root**: `C:\SpareCarry`
- **Mobile App**: `apps/mobile`
- **Shared Packages**:
  - `packages/ui` (contains React Native components)
  - `packages/hooks` (React hooks)
  - `packages/lib` (shared utilities)

## Current Versions

### apps/mobile/package.json

```json
{
  "name": "@sparecarry/mobile",
  "dependencies": {
    "expo": "~54.0.0",
    "expo-router": "~6.0.15",
    "@expo/metro-runtime": "^6.1.2",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.76.0",
    "@sparecarry/ui": "file:C:\\SpareCarry\\packages\\ui",
    "@sparecarry/hooks": "file:C:\\SpareCarry\\packages\\hooks",
    "@sparecarry/lib": "file:C:\\SpareCarry\\packages\\lib"
  },
  "overrides": {
    "react": "19.1.0",
    "react-dom": "19.1.0"
  }
}
```

### packages/ui/package.json

```json
{
  "name": "@sparecarry/ui",
  "dependencies": {
    "react": "19.1.0",
    "react-native": "0.76.0",
    "@sparecarry/hooks": "workspace:*"
  }
}
```

## Metro Config (apps/mobile/metro.config.js)

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.projectRoot = __dirname;

config.watchFolders = [__dirname, path.resolve(__dirname, "../..")];

module.exports = config;
```

## App Config (apps/mobile/app.config.ts)

- Uses Expo SDK 54
- Has expo-router, expo-camera, expo-location, expo-notifications plugins
- jsEngine: 'jsc'

## What We've Already Tried

1. ✅ Installed `@expo/metro-runtime@^6.1.2` (was missing, causing getDevServer error)
2. ✅ Aligned React Native versions to 0.76.0 across all packages
3. ✅ Cleared Metro caches, Expo caches, node_modules/.cache
4. ✅ Simplified Metro config (removed unstable_enableSymlinks, unstable_enablePackageExports)
5. ✅ Verified route files have default exports
6. ✅ Ran `expo install --check` to fix dependency versions
7. ✅ Reinstalled dependencies with `pnpm install`

## Current Behavior

- Expo dev server starts successfully
- Metro bundler runs without errors
- App bundles successfully (2915 modules)
- **Error occurs at runtime** when the app tries to load in Expo Go
- The error happens when importing from `@sparecarry/ui` which uses React Native's StyleSheet

## Stack Trace Pattern

The error originates from:

- `react-native/Libraries/Utilities/NativePlatformConstantsAndroid.js`
- Called via `react-native/Libraries/Utilities/Platform.android.js`
- Triggered when importing `react-native` StyleSheet in `packages/ui/LocationInput.tsx`

## Key Observations

1. **Expo Go Compatibility**: The app is running in Expo Go, which has its own React Native version baked in
2. **Monorepo Setup**: Using pnpm with workspace dependencies (`file:` protocol for local packages)
3. **React 19**: Using React 19.1.0 (newer than typical Expo SDK 54 setup which uses React 18)
4. **Version Alignment**: Both mobile app and UI package now use react-native 0.76.0, but error persists

## Questions to Answer

1. Is React 19 compatible with Expo SDK 54 and React Native 0.76.0?
2. Could the monorepo setup (pnpm workspaces with `file:` dependencies) be causing module resolution issues?
3. Is there a conflict between Expo Go's bundled React Native version and the project's React Native version?
4. Should we be using a development build instead of Expo Go?
5. Are there any Metro resolver configurations needed for the monorepo setup?
6. Could the `overrides` in package.json be causing issues?

## Environment

- **OS**: Windows 10
- **Package Manager**: pnpm 10.24.0
- **Node**: (not specified, but assume 18+)
- **Expo CLI**: 54.0.16
- **Running in**: Expo Go (not development build)

## Request

Please provide a comprehensive solution that addresses the root cause. We've been going in circles with version alignment fixes that don't resolve the issue. The error suggests a fundamental mismatch between what the JavaScript code expects and what's available in the native binary (Expo Go).
