# Prebuild Error: "files.map is not a function" - Investigation & Solutions

## Issue Summary

When running `npm run build:dev` or `npx expo prebuild --platform android`, the build fails with:
```
files.map is not a function
× Failed to create the native directory
```

## Root Cause

This is a bug in Expo SDK 54's prebuild code when processing file patterns on Windows. The error occurs in the `copyTemplateFiles` function where the glob pattern matcher returns a non-array value when an array is expected.

## What We've Tried

1. ✅ Deleted local android directory
2. ✅ Reinstalled all dependencies with `pnpm install --force`
3. ✅ Updated Expo CLI to latest version
4. ✅ Simplified plugin configurations
5. ✅ Ran `expo-doctor` (no issues found)
6. ✅ Verified all asset files exist

## Workarounds

### Option 1: Use EAS Build with --local flag
Try building locally with EAS to see if it behaves differently:
```bash
cd apps/mobile
eas build --platform android --profile development --local
```

### Option 2: Build on Linux/Mac
This appears to be a Windows-specific issue. If possible, try building on a Linux or Mac environment.

### Option 3: Wait for Expo Fix
This is a known issue in Expo SDK 54. Monitor the Expo GitHub repository for updates:
- https://github.com/expo/expo/issues

### Option 4: Try Different Expo SDK Version
If urgent, consider temporarily downgrading or upgrading to a different Expo SDK version (not recommended for production).

## Current Configuration

- **Expo SDK**: 54.0.25
- **Expo CLI**: 54.0.16 (updated to latest)
- **EAS CLI**: 16.28.0
- **Node.js**: v24.11.1
- **OS**: Windows 10

## Next Steps

1. Try `eas build --local` to see if local EAS build works
2. Consider using a CI/CD service (GitHub Actions, etc.) with Linux runners
3. Report this issue to Expo if not already reported
4. Monitor Expo updates for a fix

## Related Files

- `apps/mobile/app.json` - App configuration
- `apps/mobile/eas.json` - EAS Build configuration
- `apps/mobile/package.json` - Dependencies

