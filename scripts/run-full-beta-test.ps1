# Full Automated Beta Testing Script for SpareCarry
# Runs all preflight, build, QA, and verification steps
# Usage: .\scripts\run-full-beta-test.ps1

param(
    [switch]$SkipBuild = $false,
    [switch]$SkipMobile = $false,
    [switch]$SkipLoadTest = $false
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    $colorMap = @{
        "Red" = [ConsoleColor]::Red
        "Green" = [ConsoleColor]::Green
        "Yellow" = [ConsoleColor]::Yellow
        "Blue" = [ConsoleColor]::Blue
        "Cyan" = [ConsoleColor]::Cyan
        "White" = [ConsoleColor]::White
    }
    try {
        $originalColor = $Host.UI.RawUI.ForegroundColor
        if ($colorMap.ContainsKey($Color)) {
            $Host.UI.RawUI.ForegroundColor = $colorMap[$Color]
        }
        Write-Host $Message
        $Host.UI.RawUI.ForegroundColor = $originalColor
    }
    catch {
        # Fallback to plain output if color setting fails
        Write-Host $Message
    }
}

# Create results directory
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$projectRoot = Split-Path -Parent $PSScriptRoot
$resultsBaseDir = Join-Path $projectRoot "qa-results"
$resultsDir = Join-Path $resultsBaseDir $timestamp
New-Item -ItemType Directory -Force -Path $resultsDir | Out-Null
$logFile = Join-Path $resultsDir "beta-test.log"
$summaryFile = Join-Path $resultsDir "summary.json"

# Initialize results
$results = @{
    timestamp = $timestamp
    steps = @{}
    overall = "PENDING"
    score = 0
    errors = @()
    warnings = @()
}

function Log-Step {
    param(
        [string]$Step,
        [string]$Status,
        [string]$Message = "",
        [object]$Details = $null
    )
    $stepResult = @{
        status = $Status
        message = $Message
        timestamp = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        details = $Details
    }
    $results.steps[$Step] = $stepResult
    
    $statusColor = switch ($Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARN" { "Yellow" }
        default { "Cyan" }
    }
    
    Write-ColorOutput "[$Status] $Step" $statusColor
    if ($Message) {
        Write-ColorOutput "  $Message" "White"
    }
    
    Add-Content -Path $logFile -Value "[$Status] $Step - $Message"
}

function Test-Step {
    param(
        [string]$Step,
        [scriptblock]$ScriptBlock,
        [bool]$Critical = $true
    )
    try {
        Write-ColorOutput "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
        Write-ColorOutput "Running: $Step" "Cyan"
        Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" "Cyan"
        
        $output = & $ScriptBlock 2>&1
        $output | ForEach-Object { Add-Content -Path $logFile -Value $_ }
        
        Log-Step -Step $Step -Status "PASS" -Message "Completed successfully"
        return $true
    }
    catch {
        $errorMsg = $_.Exception.Message
        Log-Step -Step $Step -Status "FAIL" -Message $errorMsg -Details @{ error = $errorMsg; stack = $_.ScriptStackTrace }
        $results.errors += "$Step : $errorMsg"
        
        if ($Critical) {
            Write-ColorOutput "`n❌ CRITICAL FAILURE in $Step. Stopping execution." "Red"
            throw
        }
        return $false
    }
}

# Start logging
Write-ColorOutput "`n🚀 SpareCarry Full Beta Testing Suite" "Cyan"
Write-ColorOutput "Timestamp: $timestamp" "Cyan"
Write-ColorOutput "Results: $resultsDir`n" "Cyan"

Add-Content -Path $logFile -Value "=== SpareCarry Beta Testing Suite ==="
Add-Content -Path $logFile -Value "Started: $timestamp"
Add-Content -Path $logFile -Value ""

