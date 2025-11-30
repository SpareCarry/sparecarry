# Complete Context: React Native Invariant Violation in Expo Go - Full History

## PROJECT OVERVIEW

**Monorepo**: SpareCarry (pnpm workspace)

- **Root**: `C:\SpareCarry`
- **Mobile App**: `apps/mobile` (Expo SDK 54)
- **Shared Packages**: `packages/ui`, `packages/hooks`, `packages/lib`
- **Package Manager**: pnpm 10.24.0
- **Node**: v24.11.1
- **Expo**: 54.0.16

## CURRENT ERROR

**Invariant Violation** red error screen in Expo Go when app tries to load.

**Symptoms**:

- Metro bundling succeeds: "Android Bundled 12163ms apps\mobile\index.js (1673 modules)"
- QR code displays correctly
- Metro server runs without errors
- App starts loading in Expo Go
- **Red error screen with "Invariant Violation" appears at runtime**

## COMPLETE HISTORY OF FIXES

### Phase 1: React Version Compatibility (FIXED)

**Problem**: PlatformConstants TurboModuleRegistry error

- React 19.1.0 incompatible with Expo SDK 54
- Expo Go has React 18 baked into native binary

**Fixes Applied**:

1. Downgraded React from 19.1.0 → 18.3.1 across all packages
2. Updated `apps/mobile/package.json`, `packages/ui/package.json`, `packages/hooks/package.json`
3. Updated root `package.json` overrides
4. Updated `@types/react` from ~19.1.0 → ~18.2.0

**Result**: ✅ PlatformConstants error resolved, bundling works

### Phase 2: Module Resolution (FIXED)

**Problem**: "Unable to resolve ../../../../lib/services/shipping"

- Shipping service in root `lib/` folder, not in workspace packages
- Metro couldn't resolve root-level imports

**Fixes Applied**:

1. Created `apps/mobile/index.js` entry shim: `import 'expo-router/entry'`
2. Updated `package.json` main to `"./index.js"`
3. Added Metro aliases: `@root-lib`, `@root-src`, `@root-config`, `@root-utils`
4. Updated imports in shipping chain to use aliases:
   - `lib/services/shipping.ts` → `@root-src/constants/shippingFees`
   - `src/constants/shippingFees.ts` → `@root-config/platformFees`, `@root-utils/getDaysLeft`
5. Added webpack aliases in `next.config.js` for web app compatibility
6. Updated `tsconfig.json` paths for TypeScript support

**Result**: ✅ Module resolution errors fixed, bundling succeeds

### Phase 3: Multiple React Instances (ATTEMPTED - STILL FAILING)

**Problem**: Variant/Invariant Violation at runtime

- React resolving from root `node_modules` instead of mobile app's `node_modules`
- Multiple React instances causing hook registry mismatch

**Diagnostic Results**:

```
React resolved from: C:\SpareCarry\node_modules\.pnpm\react@18.3.1\node_modules\react\index.js
Expected: C:\SpareCarry\apps\mobile\node_modules\react\index.js
```

**Fixes Applied**:

1. **Metro Configuration** (`apps/mobile/metro.config.js`):

   ```javascript
   extraNodeModules: {
     // Explicitly map React packages to mobile app's node_modules
     'react': path.join(projectRoot, 'node_modules', 'react'),
     'react-dom': path.join(projectRoot, 'node_modules', 'react-dom'),
     'react-native': path.join(projectRoot, 'node_modules', 'react-native'),
   },
   ```

2. **pnpm Overrides** (`package.json`):

   ```json
   "pnpm": {
     "overrides": {
       "react": "18.3.1",
       "react-dom": "18.3.1",
       "react-native": "0.76.0",
       "@sparecarry/mobile>react": "18.3.1",
       "@sparecarry/mobile>react-dom": "18.3.1"
     }
   }
   ```

3. **Diagnostic Tool** (`apps/mobile/debug/checkReact.js`):
   - Runtime React resolution checker
   - Detects multiple React instances
   - Logs React version and path

4. **Layout Integration** (`apps/mobile/app/_layout.tsx`):
   - Added React diagnostic check at startup
   - Logs React resolution path

**Result**: ❌ **STILL GETTING INVARIANT VIOLATION ERROR**

## CURRENT CONFIGURATION

### apps/mobile/package.json

```json
{
  "name": "@sparecarry/mobile",
  "version": "0.1.0",
  "main": "./index.js",
  "dependencies": {
    "@expo/metro-runtime": "^6.1.2",
    "@sparecarry/hooks": "file:C:\\SpareCarry\\packages\\hooks",
    "@sparecarry/lib": "file:C:\\SpareCarry\\packages\\lib",
    "@sparecarry/ui": "file:C:\\SpareCarry\\packages\\ui",
    "expo": "~54.0.0",
    "expo-router": "~6.0.15",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-native": "0.76.0"
  }
}
```

### apps/mobile/metro.config.js

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = path.resolve(__dirname);
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [
  path.resolve(workspaceRoot, "packages"),
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(workspaceRoot, "lib"),
  path.resolve(workspaceRoot, "src"),
  path.resolve(workspaceRoot, "config"),
  path.resolve(workspaceRoot, "utils"),
];

config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
  ],
  // Force React, React-DOM, and React-Native to resolve from mobile app's node_modules
  extraNodeModules: {
    react: path.join(projectRoot, "node_modules", "react"),
    "react-dom": path.join(projectRoot, "node_modules", "react-dom"),
    "react-native": path.join(projectRoot, "node_modules", "react-native"),
  },
  alias: {
    "@root-lib": path.resolve(workspaceRoot, "lib"),
    "@root-src": path.resolve(workspaceRoot, "src"),
    "@root-config": path.resolve(workspaceRoot, "config"),
    "@root-utils": path.resolve(workspaceRoot, "utils"),
  },
  sourceExts: [...config.resolver.sourceExts, "cjs", "ts", "tsx"],
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

