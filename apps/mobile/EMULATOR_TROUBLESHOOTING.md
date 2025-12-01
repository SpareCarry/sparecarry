# Android Emulator Troubleshooting Guide

## Issue: Emulator Timeout When Starting

If you're getting "Timed out waiting for the Android emulator to start", try these solutions:

## Solution 1: Start Emulator Manually First (Recommended)

1. **Open Android Studio**
2. **Go to**: Tools → Device Manager
3. **Start the emulator** manually by clicking the ▶️ play button
4. **Wait** for it to fully boot (you'll see the Android home screen)
5. **Then run** your Expo command again:
   ```bash
   npx expo run:android
   ```

## Solution 2: Use a Different Emulator

Try using `myEmulator` instead:

```bash
npx expo run:android --device myEmulator
```

## Solution 3: Cold Boot the Emulator

If the emulator is stuck, try a cold boot:

1. **Close** any running emulator instances
2. **Open Android Studio** → Device Manager
3. **Right-click** on `Medium_Phone_API_36.0`
4. **Select** "Cold Boot Now"
5. **Wait** for it to start
6. **Then run** your Expo command

## Solution 4: Check Emulator Configuration

The API 36 emulator might be too resource-intensive. Consider:

1. **Reduce RAM allocation**:
   - Android Studio → Device Manager
   - Edit `Medium_Phone_API_36.0`
   - Advanced Settings → Reduce RAM (try 2048 MB or 1536 MB)

2. **Enable Hardware Acceleration**:
   - Ensure Hyper-V (Windows) or HAXM is enabled
   - Check: Android Studio → Settings → Appearance & Behavior → System Settings → Android SDK → SDK Tools → Intel x86 Emulator Accelerator (HAXM installer)

## Solution 5: Use Physical Device Instead

If emulators keep timing out:

1. **Enable USB Debugging** on your Android phone
2. **Connect** via USB
3. **Run**: `npx expo run:android --device`

## Solution 6: Increase Timeout (Temporary Fix)

You can try increasing the timeout, but this is usually a symptom of a deeper issue:

```bash
# Set environment variable (PowerShell)
$env:EXPO_ANDROID_EMULATOR_TIMEOUT="120000"
npx expo run:android
```

## Quick Test: Check if Emulator Works

Test if the emulator can start at all:

```bash
# List available emulators
emulator -list-avds

# Try to start manually (this will show any errors)
emulator -avd Medium_Phone_API_36.0 -no-snapshot-load
```

## Recommended: Create a New Emulator with API 34

For better compatibility with Expo SDK 54:

1. **Android Studio** → Device Manager → Create Device
2. **Select**: Phone → Pixel 5 (or similar)
3. **System Image**: API 34 (Android 14) - **Recommended for Expo SDK 54**
4. **Finish** the setup
5. **Start** the new emulator
6. **Use** it with Expo

## Why API 34 Instead of API 36?

- Your project uses **Expo SDK 54** which targets **API 34**
- API 36 (Android 15) is very new and may have compatibility issues
- API 34 is more stable and widely tested with Expo

