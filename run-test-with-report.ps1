# Run Comprehensive Tests and Generate Report
# This script ensures output is properly captured and displayed

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "  SpareCarry Comprehensive Test Suite" -ForegroundColor White
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$outputFile = "test-results-comprehensive.txt"
$detailedReportFile = "test-results-comprehensive-detailed.txt"

Write-Host "Timestamp: $timestamp" -ForegroundColor Gray
Write-Host "Output file: $outputFile" -ForegroundColor Gray
Write-Host ""

# Remove old output files if they exist
if (Test-Path $outputFile) {
    Remove-Item $outputFile -Force
    Write-Host "Removed old output file" -ForegroundColor Yellow
}

if (Test-Path $detailedReportFile) {
    Remove-Item $detailedReportFile -Force
    Write-Host "Removed old detailed report file" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Running tests..." -ForegroundColor Yellow
Write-Host ""

# Run the test command
$startTime = Get-Date

# Use Start-Process to capture output properly
$process = Start-Process -FilePath "pnpm" -ArgumentList "test:comprehensive" -NoNewWindow -Wait -PassThru -RedirectStandardOutput $outputFile -RedirectStandardError "$outputFile.errors"

# Also try direct execution for real-time output
Write-Host "--- Test Output (Real-time) ---" -ForegroundColor Cyan
Write-Host ""

# Run and show output in real-time while also saving to file
pnpm test:comprehensive *>&1 | Tee-Object -FilePath $outputFile

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "  Test Execution Summary" -ForegroundColor White
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "Duration: $([math]::Round($duration, 2)) seconds" -ForegroundColor Green
Write-Host "Output file: $outputFile" -ForegroundColor Green

if (Test-Path $detailedReportFile) {
    Write-Host "Detailed report: $detailedReportFile" -ForegroundColor Green
    $reportSize = (Get-Item $detailedReportFile).Length
    Write-Host "Report size: $reportSize bytes" -ForegroundColor Gray
}

Write-Host ""

# Show last few lines of output
if (Test-Path $outputFile) {
    $fileSize = (Get-Item $outputFile).Length
    Write-Host "Output file size: $fileSize bytes" -ForegroundColor Gray
    
    if ($fileSize -gt 0) {
        Write-Host ""
        Write-Host "--- Last 15 lines of output ---" -ForegroundColor Cyan
        Get-Content $outputFile -Tail 15 | ForEach-Object { Write-Host $_ }
    } else {
        Write-Host "⚠️  Output file is empty!" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Output file was not created!" -ForegroundColor Red
}

Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Tests completed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Tests failed or had errors (exit code: $LASTEXITCODE)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the output file for details:" -ForegroundColor Yellow
    Write-Host "  Get-Content $outputFile" -ForegroundColor Gray
}

Write-Host ""
Write-Host "To view the full report, run:" -ForegroundColor Cyan
Write-Host "  Get-Content $outputFile" -ForegroundColor White
Write-Host ""

