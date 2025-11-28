# Mobile Error Fixes - Comprehensive Guide

## Overview
This document outlines all fixes applied to resolve 500 errors, hasMagic errors, and 404 errors when testing the mobile app via Expo Go.

## Issues Fixed

### 1. 500 Internal Server Errors

#### Root Causes:
- Supabase client initialization failures
- Missing environment variables
- Network request timeouts
- Unhandled API call errors

#### Fixes Applied:

**A. Enhanced Supabase Client Error Handling** (`packages/lib/supabase/client.ts`):
- Added timeout handling (30 seconds) for all fetch requests
- Added comprehensive error logging for network failures
- Graceful fallback to placeholder client if initialization fails
- Better error messages for missing environment variables

**B. Network Error Recovery**:
- Added AbortController for request timeouts
- Improved error messages to distinguish between network errors and other failures
- Added retry logic hints in error messages

**C. Environment Variable Loading**:
- Enhanced logging to show which environment variables are missing
- Clear instructions in error messages on how to fix missing variables
- Support for both `EXPO_PUBLIC_` and `NEXT_PUBLIC_` prefixes

### 2. hasMagic Errors

#### Root Causes:
- Metro bundler trying to resolve modules with package.json exports
- pnpm workspace symlink resolution issues
- React version conflicts between root and app node_modules

#### Fixes Applied:

**A. Metro Config Improvements** (`apps/mobile/metro.config.js`):
- Disabled `unstable_enablePackageExports` to prevent hasMagic errors
- Disabled `unstable_enableSymlinks` to avoid pnpm symlink issues
- Custom resolver with comprehensive fallback logic
- Explicit React version resolution from local node_modules
- Better error handling for module resolution failures

**B. Module Resolution Strategy**:
- Prioritize local `node_modules` (React 19.1.0) over workspace root
- Fallback resolution for common module paths
- Package.json-based resolution for modules without direct entry points
- Comprehensive error logging for resolution failures

### 3. 404 Navigation Errors

#### Root Causes:
- Incorrect route nesting in Expo Router
- Missing route layout files
- Route names not matching file structure

#### Fixes Applied:

**A. Route Structure** (`apps/mobile/app/_layout.tsx`):
- Fixed auth route nesting by creating separate `auth/_layout.tsx`
- Ensured all routes are properly registered in Stack
- Added proper route listeners for debugging

**B. Auth Routes** (`apps/mobile/app/auth/_layout.tsx`):
- Created dedicated layout file for auth routes
- Properly nested login and callback screens
- Added header configuration

**C. Error Boundaries**:
- Enhanced `_error.tsx` with better error logging
- Enhanced `_not-found.tsx` with route information display
- All errors now log to Metro terminal with full details

### 4. Module Loading Errors

#### Root Causes:
- Missing or inaccessible modules (e.g., AutoMeasureCamera)
- Incorrect import paths
- Module not available in mobile environment

#### Fixes Applied:

**A. Graceful Module Loading** (`apps/mobile/app/auto-measure.tsx`):
- Lazy loading with try-catch for optional modules
- Fallback UI when modules are not available
- Clear error messages for missing features
- Proper error logging to Metro terminal

## Testing Checklist

### Pre-Testing Setup

1. **Environment Variables**:
   ```bash
   # Check if .env.local exists in apps/mobile/
   ls apps/mobile/.env.local
   
   # If missing, create it:
   cd apps/mobile
   pnpm sync-env
   # Or manually create with:
   # EXPO_PUBLIC_SUPABASE_URL=your_url
   # EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

2. **Clear Caches**:
   ```bash
   cd apps/mobile
   pnpm clear-cache
   # Or manually:
   rm -rf node_modules/.cache
   rm -rf .expo
   ```

3. **Install Dependencies**:
   ```bash
   # From root
   pnpm install
   
   # Ensure mobile app has its own node_modules
   cd apps/mobile
   npm install  # This ensures React 19.1.0 is installed locally
   ```

### Testing Steps

1. **Start Metro Bundler**:
   ```bash
   cd apps/mobile
   pnpm start:clear
   ```

2. **Check Metro Terminal for**:
   - ✅ "APP MODULE LOADING" banner
   - ✅ Supabase client initialization messages
   - ✅ Environment variable status
   - ❌ Any hasMagic errors
   - ❌ Any module resolution errors

3. **Test on Device**:
   - Open Expo Go app
   - Scan QR code or enter URL
   - Check device screen for:
     - ✅ App loads without white screen
     - ✅ No 500 error messages
     - ✅ Navigation works (tabs visible)
     - ✅ Home screen displays

4. **Check Metro Terminal for Errors**:
   - Look for error messages with "❌" prefix
   - Check for network errors
   - Verify Supabase connection status
   - Check for navigation errors

### Common Issues & Solutions

#### Issue: "fetch failed" or "Network request failed"
**Solution**:
- Check your network connection
- Verify Supabase URL is correct (not localhost)
- Check if device and computer are on same network
- Try using Tunnel mode: `expo start --tunnel`

#### Issue: "hasMagic" error persists
**Solution**:
- Clear Metro cache: `pnpm start:clear`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Metro config is using latest version
- Verify React version in `apps/mobile/package.json` is 19.1.0

#### Issue: 404 on specific routes
**Solution**:
- Check route file exists in correct location
- Verify route name matches file name
- Check `_layout.tsx` files are properly configured
- Look for route errors in Metro terminal

#### Issue: Supabase client errors
**Solution**:
- Verify environment variables are set
- Check `.env.local` file exists in `apps/mobile/`
- Restart Metro bundler after changing env vars
- Check Supabase URL is accessible from device

## Error Logging

All errors are now logged to the Metro terminal with clear prefixes:
- `❌` - Critical errors
- `⚠️` - Warnings
- `✅` - Success messages
- `📱` - Mobile-specific logs
- `[RT]` - Realtime manager logs
- `[Supabase]` - Supabase-related logs

## Next Steps

1. Test on both iOS and Android devices
2. Test with Tunnel mode for remote access
3. Monitor Supabase connection count (should be < 5)
4. Verify all navigation routes work correctly
5. Test Auto-Measure feature (if module is available)

## Additional Resources

- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Metro Bundler Configuration](https://metrobundler.dev/docs/configuration)
- [Supabase Mobile Setup](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)

