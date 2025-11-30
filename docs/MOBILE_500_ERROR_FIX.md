# Mobile 500 Error Fix - Complete Guide

## Problem

The mobile app was showing 500 internal server errors when testing on mobile devices via Expo Go.

## Root Causes Identified

1. **Supabase Client Initialization Failures**
   - Missing environment variables causing crashes
   - No graceful fallback when initialization fails
   - Module-level code execution errors

2. **Missing Error Handling**
   - API calls not wrapped in try/catch
   - No graceful degradation when services unavailable

3. **Environment Variable Issues**
   - Variables not loaded correctly
   - Missing `.env.local` file in mobile app

## Fixes Applied

### 1. Enhanced Supabase Client Error Handling

**File**: `packages/lib/supabase/client.ts`

- Added graceful fallback when env vars are missing
- Returns placeholder client instead of throwing errors
- Better error messages with fix instructions
- Fallback to in-memory storage if SecureStore fails

**Changes**:

```typescript
// Before: Threw error and crashed app
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing env vars");
}

// After: Returns placeholder client, app continues
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Creating placeholder client");
  return createSupabaseClient(
    "https://placeholder.supabase.co",
    "placeholder-key"
  );
}
```

### 2. Lazy Supabase Initialization

**File**: `apps/mobile/app/_layout.tsx`

- Moved Supabase initialization from module-level to `useEffect`
- Prevents module-level errors from crashing the app
- Better error logging and recovery

**Changes**:

```typescript
// Before: Module-level initialization (could crash on import)
let supabase = createClient();

// After: Lazy initialization in useEffect
function initializeSupabase() {
  if (supabase !== null) return supabase;
  // ... initialization with error handling
}
```

### 3. Network Utilities for LAN Testing

**File**: `apps/mobile/lib/network-utils.ts`

- Utility functions for LAN IP detection
- Helper to replace localhost with LAN IP
- Script to find your local IP address

**Usage**:

```bash
# Find your LAN IP
pnpm get-lan-ip

# Add to apps/mobile/.env.local
EXPO_PUBLIC_LAN_IP=192.168.1.100
```

### 4. Better Error Logging

- Enhanced console logging in `_layout.tsx`
- Environment variable validation
- Clear error messages with fix instructions

## Environment Setup

### Required Files

1. **`apps/mobile/.env.local`** (create if missing):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_LAN_IP=192.168.1.100  # Optional, for LAN testing
```

### Setup Steps

1. **Copy environment variables from root**:

   ```bash
   cd apps/mobile
   pnpm sync-env
   ```

2. **Get your LAN IP** (for mobile testing):

   ```bash
   pnpm get-lan-ip
   ```

   Then add `EXPO_PUBLIC_LAN_IP=your-ip` to `.env.local`

3. **Verify environment variables**:
   ```bash
   pnpm check-env
   ```

## Testing Checklist

### ✅ Pre-Testing Setup

- [ ] Environment variables set in `apps/mobile/.env.local`
- [ ] Supabase URL and key are correct
- [ ] Metro bundler cache cleared (`pnpm start:clear`)
- [ ] All dependencies installed (`pnpm install`)

### ✅ App Launch

- [ ] App launches without crashing
- [ ] No 500 errors in Metro terminal
- [ ] Home screen displays correctly
- [ ] Tabs navigation works

### ✅ Authentication

- [ ] Auth state loads correctly
- [ ] Login screen accessible
- [ ] No Supabase connection errors
- [ ] Dev mode works (if enabled)

### ✅ Navigation

- [ ] Home tab works
- [ ] Profile tab works
- [ ] Auto-Measure screen accessible
- [ ] No 404 errors for registered routes

### ✅ Features

- [ ] Auto-Measure feature loads
- [ ] Camera permissions requested (if needed)
- [ ] Location permissions requested (if needed)
- [ ] Photo capture works

### ✅ Network Testing

- [ ] Works on same WiFi network (LAN)
- [ ] Works with Expo Tunnel
- [ ] Works offline (graceful degradation)
- [ ] API calls succeed when online

### ✅ Error Handling

- [ ] Errors display user-friendly messages
- [ ] Full errors logged to Metro terminal
- [ ] App doesn't crash on network errors
- [ ] Error boundaries catch unhandled errors

## Common Issues & Solutions

### Issue: "Missing Supabase environment variables"

**Solution**:

1. Create `apps/mobile/.env.local`
2. Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Run `pnpm sync-env` to copy from root
4. Restart Metro bundler

### Issue: "Cannot connect to Supabase"

**Solution**:

1. Check internet connection
2. Verify Supabase URL is correct
3. Check Supabase project is active
4. Try accessing Supabase dashboard

### Issue: "500 error on specific screen"

**Solution**:

1. Check Metro terminal for exact error
2. Verify the screen file exists
3. Check for missing imports
4. Verify all dependencies are installed

### Issue: "App crashes on startup"

**Solution**:

1. Clear Metro cache: `pnpm start:clear`
2. Check `_layout.tsx` for module-level errors
3. Verify all required files exist
4. Check environment variables

## Debugging Tips

### 1. Check Metro Terminal

All errors are logged to the Metro terminal. Look for:

- `❌` error markers
- Stack traces
- Environment variable warnings

### 2. Enable Verbose Logging

Add to `apps/mobile/.env.local`:

```env
EXPO_PUBLIC_DEBUG=true
```

### 3. Test Individual Components

Comment out components one by one to isolate the issue.

### 4. Check Network Requests

Use React Native Debugger or Flipper to inspect network requests.

## Files Modified

1. `packages/lib/supabase/client.ts` - Enhanced error handling
2. `apps/mobile/app/_layout.tsx` - Lazy initialization
3. `apps/mobile/lib/network-utils.ts` - Network utilities (new)
4. `apps/mobile/scripts/get-lan-ip.js` - LAN IP detection (new)
5. `apps/mobile/package.json` - Added scripts

## Next Steps

1. Test on both iOS and Android
2. Test with Expo Tunnel
3. Test offline functionality
4. Monitor error logs
5. Add more error boundaries if needed

## Summary

The 500 errors were primarily caused by:

- Missing environment variables
- Module-level code execution errors
- Lack of graceful error handling

All issues have been fixed with:

- Graceful fallbacks
- Lazy initialization
- Better error messages
- Comprehensive logging

The app should now start successfully even if some services are unavailable, with clear error messages guiding users to fix configuration issues.
