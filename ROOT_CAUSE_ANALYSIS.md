# 🔍 ROOT CAUSE ANALYSIS

## EXACT ROOT CAUSE

**React 19 is incompatible with Expo SDK 54**

- Expo SDK 54 requires React 18.3.1
- Expo Go has React 18 baked into its native binary
- Project is using React 19.1.0 via pnpm overrides
- When `packages/ui` imports `react-native` StyleSheet, it uses React 19 hooks
- Expo Go's native binary expects React 18 hooks
- TurboModuleRegistry fails because the native module registry doesn't match JS expectations

## WHY Expo Go Cannot Load PlatformConstants

1. **Version Mismatch Chain**:
   - Root `package.json` has `react-native: 0.81.5` in devDependencies
   - Root `package.json` has pnpm overrides forcing React 19 for mobile
   - Mobile app has `react-native: 0.76.0` (correct for Expo SDK 54)
   - But React 19 is incompatible with Expo SDK 54

2. **Expo Go Native Binary**:
   - Expo Go is a pre-built app with React 18 + React Native 0.76.0 baked in
   - Cannot be changed without rebuilding
   - When JS code uses React 19, hooks don't match native expectations

3. **Monorepo Workspace Resolution**:
   - `packages/ui` imports `react-native` directly
   - Metro bundles it, but the native binary expects React 18 hooks
   - PlatformConstants is a native module that requires matching React version

## Recommended Fix Path Ranking

### #1 BEST: Downgrade to React 18 (Expo Go Compatible)
- ✅ Works with Expo Go immediately
- ✅ No build setup required
- ✅ Fast iteration
- ✅ Matches Expo SDK 54 requirements
- ⚠️ Requires removing React 19 overrides

### #2 ALTERNATIVE: EAS Development Build
- ✅ Can use React 19 if needed
- ✅ Full control over native modules
- ❌ Requires build setup
- ❌ Slower iteration (need to rebuild for native changes)
- ❌ More complex setup

### #3 NOT RECOMMENDED: Keep React 19 + Expo Go
- ❌ Will never work - fundamental incompatibility
- ❌ PlatformConstants error will persist

## Implementation Plan

1. Remove React 19 overrides from root package.json
2. Downgrade React to 18.3.1 in mobile app and UI package
3. Ensure React Native 0.76.0 is consistent everywhere
4. Update Metro config to properly transpile workspace packages
5. Add debug logging for module resolution
6. Set up EAS development build as fallback (optional)

