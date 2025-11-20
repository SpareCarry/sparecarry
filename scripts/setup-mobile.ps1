# CarrySpace Mobile App Setup Script (PowerShell)
# This script sets up Capacitor and syncs platforms

Write-Host "🚀 Setting up CarrySpace Mobile App..." -ForegroundColor Cyan

# Check if out folder exists
if (-not (Test-Path "out")) {
    Write-Host "📦 Building Next.js app..." -ForegroundColor Yellow
    npm run build
}

Write-Host "🔄 Syncing Capacitor..." -ForegroundColor Yellow
npx cap sync

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  iOS:   npx cap open ios"
Write-Host "  Android: npx cap open android"
Write-Host ""
Write-Host "For detailed instructions, see docs/MOBILE_DEPLOYMENT.md"

