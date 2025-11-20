#!/bin/bash
# Setup script for Detox Android testing

set -e

echo "Setting up Detox for Android..."

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ]; then
    echo "Error: ANDROID_HOME is not set"
    echo "Please set ANDROID_HOME to your Android SDK path"
    exit 1
fi

# Create Android emulator if it doesn't exist
echo "Checking for Android emulator..."
if ! emulator -list-avds | grep -q "Pixel_7_API_33"; then
    echo "Creating Android emulator..."
    echo "Please create an AVD named 'Pixel_7_API_33' with API 33"
    echo "You can do this via Android Studio: Tools > Device Manager > Create Device"
    exit 1
fi

# Build Android app for testing
echo "Building Android app for Detox..."
cd android
./gradlew assembleDebug assembleAndroidTest
cd ..

echo "Detox Android setup complete!"
echo "Run 'pnpm e2e:build:android' to build, then 'pnpm e2e:android' to test"

