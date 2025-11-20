# CarrySpace Mobile Build Verification Script
# This script verifies the mobile app setup and generates a report

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "CarrySpace Mobile Build Verification" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$report = @{
    Build = @{}
    Capacitor = @{}
    iOS = @{}
    Android = @{}
    Plugins = @{}
    Errors = @()
    Warnings = @()
    Recommendations = @()
}

# 1. Check Next.js Build
Write-Host "[1/7] Checking Next.js Build..." -ForegroundColor Yellow
if (Test-Path "out") {
    $fileCount = (Get-ChildItem "out" -Recurse -File | Measure-Object).Count
    $report.Build.Status = "SUCCESS"
    $report.Build.Files = $fileCount
    $report.Build.Path = (Resolve-Path "out").Path
    Write-Host "  ✓ out folder exists with $fileCount files" -ForegroundColor Green
} else {
    $report.Build.Status = "MISSING"
    $report.Errors += "out folder not found - run 'npm run build' first"
    Write-Host "  ✗ out folder not found" -ForegroundColor Red
}

# 2. Check Capacitor Config
Write-Host "`n[2/7] Checking Capacitor Configuration..." -ForegroundColor Yellow
if (Test-Path "capacitor.config.ts") {
    $configContent = Get-Content "capacitor.config.ts" -Raw
    if ($configContent -match 'appId.*"com\.carryspace\.app"') {
        $report.Capacitor.AppId = "OK - com.carryspace.app"
        Write-Host "  ✓ App ID: com.carryspace.app" -ForegroundColor Green
    } else {
        $report.Capacitor.AppId = "ERROR - Incorrect"
        $report.Warnings += "App ID may not be set correctly"
    }
    if ($configContent -match 'appName.*"CarrySpace"') {
        $report.Capacitor.AppName = "OK - CarrySpace"
        Write-Host "  ✓ App Name: CarrySpace" -ForegroundColor Green
    }
    if ($configContent -match 'webDir.*"out"') {
        $report.Capacitor.WebDir = "OK - out"
        Write-Host "  ✓ Web Directory: out" -ForegroundColor Green
    }
} else {
    $report.Errors += "capacitor.config.ts not found"
    Write-Host "  ✗ capacitor.config.ts not found" -ForegroundColor Red
}

# 3. Check iOS Configuration
Write-Host "`n[3/7] Checking iOS Configuration..." -ForegroundColor Yellow
if (Test-Path "ios/App/App/Info.plist") {
    $iosPlist = Get-Content "ios/App/App/Info.plist" -Raw
    if ($iosPlist -match "CarrySpace") {
        $report.iOS.AppName = "OK - CarrySpace"
        Write-Host "  OK App name configured" -ForegroundColor Green
    }
    if ($iosPlist -match "remote-notification") {
        $report.iOS.PushNotifications = "OK - Configured"
        Write-Host "  OK Push notifications configured" -ForegroundColor Green
    }
    if ($iosPlist -match "NSCameraUsageDescription") {
        $report.iOS.Camera = "OK - Permission set"
        Write-Host "  OK Camera permission configured" -ForegroundColor Green
    }
    if ($iosPlist -match "NSLocationWhenInUseUsageDescription") {
        $report.iOS.Location = "OK - Permission set"
        Write-Host "  ✓ Location permission configured" -ForegroundColor Green
    }
} else {
    $report.Warnings += "iOS Info.plist not found - run 'npx cap sync ios'"
    Write-Host "  ⚠ iOS project may need sync" -ForegroundColor Yellow
}

# 4. Check Android Configuration
Write-Host "`n[4/7] Checking Android Configuration..." -ForegroundColor Yellow
if (Test-Path "android/app/src/main/AndroidManifest.xml") {
    $androidManifest = Get-Content "android/app/src/main/AndroidManifest.xml" -Raw
    if ($androidManifest -match 'package="com\.carryspace\.app"') {
        $report.Android.Package = "OK - com.carryspace.app"
        Write-Host "  OK Package: com.carryspace.app" -ForegroundColor Green
    }
    if ($androidManifest -match "POST_NOTIFICATIONS") {
        $report.Android.PushNotifications = "OK - Permission set"
        Write-Host "  OK Push notification permission configured" -ForegroundColor Green
    }
    if ($androidManifest -match "CAMERA") {
        $report.Android.Camera = "OK - Permission set"
        Write-Host "  OK Camera permission configured" -ForegroundColor Green
    }
    if ($androidManifest -match "ACCESS_FINE_LOCATION") {
        $report.Android.Location = "OK - Permission set"
        Write-Host "  ✓ Location permission configured" -ForegroundColor Green
    }
} else {
    $report.Warnings += "AndroidManifest.xml not found - run 'npx cap sync android'"
    Write-Host "  ⚠ Android project may need sync" -ForegroundColor Yellow
}

