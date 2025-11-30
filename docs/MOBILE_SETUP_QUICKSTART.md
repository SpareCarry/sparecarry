# Quick Start: Mobile App Setup

Get your SpareCarry app running on iOS and Android in 5 minutes.

## Prerequisites Check

```bash
# Check Node.js
node --version  # Should be 18+

# Check npm
npm --version

# For iOS (Mac only)
xcodebuild -version

# For Android
java -version  # Should be Java 17+
```

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create Source Images

Create these files in `public/`:

1. **`icon-source.png`** - 1024x1024px PNG with your teal anchor logo
2. **`splash-source.png`** - 2732x2732px PNG with teal anchor logo centered on teal background

## Step 3: Generate Icons & Splash Screens

```bash
# Install ImageMagick (Mac)
brew install imagemagick

# Generate all assets
npm run generate:assets
```

## Step 4: Add Notification Sounds

Copy these sound files:

**For Web** (`public/sounds/`):

- `boat-horn.mp3`
- `airplane-ding.mp3`
- `foghorn.mp3`
- `cash-register.mp3`

**For Native** (after running `capacitor:sync`):

- Copy `.wav` versions to:
  - `ios/App/App/` (iOS)
  - `android/app/src/main/res/raw/` (Android)

## Step 5: Build & Sync

```bash
# Build Next.js app
npm run build

# Sync with Capacitor
npm run capacitor:sync
```

## Step 6: Open in IDE

**iOS:**

```bash
npm run capacitor:ios
```

**Android:**

```bash
npm run capacitor:android
```

## Step 7: Configure & Run

### iOS (Xcode)

1. Select your Team in Signing & Capabilities
2. Add "Push Notifications" capability
3. Add "Background Modes" → "Remote notifications"
4. Click Run (⌘R)

### Android (Android Studio)

1. Wait for Gradle sync to complete
2. Select device/emulator
3. Click Run

## Troubleshooting

**"No such module 'Capacitor'" (iOS)**

```bash
cd ios/App
pod install
```

**Build fails (Android)**

```bash
cd android
./gradlew clean
```

**Icons not showing**

```bash
npm run capacitor:sync
```

## Next Steps

See [MOBILE_BUILD.md](./MOBILE_BUILD.md) for detailed build instructions, publishing, and advanced configuration.