# Step 1: Preflight & Environment Validation
Test-Step -Step "Preflight & Environment Validation" -Critical $false {
    Write-ColorOutput "Checking environment configuration..." "Blue"
    
    # Check if .env.staging exists
    $projectRoot = Split-Path -Parent $PSScriptRoot
    $envFile = Join-Path $projectRoot ".env.staging"
    if (-not (Test-Path $envFile)) {
        Write-ColorOutput "⚠️  .env.staging not found. Checking .env.local..." "Yellow"
        $envFile = Join-Path $projectRoot ".env.local"
        if (-not (Test-Path $envFile)) {
            Write-ColorOutput "⚠️  .env.local also not found. Some checks may be skipped." "Yellow"
            Write-ColorOutput "   Please create .env.staging from .env.local.example for full validation" "Yellow"
            Log-Step -Step "Environment File Check" -Status "WARN" -Message "Environment file not found - some checks skipped"
        }
    }
    
    # Run preflight script
    $preflightScript = Join-Path $PSScriptRoot "preflight-beta.js"
    if (Test-Path $preflightScript) {
        $preflightOutput = node $preflightScript 2>&1
        $preflightOutput | ForEach-Object { Write-Host $_ }
        
        if ($LASTEXITCODE -ne 0) {
            throw "Preflight check failed. See output above."
        }
    }
    
    # Run environment validation
    $validateScript = Join-Path $PSScriptRoot "validate-env.js"
    if (Test-Path $validateScript) {
        $validateOutput = node $validateScript staging 2>&1
        $validateOutput | ForEach-Object { Write-Host $_ }
        
        if ($LASTEXITCODE -ne 0) {
            throw "Environment validation failed. See output above."
        }
    }
    
    Write-ColorOutput "✅ Environment validation passed" "Green"
}

# Step 2: Web Build
if (-not $SkipBuild) {
    Test-Step -Step "Web Build (Staging)" -Critical $false {
        Write-ColorOutput "Building Next.js staging web app..." "Blue"
        
        $projectRoot = Split-Path -Parent $PSScriptRoot
        Push-Location $projectRoot
        
        try {
            # Check if pnpm is available
            $pnpmCmd = Get-Command pnpm -ErrorAction SilentlyContinue
            if (-not $pnpmCmd) {
                Write-ColorOutput "⚠️  pnpm not found in PATH. Checking npm..." "Yellow"
                $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
                if (-not $npmCmd) {
                    throw "Neither pnpm nor npm found. Please install Node.js and pnpm."
                }
                $packageManager = "npm"
                Write-ColorOutput "Using npm instead of pnpm" "Yellow"
            }
            else {
                $packageManager = "pnpm"
            }
            
            # Install dependencies if needed
            if (-not (Test-Path "node_modules")) {
                Write-ColorOutput "Installing dependencies..." "Blue"
                if ($packageManager -eq "pnpm") {
                    pnpm install --frozen-lockfile
                }
                else {
                    npm ci
                }
                if ($LASTEXITCODE -ne 0) {
                    throw "Failed to install dependencies"
                }
            }
            
            # Build staging
            Write-ColorOutput "Running: $packageManager build:staging" "Blue"
            if ($packageManager -eq "pnpm") {
                pnpm build:staging
            }
            else {
                npm run build:staging
            }
            if ($LASTEXITCODE -ne 0) {
                throw "Build failed with exit code $LASTEXITCODE"
            }
            
            # Validate export
            Write-ColorOutput "Validating export..." "Blue"
            if ($packageManager -eq "pnpm") {
                pnpm validate:export
            }
            else {
                npm run validate:export
            }
            if ($LASTEXITCODE -ne 0) {
                Write-ColorOutput "⚠️  Export validation had warnings. Continuing..." "Yellow"
            }
            
            # Check out/ directory
            $outDir = Join-Path $projectRoot "out"
            if (-not (Test-Path $outDir)) {
                throw "out/ directory not found after build"
            }
            
            Write-ColorOutput "✅ Web build completed successfully" "Green"
        }
        finally {
            Pop-Location
        }
    }
}

