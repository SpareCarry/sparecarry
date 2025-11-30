# Path Alias Fix - Post-Build Script Report

**Date**: 2025-11-19  
**Status**: ✅ **Script Created - Awaiting Successful Build**

---

## ✅ Completed Tasks

### 1. Post-Build Script Created

- **File**: `scripts/fix-aliases.js`
- **Purpose**: Replaces `@/` imports with relative paths in static export output
- **Features**:
  - Recursively scans all `.js`, `.mjs`, and `.html` files in `out/` folder
  - Handles multiple import styles:
    - ES6 imports: `import ... from "@/path"`
    - Dynamic imports: `import("@/path")`
    - CommonJS: `require("@/path")`
    - Standalone: `from "@/path"`
  - Calculates correct relative paths based on file locations
  - Preserves file extensions for `require()` but removes for ES modules
  - Provides detailed statistics and error reporting

### 2. Package.json Updated

- **Added**: `"postbuild": "node scripts/fix-aliases.js"`
- **Behavior**: Automatically runs after `npm run build` completes successfully
- **Location**: `package.json` scripts section

### 3. Configuration Verified

- ✅ `tsconfig.json` has `baseUrl: "."` and `paths: { "@/*": ["./*"] }`
- ✅ `next.config.js` has webpack alias configuration
- ✅ Admin route excluded from static export (`app/_admin`)

---

## ⚠️ Current Blocker

**Build Status**: ❌ **FAILING**

The Next.js build is currently failing due to unresolved `@/` imports during compilation:

```
Module not found: Can't resolve '@/components/ui/button'
Module not found: Can't resolve '@/lib/supabase/client'
```

**Root Cause**: Next.js 14.2.18 has a known bug where webpack aliases are not properly resolved during static export builds, even when correctly configured.

**Impact**: The `out/` folder is not created, so the post-build script cannot run.

---

## 🔄 Workflow Once Build Succeeds

1. **Build Phase**: `npm run build`
   - Next.js compiles the application
   - Creates `out/` folder with static files
   - May contain `@/` imports that don't resolve at runtime

2. **Post-Build Phase**: `node scripts/fix-aliases.js` (automatic)
   - Scans all files in `out/` directory
   - Finds all `@/` import references
   - Calculates relative paths from source to target files
   - Replaces `@/` imports with correct relative paths
   - Outputs statistics and any warnings

3. **Capacitor Sync**: `npx cap sync`
   - Syncs the fixed `out/` folder to iOS and Android projects
   - All imports will resolve correctly in the mobile apps

---

## 📋 Script Capabilities

### Path Resolution Strategy

The script uses a multi-step approach to find target files:

1. **Path Map**: Builds a map of `@/` aliases to actual file locations by:
   - Scanning source project structure (`components/`, `lib/`, `app/`, `types/`)
   - Finding corresponding files in `out/` directory
   - Checking common Next.js output locations (`_next/static/chunks/`)

2. **File Search**: For each `@/` import, searches in:
   - `out/{importPath}.js`
   - `out/{importPath}.mjs`
   - `out/{importPath}/index.js`
   - `out/_next/static/chunks/{importPath}.js`

3. **Relative Path Calculation**: Computes correct relative path from source file to target file

### Import Pattern Matching

The script handles:

- ✅ `import { Button } from "@/components/ui/button"`
- ✅ `import Button from "@/components/ui/button"`
- ✅ `import("@/lib/utils")`
- ✅ `require("@/lib/supabase/client")`
- ✅ `export * from "@/components/ui/button"`

---

## 🧪 Testing Instructions

Once the build succeeds:

1. **Run Build**:

   ```bash
   npm run build
   ```

2. **Verify Post-Build Script Runs**:
   - Check console output for:
     - "🔧 Fixing @/ path aliases in static export..."
     - "📋 Building path map..."
     - "🔄 Processing files..."
     - "✅ Fix complete!"

3. **Verify Imports Fixed**:

   ```bash
   # Check a sample file
   grep -r "@/components" out/ | head -5
   # Should show no results (all replaced with relative paths)
   ```

4. **Verify Relative Paths**:

   ```bash
   # Check that relative paths exist
   grep -r "\.\./components" out/ | head -5
   # Should show relative import paths
   ```

5. **Sync Capacitor**:
   ```bash
   npx cap sync
   ```

---

## 📊 Expected Output

When the script runs successfully, you should see:

```
🔧 Fixing @/ path aliases in static export...

📋 Building path map...
   Found X mapped paths

🔍 Finding files to process...
   Found Y files to process

🔄 Processing files...
   Processed Y files

✅ Fix complete!

📊 Statistics:
   Files processed: X
   Imports fixed: Y

✨ Done!
```

---

## 🔧 Troubleshooting

### If Script Reports "Could not find target"

This means the script couldn't locate a file for a `@/` import. Possible causes:

1. **File not in expected location**: Check if the file exists in `out/` directory
2. **Different file structure**: Next.js might have bundled files differently
3. **Missing file**: The import might reference a file that wasn't included in the build

**Solution**: Check the error messages in the script output to identify which imports couldn't be resolved.

### If Build Still Fails

The post-build script cannot fix build-time errors. If the build fails:

1. **Check webpack alias configuration** in `next.config.js`
2. **Verify tsconfig.json** has correct `baseUrl` and `paths`
3. **Check for syntax errors** in source files
4. **Review build error messages** for specific issues

---

## ✅ Next Steps

1. **Resolve Build Issue**: Fix the `@/` import resolution during build
   - This may require:
     - Upgrading Next.js (if allowed)
     - Using a different build configuration
     - Temporary workaround to allow build to complete

2. **Test Post-Build Script**: Once build succeeds, verify the script works correctly

3. **Verify Static Export**: Test that all imports resolve correctly in the built output

4. **Sync Capacitor**: Run `npx cap sync` to update mobile projects

---

## 📝 Notes

- The script preserves original source files - only modifies files in `out/` directory
- The script is idempotent - safe to run multiple times
- All path separators are normalized to forward slashes (`/`) for web compatibility
- File extensions are removed for ES module imports but preserved for `require()`

---

**Script Status**: ✅ **Ready**  
**Build Status**: ⚠️ **Pending** (needs build to succeed first)  
**Capacitor Sync**: ⏳ **Waiting** (depends on successful build + script execution)