module.exports = config;
```

### apps/mobile/index.js

```javascript
// apps/mobile/index.js
import "expo-router/entry";
```

### apps/mobile/app/\_layout.tsx (partial)

```typescript
// Add aggressive logging at module level
import "../lib/debug-mode";

// React resolution diagnostic (temporary)
try {
  const reactCheck = require("../debug/checkReact");
  console.log("React diagnostic loaded:", reactCheck);
} catch (e) {
  console.warn("Could not load React diagnostic:", e.message);
}

import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
// ... rest of layout
```

### Root package.json (pnpm section)

```json
{
  "pnpm": {
    "overrides": {
      "react": "18.3.1",
      "react-dom": "18.3.1",
      "react-native": "0.76.0",
      "@sparecarry/mobile>react": "18.3.1",
      "@sparecarry/mobile>react-dom": "18.3.1"
    },
    "peerDependencyRules": {
      "allowedVersions": {
        "react": "18.3.1"
      }
    }
  }
}
```

### Workspace Packages

**packages/ui/package.json**:

```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-native": "0.76.0"
  },
  "devDependencies": {
    "react": "18.3.1",
    "react-native": "0.76.0"
  }
}
```

**packages/hooks/package.json**:

```json
{
  "peerDependencies": {
    "react": "^18.0.0"
  },
  "devDependencies": {
    "react": "18.3.1"
  }
}
```

## WHAT WE'VE VERIFIED

1. ✅ **React version**: 18.3.1 (correct for Expo SDK 54)
2. ✅ **React Native version**: 0.76.0 (correct for Expo SDK 54)
3. ✅ **Bundling**: Succeeds without errors
4. ✅ **Module resolution**: All imports resolve correctly
5. ✅ **Workspace packages**: Use peerDependencies correctly
6. ✅ **pnpm overrides**: Global React version enforced
7. ✅ **Metro config**: Explicit React module mapping
8. ✅ **Hook usage**: No conditional hooks found in codebase scan

## WHAT WE HAVEN'T VERIFIED YET

1. ❓ **Runtime React resolution**: Need to check actual resolution path at runtime in Expo Go
2. ❓ **Expo Go compatibility**: May need EAS Development Build instead
3. ❓ **Native module conflicts**: Could be a native binary mismatch
4. ❓ **expo-router setup**: May have initialization issues
5. ❓ **Workspace package imports**: May be importing React from wrong location

## POSSIBLE ROOT CAUSES (NOT YET RESOLVED)

1. **Metro extraNodeModules not working**: The explicit mapping might not be taking effect
2. **pnpm hoisting**: React might still be hoisted to root despite overrides
3. **Expo Go limitation**: Expo Go may have React 18 baked in, but our code expects a different instance
4. **Workspace package resolution**: `@sparecarry/*` packages might be resolving React from root
5. **Metro cache**: Old cached bundles might have multiple React instances
6. **Native binary mismatch**: Expo Go's native binary might expect different React version

## WHAT WE NEED

A solution that:

1. **Forces single React instance** at runtime in Expo Go
   - Verify Metro's `extraNodeModules` is actually working
   - Check if pnpm hoisting can be disabled for React
   - Ensure workspace packages don't create their own React instances

2. **Handles Expo Go limitations**
   - Determine if EAS Development Build is required
   - Check if there's a way to make Expo Go work with monorepo setup
   - Verify expo-router compatibility with workspace packages

3. **Provides alternative approaches**
   - If Metro config can't force single instance, what else can we try?
   - Should we use `.npmrc` to control hoisting?
   - Should we use `resolutions` instead of `overrides`?

4. **Includes verification steps**
   - How to confirm single React instance at runtime
   - How to debug Metro module resolution
   - How to check if Expo Go is the issue

## ADDITIONAL CONTEXT

- **Expo SDK 54** requires React 18.3.1 (we have this)
- **Expo Go** has React 18 baked into its native binary
- **Monorepo** with pnpm workspaces makes module resolution complex
- **Workspace packages** (`@sparecarry/*`) are linked via `file:` protocol
- **Bundling works** but runtime fails, suggesting a resolution issue
- **No code changes** to components/hooks needed (they're correct)

## FILES TO INVESTIGATE

- `apps/mobile/metro.config.js` - Metro configuration
- `apps/mobile/package.json` - Mobile app dependencies
- `package.json` - Root pnpm overrides
- `apps/mobile/index.js` - Entry point
- `apps/mobile/app/_layout.tsx` - Root layout
- `packages/ui/package.json` - UI package deps
- `packages/hooks/package.json` - Hooks package deps
- `apps/mobile/debug/checkReact.js` - Diagnostic tool

## ERROR DETAILS NEEDED

To help diagnose, we need:

- Exact error message from Expo Go (screenshot text)
- Console logs from Metro bundler
- React resolution path at runtime (from checkReact.js)
- Any warnings about multiple React instances

## REQUEST

Please provide:

1. **Diagnosis**: Why is Metro's `extraNodeModules` not preventing multiple React instances?
2. **Solution**: What additional fixes are needed to ensure single React instance?
3. **Alternative**: If Metro config can't fix it, what's the alternative (EAS Dev Build, different monorepo setup, etc.)?
4. **Verification**: How to confirm the fix works at runtime in Expo Go?

We've tried configuration fixes but the invariant violation persists. We need a deeper solution that addresses the root cause of multiple React instances in the monorepo + Expo Go environment.
