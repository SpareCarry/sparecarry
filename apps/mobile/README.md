# SpareCarry Mobile App

React Native mobile app built with Expo.

## Quick Start

### Dev Client (Recommended)

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Build and install Dev Client (one-time per device):**

   ```bash
   # Android
   pnpm build:dev:android

   # iOS (macOS only)
   pnpm build:dev:ios
   ```

3. **Start development server (Dev Client):**

   ```bash
   pnpm dev:mobile
   ```

4. **On your phone:**
   - Open the **Expo Dev Client** installed from the EAS build
   - Scan the QR code from the terminal or Dev Tools
   - The app opens in the Dev Client and connects to the dev server

### Legacy: Expo Go (not recommended)

You can still use Expo Go for very basic testing, but some native features (camera, auto-measure, etc.) may be limited or unstable.

1. **Start development server:**

   ```bash
   pnpm start
   ```

2. **On your phone:**
   - Install **Expo Go** from App Store/Play Store
   - Scan QR code from terminal
   - App opens in Expo Go

### Development Build (Full Native Features without Dev Client)

For testing camera, sensors, and other native features without using a Dev Client:

1. **Prebuild native code:**

   ```bash
   pnpm prebuild
   ```

2. **Run on device:**

   ```bash
   # Android
   pnpm android

   # iOS (macOS only)
   pnpm ios
   ```

## Testing Auto-Measure Feature

### Prerequisites

- Development build or production build (Expo Go has limited camera access)
- Camera permission granted
- Good lighting

### Steps

1. Open app and navigate to "Post Request" form
2. Tap "Auto-Fill Dimensions (Camera)" button
3. Grant camera permission
4. Point camera at object
5. Tap "Auto-Measure"
6. Verify:
   - Dimensions are filled
   - Photos appear in gallery
   - Overlay is visible in photos

### Enhanced Features

- **Reference Object**: Tap "Reference" button, enable it, place credit card/coin next to object
- **Multi-Frame**: Automatically captures 3 frames and averages
- **Tilt Correction**: Automatically corrects for phone tilt

## Build Commands

```bash
# Development
pnpm start              # Start dev server
pnpm android           # Run on Android
pnpm ios               # Run on iOS (macOS only)
pnpm web               # Run web version

# Prebuild
pnpm prebuild          # Generate native code
pnpm prebuild:clean   # Clean and regenerate
```

## EAS Build (Cloud)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build
eas build --platform android --profile development
eas build --platform ios --profile development
```

## Project Structure

```
apps/mobile/
├── app/                 # Expo Router screens
│   ├── (tabs)/         # Tab navigation
│   ├── auth/           # Authentication
│   └── auto-measure.tsx # Auto-measure screen
├── assets/             # Images, icons, sounds
├── config/             # Configuration
└── package.json        # Dependencies
```

## Dependencies

- `expo-camera` - Camera access
- `expo-sensors` - Accelerometer for tilt detection
- `expo-image-manipulator` - Image processing
- `expo-file-system` - File system access
- `react-native-view-shot` - View capture with overlay

## Troubleshooting

See `docs/MOBILE_BUILD_AND_TEST.md` for detailed troubleshooting.

## More Info

- Full guide: `docs/MOBILE_BUILD_AND_TEST.md`
- Auto-Measure docs: `docs/AUTO_MEASURE_ENHANCED_SUMMARY.md`
