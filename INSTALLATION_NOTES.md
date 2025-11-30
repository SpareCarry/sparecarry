# Installation Notes for Windows

## Package Manager

This project uses **pnpm** as the package manager, not npm. The project includes `pnpm-lock.yaml` which ensures consistent dependency resolution.

## Installing Dependencies

### Option 1: Using npx (Recommended for first-time setup)

```powershell
npx pnpm install
```

This will:

- Download and use pnpm automatically
- Install all dependencies
- Work without needing pnpm installed globally

### Option 2: Install pnpm globally

```powershell
npm install -g pnpm
```

Then refresh your PowerShell PATH:

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

Or simply restart PowerShell, then:

```powershell
pnpm install
```

## Why pnpm?

- Faster installation times
- More efficient disk usage (hard links)
- Better dependency resolution
- Lock file ensures consistent installs across environments

## Troubleshooting

### npm install fails with "Cannot read properties of null"

**Solution**: Use pnpm instead:

```powershell
npx pnpm install
```

### pnpm command not found after global install

**Solution**: Refresh PATH or restart PowerShell:

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

### Build scripts fail with environment variable errors

**Solution**: Ensure `cross-env` is installed (it should be after running `pnpm install`):

```powershell
npx pnpm list cross-env
```

## Common Commands

```powershell
# Install dependencies
npx pnpm install

# Start development server
npx pnpm dev

# Build staging
npx pnpm build:staging

# Run tests
npx pnpm test

# Run beta test suite
.\scripts\run-full-beta-test.ps1 -SkipMobile -SkipLoadTest
```

## Verification

After installation, verify everything works:

1. **Check cross-env is installed**:

   ```powershell
   npx pnpm list cross-env
   ```

2. **Test dev server**:

   ```powershell
   npx pnpm dev
   ```

   Should start without Capacitor or Sentry errors.

3. **Run preflight check**:
   ```powershell
   npx pnpm preflight:beta
   ```

---

**Status**: ✅ Dependencies installed successfully using pnpm.
