# Expo Doctor Warnings - Expected in Monorepo Setup

This document explains the `expo-doctor` warnings you may see and why they are **expected and acceptable** for this monorepo setup.

## Why We Have These Warnings

This project uses a **monorepo structure** with `pnpm` workspaces, which requires custom Metro bundler configuration to:
- Watch workspace packages for changes
- Resolve modules correctly across the monorepo
- Prevent React duplication conflicts

These customizations are necessary and correct, but they differ from Expo's default configuration, which triggers `expo-doctor` warnings.

## Warning Breakdown

### 1. Metro Config Warnings ✅ **Safe to Ignore**

**Warning:** 
```
✖ Check for issues with Metro config
- "watchFolders" does not contain all entries from Expo's defaults
- "resolver.nodeModulesPaths" does not contain all entries from Expo's defaults
```

**Why This Happens:**
- We customize `watchFolders` to include monorepo packages (`packages/`, `lib/`, `src/`, etc.)
- We override `nodeModulesPaths` to prevent React conflicts in pnpm workspace

**Is This a Problem?** **No** - This configuration is intentional and correct for our monorepo setup.

**What We've Done:**
- ✅ Merged Expo's default `watchFolders` with our monorepo folders
- ✅ Added comments explaining the intentional `nodeModulesPaths` override
- ✅ Configuration is optimized for both monorepo functionality and Expo compatibility

### 2. Duplicate Dependencies ⚠️ **Common in Monorepos**

**Warning:**
```
✖ Check that no duplicate dependencies are installed
Your project contains duplicate native module dependencies...
```

**Why This Happens:**
- `pnpm` workspaces create symlinks between workspace packages
- Multiple packages may depend on the same modules (e.g., `react`, `expo`)
- The same package version can appear in different `node_modules` locations

**Is This a Problem?** **Usually No** - As long as versions match, `pnpm` handles this correctly via symlinks.

**When to Worry:**
- If you see **version mismatches** (e.g., `react@19.1.0` and `react@18.2.0`)
- If you encounter runtime errors about duplicate modules
- If native builds fail with module conflicts

**What to Do:**
1. Check versions are consistent across workspace
2. Run `pnpm install` to ensure symlinks are correct
3. If issues persist, run `pnpm install --force` (nuclear option)

### 3. App Config Sync Warning ℹ️ **Informational Only**

**Warning:**
```
✖ Check for app config fields that may not be synced in a non-CNG project
This project contains native project folders but also has native configuration 
properties in app.json...
```

**Why This Happens:**
- We have native folders (`android/`, `ios/`) which means we're using a **"bare workflow"**
- We also have configuration in `app.json` (orientation, icon, splash, etc.)
- Changes to `app.json` won't automatically sync to native folders

**Is This a Problem?** **No** - This is expected behavior for bare workflow projects.

**What This Means:**
- ✅ Native folders exist, so you can make native code changes directly
- ⚠️ If you change `app.json`, you may need to:
  - Manually update native config files, OR
  - Run `npx expo prebuild` to regenerate native folders from `app.json`

**Recommendation:**
- Keep native configs in sync manually, OR
- Use `expo prebuild` before major builds if you changed `app.json`

## When to Take Action

### ✅ Safe to Ignore If:
- App builds and runs correctly
- No runtime errors related to modules
- All dependency versions match across workspace
- Native builds work as expected

### ⚠️ Action Required If:
- Builds fail with module resolution errors
- Runtime errors about duplicate React or other modules
- Version conflicts in dependencies (check `package.json` files)
- Native builds fail unexpectedly

## Verification

To verify everything is working correctly:

```bash
# Check Metro bundler works
cd apps/mobile
pnpm start

# Check builds work
pnpm android  # or ios

# Check for version mismatches
pnpm list react
pnpm list react-native
```

## Summary

These warnings are **expected in monorepo setups** and don't indicate problems. The Metro config has been optimized to:
- ✅ Merge Expo defaults where safe
- ✅ Maintain monorepo functionality
- ✅ Prevent React duplication conflicts
- ✅ Support workspace package imports

If you encounter actual build or runtime issues, investigate those specifically. The warnings themselves are informational for our setup.

