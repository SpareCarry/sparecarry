# Expo 404 Development Server Error - Full Context Prompt

## CURRENT ERROR

Getting a **red 404 development server error** in Expo Go after fixing React version compatibility issues.

## PROJECT CONTEXT

### Monorepo Structure
- **Package Manager**: pnpm workspaces
- **Root**: `C:\SpareCarry`
- **Mobile App**: `apps/mobile` (Expo SDK 54)
- **Shared Packages**: 
  - `packages/ui` (React Native components)
  - `packages/hooks` (React hooks)
  - `packages/lib` (utilities)

### Recent Fixes Applied

**Problem 1 (FIXED)**: PlatformConstants TurboModuleRegistry error
- **Root Cause**: React 19.1.0 incompatible with Expo SDK 54 (requires React 18.3.1)
- **Fix Applied**: Downgraded React from 19.1.0 → 18.3.1 across all packages
- **Status**: ✅ React 18.3.1 now correctly installed in mobile app

**Problem 2 (CURRENT)**: 404 Development Server Error
- **Error**: Red screen showing 404 development server error in Expo Go
- **When**: After React version fix, when trying to load app
- **Status**: ❌ Not resolved

## CURRENT CONFIGURATION

### apps/mobile/package.json
```json
{
  "name": "@sparecarry/mobile",
  "main": "expo-router/entry",
  "dependencies": {
    "expo": "~54.0.0",
    "expo-router": "~6.0.15",
    "@expo/metro-runtime": "^6.1.2",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-native": "0.76.0",
    "@sparecarry/ui": "file:C:\\SpareCarry\\packages\\ui",
    "@sparecarry/hooks": "file:C:\\SpareCarry\\packages\\hooks",
    "@sparecarry/lib": "file:C:\\SpareCarry\\packages\\lib"
  }
}
```

### apps/mobile/metro.config.js
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.projectRoot = __dirname;

const workspaceRoot = path.resolve(__dirname, '../..');
config.watchFolders = [
  __dirname,
  workspaceRoot,
];

config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(__dirname, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ],
};

config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'ts',
  'tsx',
];

module.exports = config;
```

### apps/mobile/app.config.ts
- Expo SDK 54
- Uses `expo-router` plugin
- Has expo-camera, expo-location, expo-notifications plugins
- jsEngine: 'jsc'

### Entry Point
- **Main**: `expo-router/entry` (as specified in package.json)
- **Layout**: `apps/mobile/app/_layout.tsx` exists and exports RootLayout

## WHAT WE'VE TRIED

1. ✅ Fixed React version mismatch (19.1.0 → 18.3.1)
2. ✅ Aligned React Native versions (0.76.0 everywhere)
3. ✅ Updated Metro config for monorepo workspace resolution
4. ✅ Cleared Expo caches (`.expo` folder)
5. ✅ Cleared Metro caches
6. ✅ Reinstalled dependencies with `pnpm install`
7. ✅ Verified React 18.3.1 is installed in mobile app

## ERROR DETAILS NEEDED

Please help diagnose:
- **What causes 404 development server errors in Expo Go?**
- **Is this related to the monorepo setup?**
- **Could it be Metro bundler not finding the entry point?**
- **Is expo-router entry point configured correctly?**
- **Are workspace packages causing resolution issues?**

## ENVIRONMENT

- **OS**: Windows 10
- **Package Manager**: pnpm 10.24.0
- **Expo CLI**: 54.0.16
- **Running in**: Expo Go (not development build)
- **Network**: LAN connection (Metro on port 8081)

## REQUEST

Provide a comprehensive solution that:
1. Diagnoses the exact cause of the 404 error
2. Fixes the Metro bundler/Expo Router entry point configuration
3. Ensures workspace packages resolve correctly
4. Gets the app loading in Expo Go without errors
5. Maintains the monorepo structure

## ADDITIONAL CONTEXT

- The app was working before the React version changes (but had PlatformConstants error)
- After React downgrade, PlatformConstants error is gone but 404 appears
- Metro bundler starts successfully and shows QR code
- Error appears when app tries to load in Expo Go
- Using `file:` protocol for workspace dependencies (pnpm monorepo)

Please provide step-by-step fix instructions.

