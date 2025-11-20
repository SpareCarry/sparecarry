#!/bin/bash
# Setup script for Detox iOS testing

set -e

echo "Setting up Detox for iOS..."

# Check if Xcode is available
if ! command -v xcodebuild &> /dev/null; then
    echo "Error: Xcode is not installed"
    echo "Please install Xcode from the App Store"
    exit 1
fi

# Check for iOS simulators
echo "Checking for iOS simulators..."
xcrun simctl list devices available | grep -q "iPhone" || {
    echo "Error: No iOS simulators found"
    echo "Please install iOS simulators via Xcode: Preferences > Components"
    exit 1
}

# Install CocoaPods dependencies if needed
if [ -f "ios/App/App/Podfile" ]; then
    echo "Installing CocoaPods dependencies..."
    cd ios/App/App
    pod install
    cd ../../..
fi

echo "Detox iOS setup complete!"
echo "Run 'pnpm e2e:build:ios' to build, then 'pnpm e2e:ios' to test"

