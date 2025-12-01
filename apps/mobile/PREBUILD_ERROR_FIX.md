# Prebuild Error: "files.map is not a function" - Investigation & Solutions

## Issue Summary

When running `npm run build:dev` or `npx expo prebuild --platform android`, the build fails with:
```
files.map is not a function
× Failed to create the native directory
```

## Root Cause (RESOLVED ✅)

**The issue was caused by upgrading React Native from `0.76.0` to `0.81.5`** (commit `241c645` on Dec 1, 2025).

The `files.map is not a function` error occurs when Expo SDK 54's prebuild tries to process templates with React Native 0.81.5. This appears to be an incompatibility between Expo SDK 54 and React Native 0.81.5.

**Fix Applied:**
- Reverted React Native to `0.76.0` (the working version)
- Removed `expo-system-ui` (added during the upgrade)
- Reverted `@react-navigation/native` to `^7.1.22`
- Changed JS engine from `"hermes"` back to `"jsc"` in `app.json`

After these changes, `npx @expo/cli@latest prebuild --platform android --clean` completes successfully.

## Solution (Applied)

**Reverted to React Native 0.76.0** - This was the working version before the upgrade.

Changes made:
1. ✅ Reverted `react-native` from `0.81.5` → `0.76.0` in `package.json`
2. ✅ Removed `expo-system-ui` package (added during upgrade)
3. ✅ Reverted `@react-navigation/native` from `^7.1.8` → `^7.1.22`
4. ✅ Changed JS engine from `"hermes"` → `"jsc"` in `app.json` (both root and android sections)
5. ✅ Ran `pnpm install` to update dependencies

**Result:** `npx @expo/cli@latest prebuild --platform android --clean` now completes successfully.

## What We Tried Before Finding the Root Cause

1. ✅ Deleted local `android` directory and re-ran prebuild  
2. ✅ Reinstalled all dependencies with `pnpm install --force` from the monorepo root  
3. ✅ Pinned `@expo/cli` (e.g. `54.0.10`, `54.0.16`, `54.0.25`) and used the local `expo` binary in scripts  
4. ✅ Simplified `app.json` plugin configuration (e.g. `expo-notifications`, `expo-location`, `expo-camera`)  
5. ✅ Ran `expo-doctor` (no blocking issues found)  
6. ✅ Verified assets referenced in `app.json` all exist  
7. ✅ Ran `expo prebuild` on Ubuntu GitHub Actions runners (with and without monorepo isolation)  
8. ✅ Tried isolation workflows (`generate-android-project.yml`, `generate-android-artifact.yml`)

All of these still hit the same `files.map is not a function` failure because the root cause was the React Native version incompatibility.

## Important Notes

- **Local EAS Android builds on Windows are not supported**  
  `eas build --platform android --profile ... --local` fails with:  
  `Unsupported platform, macOS or Linux is required to build apps for Android`.  
  Use remote EAS builds instead.

- **React Native 0.81.5 incompatibility**  
  The upgrade to React Native 0.81.5 (commit `241c645`) broke prebuild. This appears to be an incompatibility between Expo SDK 54 and React Native 0.81.5. The project now uses React Native 0.76.0, which works correctly with Expo SDK 54.

## Future Upgrades

When you want to upgrade React Native again:

1. **Check Expo SDK compatibility**  
   - Verify that the target React Native version is officially supported by Expo SDK 54 (or upgrade to a newer Expo SDK that supports RN 0.81.5+).
   - Test `expo prebuild --platform android --clean` locally before committing.

2. **Test incrementally**  
   - Upgrade React Native in a separate branch.
   - Run prebuild immediately to catch compatibility issues early.
   - If prebuild fails, revert the upgrade and wait for Expo to add support.

3. **Monitor Expo releases**  
   - Watch for Expo SDK updates that add React Native 0.81.5+ support.
   - Check Expo's compatibility matrix before upgrading.

## Current Configuration (Working State)

- **Expo SDK**: `~54.0.25`  
- **Expo CLI** (`@expo/cli` in `devDependencies`): `54.0.10`  
- **React Native**: `0.76.0` ✅ (reverted from `0.81.5`)  
- **JS Engine**: `jsc` (JavaScriptCore)  
- **Node.js**: Using Node 20 via `nvm-windows`  
- **OS (local)**: Windows 10  
- **OS (CI)**: Ubuntu 24.04 (GitHub Actions)

## Related Files

- `apps/mobile/app.json` – Expo app configuration and plugins  
- `apps/mobile/eas.json` – EAS Build configuration  
- `apps/mobile/package.json` – Dependencies and scripts  
- `.github/workflows/generate-android-artifact.yml` – Experimental isolation workflow (currently still hits the bug)

