# Troubleshooting Notes & Solutions

This document records fixes and solutions that have worked for this project. Reference this when encountering similar issues.

---

## ✅ Fixed Issues

### 1. Missing `dev` Script in Mobile App

**Problem**: `npm run dev` failed with "Missing script: 'dev'"

**Location**: `apps/mobile/package.json`

**Solution**: Added `dev` script that maps to `expo start --clear`

```json
"scripts": {
  "dev": "expo start --clear",
  ...
}
```

**Status**: ✅ Fixed - Users can now run `npm run dev` in the mobile app directory

---

### 2. Missing Peer Dependency Settings in `.npmrc`

**Problem**: `.npmrc` file was missing React peer dependency resolution settings, causing potential npm installation failures. Documentation and scripts referenced `--legacy-peer-deps` flag, indicating these settings were intentionally configured.

**Location**: `.npmrc` (root)

**Solution**: Restored peer dependency settings:
- `legacy-peer-deps=true` - Uses lenient peer dependency resolution
- `strict-peer-dependencies=false` - Doesn't fail on peer dependency warnings

**Current `.npmrc` contents**:
```
# Allow build scripts for these packages
enable-pre-post-scripts=true

# Peer dependency resolution settings
# These settings allow npm to handle peer dependency conflicts leniently,
# matching the --legacy-peer-deps flag used in CI scripts and documentation
legacy-peer-deps=true
strict-peer-dependencies=false
```

**Why this matters**: 
- CI scripts (`scripts/ci-build.sh`) use `npm install --legacy-peer-deps`
- Documentation (`CI_PIPELINE_SETUP.md`) references `--legacy-peer-deps`
- These settings make the flag behavior the default, preventing installation failures

**Status**: ✅ Fixed - npm now handles peer dependencies leniently by default

---

### 3. Android Emulator Timeout Issue

**Problem**: Expo build command timed out waiting for Android emulator to start

**Error**: `Timed out waiting for the Android emulator to start`

**Solution**: Start emulator manually before running Expo commands

**Steps that work**:
1. Open Android Studio
2. Go to Tools → Device Manager
3. Start the emulator manually (click ▶️ play button)
4. Wait for emulator to fully boot (Android home screen visible)
5. Then run: `npx expo run:android`

**Alternative Solutions**:
- Use a different emulator: `npx expo run:android --device myEmulator`
- Use physical device: `npx expo run:android --device` (with USB debugging enabled)
- Cold boot emulator if stuck: Android Studio → Device Manager → Right-click emulator → "Cold Boot Now"

**Emulator Recommendations**:
- **Best**: API 34 (Android 14) - Compatible with Expo SDK 54
- **Current**: API 36 (Android 15) - Very new, may have compatibility issues
- Project uses Expo SDK 54 (`expo: ~54.0.25`)

**Documentation Created**: `apps/mobile/EMULATOR_TROUBLESHOOTING.md`

**Status**: ✅ Solution documented - Manual emulator start works reliably

---

## 📋 Project Configuration Reference

### Mobile App Setup
- **Framework**: Expo SDK 54 (`expo: ~54.0.25`)
- **React Native**: 0.76.0
- **React**: 18.3.1 (pinned via overrides)
- **Location**: `apps/mobile/`

### Android Configuration
- **Target SDK**: API 34 (recommended for Expo SDK 54)
- **Min SDK**: 22
- **Package**: `com.sparecarry.app`
- **Location**: `apps/mobile/android/`

### Available Emulators
- `Medium_Phone_API_36.0` - API 36 (Android 15)
- `myEmulator` - Custom emulator

### npm Configuration
- **Location**: `.npmrc` (root)
- **Settings**: 
  - `enable-pre-post-scripts=true`
  - `legacy-peer-deps=true`
  - `strict-peer-dependencies=false`

---

## 🔧 Common Commands

### Mobile App Development
```bash
# Start development server
cd apps/mobile
npm run dev          # Uses: expo start --clear

# Run on Android
npx expo run:android

# Run on Android (specific device)
npx expo run:android --device <device-name>

# List available emulators
emulator -list-avds
```

### Dependency Management
```bash
# Install dependencies (uses .npmrc settings automatically)
npm install

# If .npmrc settings don't work, use flag explicitly
npm install --legacy-peer-deps
```

---

## 🐛 Known Issues & Workarounds

### Android Emulator Timeout
- **Issue**: Expo times out waiting for emulator
- **Workaround**: Always start emulator manually in Android Studio first
- **Future Fix**: Consider creating API 34 emulator for better compatibility

### Android Project Malformed Warning
- **Issue**: Expo detected malformed Android project
- **Status**: User canceled - needs investigation if it persists
- **Potential Fix**: May need to run `npx expo prebuild --clean` to regenerate native projects

---

## 📝 Files Modified in This Session

1. `apps/mobile/package.json` - Added `dev` script
2. `.npmrc` - Restored peer dependency settings
3. `apps/mobile/EMULATOR_TROUBLESHOOTING.md` - Created troubleshooting guide
4. `TROUBLESHOOTING_NOTES.md` - This file

---

## 🔍 Quick Reference: Where to Look

- **Mobile app config**: `apps/mobile/app.json`
- **Android build config**: `apps/mobile/android/app/build.gradle`
- **npm config**: `.npmrc` (root)
- **CI scripts**: `scripts/ci-build.sh`
- **Emulator troubleshooting**: `apps/mobile/EMULATOR_TROUBLESHOOTING.md`

---

## 💡 Tips for Future Troubleshooting

1. **Always check `.npmrc` first** if npm install fails - peer dependency issues are common
2. **Start emulators manually** before running Expo commands - prevents timeout issues
3. **Use API 34 emulator** for Expo SDK 54 projects - better compatibility than API 36
4. **Check package.json scripts** if a command fails - may need to add missing script
5. **Reference CI scripts** (`scripts/ci-build.sh`) to see what flags/commands are expected

---

### 4. Missing API Endpoints

**Problem**: Feature tests failing because API endpoints don't exist:
- `/api/matches/auto-match`
- `/api/payments/create-intent`
- `/api/payments/confirm-delivery`
- `/api/payments/auto-release`
- `/api/notifications/register-token`

**Location**: `app/api/` directory

**Solution**: Created all missing API route handlers:
- `app/api/payments/create-intent/route.ts` - Creates Stripe payment intent for matches
- `app/api/payments/confirm-delivery/route.ts` - Confirms delivery and releases payment
- `app/api/payments/auto-release/route.ts` - Cron endpoint for auto-releasing escrow after 24h
- `app/api/matches/auto-match/route.ts` - Auto-matches trips with requests
- `app/api/notifications/register-token/route.ts` - Registers push notification tokens

**Key Features**:
- All endpoints support dev mode (`isDevMode()`)
- Payment endpoints integrate with Stripe
- Auto-release endpoint requires `CRON_SECRET` authentication
- All endpoints include proper error handling and validation

**Status**: ✅ Fixed - All endpoints created and ready for testing

**Note**: Server must be running (`npm run dev`) for tests to pass. Tests will show 404 if server is not running.

---

**Last Updated**: 2025-11-30
**Session**: Fixed missing dev script, restored .npmrc peer dependency settings, documented emulator timeout solution, created missing API endpoints

