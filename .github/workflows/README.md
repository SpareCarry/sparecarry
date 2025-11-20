# GitHub Actions CI/CD Workflows

This directory contains GitHub Actions workflows for the SpareCarry project.

## Workflows

### `ci.yml` - Main CI Pipeline

Runs on every push and pull request to `main` and `develop` branches.

**Jobs**:
1. **Test** - Unit and integration tests (Vitest)
   - Matrix: Node 18/20 × Ubuntu/macOS
   - Runs: Tests, type checks, linting, Next.js build

2. **E2E** - End-to-end tests (Playwright)
   - Runs on Ubuntu
   - Tests web application flows

3. **Build Android** - Capacitor Android build
   - Runs on Ubuntu
   - Builds Android APK (no emulator)

4. **Build iOS** - Capacitor iOS build
   - Runs on macOS
   - Builds iOS app (simulator)

5. **Type Check** - TypeScript validation
   - Type coverage check
   - Dead code detection

6. **Summary** - CI status summary
   - Aggregates all job results

## Environment Variables

All workflows use test/mock environment variables:
- `NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_123`
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

**No secrets required** - All tests use mocks.

## Running Locally

### Run Tests
```bash
pnpm test
```

### Run E2E Tests
```bash
pnpm test:e2e
```

### Run in Docker
```bash
pnpm test:e2e:docker
```

### Type Checks
```bash
pnpm typecheck:all
```

## Workflow Status Badge

Add to your README:
```markdown
![CI](https://github.com/your-org/sparecarry/workflows/CI/badge.svg)
```

