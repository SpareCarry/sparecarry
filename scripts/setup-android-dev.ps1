Write-Host "SpareCarry Dev Environment Initialiser"

# ---- 1. Ensure platform-tools folder exists ----
$platformTools = "C:\Android\platform-tools"

if (-Not (Test-Path $platformTools)) {
    Write-Host "platform-tools not found, creating base C:\Android folder (if needed)..."
    New-Item -ItemType Directory -Force -Path "C:\Android" | Out-Null
}

if (-Not (Test-Path "C:\Android")) {
    Write-Host "ERROR: Could not create C:\Android. Run PowerShell as Admin."
    exit 1
}

Write-Host "Expected platform-tools path: $platformTools"
Write-Host "If not downloaded yet, please:"
Write-Host "  1) Download Android SDK Platform-Tools for Windows"
Write-Host "     from: https://developer.android.com/tools/releases/platform-tools"
Write-Host "  2) Extract the zip so adb.exe is at: C:\Android\platform-tools\adb.exe"
Write-Host ""

if (-Not (Test-Path (Join-Path $platformTools "adb.exe"))) {
    Write-Host "ERROR: adb.exe not found at $platformTools"
    Write-Host "Download & extract platform-tools, then re-run this script."
    exit 1
}

# ---- 2. Detect LAN IP (for info only) ----
Write-Host "Detecting LAN IP..."
$ip = (Get-NetIPAddress | Where-Object {
    $_.IPAddress -match '192\.168\.' -and $_.AddressFamily -eq 'IPv4'
}).IPAddress

if (-Not $ip) {
    Write-Host "WARNING: No 192.168.x.x LAN IP found. Are you connected to WiFi?"
} else {
    Write-Host "LAN IP detected: $ip"
}
Write-Host ""

# ---- 3. Test if port 8081 is reachable locally ----
Write-Host "Checking if Metro port 8081 is open locally..."
$portTest = Test-NetConnection -ComputerName "localhost" -Port 8081 -WarningAction SilentlyContinue

if ($portTest -and $portTest.TcpTestSucceeded) {
    Write-Host "Metro is already running on localhost:8081"
} else {
    Write-Host "Metro is not running on 8081 yet (that's fine, we'll start it)."
}
Write-Host ""

# ---- 4. Setup ADB reverse -------------------------------------
Write-Host "Checking for ADB device..."

Set-Location $platformTools

$adbOutput = .\adb devices

Write-Host $adbOutput

if ($adbOutput -notmatch "device`r?`n" -or $adbOutput -match "unauthorized") {
    Write-Host "ERROR: ADB device not authorized or not detected."
    Write-Host "Fix:"
    Write-Host "  1) Ensure USB debugging is enabled on the phone"
    Write-Host "  2) Phone is unlocked and connected via USB"
    Write-Host "  3) Accept the 'Allow USB debugging?' popup on the phone"
    exit 1
}

Write-Host "Android device detected!"

Write-Host "Setting ADB reverse tcp:8081 -> tcp:8081 ..."

$reverseResult = .\adb reverse tcp:8081 tcp:8081 2>&1

Write-Host "ADB replied: $reverseResult"

Write-Host "adb reverse configured!"
Write-Host ""

# ---- 5. Start Metro bundler ------------------------------------
Write-Host "Starting Expo Metro Bundler (dev client mode)..."
Set-Location "C:\SpareCarry\apps\mobile"

Write-Host "Running: npx expo start --dev-client --clear"
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "cd C:\SpareCarry\apps\mobile; npx expo start --dev-client --clear"

Write-Host ""
Write-Host "============================================================"
Write-Host "SpareCarry Dev Environment Ready (via ADB reverse)"
Write-Host "------------------------------------------------------------"
Write-Host "Android Dev Client will now connect through:"
Write-Host "  localhost:8081 (tunneled to this PC via ADB Reverse)"
Write-Host ""
Write-Host "You should NOT see: 'Failed to connect to localhost/127.0.0.1:8081'"
Write-Host "------------------------------------------------------------"
Write-Host "If you still do:"
Write-Host "  - Ensure USB debugging is enabled"
Write-Host "  - Ensure the phone is unlocked + cable connected"
Write-Host "  - Re-run this script or: adb reverse tcp:8081 tcp:8081"
Write-Host "============================================================"


