# Master PowerShell script to run all tests with detailed reports
# Usage: .\run-all-tests.ps1

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "  SpareCarry - Complete Test Suite Runner" -ForegroundColor White
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "Timestamp: $timestamp" -ForegroundColor Gray
Write-Host ""

# Test commands with their output files
$testCommands = @(
    @{ Name = "Comprehensive Tests"; Command = "pnpm test:comprehensive"; OutputFile = "test-results-comprehensive.txt" },
    @{ Name = "All Features Tests"; Command = "pnpm test:features"; OutputFile = "test-results-all-features.txt" },
    @{ Name = "Unit Tests (Vitest)"; Command = "node scripts/run-vitest-with-report.js"; OutputFile = "test-results-vitest.txt" },
    @{ Name = "E2E Tests (Playwright)"; Command = "node scripts/run-playwright-with-report.js"; OutputFile = "test-results-playwright.txt" },
    @{ Name = "Beta Readiness"; Command = "node scripts/verify-beta-readiness.js"; OutputFile = "test-results-beta-readiness.txt" }
)

$overallStartTime = Get-Date
$results = @()

foreach ($test in $testCommands) {
    Write-Host ""
    Write-Host "=" * 70 -ForegroundColor Yellow
    Write-Host "  Running: $($test.Name)" -ForegroundColor White
    Write-Host "=" * 70 -ForegroundColor Yellow
    Write-Host ""
    
    $startTime = Get-Date
    
    try {
        # Run command and capture output
        $output = Invoke-Expression $test.Command 2>&1 | Out-String
        
        # Save to file
        $output | Out-File -FilePath $test.OutputFile -Encoding UTF8
        
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        # Check if passed (look for success indicators)
        $hasPassed = $output -notmatch "FAILED|failed" -and ($output -match "PASSED|passed|✅")
        
        $results += @{
            Name = $test.Name
            Status = if ($hasPassed) { "[PASSED]" } else { "[FAILED]" }
            Duration = "$([math]::Round($duration, 2))s"
            OutputFile = $test.OutputFile
        }
        
        Write-Host "Status: $(if ($hasPassed) { '[PASSED]' } else { '[FAILED]' })" -ForegroundColor $(if ($hasPassed) { "Green" } else { "Red" })
        Write-Host "Duration: $([math]::Round($duration, 2))s" -ForegroundColor Gray
        Write-Host "Output saved to: $($test.OutputFile)" -ForegroundColor Gray
        
    } catch {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        $results += @{
            Name = $test.Name
            Status = "[ERROR]"
            Duration = "$([math]::Round($duration, 2))s"
            OutputFile = $test.OutputFile
            Error = $_.Exception.Message
        }
        
        Write-Host "Status: [ERROR]" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

$overallEndTime = Get-Date
$totalDuration = ($overallEndTime - $overallStartTime).TotalSeconds

# Summary
Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "  Test Suite Summary" -ForegroundColor White
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

$passed = ($results | Where-Object { $_.Status -match "PASSED" }).Count
$failed = ($results | Where-Object { $_.Status -notmatch "PASSED" }).Count

Write-Host "Total Test Suites: $($results.Count)" -ForegroundColor White
Write-Host "[PASSED] $passed" -ForegroundColor Green
Write-Host "[FAILED] $failed" -ForegroundColor Red
Write-Host "Total Duration: $([math]::Round($totalDuration, 2))s" -ForegroundColor Gray
Write-Host "Success Rate: $([math]::Round(($passed / $results.Count) * 100, 1))%" -ForegroundColor Gray

Write-Host ""
Write-Host "Individual Results:" -ForegroundColor White
foreach ($result in $results) {
    $color = if ($result.Status -match "PASSED") { "Green" } else { "Red" }
    Write-Host "  $($result.Status) $($result.Name) ($($result.Duration))" -ForegroundColor $color
    Write-Host "    Output: $($result.OutputFile)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Check for detailed reports
$detailedReports = @(
    "test-results-comprehensive-detailed.txt",
    "test-results-all-features-detailed.txt",
    "test-results-vitest-detailed.txt",
    "test-results-playwright-detailed.txt",
    "test-results-beta-readiness-detailed.txt",
    "test-results-ALL-TESTS-detailed.txt"
)

Write-Host "Detailed Reports Available:" -ForegroundColor Cyan
foreach ($report in $detailedReports) {
    if (Test-Path $report) {
        $size = (Get-Item $report).Length
        $sizeStr = "$size bytes"
        Write-Host "  [OK] $report - $sizeStr" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "To view a detailed report, run:" -ForegroundColor Cyan
Write-Host "  Get-Content test-results-*-detailed.txt" -ForegroundColor White
Write-Host ""

if ($failed -gt 0) {
    Write-Host "Some tests failed. Please review the detailed reports above." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "All tests passed!" -ForegroundColor Green
    exit 0
}

