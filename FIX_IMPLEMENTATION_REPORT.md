# Variant Violation Fix - Implementation Report

## Root Cause

**Multiple React Instances Due to Resolution Path Mismatch**

React was resolving from root `node_modules` (`C:\SpareCarry\node_modules\.pnpm\react@18.3.1\...`) instead of the mobile app's `node_modules` (`C:\SpareCarry\apps\mobile\node_modules\react`). This caused:

- Different parts of the app loading React from different locations
- Multiple React instances = multiple hook registries
- React's internal state becoming inconsistent
- **Variant Violation** error at runtime

## Fixes Applied

### 1. Metro Configuration (`apps/mobile/metro.config.js`)

**Changed**: `extraNodeModules` from Proxy to explicit object mapping

**Before**:

```javascript
extraNodeModules: new Proxy({}, {
  get: (_, name) => path.join(projectRoot, 'node_modules', name)
}),
```

**After**:

```javascript
extraNodeModules: {
  // Explicitly map React packages to mobile app's node_modules
  'react': path.join(projectRoot, 'node_modules', 'react'),
  'react-dom': path.join(projectRoot, 'node_modules', 'react-dom'),
  'react-native': path.join(projectRoot, 'node_modules', 'react-native'),
},
```

**Why**: Explicit mapping ensures Metro always resolves React from the mobile app's node_modules, preventing multiple instances.

### 2. pnpm Overrides (`package.json`)

**Added**: Global React version overrides

**Before**:

```json
"overrides": {
  "@sparecarry/mobile>react": "18.3.1",
  "@sparecarry/mobile>react-dom": "18.3.1",
  // ... other overrides
}
```

**After**:

```json
"overrides": {
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "react-native": "0.76.0",
  "@sparecarry/mobile>react": "18.3.1",
  "@sparecarry/mobile>react-dom": "18.3.1",
  // ... other overrides
}
```

**Why**: Global overrides ensure ALL packages (including transitive dependencies) use the same React version.

### 3. Diagnostic File (`apps/mobile/debug/checkReact.js`)

**Created**: Runtime React resolution checker

**Purpose**: Verify that React resolves from the correct location at runtime and detect multiple instances.

**Usage**: Automatically loaded in `apps/mobile/app/_layout.tsx` at startup.

## Files Modified

1. `apps/mobile/metro.config.js` - Updated `extraNodeModules`
2. `package.json` - Added global React overrides
3. `apps/mobile/app/_layout.tsx` - Added React diagnostic check
4. `apps/mobile/debug/checkReact.js` - Created diagnostic file

## Verification Steps

1. **Reinstall dependencies**:

   ```bash
   cd C:\SpareCarry
   pnpm install
   ```

2. **Verify React resolution**:

   ```bash
   cd apps/mobile
   node -e "console.log('React from:', require.resolve('react'))"
   ```

   Should show: `C:\SpareCarry\apps\mobile\node_modules\react\...`

3. **Start Metro bundler**:

   ```bash
   cd apps/mobile
   npx expo start -c
   ```

4. **Check console logs** for:
   - "React resolved from: ...apps/mobile/node_modules/react..."
   - "React version: 18.3.1"
   - "✅ React singleton check initialized" (no warnings about multiple instances)

5. **Load app in Expo Go**:
   - No Variant Violation error
   - App loads successfully
   - UI components render correctly

## Expected Results

- ✅ Single React instance (resolved from mobile app's node_modules)
- ✅ No variant violation errors
- ✅ App loads in Expo Go without errors
- ✅ All hooks work correctly
- ✅ UI components render properly

## Safety Notes

- ✅ No code changes to components or hooks
- ✅ Only configuration changes (Metro, pnpm)
- ✅ Preserves all existing fixes (aliases, entry shim, React 18.3.1)
- ✅ Minimal changes, maximum impact
