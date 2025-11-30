# Package Manager: pnpm vs npm

## This Project Uses: **pnpm** ✅

### Evidence:

- ✅ `pnpm-lock.yaml` file exists (not `package-lock.json`)
- ✅ All scripts in `package.json` use `pnpm`
- ✅ `playwright.config.ts` uses `"pnpm dev"`
- ✅ `package.json` requires `"pnpm": ">=8.0.0"`

## Why pnpm is Better for This Project

### 1. **Disk Space Efficiency** 💾

- **pnpm**: Uses a content-addressable store (single copy of each package version)
- **npm**: Duplicates packages in every `node_modules` folder
- **Result**: pnpm uses ~50-70% less disk space

### 2. **Installation Speed** ⚡

- **pnpm**: Faster installs due to hard linking and parallel downloads
- **npm**: Slower, especially with many dependencies
- **Result**: pnpm is often 2-3x faster

### 3. **Strict Dependency Resolution** 🔒

- **pnpm**: Only allows access to declared dependencies (prevents phantom dependencies)
- **npm**: Allows access to transitive dependencies (can cause bugs)
- **Result**: More reliable builds and fewer bugs

### 4. **Monorepo Support** 🏗️

- **pnpm**: Excellent workspace/monorepo support
- **npm**: Basic workspace support
- **Result**: Better for large projects

### 5. **Disk Space Example**

```
npm:  ~500MB node_modules
pnpm: ~150MB store + links (saves 350MB)
```

## Commands Comparison

| Task           | npm                   | pnpm                             |
| -------------- | --------------------- | -------------------------------- |
| Install        | `npm install`         | `pnpm install`                   |
| Dev            | `npm run dev`         | `pnpm run dev` or `pnpm dev`     |
| Build          | `npm run build`       | `pnpm run build` or `pnpm build` |
| Test           | `npm test`            | `pnpm test`                      |
| Add package    | `npm install <pkg>`   | `pnpm add <pkg>`                 |
| Remove package | `npm uninstall <pkg>` | `pnpm remove <pkg>`              |

## Important Notes

⚠️ **Never use `npm` commands in this project!**

- Using `npm` will create `package-lock.json` (conflicts with `pnpm-lock.yaml`)
- Dependencies may not resolve correctly
- CI/CD and other developers use `pnpm`

## When to Use Each

### Use pnpm (This Project) ✅

- All development work
- Installing dependencies
- Running scripts
- CI/CD pipelines

### npm is OK for:

- Global CLI tools: `npm install -g <tool>`
- Other projects that use npm
- Quick one-off package installations in non-pnpm projects

## Installation

If you don't have pnpm:

```powershell
# Install via npm (one time)
npm install -g pnpm

# Or via standalone script (recommended)
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

Verify installation:

```powershell
pnpm --version  # Should show >= 8.0.0
```

## Summary

✅ **This project uses `pnpm`**  
✅ **Always use `pnpm` commands**  
✅ **pnpm is faster and uses less disk space**  
✅ **pnpm prevents dependency-related bugs**

**Correct command for dev server:**

```powershell
pnpm run dev
# or simply:
pnpm dev
```
