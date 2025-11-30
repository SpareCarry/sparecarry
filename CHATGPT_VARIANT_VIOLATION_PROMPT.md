# React Native Variant Violation Error - Full Context

## CURRENT STATUS

**✅ PROGRESS MADE:**

- ✅ Fixed React version compatibility (19.1.0 → 18.3.1)
- ✅ Fixed module resolution errors (added Metro aliases)
- ✅ Bundling now succeeds: "Android Bundled 12163ms apps\mobile\index.js (1673 modules)"
- ✅ No more "Unable to resolve" errors
- ✅ Metro server starts successfully

**❌ NEW ERROR:**

- **Variant Violation** error at runtime (after successful bundling)
- Error appears when app tries to load in Expo Go
- User mentioned they sent a screenshot previously (similar to PlatformConstants error)

## PROJECT CONTEXT

### Monorepo Structure

- **Package Manager**: pnpm workspaces
- **Root**: `C:\SpareCarry`
- **Mobile App**: `apps/mobile` (Expo SDK 54)
- **Shared Packages**: `packages/ui`, `packages/hooks`, `packages/lib`

### Current Versions

```json
{
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "react-native": "0.76.0",
  "expo": "~54.0.0"
}
```

**Note**: Expo warns about version mismatch (expects React 19.1.0), but React 18.3.1 is correct for Expo SDK 54. This warning is expected and safe to ignore.

### Recent Fixes Applied

1. **React Version Downgrade**
   - Changed from React 19.1.0 → 18.3.1 across all packages
   - Fixed PlatformConstants TurboModuleRegistry error

2. **Module Resolution Fixes**
   - Added Metro aliases: `@root-lib`, `@root-src`, `@root-config`, `@root-utils`
   - Updated shipping service imports to use aliases
   - Added webpack aliases in Next.js config
   - Updated tsconfig.json paths

3. **Entry Point**
   - Created `apps/mobile/index.js` with `import 'expo-router/entry'`
   - Updated package.json main to `"./index.js"`

4. **Metro Configuration**
   - Configured watchFolders for monorepo
   - Added resolver aliases
   - Configured nodeModulesPaths

## ERROR DETAILS

### What We Know

- Bundling completes successfully
- Metro server runs without errors
- QR code displays correctly
- App starts loading in Expo Go
- **Variant Violation error occurs at runtime**

### Possible Causes

1. **Multiple React Instances**
   - Different packages might be resolving different React versions
   - pnpm hoisting might be creating duplicate React instances
   - Workspace packages might have their own React copies

2. **React Hook Violations**
   - Hooks used conditionally
   - Hooks used outside components
   - Multiple React instances causing hook registry mismatch

3. **TurboModule Registry Issues**
   - Similar to PlatformConstants error we fixed earlier
   - Native modules not properly registered
   - React Native version mismatch in native binary vs JS

4. **Expo Go Compatibility**
   - Expo Go has React 18 baked in
   - Our code might be using React 19 features
   - Or there's a version mismatch in dependencies

## CURRENT CONFIGURATION

### apps/mobile/package.json

```json
{
  "main": "./index.js",
  "dependencies": {
    "@sparecarry/lib": "file:../../packages/lib",
    "@sparecarry/ui": "file:../../packages/ui",
    "@sparecarry/hooks": "file:../../packages/hooks",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-native": "0.76.0",
    "expo": "~54.0.0",
    "expo-router": "~6.0.15"
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
  extraNodeModules: new Proxy(
    {},
    {
      get: (_, name) => path.join(projectRoot, "node_modules", name),
    }
  ),
  alias: {
    "@root-lib": path.resolve(workspaceRoot, "lib"),
    "@root-src": path.resolve(workspaceRoot, "src"),
    "@root-config": path.resolve(workspaceRoot, "config"),
    "@root-utils": path.resolve(workspaceRoot, "utils"),
  },
  sourceExts: [...config.resolver.sourceExts, "cjs", "ts", "tsx"],
};
```

### Workspace Packages

**packages/ui/package.json:**

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

**packages/hooks/package.json:**

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

## DIAGNOSIS NEEDED

1. **Check for Multiple React Instances**
   - Verify pnpm resolves only one React version
   - Check if workspace packages have React in dependencies vs peerDependencies
   - Ensure Metro resolves React from mobile app's node_modules

2. **Verify Hook Usage**
   - Check if any hooks are used conditionally
   - Verify all hooks are used at component top level
   - Check for hooks in loops or conditions

3. **Check TurboModule Registry**
   - Verify React Native version matches Expo Go
   - Check if any native modules are accessed incorrectly
   - Verify PlatformConstants and other core modules load correctly

4. **Expo Go Compatibility**
   - Verify all dependencies are compatible with Expo Go
   - Check if any custom native code is being used
   - Verify expo-router setup is correct

## REQUEST

Provide a solution that:

1. **Identifies the exact cause** of the variant violation error
   - Is it multiple React instances?
   - Is it a hook violation?
   - Is it a TurboModule issue?
   - Is it Expo Go compatibility?

2. **Fixes the root cause** with minimal changes
   - Prefer configuration fixes over code changes
   - Maintain monorepo structure
   - Keep React 18.3.1 (correct for Expo SDK 54)

3. **Ensures the app loads in Expo Go** without errors
   - No variant violations
   - No TurboModule errors
   - App renders correctly

4. **Provides verification steps**
   - How to confirm the fix works
   - What to check if errors persist
   - How to debug similar issues

## ADDITIONAL CONTEXT

- The app was working before (with React 19), but had PlatformConstants error
- We downgraded React to fix that, and now bundling works
- But now we have a variant violation at runtime
- This suggests a React instance mismatch or hook violation

## FILES TO CHECK

- `apps/mobile/app/_layout.tsx` - Root layout component
- `apps/mobile/index.js` - Entry point
- `packages/ui/index.ts` - UI package exports
- `packages/hooks/index.ts` - Hooks package exports
- Any files using React hooks conditionally

Please provide a comprehensive solution that addresses the variant violation error while maintaining all the fixes we've already applied.
