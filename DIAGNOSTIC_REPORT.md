# Variant Violation - Diagnostic Report

## Analysis Phase Results

### 1. Environment Versions
- **Node**: v24.11.1
- **pnpm**: 10.24.0
- **Expo**: 54.0.16

### 2. React Resolution Analysis

**Critical Finding**: React is resolving from **root node_modules**, not mobile app's node_modules:
```
React resolved from: C:\SpareCarry\node_modules\.pnpm\react@18.3.1\node_modules\react\index.js
```

**Expected**: Should resolve from `C:\SpareCarry\apps\mobile\node_modules\react\index.js`

### 3. Dependency Tree Analysis

**Root package.json:**
- `react`: 18.3.1 (dependencies)
- `react-native`: 0.76.0 (devDependencies)

**apps/mobile/package.json:**
- `react`: 18.3.1 (dependencies) ✅
- `react-native`: 0.76.0 (dependencies) ✅

**Workspace Packages:**
- `packages/ui`: React/react-native as **peerDependencies** ✅
- `packages/hooks`: React as **peerDependencies** ✅
- `packages/lib`: No React dependency ✅

### 4. pnpm Overrides
- Already has `@sparecarry/mobile>react: 18.3.1`
- **Missing**: Global `react: 18.3.1` override

### 5. Metro Configuration
- `extraNodeModules` uses Proxy but may not be forcing React correctly
- `nodeModulesPaths` includes mobile app's node_modules first ✅
- But React still resolves from root

### 6. Hook Usage Scan
- Scanned packages and apps/mobile
- All hooks appear to be used correctly (top-level, in components)
- No obvious conditional hook usage found

## Root Cause Identified

**Multiple React Instances Due to Resolution Path**

The issue is that:
1. React resolves from root `node_modules` instead of mobile app's `node_modules`
2. Workspace packages might resolve React from different locations
3. Metro's `extraNodeModules` proxy isn't explicitly forcing React resolution
4. pnpm hoisting might be placing React in root instead of mobile app

This causes the "Variant Violation" because:
- Different parts of the app load React from different locations
- React's internal state (hooks registry) becomes inconsistent
- Multiple React instances = multiple hook registries = variant violation

## Fix Strategy

1. **Force React resolution in Metro config** - Explicitly map react/react-dom/react-native to mobile app's node_modules
2. **Add global pnpm overrides** - Ensure all packages use React 18.3.1
3. **Verify single React instance** - Add runtime check to confirm fix

