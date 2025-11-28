# Clear Metro bundler cache for pnpm workspace (PowerShell)

Write-Host "🧹 Clearing Metro bundler cache..." -ForegroundColor Cyan

# Clear Metro cache
if (Test-Path ".expo") { Remove-Item -Recurse -Force ".expo" }
if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force "node_modules\.cache" }
if (Test-Path "..\..\node_modules\.cache") { Remove-Item -Recurse -Force "..\..\node_modules\.cache" }

Write-Host "✅ Cache cleared!" -ForegroundColor Green
Write-Host "Now run: pnpm start" -ForegroundColor Yellow

