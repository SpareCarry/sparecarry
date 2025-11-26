# Test Reports Guide

All test scripts have been enhanced to generate detailed reports that you can share for debugging and fixing errors.

## Quick Start

### Run All Tests with Reports (Recommended)
```powershell
.\run-all-tests.ps1
```

Or using npm/pnpm:
```bash
pnpm test:all:with-reports
```

### Individual Test Commands

#### 1. Comprehensive Tests
```powershell
pnpm test:comprehensive > test-results-comprehensive.txt 2>&1
```
**Reports Generated:**
- `test-results-comprehensive.txt` - Raw output
- `test-results-comprehensive-detailed.txt` - Detailed formatted report
- `test-results-comprehensive.json` - JSON report for programmatic access

#### 2. All Features Tests
```powershell
pnpm test:features > test-results-all-features.txt 2>&1
```
**Reports Generated:**
- `test-results-all-features.txt` - Raw output
- `test-results-all-features-detailed.txt` - Detailed formatted report
- `test-results-all-features.json` - JSON report

#### 3. Unit Tests (Vitest)
```powershell
pnpm test:with-report
```
**Reports Generated:**
- `test-results-vitest.txt` - Raw output
- `test-results-vitest-detailed.txt` - Detailed formatted report
- `test-results-vitest.json` - JSON report

#### 4. E2E Tests (Playwright)
```powershell
pnpm test:e2e:with-report
```
**Reports Generated:**
- `test-results-playwright.txt` - Raw output
- `test-results-playwright-detailed.txt` - Detailed formatted report
- `test-results-playwright.json` - JSON report
- `playwright-report/index.html` - HTML report (if available)

#### 5. Beta Readiness Verification
```powershell
pnpm test:verify-readiness
```
**Reports Generated:**
- `test-results/beta-readiness-verification-*.json` - JSON report
- `test-results/test-results-beta-readiness-detailed.txt` - Detailed report

#### 6. Beta Tests
```powershell
pnpm test:beta
```
**Reports Generated:**
- `test-results/beta-test-results-*.json` - JSON report
- `test-results/test-results-beta-detailed.txt` - Detailed report

## Report Formats

### Detailed Text Report
Contains:
- Test metadata (timestamp, Node version, working directory)
- Summary (total, passed, failed, success rate)
- Detailed results for each test
- Environment information
- Duration information

### JSON Report
Contains:
- Structured data for programmatic access
- All test results with status
- Environment information
- Raw output (truncated for large outputs)

## Master Test Runner

The master test runner (`run-all-tests-with-reports.js` or `run-all-tests.ps1`) runs all test suites and generates:
- Individual reports for each test suite
- A master summary report: `test-results-ALL-TESTS-detailed.txt`
- A master JSON report: `test-results-ALL-TESTS.json`

## Viewing Reports

### PowerShell
```powershell
# View detailed report
Get-Content test-results-comprehensive-detailed.txt

# View all detailed reports
Get-Content test-results-*-detailed.txt

# View master report
Get-Content test-results-ALL-TESTS-detailed.txt
```

### Command Line
```bash
# View detailed report
cat test-results-comprehensive-detailed.txt

# View all detailed reports
cat test-results-*-detailed.txt
```

## Sharing Reports

To share test results for debugging:

1. **Run the tests:**
   ```powershell
   .\run-all-tests.ps1
   ```

2. **Share these files:**
   - `test-results-ALL-TESTS-detailed.txt` - Master summary
   - `test-results-*-detailed.txt` - Individual test suite reports
   - `test-results-*.json` - JSON reports (if needed)

3. **Or share specific test results:**
   ```powershell
   # For comprehensive tests
   Get-Content test-results-comprehensive-detailed.txt
   
   # For a specific failing test
   Get-Content test-results-playwright-detailed.txt
   ```

## New NPM Scripts

Added to `package.json`:
- `test:with-report` - Run unit tests with detailed report
- `test:e2e:with-report` - Run E2E tests with detailed report
- `test:all:with-reports` - Run all tests with detailed reports

## Report Structure

Each detailed report includes:

1. **Metadata Section**
   - Generation timestamp
   - Node version
   - Working directory
   - Script path
   - Duration

2. **Summary Section**
   - Total tests
   - Passed count
   - Failed count
   - Success rate

3. **Detailed Results Section**
   - Individual test results
   - Status (✅ PASSED / ❌ FAILED)
   - Details and output
   - Errors (if any)
   - Warnings and notes

4. **Environment Information**
   - Environment variables
   - Configuration details
   - Additional context

## Troubleshooting

### If reports are not generated:
1. Check that the script completed (didn't crash early)
2. Verify write permissions in the project directory
3. Check console output for error messages

### If output is empty:
1. Ensure the test command is correct
2. Check that dependencies are installed (`pnpm install`)
3. Verify environment variables are set (`.env.local`)

### If tests fail:
1. Review the detailed report for specific errors
2. Check the JSON report for structured error data
3. Look at the raw output file for full error messages

## Best Practices

1. **Run tests before committing:**
   ```powershell
   .\run-all-tests.ps1
   ```

2. **Review detailed reports:**
   - Check success rates
   - Review failed tests
   - Look for warnings

3. **Share complete reports:**
   - Include both detailed and JSON reports
   - Share environment information if relevant
   - Include raw output for debugging

4. **Keep reports organized:**
   - Reports are timestamped in JSON files
   - Detailed reports overwrite previous runs
   - Archive important test runs if needed

## Example Workflow

```powershell
# 1. Run all tests
.\run-all-tests.ps1

# 2. Check summary
Get-Content test-results-ALL-TESTS-detailed.txt | Select-Object -First 50

# 3. If tests failed, check specific report
Get-Content test-results-playwright-detailed.txt

# 4. Share the detailed report for help
# Copy test-results-*-detailed.txt files
```

---

**Last Updated:** 2025-11-24  
**All test scripts now generate detailed reports for easy debugging and sharing.**

