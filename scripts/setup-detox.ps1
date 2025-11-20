# PowerShell script for Detox setup (Windows)

Write-Host "Setting up Detox for mobile testing..." -ForegroundColor Green

# Check for Android
if ($env:ANDROID_HOME) {
    Write-Host "Android SDK found at: $env:ANDROID_HOME" -ForegroundColor Green
    
    # Check for emulator
    $emulators = & "$env:ANDROID_HOME\emulator\emulator" -list-avds
    if ($emulators -match "Pixel_7_API_33") {
        Write-Host "Android emulator 'Pixel_7_API_33' found" -ForegroundColor Green
    } else {
        Write-Host "Warning: Android emulator 'Pixel_7_API_33' not found" -ForegroundColor Yellow
        Write-Host "Please create an AVD named 'Pixel_7_API_33' via Android Studio" -ForegroundColor Yellow
    }
} else {
    Write-Host "Warning: ANDROID_HOME not set" -ForegroundColor Yellow
}

# Check for iOS (macOS only)
if ($IsMacOS -or $env:OS -eq "Darwin") {
    if (Get-Command xcodebuild -ErrorAction SilentlyContinue) {
        Write-Host "Xcode found" -ForegroundColor Green
    } else {
        Write-Host "Warning: Xcode not found" -ForegroundColor Yellow
    }
} else {
    Write-Host "iOS testing requires macOS" -ForegroundColor Yellow
}

Write-Host "`nSetup complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Install dependencies: pnpm install" -ForegroundColor White
Write-Host "2. Build Android: pnpm e2e:build:android" -ForegroundColor White
Write-Host "3. Build iOS: pnpm e2e:build:ios (macOS only)" -ForegroundColor White
Write-Host "4. Run tests: pnpm e2e:android or pnpm e2e:ios" -ForegroundColor White

