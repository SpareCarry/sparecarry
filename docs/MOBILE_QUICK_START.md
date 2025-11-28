# Mobile App - Quick Start Guide

## ✅ Dependencies Installed

All dependencies are now installed, including:
- `expo-image-manipulator` ✅
- `expo-file-system` ✅
- `react-native-view-shot` ✅
- `expo-sensors` ✅

## 🚀 Start the App

### Option 1: Expo Go (Fastest)

```bash
cd apps/mobile
pnpm start
```

Then:
1. Install **Expo Go** on your phone
2. Scan the QR code
3. App opens in Expo Go

**Note:** Auto-Measure may have limited functionality in Expo Go due to camera/sensor restrictions.

### Option 2: Development Build (Recommended for Auto-Measure)

```bash
cd apps/mobile
pnpm prebuild    # Already done!
pnpm android    # For Android
# OR
pnpm ios        # For iOS (macOS only)
```

This gives you full native camera and sensor access.

## 📱 Testing Auto-Measure

1. **Open the app**
2. **Navigate to Post Request form**
3. **Tap "Auto-Fill Dimensions (Camera)"**
4. **Grant camera permission**
5. **Point at object and tap "Auto-Measure"**
6. **Verify:**
   - Dimensions are filled
   - 3 photos captured
   - Photos appear in gallery

## 🔧 Troubleshooting

### "expo-image-manipulator not installed"
```bash
cd apps/mobile
pnpm install
```

### App won't start
```bash
# Clear cache
expo start -c

# Or clean install
rm -rf node_modules
pnpm install
```

### Prebuild errors
```bash
# Create placeholder assets
node scripts/create-placeholder-assets.js

# Then prebuild
pnpm prebuild
```

## 📚 More Info

- Full guide: `docs/MOBILE_BUILD_AND_TEST.md`
- Auto-Measure docs: `docs/AUTO_MEASURE_ENHANCED_SUMMARY.md`

