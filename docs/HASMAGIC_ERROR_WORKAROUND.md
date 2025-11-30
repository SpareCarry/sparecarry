# Metro hasMagic Error - Workaround Guide

## Problem

The `hasMagic` error is a **known compatibility issue** between Metro bundler and pnpm's symlink structure:

```
ERROR: Cannot read properties of undefined (reading 'hasMagic')
```

This occurs because Metro's resolver tries to access a property that doesn't exist in pnpm's symlinked `node_modules` structure.

## Why This Happens

- **pnpm** uses symlinks to save disk space
- **Metro bundler** expects a traditional `node_modules` structure
- Metro's resolver code accesses `hasMagic` property which is undefined in pnpm's structure

## Solutions (In Order of Preference)

### Solution 1: Custom Metro Resolver (Already Applied) ✅

We've added a custom resolver in `metro.config.js` that:

- Handles `expo-router/entry` explicitly
- Catches `hasMagic` errors and uses fallback resolution
- Manually resolves modules when needed

**Try this first**: `pnpm start:clear`

### Solution 2: Use npm Instead of pnpm (Recommended Workaround)

If Solution 1 doesn't work, use npm for the mobile app:

```bash
cd apps/mobile
pnpm switch-to-npm
```

Or manually:

```bash
cd apps/mobile
rm -rf node_modules
npm install
npm start
```

**Note**: This only affects the mobile app. The rest of the monorepo can still use pnpm.

### Solution 3: Use Yarn Instead of pnpm

```bash
cd apps/mobile
rm -rf node_modules
yarn install
yarn start
```

### Solution 4: Wait for Metro Fix

This is a known issue in Metro. You can:

- Track the issue on Metro's GitHub
- Use npm/yarn as a temporary workaround
- Check for Metro updates that fix this

## Current Status

- ✅ Custom resolver added to `metro.config.js`
- ✅ Workaround script created (`switch-to-npm.js`)
- ⚠️ Issue persists if custom resolver doesn't work

## Testing

After applying a solution:

1. Clear Metro cache: `pnpm start:clear` (or `npm start -- --clear`)
2. Check Metro terminal for errors
3. Scan QR code with Expo Go
4. Verify app loads without `hasMagic` error

## Long-term Fix

The proper fix requires:

- Metro bundler to support pnpm's symlink structure
- Or pnpm to provide a compatibility mode for Metro

Until then, using npm for the mobile app is the most reliable workaround.

## Files Modified

- `apps/mobile/metro.config.js` - Added custom resolver
- `apps/mobile/scripts/switch-to-npm.js` - Workaround script
- `apps/mobile/package.json` - Added `switch-to-npm` script