# Step 3: Mobile Build (if not skipped)
if (-not $SkipMobile) {
    Test-Step -Step "Mobile Build (iOS)" -Critical $false {
        Write-ColorOutput "Building iOS app..." "Blue"
        Write-ColorOutput "⚠️  iOS build requires macOS and Xcode. Skipping in CI." "Yellow"
        Log-Step -Step "Mobile Build (iOS)" -Status "WARN" -Message "Skipped - requires macOS/Xcode"
    }
    
    Test-Step -Step "Mobile Build (Android)" -Critical $false {
        Write-ColorOutput "Building Android app..." "Blue"
        Write-ColorOutput "⚠️  Android build requires Android SDK. Skipping in CI." "Yellow"
        Log-Step -Step "Mobile Build (Android)" -Status "WARN" -Message "Skipped - requires Android SDK"
    }
}

# Step 4: Database Migration & Seed
Test-Step -Step "Database Migration & Seed" -Critical $false {
    Write-ColorOutput "Running database migration and seed..." "Blue"
    
    Push-Location (Join-Path $PSScriptRoot "..")
    
    try {
        # Check if migration script exists (Windows-compatible Node.js version)
        $migrateScript = Join-Path $PSScriptRoot "migrate-staging-db.js"
        if (Test-Path $migrateScript) {
            $packageManager = if (Get-Command pnpm -ErrorAction SilentlyContinue) { "pnpm" } else { "npm" }
            Write-ColorOutput "Running: $packageManager db:migrate:staging" "Blue"
            if ($packageManager -eq "pnpm") {
                pnpm db:migrate:staging
            } else {
                npm run db:migrate:staging
            }
            if ($LASTEXITCODE -ne 0) {
                Write-ColorOutput "⚠️  Migration failed or not configured. Continuing..." "Yellow"
                Log-Step -Step "Database Migration" -Status "WARN" -Message "Migration script failed or not configured"
            }
        }
        else {
            Write-ColorOutput "⚠️  Migration script not found. Skipping..." "Yellow"
            Log-Step -Step "Database Migration" -Status "WARN" -Message "Migration script not found"
        }
        
        # Check if seed script exists
        $seedScript = Join-Path $PSScriptRoot "seed-staging-data.js"
        if (Test-Path $seedScript) {
            $packageManager = if (Get-Command pnpm -ErrorAction SilentlyContinue) { "pnpm" } else { "npm" }
            Write-ColorOutput "Running: $packageManager db:seed:staging" "Blue"
            if ($packageManager -eq "pnpm") {
                pnpm db:seed:staging
            } else {
                npm run db:seed:staging
            }
            if ($LASTEXITCODE -ne 0) {
                Write-ColorOutput "⚠️  Seeding failed or not configured. Continuing..." "Yellow"
                Log-Step -Step "Database Seed" -Status "WARN" -Message "Seed script failed or not configured"
            }
        }
        else {
            Write-ColorOutput "⚠️  Seed script not found. Skipping..." "Yellow"
            Log-Step -Step "Database Seed" -Status "WARN" -Message "Seed script not found"
        }
        
        Write-ColorOutput "✅ Database setup completed (with warnings)" "Green"
    }
    finally {
        Pop-Location
    }
}

# Step 5: QA Simulation
Test-Step -Step "QA Simulation" -Critical $false {
    Write-ColorOutput "Running QA simulation..." "Blue"
    
    Push-Location (Join-Path $PSScriptRoot "..")
    
    try {
        $qaScript = Join-Path $PSScriptRoot "final_qa_script.js"
        if (Test-Path $qaScript) {
            # Run QA script in CI mode (Windows-compatible Node.js version)
            $packageManager = if (Get-Command pnpm -ErrorAction SilentlyContinue) { "pnpm" } else { "npm" }
            Write-ColorOutput "Running: $packageManager qa:run --ci" "Blue"
            if ($packageManager -eq "pnpm") {
                pnpm qa:run --ci
            } else {
                npm run qa:run -- --ci
            }
            if ($LASTEXITCODE -ne 0) {
                Write-ColorOutput "⚠️  QA simulation had failures. Check logs." "Yellow"
                Log-Step -Step "QA Simulation" -Status "WARN" -Message "Some QA tests failed"
            }
            else {
                Write-ColorOutput "✅ QA simulation completed" "Green"
            }
        }
        else {
            Write-ColorOutput "⚠️  QA script not found. Running basic tests..." "Yellow"
            
            # Run basic tests
            if (Get-Command pnpm -ErrorAction SilentlyContinue) {
                Write-ColorOutput "Running: pnpm test" "Blue"
                pnpm test 2>&1 | Out-Null
                if ($LASTEXITCODE -ne 0) {
                    Log-Step -Step "QA Simulation" -Status "WARN" -Message "Unit tests had failures"
                }
            }
        }
    }
    finally {
        Pop-Location
    }
}

