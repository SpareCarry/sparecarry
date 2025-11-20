# Clean Dependencies Script for SpareCarry
# Removes all node_modules, lock files, and caches

Write-Host "🧹 Cleaning SpareCarry Dependencies..." -ForegroundColor Cyan
Write-Host ""

# Stop any running processes
Write-Host "Stopping Node processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*next*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Remove node_modules
if (Test-Path "node_modules") {
    Write-Host "Removing node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules
    Write-Host "✅ node_modules removed" -ForegroundColor Green
} else {
    Write-Host "⚠️  node_modules not found" -ForegroundColor Yellow
}

# Remove lock files
$lockFiles = @("pnpm-lock.yaml", "package-lock.json", "yarn.lock")
foreach ($file in $lockFiles) {
    if (Test-Path $file) {
        Write-Host "Removing $file..." -ForegroundColor Yellow
        Remove-Item -Force $file
        Write-Host "✅ $file removed" -ForegroundColor Green
    }
}

# Remove .next cache
if (Test-Path ".next") {
    Write-Host "Removing .next cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .next
    Write-Host "✅ .next cache removed" -ForegroundColor Green
}

# Remove other caches
$cacheDirs = @("node_modules/.cache", ".turbo", ".vercel")
foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Write-Host "Removing $dir..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
        Write-Host "✅ $dir removed" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: npx pnpm install" -ForegroundColor White
Write-Host "  2. Run: npx pnpm dev" -ForegroundColor White

