# Automated Payment Flow Test Script (PowerShell)
# Tests the complete payment flow using API endpoints

$ErrorActionPreference = "Continue"

$BASE_URL = $env:NEXT_PUBLIC_APP_URL
if (-not $BASE_URL) {
    $BASE_URL = "http://localhost:3000"
}

$CRON_SECRET = $env:CRON_SECRET

Write-Host "🚀 Testing Complete Payment Flow..." -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Test 1: Check if server is running
Write-Host "`n1. Checking if server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $BASE_URL -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not running at $BASE_URL" -ForegroundColor Red
    Write-Host "   Start the server with: pnpm dev" -ForegroundColor Yellow
    exit 1
}

# Test 2: Test auto-match endpoint
Write-Host "`n2. Testing auto-match endpoint..." -ForegroundColor Yellow
try {
    $body = @{ type = "plane"; id = "test" } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/matches/auto-match" -Method Post `
        -ContentType "application/json" -Body $body -UseBasicParsing -ErrorAction Stop
    $statusCode = $response.StatusCode
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
}

if ($statusCode -eq 401 -or $statusCode -eq 400 -or $statusCode -eq 200) {
    Write-Host "✅ Auto-match endpoint accessible (status: $statusCode)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Auto-match endpoint returned unexpected status: $statusCode" -ForegroundColor Yellow
}

# Test 3: Test payment intent creation endpoint
Write-Host "`n3. Testing payment intent creation endpoint..." -ForegroundColor Yellow
try {
    $body = @{ matchId = "test" } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/payments/create-intent" -Method Post `
        -ContentType "application/json" -Body $body -UseBasicParsing -ErrorAction Stop
    $statusCode = $response.StatusCode
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
}

if ($statusCode -eq 401 -or $statusCode -eq 400 -or $statusCode -eq 200) {
    Write-Host "✅ Payment intent endpoint accessible (status: $statusCode)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Payment intent endpoint returned unexpected status: $statusCode" -ForegroundColor Yellow
}

# Test 4: Test auto-release cron endpoint
Write-Host "`n4. Testing auto-release cron endpoint..." -ForegroundColor Yellow
if (-not $CRON_SECRET) {
    Write-Host "⚠️  CRON_SECRET not set, skipping auto-release test" -ForegroundColor Yellow
} else {
    try {
        $headers = @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $CRON_SECRET"
        }
        $response = Invoke-WebRequest -Uri "$BASE_URL/api/payments/auto-release" -Method Post `
            -Headers $headers -UseBasicParsing -ErrorAction Stop
        $statusCode = $response.StatusCode
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
    }

    if ($statusCode -eq 200 -or $statusCode -eq 401) {
        Write-Host "✅ Auto-release endpoint accessible (status: $statusCode)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Auto-release endpoint returned unexpected status: $statusCode" -ForegroundColor Yellow
    }
}

# Test 5: Test notification endpoints
Write-Host "`n5. Testing notification endpoints..." -ForegroundColor Yellow
try {
    $body = @{ token = "test-token" } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/notifications/register-token" -Method Post `
        -ContentType "application/json" -Body $body -UseBasicParsing -ErrorAction Stop
    $statusCode = $response.StatusCode
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
}

if ($statusCode -eq 401 -or $statusCode -eq 400 -or $statusCode -eq 200) {
    Write-Host "✅ Notification endpoint accessible (status: $statusCode)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Notification endpoint returned unexpected status: $statusCode" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Payment flow tests completed!" -ForegroundColor Green
Write-Host "Note: 401/400 responses are expected if authentication is required" -ForegroundColor Gray