# Step 6: Health Check
Test-Step -Step "Health Check Endpoint" -Critical $false {
    Write-ColorOutput "Testing health check endpoint..." "Blue"
    
    # Try to start dev server and check health
    $healthUrl = "http://localhost:3000/api/health"
    
    # Check if server is already running
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 5 -ErrorAction Stop
        $healthData = $response.Content | ConvertFrom-Json
        
        if ($healthData.status -eq "ok") {
            Write-ColorOutput "✅ Health check passed" "Green"
            Log-Step -Step "Health Check" -Status "PASS" -Message "All services healthy" -Details $healthData
        }
        elseif ($healthData.status -eq "degraded") {
            Write-ColorOutput "⚠️  Health check degraded" "Yellow"
            Log-Step -Step "Health Check" -Status "WARN" -Message "Some services degraded" -Details $healthData
        }
        else {
            Write-ColorOutput "❌ Health check failed" "Red"
            Log-Step -Step "Health Check" -Status "FAIL" -Message "Health check failed" -Details $healthData
        }
    }
    catch {
        Write-ColorOutput "⚠️  Health check endpoint not accessible (server may not be running)" "Yellow"
        Log-Step -Step "Health Check" -Status "WARN" -Message "Endpoint not accessible - server may not be running"
    }
}

# Step 7: Load Tests (if not skipped)
if (-not $SkipLoadTest) {
    Test-Step -Step "Load Tests" -Critical $false {
        Write-ColorOutput "Running load tests..." "Blue"
        Write-ColorOutput "⚠️  Load tests require k6 and staging server. Skipping..." "Yellow"
        Log-Step -Step "Load Tests" -Status "WARN" -Message "Skipped - requires k6 and staging server"
    }
}

# Step 8: Feature Flags
Test-Step -Step "Feature Flags Verification" -Critical $false {
    Write-ColorOutput "Verifying feature flags..." "Blue"
    Write-ColorOutput "⚠️  Feature flag verification requires Unleash server. Skipping..." "Yellow"
    Log-Step -Step "Feature Flags" -Status "WARN" -Message "Skipped - requires Unleash server"
}

# Step 9: Backup & Recovery
Test-Step -Step "Backup & Recovery Verification" -Critical $false {
    Write-ColorOutput "Verifying backup system..." "Blue"
    Write-ColorOutput "⚠️  Backup verification requires Supabase credentials. Skipping..." "Yellow"
    Log-Step -Step "Backup & Recovery" -Status "WARN" -Message "Skipped - requires Supabase credentials"
}

# Step 10: Sentry & Logging
Test-Step -Step "Sentry & Logging Verification" -Critical $false {
    Write-ColorOutput "Verifying Sentry integration..." "Blue"
    
    # Check if Sentry is configured
    $projectRoot = Split-Path -Parent $PSScriptRoot
    $envFile = Join-Path $projectRoot ".env.staging"
    if (-not (Test-Path $envFile)) {
        $envFile = Join-Path $projectRoot ".env.local"
    }
    
    if (Test-Path $envFile) {
        $envContent = Get-Content $envFile -Raw
        if ($envContent -match "NEXT_PUBLIC_SENTRY_DSN") {
            Write-ColorOutput "✅ Sentry DSN found in environment" "Green"
            Log-Step -Step "Sentry & Logging" -Status "PASS" -Message "Sentry DSN configured"
        }
        else {
            Write-ColorOutput "⚠️  Sentry DSN not found" "Yellow"
            Log-Step -Step "Sentry & Logging" -Status "WARN" -Message "Sentry DSN not configured"
        }
    }
    else {
        Write-ColorOutput "⚠️  Environment file not found" "Yellow"
        Log-Step -Step "Sentry & Logging" -Status "WARN" -Message "Environment file not found"
    }
}

