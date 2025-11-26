# PowerShell script to run comprehensive tests and generate detailed report
# Usage: .\scripts\run-comprehensive-test.ps1

Write-Host "Starting Comprehensive Test Suite..." -ForegroundColor Cyan
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Set output file
$outputFile = "test-results-comprehensive.txt"
$detailedReportFile = "test-results-comprehensive-detailed.txt"

# Run the test and capture all output
Write-Host "Running: pnpm test:comprehensive" -ForegroundColor Yellow
Write-Host ""

# Run command and capture output
$startTime = Get-Date
try {
    # Run the command and capture both stdout and stderr
    $result = pnpm test:comprehensive 2>&1 | Tee-Object -FilePath $outputFile
    
    # Also display to console in real-time
    $result | ForEach-Object { Write-Host $_ }
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host "Test completed in $([math]::Round($duration, 2)) seconds" -ForegroundColor Green
    Write-Host "Output saved to: $outputFile" -ForegroundColor Green
    
    if (Test-Path $detailedReportFile) {
        Write-Host "Detailed report saved to: $detailedReportFile" -ForegroundColor Green
    }
    
    Write-Host "=" * 60 -ForegroundColor Cyan
    
    # Check exit code
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tests completed successfully" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ Some tests failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to run tests" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}

