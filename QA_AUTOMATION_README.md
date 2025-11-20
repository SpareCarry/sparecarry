# QA Automation Readme

**Guide for running automated QA tests and adding new test cases**

**Last Updated**: 2024-12-19  
**Version**: 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Running Automated Tests](#running-automated-tests)
3. [Adding New QA Tasks](#adding-new-qa-tasks)
4. [Documenting Issues](#documenting-issues)
5. [Capturing Logs, Screenshots, Videos](#capturing-logs-screenshots-videos)
6. [CI QA Steps](#ci-qa-steps)
7. [Adding New Device Types](#adding-new-device-types)

---

## Overview

The QA automation system provides:

- ✅ **Automated test execution** via scripts
- ✅ **Manual test tracking** via checklists
- ✅ **Result logging** with timestamps
- ✅ **CI integration** for continuous validation
- ✅ **Issue documentation** templates

---

## Running Automated Tests

### Quick Start

```bash
# Run all QA tests
pnpm qa:run

# Run in CI mode (non-interactive)
pnpm qa:run --ci
```

### Individual Test Suites

```bash
# Environment validation
pnpm validate:env staging

# Preflight check
pnpm preflight:beta

# Code quality
pnpm typecheck
pnpm lint
pnpm format:check

# Unit tests
pnpm test

# Integration tests
pnpm test

# E2E tests (Playwright)
pnpm test:e2e

# Mobile E2E tests (Detox)
pnpm e2e:android
pnpm e2e:ios

# Load tests
pnpm loadtest

# Health check
curl https://staging.sparecarry.com/api/health
```

### Test Results

Results are saved to `qa-results/`:

- `qa_results_YYYYMMDD_HHMMSS.txt` - Detailed test results
- `qa_summary_YYYYMMDD_HHMMSS.json` - JSON summary

**View Results**:
```bash
# View latest results
cat qa-results/qa_results_*.txt | tail -50

# View summary
cat qa-results/qa_summary_*.json | jq .
```

---

## Adding New QA Tasks

### 1. Add to QA_TASKS.md

Edit `QA_TASKS.md` and add new task:

```markdown
### New Category

- [ ] **TASK-XXX**: Task description
  - Steps: 1, 2, 3
  - Expected: Result
  - Acceptance: Criteria
```

### 2. Add to QA_SIMULATION.md

If it's a test case, add to `QA_SIMULATION.md`:

```markdown
#### TC-NEW-001: New Test Case
**Steps**:
1. Step one
2. Step two
3. Step three

**Expected**:
- ✅ Expected result 1
- ✅ Expected result 2

**Acceptance**: Acceptance criteria
```

### 3. Add Automated Test (Optional)

If it can be automated, add to test suite:

**Unit Test** (`tests/unit/`):
```typescript
import { describe, it, expect } from 'vitest';

describe('New Feature', () => {
  it('should work correctly', () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

**E2E Test** (`tests/e2e/`):
```typescript
import { test, expect } from '@playwright/test';

test('new feature e2e', async ({ page }) => {
  await page.goto('/');
  // Test steps
  await expect(page.locator('selector')).toBeVisible();
});
```

### 4. Update FINAL_QA_SCRIPT.sh

If it should be in the automated script, add to `scripts/final_qa_script.sh`:

```bash
# Add new test function
run_test "New Test" "command-to-run" || true
```

---

## Documenting Issues

### Issue Template

Create issue in GitHub or document in `qa-results/issues/`:

```markdown
# Issue: [Title]

**Severity**: Critical / High / Medium / Low
**Platform**: Web / iOS / Android / API
**Date**: YYYY-MM-DD
**Reporter**: [Name]

## Description
Brief description of the issue

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots/Videos
- [Attach screenshots]
- [Attach screen recording]

## Environment
- OS: [OS version]
- Browser: [Browser version] (for web)
- Device: [Device model] (for mobile)
- App Version: [Version]
- Build: [Build number]

## Logs
[Paste relevant logs]

## Additional Context
Any other relevant information
```

### Issue Tracking

**GitHub Issues**:
- Use labels: `bug`, `qa`, `critical`, `high`, `medium`, `low`
- Assign to developer
- Link to test case if applicable

**Internal Tracking**:
- Document in `qa-results/issues/`
- Include timestamp
- Link to test results

---

## Capturing Logs, Screenshots, Videos

### Logs

**Web**:
```bash
# Browser console logs
# Open DevTools → Console
# Export logs or copy/paste

# Network logs
# Open DevTools → Network
# Export HAR file
```

**Mobile**:
```bash
# iOS (Xcode)
# Window → Devices and Simulators
# Select device → View Device Logs

# Android (Android Studio)
# View → Tool Windows → Logcat
# Export logs
```

**API**:
```bash
# Server logs
# Check Vercel logs or server logs

# API request/response
curl -v https://staging.sparecarry.com/api/endpoint > api_log.txt
```

### Screenshots

**Web**:
- Use browser DevTools screenshot
- Or OS screenshot tool
- Save to `qa-results/screenshots/`

**Mobile**:
- iOS: Use device screenshot (Power + Volume Up)
- Android: Use device screenshot (Power + Volume Down)
- Or use Xcode/Android Studio screenshot tools
- Save to `qa-results/screenshots/`

**Naming Convention**:
```
screenshot_YYYYMMDD_HHMMSS_platform_feature.png
Example: screenshot_20241219_143022_ios_login.png
```

### Screen Recordings

**Web**:
- Use browser DevTools recording
- Or screen recording software (OBS, QuickTime)
- Save to `qa-results/videos/`

**Mobile**:
- iOS: Use QuickTime (connect device)
- Android: Use Android Studio screen recorder
- Or use device screen recording
- Save to `qa-results/videos/`

**Naming Convention**:
```
video_YYYYMMDD_HHMMSS_platform_feature.mp4
Example: video_20241219_143022_android_payment.mp4
```

### Automated Capture

**Playwright** (E2E tests):
```typescript
// Screenshot on failure
test('feature', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('selector')).toBeVisible();
});

// Auto-captures screenshot on failure
```

**Vitest** (Unit tests):
```typescript
// Screenshot in test
import { screenshot } from 'vitest';

test('feature', async () => {
  // Test code
  await screenshot('test-screenshot.png');
});
```

---

## CI QA Steps

### GitHub Actions Integration

The CI pipeline (`/.github/workflows/ci.yml`) includes:

1. **Environment Validation**
   ```yaml
   - name: Validate Environment
     run: pnpm validate:env staging
   ```

2. **Code Quality**
   ```yaml
   - name: Type Check
     run: pnpm typecheck
   
   - name: Lint
     run: pnpm lint
   
   - name: Format Check
     run: pnpm format:check
   ```

3. **Tests**
   ```yaml
   - name: Unit Tests
     run: pnpm test
   
   - name: E2E Tests
     run: pnpm test:e2e
   ```

4. **Build Verification**
   ```yaml
   - name: Build
     run: pnpm build:staging
   
   - name: Validate Export
     run: pnpm validate:export
   ```

5. **Health Check**
   ```yaml
   - name: Health Check
     run: |
       curl -f https://staging.sparecarry.com/api/health || exit 1
   ```

### Adding New CI Steps

Edit `.github/workflows/ci.yml`:

```yaml
- name: New QA Step
  run: |
    # Your command here
    pnpm your-command
  continue-on-error: false  # or true if optional
```

### CI Artifacts

CI saves artifacts:

- Test results: `qa-results/`
- Build artifacts: `out/`, `ios/build/`, `android/app/build/`
- Screenshots: `qa-results/screenshots/`
- Videos: `qa-results/videos/`

**Download Artifacts**:
1. Go to GitHub Actions
2. Select workflow run
3. Scroll to "Artifacts"
4. Download artifacts

---

## Adding New Device Types

### iOS Devices

**Add to Detox Config** (`detox.config.js`):

```javascript
configurations: {
  'ios.sim.iphone14': {
    device: {
      type: 'iPhone 14',
      os: 'iOS 16.0',
    },
    app: 'ios',
  },
  'ios.sim.ipad': {
    device: {
      type: 'iPad Pro (12.9-inch)',
      os: 'iOS 16.0',
    },
    app: 'ios',
  },
}
```

**Test on Device**:
```bash
# List available simulators
xcrun simctl list devices

# Run on specific device
pnpm e2e:ios --device "iPhone 14"
```

### Android Devices

**Add to Detox Config** (`detox.config.js`):

```javascript
configurations: {
  'android.emu.pixel6': {
    device: {
      avdName: 'Pixel_6_API_33',
    },
    app: 'android',
  },
  'android.emu.tablet': {
    device: {
      avdName: 'Tablet_API_33',
    },
    app: 'android',
  },
}
```

**Test on Device**:
```bash
# List available emulators
emulator -list-avds

# Run on specific emulator
pnpm e2e:android --device "Pixel_6_API_33"
```

### Web Browsers

**Add to Playwright Config** (`playwright.config.ts`):

```typescript
projects: [
  {
    name: 'chrome',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
  {
    name: 'safari',
    use: { ...devices['Desktop Safari'] },
  },
  {
    name: 'mobile-chrome',
    use: { ...devices['Pixel 5'] },
  },
  {
    name: 'mobile-safari',
    use: { ...devices['iPhone 12'] },
  },
]
```

**Run on Specific Browser**:
```bash
# Run on Chrome only
pnpm test:e2e --project=chrome

# Run on mobile Chrome
pnpm test:e2e --project=mobile-chrome
```

---

## Best Practices

### Test Organization

1. **Group related tests** together
2. **Use descriptive names** for test cases
3. **Keep tests independent** (no dependencies)
4. **Clean up after tests** (delete test data)

### Test Data

1. **Use test accounts** (from seed script)
2. **Don't use production data**
3. **Clean up test data** after tests
4. **Use unique identifiers** for test data

### Error Handling

1. **Capture all errors** in logs
2. **Include context** in error messages
3. **Take screenshots** on failures
4. **Document error patterns**

### Performance

1. **Run tests in parallel** when possible
2. **Use test timeouts** appropriately
3. **Skip slow tests** in CI if needed
4. **Monitor test execution time**

---

## Troubleshooting

### Tests Fail Intermittently

**Solution**:
- Add retry logic
- Increase timeouts
- Check for race conditions
- Verify test data cleanup

### CI Tests Fail Locally Pass

**Solution**:
- Check environment differences
- Verify environment variables
- Check CI logs
- Test in CI-like environment

### Mobile Tests Fail

**Solution**:
- Verify emulator/simulator running
- Check device logs
- Verify app installed
- Check Detox configuration

---

## Resources

- **QA_SIMULATION.md**: Complete QA manual
- **QA_TASKS.md**: Granular task list
- **BETA_REHEARSAL.md**: Rehearsal guide
- **Vitest Docs**: https://vitest.dev
- **Playwright Docs**: https://playwright.dev
- **Detox Docs**: https://wix.github.io/Detox

---

**Last Updated**: 2024-12-19  
**Version**: 1.0.0

