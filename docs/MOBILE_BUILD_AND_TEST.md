# Mobile App - Build and Test Guide

## Quick Start

### Development Mode (Fastest - Use Expo Go)

1. **Start the development server:**
   ```bash
   cd apps/mobile
   pnpm start
   ```

2. **On your phone:**
   - Install **Expo Go** app from App Store (iOS) or Play Store (Android)
   - Scan the QR code shown in terminal
   - App opens in Expo Go

3. **Test Auto-Measure:**
   - Navigate to post request form
   - Tap "Auto-Fill Dimensions (Camera)"
   - Grant camera permission
   - Test the feature!

### Development Build (Full Native Features)

For testing native features like camera, sensors, etc., you need a development build:

#### Option 1: Local Development Build

**Android:**
```bash
cd apps/mobile
pnpm prebuild
pnpm android
# Or open Android Studio and run from there
```

**iOS (macOS only):**
```bash
cd apps/mobile
pnpm prebuild
pnpm ios
# Or open Xcode and run from there
```

#### Option 2: EAS Build (Cloud Build)

**Build for Android:**
```bash
cd apps/mobile
eas build --platform android --profile development
```

**Build for iOS:**
```bash
cd apps/mobile
eas build --platform ios --profile development
```

**Install on device:**
- Download the build from EAS dashboard
- Install on your device
- Run `pnpm start` and connect to the build

## Testing Auto-Measure Feature

### Prerequisites
- ✅ Camera permission granted
- ✅ Device has accelerometer (for tilt detection)
- ✅ Good lighting for object detection

### Test Steps

1. **Open the app** (Expo Go or development build)

2. **Navigate to Post Request form:**
   - Find the "Post Request" or "Create Request" screen
   - Scroll to dimensions section

3. **Test Basic Measurement:**
   - Tap "Auto-Fill Dimensions (Camera)"
   - Grant camera permission if prompted
   - Point camera at an object
   - Wait for measurement rectangle to appear
   - Tap "Auto-Measure"
   - Verify dimensions are filled

4. **Test Reference Object (Optional):**
   - Tap "Reference" button
   - Enable "Use Reference"
   - Place credit card/coin/paper next to object
   - Capture measurement
   - Verify improved accuracy

5. **Test Multi-Frame Averaging:**
   - Capture measurement multiple times
   - Compare results (should be more consistent)
   - Check that 3 photos are captured

6. **Test Tilt Correction:**
   - Tilt phone at different angles
   - Capture measurements
   - Verify corrections are applied

7. **Verify Photos:**
   - Check that photos appear in gallery
   - Verify overlay is visible in photos
   - Test reordering/deleting photos

## Build Commands

### Development
```bash
# Start dev server
pnpm start

# Start with Android
pnpm android

# Start with iOS (macOS only)
pnpm ios

# Start web version
pnpm web
```

### Production Builds

**Using EAS Build (Recommended):**

```bash
# Build Android APK
eas build --platform android --profile preview

# Build Android AAB (for Play Store)
eas build --platform android --profile production

# Build iOS (requires Apple Developer account)
eas build --platform ios --profile production
```

**Local Builds:**

```bash
# Prebuild (generate native code)
pnpm prebuild

# Android
cd android
./gradlew assembleRelease  # APK
./gradlew bundleRelease     # AAB

# iOS (macOS only)
cd ios
xcodebuild -workspace SpareCarry.xcworkspace -scheme SpareCarry -configuration Release
```

## Testing Checklist

### Basic Functionality
- [ ] App launches successfully
- [ ] Navigation works
- [ ] Forms load correctly
- [ ] Camera permission requested

### Auto-Measure Feature
- [ ] Camera opens when tapping "Auto-Fill Dimensions"
- [ ] Measurement rectangle appears
- [ ] "Auto-Measure" button works
- [ ] Dimensions are calculated
- [ ] Dimensions are filled in form
- [ ] Photos are captured with overlay
- [ ] Photos appear in gallery

### Enhanced Features
- [ ] Multi-frame averaging works (3 frames)
- [ ] Tilt detection works (accelerometer)
- [ ] Tilt correction improves accuracy
- [ ] Reference object detection works
- [ ] Reference calibration improves accuracy
- [ ] All 3 photos captured (main, side, reference)
- [ ] Progress indicators show correctly

### Performance
- [ ] Camera preview is smooth
- [ ] Measurement completes in < 5 seconds
- [ ] No crashes or freezes
- [ ] Memory usage is reasonable

## Troubleshooting

### Camera Not Opening
- Check camera permission in device settings
- Verify `expo-camera` is installed
- Check `app.json` has camera plugin configured

### Measurement Fails
- Ensure good lighting
- Ensure object is centered in frame
- Try different object sizes
- Check console for errors

### Prebuild Fails
- Run `node scripts/create-placeholder-assets.js` to create assets
- Check all dependencies are installed: `pnpm install`
- Verify `app.json` and `app.config.ts` are valid

### Build Errors
- Clean build: `pnpm prebuild:clean`
- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`

## Environment Setup

### Required
- Node.js 18+
- pnpm 8+
- Expo CLI (installed via pnpm)
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)

### Optional
- EAS CLI: `npm install -g eas-cli`
- Expo Go app on your phone

## Quick Test Commands

```bash
# Start development server
cd apps/mobile
pnpm start

# Build and run Android
pnpm android

# Build and run iOS (macOS only)
pnpm ios

# Prebuild (generate native code)
pnpm prebuild

# Clean prebuild
pnpm prebuild:clean
```

## Next Steps

1. **Test in Expo Go first** (fastest way to test)
2. **Create development build** if you need native features
3. **Test on real devices** (not just simulator)
4. **Test Auto-Measure** with various objects
5. **Verify accuracy** with known object sizes
6. **Test offline functionality**
7. **Performance test** on low-end devices

## Notes

- **Expo Go**: Fastest for development, but some native features may be limited
- **Development Build**: Full native features, requires build time
- **Production Build**: For app store submission

For Auto-Measure specifically, you'll need a development build or production build since it uses native camera and sensors.

