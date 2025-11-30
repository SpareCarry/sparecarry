# Mobile App Error Logging Setup ✅

## What Was Added

I've set up comprehensive error logging for the **Expo mobile app** so all 404s and errors now appear in your **terminal** (where you ran `pnpm start`).

## Changes Made

### 1. **Mobile Logger** (`apps/mobile/lib/logger.ts`)

- Centralized logging system for React Native
- Outputs to console (which appears in Metro bundler terminal)
- Formats errors with timestamps, routes, and stack traces

### 2. **Enhanced Root Layout** (`apps/mobile/app/_layout.tsx`)

- Logs all navigation events
- Logs screen focus events
- Logs authentication redirects
- Logs app startup/shutdown

### 3. **Error Boundary** (`apps/mobile/app/_error.tsx`)

- Catches all unhandled errors
- Logs them to terminal
- Shows user-friendly error screen

### 4. **Auto-Measure Screen Logging** (`apps/mobile/app/auto-measure.tsx`)

- Logs when screen opens
- Logs measurement completion
- Logs storage operations

### 5. **Fixed Type Mismatches**

- Fixed `AutoMeasureCamera` to pass photos as array
- Fixed `auto-measure.tsx` to handle array format
- Added AsyncStorage for native storage

## How to See Errors

### **Start Metro Bundler**

```bash
cd apps/mobile
pnpm start
```

### **What You'll See in Terminal**

When a 404 or error occurs, you'll see:

```
[2025-11-28T10:30:00.000Z] [MOBILE] [WARN] Navigation error | Route: /missing-route | Error: Route not found
```

For app errors:

```
[2025-11-28T10:30:00.000Z] [MOBILE] [ERROR] App Error Boundary caught error | Error: Cannot read property 'x' of undefined | Stack: ...
```

For navigation:

```
[2025-11-28T10:30:00.000Z] [MOBILE] [DEBUG] Navigation: (tabs) | Route: (tabs) | segments: ["(tabs)"] | hasUser: true
```

## What Gets Logged

- ✅ **All navigation events** (route changes, redirects)
- ✅ **Screen focus events** (when screens mount)
- ✅ **Authentication state changes**
- ✅ **Measurement operations** (auto-measure feature)
- ✅ **Storage operations** (AsyncStorage)
- ✅ **Unhandled errors** (caught by error boundary)
- ✅ **Stack traces** (in development mode)

## Testing the Logging

1. **Start the app:**

   ```bash
   cd apps/mobile
   pnpm start
   ```

2. **Open Expo Go** and scan QR code

3. **Try navigating** - you'll see logs in terminal:

   ```
   [MOBILE] [DEBUG] Screen focused: (tabs)
   [MOBILE] [INFO] Navigation: (tabs)
   ```

4. **Try accessing a non-existent route** - you'll see:
   ```
   [MOBILE] [WARN] Navigation error | Route: /missing
   ```

## Common 404 Causes in Mobile App

1. **Missing route file** - Check `apps/mobile/app/` directory
2. **Incorrect navigation** - Use `router.push('/route')` not `window.location`
3. **Stack not registered** - Route must be in `_layout.tsx` Stack

## Available Routes

Current routes in mobile app:

- ✅ `/(tabs)` - Tab navigation (home, profile)
- ✅ `/auth/login` - Login screen
- ✅ `/auth/callback` - OAuth callback
- ✅ `/(mobile-only)/camera` - Camera screen
- ✅ `/(mobile-only)/location` - Location screen
- ✅ `/auto-measure` - Auto-measure camera

## Next Steps

1. **Restart Metro bundler** to enable logging
2. **Try the action that causes 404**
3. **Check terminal output** - error will be logged there
4. **Share the terminal output** with me so I can fix it

All mobile app errors now show in your terminal! 🎉
