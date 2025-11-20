# Quick Fix: Amend Commit to Remove Secrets
# Use this if the secret is in the most recent commit (HEAD)

Write-Host "🔧 Amending commit to remove secrets..." -ForegroundColor Cyan
Write-Host ""

# Check if STRIPE_WEBHOOK_SETUP.md has uncommitted changes
$status = git status --porcelain STRIPE_WEBHOOK_SETUP.md
if ($status -match "^ M") {
    Write-Host "✅ Found fixed version of STRIPE_WEBHOOK_SETUP.md" -ForegroundColor Green
    Write-Host "   Staging file..." -ForegroundColor Gray
    
    git add STRIPE_WEBHOOK_SETUP.md
    
    Write-Host "   Amending commit..." -ForegroundColor Gray
    git commit --amend --no-edit
    
    Write-Host ""
    Write-Host "✅ Commit amended successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next step: Force push to GitHub" -ForegroundColor Yellow
    Write-Host "   git push origin --force main" -ForegroundColor White
} else {
    Write-Host "⚠️  No changes detected in STRIPE_WEBHOOK_SETUP.md" -ForegroundColor Yellow
    Write-Host "   The file may already be fixed, or needs to be fixed first." -ForegroundColor Yellow
}