# 5. Check Capacitor Plugins
Write-Host "`n[5/7] Checking Capacitor Plugins..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$requiredPlugins = @(
    "@capacitor/core",
    "@capacitor/ios",
    "@capacitor/android",
    "@capacitor/push-notifications",
    "@capacitor/local-notifications",
    "@capacitor/app",
    "@capacitor/status-bar"
)

foreach ($plugin in $requiredPlugins) {
    $pluginName = $plugin -replace "@capacitor/", ""
    if ($packageJson.dependencies.PSObject.Properties.Name -contains $plugin) {
        $version = $packageJson.dependencies.$plugin
        $report.Plugins.$pluginName = "OK - $version"
        Write-Host "  OK $plugin ($version)" -ForegroundColor Green
    } else {
        $report.Plugins.$pluginName = "ERROR - Missing"
        $report.Errors += "$plugin not installed"
        Write-Host "  ✗ $plugin missing" -ForegroundColor Red
    }
}

# 6. Check Push Notification Integration
Write-Host "`n[6/7] Checking Push Notification Integration..." -ForegroundColor Yellow
if (Test-Path "lib/notifications/capacitor-notifications.ts") {
    $report.Plugins.PushIntegration = "OK - Code exists"
    Write-Host "  OK Capacitor push notification code found" -ForegroundColor Green
} else {
    $report.Warnings += "Push notification integration code not found"
}

if (Test-Path "lib/notifications/expo-push-service.ts") {
    $report.Plugins.ExpoIntegration = "OK - Code exists"
    Write-Host "  ✓ Expo push service integration code found" -ForegroundColor Green
}

# 7. Generate Recommendations
Write-Host "`n[7/7] Generating Recommendations..." -ForegroundColor Yellow

if (-not (Test-Path "out")) {
    $report.Recommendations += "Run 'npm run build' to create the out folder"
}

if (-not (Test-Path "ios/App/App/Info.plist") -or -not (Test-Path "android/app/src/main/AndroidManifest.xml")) {
    $report.Recommendations += "Run 'npx cap sync' to sync web assets to native projects"
}

$report.Recommendations += "iOS: Open in Xcode and configure signing (Team selection)"
$report.Recommendations += "iOS: Enable Push Notifications capability in Xcode"
$report.Recommendations += "Android: Create Firebase project and add google-services.json"
$report.Recommendations += "Android: Create keystore for production builds"
$report.Recommendations += "Test on simulators/emulators before production build"

# Output Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Build Status: " -NoNewline
if ($report.Build.Status -eq "SUCCESS") {
    Write-Host $report.Build.Status -ForegroundColor Green
    Write-Host "  Files: $($report.Build.Files)" -ForegroundColor Gray
} else {
    Write-Host $report.Build.Status -ForegroundColor Red
}

Write-Host "`nCapacitor Config:" -ForegroundColor Cyan
Write-Host "  App ID: $($report.Capacitor.AppId)" -ForegroundColor $(if ($report.Capacitor.AppId -match "OK") { "Green" } else { "Red" })
Write-Host "  App Name: $($report.Capacitor.AppName)" -ForegroundColor $(if ($report.Capacitor.AppName -match "OK") { "Green" } else { "Red" })
Write-Host "  Web Dir: $($report.Capacitor.WebDir)" -ForegroundColor $(if ($report.Capacitor.WebDir -match "OK") { "Green" } else { "Red" })

if ($report.Errors.Count -gt 0) {
    Write-Host "`nErrors:" -ForegroundColor Red
    foreach ($error in $report.Errors) {
        Write-Host "  ERROR: $error" -ForegroundColor Red
    }
}

if ($report.Warnings.Count -gt 0) {
    Write-Host "`nWarnings:" -ForegroundColor Yellow
    foreach ($warning in $report.Warnings) {
        Write-Host "  WARNING: $warning" -ForegroundColor Yellow
    }
}

if ($report.Recommendations.Count -gt 0) {
    Write-Host "`nRecommendations:" -ForegroundColor Cyan
    foreach ($rec in $report.Recommendations) {
        Write-Host "  -> $rec" -ForegroundColor Gray
    }
}

# Save report to file
$reportJson = $report | ConvertTo-Json -Depth 10
$reportJson | Out-File "mobile-build-report.json" -Encoding UTF8
Write-Host "`nOK Report saved to mobile-build-report.json" -ForegroundColor Green

Write-Host "`n========================================`n" -ForegroundColor Cyan