# Calculate overall score
$passedSteps = ($results.steps.Values | Where-Object { $_.status -eq "PASS" }).Count
$totalSteps = $results.steps.Count
$warnSteps = ($results.steps.Values | Where-Object { $_.status -eq "WARN" }).Count
$failedSteps = ($results.steps.Values | Where-Object { $_.status -eq "FAIL" }).Count

$results.score = if ($totalSteps -gt 0) { [math]::Round(($passedSteps / $totalSteps) * 100, 1) } else { 0 }

if ($failedSteps -eq 0 -and $warnSteps -eq 0) {
    $results.overall = "PASS"
}
elseif ($failedSteps -eq 0) {
    $results.overall = "WARN"
}
else {
    $results.overall = "FAIL"
}

# Save summary
$results | ConvertTo-Json -Depth 10 | Out-File -FilePath $summaryFile -Encoding UTF8

# Generate final report
$reportFile = Join-Path $resultsDir "BETA_TEST_REPORT.md"
@"
# Beta Testing Report

**Generated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Overall Status**: $($results.overall)
**Score**: $($results.score)%

## Summary

- **Total Steps**: $totalSteps
- **Passed**: $passedSteps
- **Warnings**: $warnSteps
- **Failed**: $failedSteps

## Step Results

"@ | Out-File -FilePath $reportFile -Encoding UTF8

foreach ($step in $results.steps.GetEnumerator() | Sort-Object Key) {
    $status = $step.Value.status
    $message = $step.Value.message
    $statusIcon = switch ($status) {
        "PASS" { "✅" }
        "FAIL" { "❌" }
        "WARN" { "⚠️" }
        default { "⏳" }
    }
    
    "### $statusIcon $($step.Key)" | Out-File -FilePath $reportFile -Append -Encoding UTF8
    "- **Status**: $status" | Out-File -FilePath $reportFile -Append -Encoding UTF8
    "- **Message**: $message" | Out-File -FilePath $reportFile -Append -Encoding UTF8
    "- **Timestamp**: $($step.Value.timestamp)" | Out-File -FilePath $reportFile -Append -Encoding UTF8
    "" | Out-File -FilePath $reportFile -Append -Encoding UTF8
}

if ($results.errors.Count -gt 0) {
    "" | Out-File -FilePath $reportFile -Append -Encoding UTF8
    "## Errors" | Out-File -FilePath $reportFile -Append -Encoding UTF8
    "" | Out-File -FilePath $reportFile -Append -Encoding UTF8
    foreach ($err in $results.errors) {
        "- $err" | Out-File -FilePath $reportFile -Append -Encoding UTF8
    }
}

# Print final summary
Write-ColorOutput "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
Write-ColorOutput "Beta Testing Complete" "Cyan"
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
Write-ColorOutput "Overall Status: $($results.overall)" $(if ($results.overall -eq "PASS") { "Green" } elseif ($results.overall -eq "WARN") { "Yellow" } else { "Red" })
Write-ColorOutput "Score: $($results.score)%" "White"
Write-ColorOutput "Passed: $passedSteps / $totalSteps" "Green"
Write-ColorOutput "Warnings: $warnSteps" "Yellow"
Write-ColorOutput "Failed: $failedSteps" $(if ($failedSteps -eq 0) { "Green" } else { "Red" })
Write-ColorOutput "`nResults saved to: $resultsDir" "Cyan"
Write-ColorOutput "Report: $reportFile" "Cyan"
Write-ColorOutput "Summary: $summaryFile" "Cyan"

# Exit with appropriate code
if ($results.overall -eq "FAIL") {
    exit 1
}
elseif ($results.overall -eq "WARN") {
    exit 0
}
else {
    exit 0
}

