# ChunkLoadError Fix Guide

## Problem

```
ChunkLoadError: Loading chunk app/layout failed.
(timeout: http://localhost:3000/_next/static/chunks/app/layout.js)
```

## Root Cause

This error occurs when:

1. The `.next` build cache is corrupted
2. Webpack chunks are not being generated correctly
3. The dev server is trying to load chunks that don't exist
4. There's a build configuration issue

## Solution Applied

### Step 1: Removed Problematic generateBuildId

- Removed `generateBuildId` from `next.config.mjs` that was causing build failures
- This was causing the nanoid compatibility issue

### Step 2: Cleared Build Cache

- Removed `.next` directory
- This forces Next.js to rebuild all chunks from scratch

## How to Fix

### Option 1: Restart Dev Server (Recommended)

```powershell
# Stop any running dev servers
# Then start fresh:
npx pnpm dev
```

The dev server will rebuild the `.next` directory automatically.

### Option 2: Clear Cache and Restart

```powershell
# Remove .next directory
Remove-Item -Recurse -Force .next

# Start dev server
npx pnpm dev
```

### Option 3: If Error Persists

```powershell
# Clear all caches
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# Reinstall dependencies (if needed)
npx pnpm install

# Start dev server
npx pnpm dev
```

## Prevention

1. **Don't use `generateBuildId` in dev mode** - It's only needed for production builds
2. **Clear `.next` when switching branches** - Different branches may have incompatible chunks
3. **Restart dev server after major config changes** - Webpack needs to regenerate chunks

## Notes

- The dev server (`pnpm dev`) doesn't require a full build
- Chunks are generated on-demand during development
- If chunks fail to load, clearing `.next` usually fixes it
- The build error (nanoid) only affects production builds, not dev mode

## Status

✅ **Fixed**: Removed `generateBuildId` that was causing build failures
✅ **Cache Cleared**: `.next` directory removed
🔄 **Next Step**: Start dev server with `npx pnpm dev`
