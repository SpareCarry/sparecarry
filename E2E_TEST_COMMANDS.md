# End-to-End Testing Commands & Results Sharing Guide

## 🚀 Complete End-to-End Test Commands

### Option 1: Full Test Suite (Recommended)

**Tests everything: Unit tests + E2E tests + API/DB checks**

```powershell
# Make sure your dev server is running first
pnpm dev

# In another terminal, run comprehensive tests:
pnpm test:all > test-results-full.txt 2>&1
```

This runs:

- ✅ Unit/Integration tests (Vitest)
- ✅ E2E tests (Playwright)
- ✅ All test files

### Option 2: Comprehensive Automated Tests

**Tests infrastructure: Environment, DB, Stripe, APIs**

```powershell
# No server needed for most tests
pnpm test:comprehensive > test-results-comprehensive.txt 2>&1
```

This tests:

- ✅ Environment variables
- ✅ Database connectivity
- ✅ Stripe connectivity
- ✅ API endpoints (needs server running)
- ✅ Matching algorithm
- ✅ Payment intents
- ✅ Notification services
- ✅ Database tables

### Option 3: E2E Tests Only (Playwright)

**Tests user flows in browser**

```powershell
# Make sure dev server is running
pnpm dev

# In another terminal:
pnpm test:e2e > test-results-e2e.txt 2>&1
```

### Option 4: E2E Tests with Visual UI (Best for Debugging)

**See tests run in real-time with browser**

```powershell
# Make sure dev server is running
pnpm dev

# In another terminal:
pnpm test:e2e:ui
```

This opens Playwright UI where you can:

- Watch tests run in real-time
- See browser interactions
- Debug failures visually
- Re-run individual tests

### Option 5: All Tests + Coverage Report

**Complete test suite with coverage**

```powershell
pnpm test:all > test-results-all.txt 2>&1
pnpm coverage > test-coverage.txt 2>&1
```

## 📋 How to Share Results with Me

### Method 1: Save to File (Recommended)

```powershell
# Run tests and save output
pnpm test:all > test-results.txt 2>&1

# Then share the file or paste its contents
```

### Method 2: Include Both Output and Errors

```powershell
# Capture both stdout and stderr
pnpm test:all *> test-results-complete.txt

# Or using PowerShell's Out-File
pnpm test:all | Out-File -FilePath test-results.txt -Encoding utf8
```

### Method 3: Include Playwright HTML Report

```powershell
# Run E2E tests
pnpm test:e2e

# The HTML report is automatically generated at:
# playwright-report/index.html

# Share the entire playwright-report folder or open it in browser
```

### Method 4: Share Specific Test Output

```powershell
# Run specific test file
pnpm test:e2e tests/e2e/auth-flow.spec.ts > auth-test-results.txt 2>&1

# Run with more verbose output
pnpm test:e2e --reporter=list,html > test-results.txt 2>&1
```

## 📤 What to Include When Sharing Results

When sharing test results, please include:

1. **The command you ran**

   ```
   pnpm test:all
   ```

2. **The full output** (from the saved file)
   - All test results
   - Error messages
   - Stack traces
   - Warnings

3. **Environment info** (if relevant)

   ```powershell
   node --version
   pnpm --version
   ```

4. **Any relevant files**
   - `test-results.txt` (or whatever you named it)
   - `playwright-report/index.html` (if E2E tests failed)
   - Screenshots from failed tests (usually in `test-results/` folder)

5. **What you expected vs what happened**
   - "Expected all tests to pass but 3 failed"
   - "Expected auth flow to work but got timeout"

## 🔍 Quick Diagnostic Commands

If tests fail, run these to help diagnose:

```powershell
# Check if server is running
curl http://localhost:3000

# Check environment variables
pnpm validate:env

# Check if Playwright browsers are installed
pnpm playwright:install

# Run a single simple test
pnpm test tests/unit/utils/getDaysLeft.test.ts
```

## 📝 Example Workflow

```powershell
# 1. Start dev server (in one terminal)
pnpm dev

# 2. Run comprehensive tests (in another terminal)
pnpm test:comprehensive > test-results.txt 2>&1

# 3. Run E2E tests
pnpm test:e2e > test-e2e-results.txt 2>&1

# 4. Check results
cat test-results.txt
cat test-e2e-results.txt

# 5. If there are failures, share both files with me
```

## 🎯 Best Command for Complete End-to-End Testing

**For the most comprehensive test:**

```powershell
# Terminal 1: Start server
pnpm dev

# Terminal 2: Run all tests
pnpm test:all > complete-test-results.txt 2>&1

# Terminal 2: Also run comprehensive infrastructure tests
pnpm test:comprehensive >> complete-test-results.txt 2>&1
```

This gives you:

- ✅ All unit tests
- ✅ All E2E tests
- ✅ All infrastructure checks
- ✅ Complete output in one file

## 💡 Pro Tips

1. **Use `test:e2e:ui` for debugging** - Visual feedback is invaluable
2. **Run `test:comprehensive` first** - Catches infrastructure issues early
3. **Save all output** - Even successful runs help me understand your setup
4. **Include error context** - What were you trying to do when it failed?

## 🚨 Common Issues & Solutions

### "Server not running" warnings

**Solution:** Start server with `pnpm dev` first, then run tests

### "Playwright browsers not installed"

**Solution:** Run `pnpm playwright:install`

### "Environment variables missing"

**Solution:** Check `.env.local` file exists and has required vars

### "Tests timeout"

**Solution:** Increase timeout in `playwright.config.ts` or specific test

---

**Ready to test?** Run `pnpm test:all` and share the results! 🚀
