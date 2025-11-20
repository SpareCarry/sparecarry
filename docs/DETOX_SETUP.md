# Detox Mobile E2E Testing Setup

This guide explains how to set up and run Detox end-to-end tests for the SpareCarry mobile app.

## Prerequisites

### Android
- Android SDK installed
- `ANDROID_HOME` environment variable set
- Android emulator created (recommended: `Pixel_7_API_33` with API 33)
- Java Development Kit (JDK) 11 or higher

### iOS (macOS only)
- Xcode installed
- iOS Simulator available
- CocoaPods installed (`sudo gem install cocoapods`)

## Installation

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Build the mobile app**:
   ```bash
   pnpm mobile:build
   ```

## Android Setup

1. **Create Android Emulator** (if not exists):
   - Open Android Studio
   - Go to Tools > Device Manager
   - Create a new Virtual Device
   - Select "Pixel 7" device
   - Select API 33 (Android 13) system image
   - Name it `Pixel_7_API_33`

2. **Update Android build.gradle**:
   - Open `android/app/build.gradle`
   - Add Detox configuration (see `android/app/build.gradle.detox` for reference)
   - Add Detox dependencies to `dependencies` block

3. **Build for testing**:
   ```bash
   pnpm e2e:build:android
   ```

4. **Run tests**:
   ```bash
   pnpm e2e:android
   ```

## iOS Setup

1. **Install CocoaPods dependencies**:
   ```bash
   cd ios/App/App
   pod install
   cd ../../..
   ```

2. **Build for testing**:
   ```bash
   pnpm e2e:build:ios
   ```

3. **Run tests**:
   ```bash
   pnpm e2e:ios
   ```

## Test Structure

Tests are located in the `e2e/` directory:

- `app-launch.e2e.ts` - App launch and basic navigation
- `auth-flow.e2e.ts` - Authentication flows
- `listing-flow.e2e.ts` - Creating trips and requests
- `match-flow.e2e.ts` - Match discovery and acceptance
- `chat-flow.e2e.ts` - Messaging functionality
- `payment-flow.e2e.ts` - Payment processing (stubbed)
- `push-notifications.e2e.ts` - Push notification handling

## Configuration

### Detox Config (`detox.config.js`)

The Detox configuration supports:
- **Android**: Debug and release builds
- **iOS**: Debug and release builds
- **Devices**: iPhone 15 Pro simulator, Pixel 7 emulator

### Jest Config (`e2e/jest.config.js`)

Jest is used as the test runner for Detox. Configuration includes:
- Test timeout: 120 seconds
- Single worker (required for Detox)
- Detox-specific reporters and environment

## Running Tests

### Android
```bash
# Build and test
pnpm e2e:build:android
pnpm e2e:android

# CI mode (headless)
pnpm e2e:android:ci
```

### iOS
```bash
# Build and test
pnpm e2e:build:ios
pnpm e2e:ios

# CI mode (headless)
pnpm e2e:ios:ci
```

## Writing Tests

### Basic Test Structure

```typescript
import { device, expect, element, by, waitFor } from 'detox';

describe('Feature Name', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should do something', async () => {
    await waitFor(element(by.id('element-id')))
      .toBeVisible()
      .withTimeout(5000);
    
    await element(by.id('element-id')).tap();
    
    await expect(element(by.text('Expected Text'))).toBeVisible();
  });
});
```

### Element Selection

- **By ID**: `element(by.id('element-id'))`
- **By Text**: `element(by.text('Button Text'))`
- **By Label**: `element(by.label('Accessibility Label'))`
- **Multiple matches**: `element(by.id('item')).atIndex(0)`

### Common Actions

- **Tap**: `await element(by.id('button')).tap()`
- **Type**: `await element(by.id('input')).typeText('text')`
- **Scroll**: `await element(by.id('scroll-view')).scroll(100, 'down')`
- **Swipe**: `await element(by.id('card')).swipe('left')`

## Troubleshooting

### Android Issues

**"Emulator not found"**:
- Ensure emulator is created and named correctly
- Check `ANDROID_HOME` is set
- Verify emulator is running: `emulator -list-avds`

**"Build failed"**:
- Ensure `android/app/build.gradle` includes Detox configuration
- Check Java version: `java -version` (should be 11+)
- Clean build: `cd android && ./gradlew clean`

### iOS Issues

**"Simulator not found"**:
- List available simulators: `xcrun simctl list devices`
- Boot simulator manually: `xcrun simctl boot "iPhone 15 Pro"`

**"Build failed"**:
- Ensure CocoaPods are installed: `pod --version`
- Reinstall pods: `cd ios/App/App && pod install`
- Clean build folder in Xcode

### General Issues

**"Tests timeout"**:
- Increase timeout in `detox.config.js`
- Check device/simulator is responsive
- Verify app builds successfully

**"Element not found"**:
- Add test IDs to React components: `testID="element-id"`
- Use accessibility labels: `accessibilityLabel="Label"`
- Check element is actually rendered (not hidden)

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Detox Android Tests
  run: |
    pnpm e2e:build:android
    pnpm e2e:android:ci
  env:
    ANDROID_HOME: ${{ secrets.ANDROID_HOME }}
```

### CircleCI Example

```yaml
- run:
    name: Run Detox iOS Tests
    command: |
      pnpm e2e:build:ios
      pnpm e2e:ios:ci
```

## Best Practices

1. **Use test IDs**: Add `testID` props to key UI elements
2. **Wait for elements**: Always use `waitFor()` for async operations
3. **Clean state**: Use `beforeEach` to reset app state
4. **Isolate tests**: Each test should be independent
5. **Mock external services**: Use test doubles for API calls
6. **Keep tests fast**: Minimize wait times and unnecessary actions

## Next Steps

- Add more test coverage for edge cases
- Integrate with CI/CD pipeline
- Add visual regression testing
- Set up test reporting and analytics

