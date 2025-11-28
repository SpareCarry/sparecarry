# 📱 SpareCarry Mobile App - Testing Checklist

This document provides a comprehensive step-by-step testing checklist for the SpareCarry mobile app, including setup, feature testing, error debugging, and common issues.

---

## 📋 Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Environment Verification](#environment-verification)
3. [App Startup & Navigation](#app-startup--navigation)
4. [Authentication Testing](#authentication-testing)
5. [Core Features Testing](#core-features-testing)
6. [Auto-Measure Feature](#auto-measure-feature)
7. [Error Handling & Debugging](#error-handling--debugging)
8. [Network Testing](#network-testing)
9. [Platform-Specific Testing](#platform-specific-testing)
10. [Common Issues & Solutions](#common-issues--solutions)

---

## 🚀 Pre-Testing Setup

### Prerequisites Checklist

- [ ] **Node.js & pnpm installed**
  ```bash
  node --version  # Should be v18+ or v20+
  pnpm --version  # Should be v8+
  ```

- [ ] **Expo CLI installed globally** (optional, but recommended)
  ```bash
  npm install -g expo-cli
  ```

- [ ] **Expo Go app installed on mobile device**
  - iOS: Download from [App Store](https://apps.apple.com/app/expo-go/id982107779)
  - Android: Download from [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

- [ ] **Mobile device and computer on same network** (for LAN testing)
  - Check WiFi connection on both devices
  - Verify both devices are on the same subnet

- [ ] **Development environment ready**
  - Terminal/Command Prompt open
  - Code editor ready
  - Mobile device nearby

---

## 🔧 Environment Verification

### Step 1: Check Environment Variables

- [ ] **Navigate to project root**
  ```bash
  cd C:\SpareCarry
  ```

- [ ] **Verify `.env` file exists in root**
  ```bash
  # Windows PowerShell
  Test-Path .env
  # Should return: True
  ```

- [ ] **Check required environment variables are set**
  ```bash
  # Windows PowerShell
  Get-Content .env | Select-String "SUPABASE"
  ```
  
  Required variables:
  - [ ] `EXPO_PUBLIC_SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
  - [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - [ ] `EXPO_PUBLIC_EAS_PROJECT_ID` (optional, for push notifications)

- [ ] **Sync environment variables to mobile app**
  ```bash
  cd apps/mobile
  pnpm sync-env
  ```

- [ ] **Verify environment variables in mobile app**
  ```bash
  # Check if .env file exists in apps/mobile
  Test-Path apps/mobile/.env
  ```

### Step 2: Install Dependencies

- [ ] **Install root dependencies**
  ```bash
  cd C:\SpareCarry
  pnpm install
  ```

- [ ] **Install mobile app dependencies**
  ```bash
  cd apps/mobile
  pnpm install
  ```

- [ ] **Verify no peer dependency warnings**
  ```bash
  pnpm install
  # Should not show React version mismatch warnings
  ```

### Step 3: Clear Caches

- [ ] **Clear Metro bundler cache**
  ```bash
  cd apps/mobile
  pnpm start:clear
  # Or manually:
  # expo start --clear
  ```

- [ ] **Clear Expo cache** (if issues persist)
  ```bash
  expo start --clear
  ```

- [ ] **Clear node_modules and reinstall** (if dependency issues)
  ```bash
  rm -rf node_modules
  pnpm install
  ```

---

## 📱 App Startup & Navigation

### Step 1: Start Metro Bundler

- [ ] **Start Expo development server**
  ```bash
  cd apps/mobile
  pnpm start
  # Or for offline mode:
  pnpm start:offline
  ```

- [ ] **Verify Metro bundler starts successfully**
  - Should see: `Metro waiting on exp://...`
  - Should see: QR code in terminal
  - Should NOT see: `hasMagic` errors
  - Should NOT see: React version mismatch warnings

- [ ] **Check for startup errors in terminal**
  - Look for red error messages
  - Check for module resolution errors
  - Verify no Supabase initialization errors

### Step 2: Connect Mobile Device

#### Option A: LAN Connection (Recommended for Development)

- [ ] **Get your computer's LAN IP address**
  ```bash
  cd apps/mobile
  pnpm get-lan-ip
  # Or manually:
  # Windows: ipconfig | findstr IPv4
  # Mac/Linux: ifconfig | grep inet
  ```

- [ ] **Verify mobile device can reach computer**
  - Open browser on mobile device
  - Navigate to: `http://<LAN_IP>:8081`
  - Should see Metro bundler status page

- [ ] **Open Expo Go app on mobile device**
  - Tap "Scan QR Code" or "Enter URL manually"
  - Enter: `exp://<LAN_IP>:8081`
  - Or scan QR code from terminal

#### Option B: Tunnel Connection (For Testing Outside LAN)

- [ ] **Start with tunnel mode**
  ```bash
  cd apps/mobile
  expo start --tunnel
  ```

- [ ] **Wait for tunnel URL**
  - Should see: `exp://...@exp.host:80`
  - Copy this URL

- [ ] **Open Expo Go app**
  - Enter tunnel URL or scan QR code

### Step 3: Verify App Loads

- [ ] **Check app loads on device**
  - Should see: Green square logo
  - Should see: "SpareCarry" title
  - Should see: "Welcome to SpareCarry!" message
  - Should NOT see: Red error screen
  - Should NOT see: Blank white screen

- [ ] **Check Metro terminal for errors**
  - Look for: `✅ Supabase client initialized`
  - Look for: `✅ App loaded successfully`
  - Should NOT see: `❌ Failed to initialize Supabase client`
  - Should NOT see: `❌ Navigation error`

- [ ] **Verify navigation works**
  - Tap "Profile" tab at bottom
  - Should navigate to Profile screen
  - Tap "Home" tab
  - Should navigate back to Home screen

### Step 4: Test Error Boundaries

- [ ] **Verify error boundary works**
  - If app crashes, should see error screen
  - Error screen should show error message
  - Error screen should have "Try Again" button
  - Check Metro terminal for full error details

- [ ] **Verify 404 handler works**
  - Try navigating to non-existent route (if possible)
  - Should see 404 screen with route information
  - Check Metro terminal for 404 log

---

## 🔐 Authentication Testing

### Step 1: Test Authentication State

- [ ] **Check initial auth state**
  - On Home screen, verify user status is displayed
  - Should show: "Not logged in" or user email
  - Should show: "DEV MODE" banner if dev mode enabled

- [ ] **Navigate to Profile screen**
  - Tap "Profile" tab
  - Should see: Login form or user info
  - Should see: Push notification status

### Step 2: Test Login Flow

- [ ] **Open login screen**
  - Navigate to `/auth/login` (if accessible)
  - Or use login form on Profile screen

- [ ] **Test email/password login**
  - Enter valid email and password
  - Tap "Sign In"
  - Should navigate to Home screen
  - Should show user email on Home screen
  - Check Metro terminal for auth success logs

- [ ] **Test invalid credentials**
  - Enter invalid email/password
  - Tap "Sign In"
  - Should show error message
  - Should NOT crash app

### Step 3: Test OAuth Login

- [ ] **Test Google OAuth**
  - Tap "Sign in with Google"
  - Should open browser/OAuth flow
  - Should redirect back to app
  - Should show user logged in

- [ ] **Test OAuth callback**
  - Verify `/auth/callback` route exists
  - Check deep linking works
  - Verify session is saved

### Step 4: Test Sign Out

- [ ] **Sign out from Profile screen**
  - Tap "Sign Out" button
  - Should return to login/unauthorized state
  - Should clear user session
  - Check Metro terminal for sign out logs

---

## 🎯 Core Features Testing

### Location Services

- [ ] **Test location permission request**
  - Enable location on Home screen (if toggle exists)
  - Should request location permission
  - Grant permission
  - Should show current location coordinates

- [ ] **Test location display**
  - Verify coordinates are displayed
  - Format: `latitude, longitude` (4 decimal places)
  - Should update if location changes

- [ ] **Test location error handling**
  - Deny location permission
  - Should show error message
  - Should NOT crash app

- [ ] **Test location on different platforms**
  - iOS: Verify permission dialog appears
  - Android: Verify permission dialog appears
  - Web: Verify browser geolocation works

### Camera Access

- [ ] **Test camera permission**
  - Navigate to camera screen (if exists)
  - Should request camera permission
  - Grant permission
  - Should show camera preview

- [ ] **Test photo capture**
  - Take a photo
  - Should save photo
  - Should display photo preview

- [ ] **Test camera error handling**
  - Deny camera permission
  - Should show error message
  - Should NOT crash app

### Push Notifications

- [ ] **Test push notification registration**
  - Navigate to Profile screen
  - Should see: "Push notifications enabled" or "not available"
  - Check Metro terminal for token registration logs

- [ ] **Test push notification on device**
  - Send test notification (if backend supports)
  - Should receive notification
  - Should handle notification tap

- [ ] **Test push notification permissions**
  - Deny notification permission
  - Should show warning message
  - Should NOT crash app

---

## 📏 Auto-Measure Feature

### Step 1: Access Auto-Measure

- [ ] **Navigate to Auto-Measure screen**
  - From item listing form, tap "Auto-Fill Dimensions (Camera)"
  - Or navigate directly to `/auto-measure`
  - Should open camera screen with overlay

- [ ] **Verify camera loads**
  - Should show camera preview
  - Should show measurement rectangle overlay
  - Should show "Auto-Measure" button at bottom

### Step 2: Test Measurement

- [ ] **Test object detection**
  - Point camera at an object
  - Should show bounding box around object
  - Should show "Size Detecting..." indicator

- [ ] **Test measurement capture**
  - Tap "Auto-Measure" button
  - Should freeze frame
  - Should calculate dimensions
  - Should return to previous screen

- [ ] **Test dimension auto-fill**
  - Verify dimensions are filled in form
  - Should show: "Auto-estimated (Tap to edit)" label
  - Should allow manual editing

### Step 3: Test Multi-Frame Averaging

- [ ] **Test multi-frame capture**
  - Enable multi-frame mode (if available)
  - Capture multiple frames
  - Should average measurements
  - Should show improved accuracy

### Step 4: Test Photo Capture

- [ ] **Test photo capture with overlay**
  - Capture measurement photo
  - Should save photo with overlay
  - Should add photo to item gallery
  - Should label photo as "Auto-Measure Photo"

- [ ] **Test multiple photos**
  - Capture main photo
  - Capture side photo (if available)
  - Capture reference object photo (if available)
  - All photos should be saved

### Step 5: Test Reference Object Calibration

- [ ] **Test reference object detection**
  - Place reference object (credit card, coin, paper)
  - Select reference object type
  - Should detect reference object
  - Should apply calibration

- [ ] **Test calibration accuracy**
  - Compare measurements with/without reference
  - Calibrated measurements should be more accurate

---

## 🐛 Error Handling & Debugging

### Step 1: Check Metro Terminal Logs

- [ ] **Verify logs are visible**
  - All errors should appear in Metro terminal
  - Errors should be clearly marked with `❌`
  - Stack traces should be complete

- [ ] **Check for common error patterns**
  - `❌ Failed to initialize Supabase client`
  - `❌ Navigation error`
  - `❌ Module not found`
  - `❌ Cannot read properties of undefined`

### Step 2: Check Device Logs

- [ ] **Enable remote debugging** (if needed)
  - Shake device to open developer menu
  - Tap "Debug Remote JS"
  - Open Chrome DevTools
  - Check Console for errors

- [ ] **Check React Native Debugger**
  - Install React Native Debugger
  - Connect to Metro bundler
  - Check Redux/React DevTools

### Step 3: Test Error Recovery

- [ ] **Test network error handling**
  - Disable WiFi/mobile data
  - Try to use app
  - Should show error message
  - Should NOT crash app

- [ ] **Test API error handling**
  - Use invalid API credentials
  - Should show error message
  - Should NOT crash app

- [ ] **Test component error boundaries**
  - Force component error (if test mode available)
  - Should show error screen
  - Should allow retry

---

## 🌐 Network Testing

### Step 1: Test LAN Connection

- [ ] **Verify LAN IP is correct**
  ```bash
  pnpm get-lan-ip
  # Should show your computer's local IP
  ```

- [ ] **Test connectivity**
  - Ping computer from mobile device (if possible)
  - Or open `http://<LAN_IP>:8081` in mobile browser
  - Should see Metro bundler status

- [ ] **Test app over LAN**
  - Connect via LAN IP
  - Use app normally
  - Should work without issues
  - Should NOT show 404 errors

### Step 2: Test Tunnel Connection

- [ ] **Start tunnel mode**
  ```bash
  expo start --tunnel
  ```

- [ ] **Wait for tunnel URL**
  - Should see: `exp://...@exp.host:80`
  - Copy URL

- [ ] **Connect via tunnel**
  - Open Expo Go
  - Enter tunnel URL
  - Should connect successfully

- [ ] **Test app over tunnel**
  - Use app normally
  - May be slower than LAN
  - Should still work

### Step 3: Test Offline Mode

- [ ] **Test offline functionality**
  - Disable WiFi/mobile data
  - App should handle offline gracefully
  - Should show appropriate error messages
  - Should NOT crash

---

## 📱 Platform-Specific Testing

### iOS Testing

- [ ] **Test on iOS device**
  - Use Expo Go for iOS
  - Test all features
  - Verify iOS-specific permissions work

- [ ] **Test iOS-specific features**
  - Camera permissions
  - Location permissions
  - Push notifications
  - Deep linking

- [ ] **Test iOS UI/UX**
  - Verify safe area insets work
  - Check status bar styling
  - Verify tab bar appearance

### Android Testing

- [ ] **Test on Android device**
  - Use Expo Go for Android
  - Test all features
  - Verify Android-specific permissions work

- [ ] **Test Android-specific features**
  - Camera permissions
  - Location permissions
  - Push notifications
  - Deep linking

- [ ] **Test Android UI/UX**
  - Verify status bar styling
  - Check navigation gestures
  - Verify back button handling

---

## 🔧 Common Issues & Solutions

### Issue: "Project is incompatible with this version of Expo Go"

**Symptoms:**
- Error message when opening app in Expo Go
- SDK version mismatch

**Solutions:**
- [ ] Check Expo SDK version in `apps/mobile/package.json`
- [ ] Update to match Expo Go version (currently SDK 54)
- [ ] Run `pnpm install` to update dependencies
- [ ] Clear cache: `expo start --clear`

### Issue: "React version mismatch"

**Symptoms:**
- Warning: `react@18.3.1 - expected version: 19.1.0`
- App may not work correctly

**Solutions:**
- [ ] Verify `apps/mobile/package.json` has `react: "19.1.0"`
- [ ] Check `metro.config.js` prioritizes local `node_modules`
- [ ] Remove `workspaceRoot` from `nodeModulesPaths` in Metro config
- [ ] Clear cache and reinstall: `rm -rf node_modules && pnpm install`

### Issue: "Cannot read properties of undefined (reading 'hasMagic')"

**Symptoms:**
- Metro bundler error
- App fails to bundle

**Solutions:**
- [ ] Check `metro.config.js` has custom resolver for `expo-router/entry`
- [ ] Verify `unstable_enablePackageExports = false`
- [ ] Clear cache: `expo start --clear`
- [ ] Reinstall dependencies: `pnpm install`

### Issue: "404 Page Not Found" on Mobile

**Symptoms:**
- App shows 404 screen
- Navigation fails

**Solutions:**
- [ ] Check Metro terminal for 404 log (should show route)
- [ ] Verify route exists in `apps/mobile/app/` directory
- [ ] Check `_layout.tsx` registers all routes
- [ ] Verify navigation code uses correct route paths

### Issue: "500 Internal Server Error"

**Symptoms:**
- App shows 500 error
- API calls fail

**Solutions:**
- [ ] Check Metro terminal for error details
- [ ] Verify Supabase environment variables are set
- [ ] Check Supabase client initialization logs
- [ ] Verify network connectivity
- [ ] Check if using `localhost` (should use LAN IP for mobile)

### Issue: "Supabase client initialization failed"

**Symptoms:**
- Error: `Missing Supabase environment variables`
- Authentication doesn't work

**Solutions:**
- [ ] Verify `.env` file exists in root
- [ ] Check `EXPO_PUBLIC_SUPABASE_URL` is set
- [ ] Check `EXPO_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] Run `pnpm sync-env` to sync to mobile app
- [ ] Restart Metro bundler after setting env vars

### Issue: "expo-notifications auto-load warning"

**Symptoms:**
- Warning about expo-notifications in Expo Go

**Solutions:**
- [ ] Verify `usePushNotifications` lazy-loads the module
- [ ] Check hook only loads when needed
- [ ] Warning is expected in Expo Go (not an error)

### Issue: "App shows blank white screen"

**Symptoms:**
- App loads but shows nothing
- No errors visible

**Solutions:**
- [ ] Check Metro terminal for errors
- [ ] Verify `_layout.tsx` renders correctly
- [ ] Check if error boundary caught an error
- [ ] Try shaking device to open developer menu
- [ ] Check React Native Debugger

### Issue: "Metro bundler won't start"

**Symptoms:**
- `expo start` fails
- Port 8081 already in use

**Solutions:**
- [ ] Kill process on port 8081:
  ```bash
  # Windows
  netstat -ano | findstr :8081
  taskkill /PID <PID> /F
  ```
- [ ] Try different port: `expo start --port 8082`
- [ ] Clear cache: `expo start --clear`

---

## ✅ Final Verification Checklist

Before considering testing complete, verify:

- [ ] **App starts without errors**
- [ ] **All screens are accessible**
- [ ] **Navigation works correctly**
- [ ] **Authentication flows work**
- [ ] **Core features (location, camera, push) work**
- [ ] **Auto-Measure feature works**
- [ ] **Error handling works gracefully**
- [ ] **No crashes or freezes**
- [ ] **Metro terminal shows no critical errors**
- [ ] **App works on both iOS and Android**
- [ ] **App works over LAN and Tunnel**

---

## 📝 Testing Notes Template

Use this template to document your testing session:

```
Date: ___________
Tester: ___________
Device: ___________
OS Version: ___________
Expo Go Version: ___________

Issues Found:
1. 
2. 
3. 

Features Tested:
- [ ] App Startup
- [ ] Navigation
- [ ] Authentication
- [ ] Location
- [ ] Camera
- [ ] Push Notifications
- [ ] Auto-Measure

Notes:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## 🆘 Getting Help

If you encounter issues not covered in this checklist:

1. **Check Metro Terminal**: Most errors are logged here
2. **Check Device Logs**: Shake device → Developer Menu → View Logs
3. **Check React Native Debugger**: For detailed component state
4. **Review Error Boundaries**: App should show error screens with details
5. **Check GitHub Issues**: Search for similar issues
6. **Ask for Help**: Share error logs and steps to reproduce

---

**Last Updated:** 2024-12-19
**Version:** 1.0.0

