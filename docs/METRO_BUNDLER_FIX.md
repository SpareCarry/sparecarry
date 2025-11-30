# 🔧 Metro Bundler 404 Fix (pnpm Workspace)

## Problem

Getting 404 error when Metro tries to load bundle:

```
http://192.168.1.238:8081/node_modules/.pnpm/expo-router@6.0l15_@expo+me_1f449006d2befaab722153cc94c1ad25/node_modules/expo-router/entry.bundle?platform=android
```

This is a **Metro bundler path resolution issue** with pnpm workspaces, not a route 404.

## ✅ Fix Applied

### 1. **Updated Metro Config** (`apps/mobile/metro.config.js`)

- Added proper workspace root resolution
- Configured node_modules paths for pnpm
- Enabled package exports
- Added better source extensions

### 2. **Clear Cache Script** (`apps/mobile/scripts/clear-cache.js`)

- Clears Metro cache
- Clears node_modules cache
- Works on Windows and Unix

## 🚀 How to Fix

### **Option 1: Clear Cache and Restart (Recommended)**

```bash
cd apps/mobile

# Clear cache
pnpm clear-cache

# Start with cleared cache
pnpm start:clear
```

### **Option 2: Manual Cache Clear**

```bash
cd apps/mobile

# Stop Metro (Ctrl+C if running)

# Clear caches
rm -rf .expo
rm -rf node_modules/.cache
rm -rf ../../node_modules/.cache

# Start fresh
pnpm start --clear
```

### **Option 3: Full Reset**

```bash
cd apps/mobile

# Stop Metro
# Clear everything
rm -rf .expo
rm -rf node_modules
rm -rf ../../node_modules/.cache

# Reinstall
cd ../..
pnpm install

# Start
cd apps/mobile
pnpm start --clear
```

## 🔍 Why This Happens

1. **pnpm workspace structure** - pnpm uses symlinks and a different node_modules layout
2. **Metro cache** - Old cache might have wrong paths
3. **Path resolution** - Metro needs explicit workspace root configuration

## ✅ Verification

After clearing cache and restarting:

1. **Metro should start** without errors
2. **Bundle URL should be shorter** (not the long pnpm path)
3. **App should load** in Expo Go

## 📋 If Still Failing

1. **Check Metro terminal** for actual error message
2. **Verify expo-router is installed**: `pnpm list expo-router`
3. **Check package.json main field**: Should be `"expo-router/entry"`
4. **Try restarting Expo Go** app on phone
5. **Check network** - Make sure phone and computer are on same WiFi

## 💡 Prevention

- Always use `pnpm start:clear` after dependency changes
- Clear cache when switching between branches
- Use `pnpm clear-cache` script before reporting issues

The Metro config is now optimized for pnpm workspaces! 🎉
