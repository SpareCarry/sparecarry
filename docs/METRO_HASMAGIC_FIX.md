# 🔧 Metro Bundler "hasMagic" Error Fix

## Problem

Getting error:

```
Cannot read properties of undefined (reading 'hasMagic')
```

This is a known issue with Metro bundler and pnpm workspaces, especially with `expo-router`.

## Root Cause

The `hasMagic` property comes from the `glob` package, which Metro uses internally. With pnpm's symlink structure, Metro sometimes can't find or properly resolve `glob`, causing this error.

## ✅ Solutions (Try in Order)

### Solution 1: Simplified Metro Config (Applied)

I've simplified `metro.config.js` to minimal settings:

- Removed all unstable features
- Minimal watchFolders
- Basic nodeModulesPaths only

**Try this first:**

```bash
# Stop Metro (Ctrl+C)
pnpm clear-cache

```

### Solution 2: Install glob Package

If Solution 1 doesn't work, install `glob` at workspace root:

```bash
cd ../..
pnpm add -w -D glob@latest
cd apps/mobile
pnpm start:clear
```

### Solution 3: Reinstall Dependencies

If still failing, reinstall all dependencies:

```bash
cd ../..
rm -rf node_modules
rm -rf apps/mobile/node_modules
pnpm install
cd apps/mobile
pnpm start:clear
```

### Solution 4: Use npm/yarn Instead of pnpm

As a last resort, pnpm's symlink structure can cause issues with Metro. You could:

1. **Temporarily use npm:**

   ```bash
   cd apps/mobile
   npm install
   npm start -- --clear
   ```

2. **Or use yarn:**
   ```bash
   cd apps/mobile
   yarn install
   yarn start --clear
   ```

### Solution 5: Check expo-router Version

There might be a compatibility issue with `expo-router@6.0.15`. Try:

```bash
cd apps/mobile
pnpm add expo-router@latest
pnpm start:clear
```

## 🔍 Debugging

If none of the above work:

1. **Check Metro logs** for the exact error location
2. **Check if glob is installed:**
   ```bash
   pnpm list glob
   ```
3. **Check pnpm version:**

   ```bash
   pnpm --version
   ```

   (Should be 8.x or 9.x for best compatibility)

4. **Check Expo SDK version:**
   ```bash
   cd apps/mobile
   npx expo --version
   ```

## 📋 Current Status

- ✅ Metro config simplified
- ⏳ Waiting for user to test
- ⏳ May need to install glob or reinstall dependencies

## 💡 Prevention

- Keep Metro config minimal
- Avoid unstable Metro features
- Use stable Expo SDK versions
- Consider using npm/yarn if pnpm continues to cause issues
