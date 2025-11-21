# Git Secret Cleanup Script for SpareCarry
# This script helps clean secrets from Git history

param(
    [switch]$DryRun = $false,
    [switch]$UseBFG = $false,
    [string]$BackupPath = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').bundle"
)

Write-Host "🔐 Git Secret Cleanup Script" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "❌ Error: Not a Git repository" -ForegroundColor Red
    exit 1
}

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "⚠️  Warning: You have uncommitted changes" -ForegroundColor Yellow
    Write-Host "   Consider committing or stashing them first" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Continue anyway? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        exit 1
    }
}

# Step 1: Create backup
Write-Host "📦 Step 1: Creating backup..." -ForegroundColor Cyan
if (-not $DryRun) {
    git bundle create $BackupPath --all
    Write-Host "✅ Backup created: $BackupPath" -ForegroundColor Green
} else {
    Write-Host "   [DRY RUN] Would create backup: $BackupPath" -ForegroundColor Gray
}

# Step 2: Check for git-filter-repo
Write-Host ""
Write-Host "🔍 Step 2: Checking for cleanup tools..." -ForegroundColor Cyan

$hasFilterRepo = $false
$hasBFG = $false

try {
    $null = git filter-repo --version 2>&1
    $hasFilterRepo = $true
    Write-Host "✅ git-filter-repo found" -ForegroundColor Green
} catch {
    Write-Host "❌ git-filter-repo not found" -ForegroundColor Red
}

if (Test-Path "bfg.jar") {
    $hasBFG = $true
    Write-Host "✅ BFG Repo-Cleaner found (bfg.jar)" -ForegroundColor Green
} else {
    Write-Host "❌ BFG Repo-Cleaner not found (bfg.jar)" -ForegroundColor Red
}

if (-not $hasFilterRepo -and -not $hasBFG) {
    Write-Host ""
    Write-Host "❌ Error: No cleanup tools found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install one of the following:" -ForegroundColor Yellow
    Write-Host "  1. git-filter-repo: pip install git-filter-repo" -ForegroundColor Yellow
    Write-Host "  2. BFG Repo-Cleaner: Download from https://rtyley.github.io/bfg-repo-cleaner/" -ForegroundColor Yellow
    exit 1
}

# Step 3: Create replacement file
Write-Host ""
Write-Host "📝 Step 3: Creating replacement patterns..." -ForegroundColor Cyan

$replacements = @"
__REDACTED__==>sk_test_REDACTED
pk_test_51SVMG2Gf57CmEub7fSsGPRCSQ0JqXIW78GYQxPr4C3KPxXFECs9uLjkAEhetXqWeoyQb53YDN5uwZobtRuZ1iY4K00IxU9wB7W==>pk_test_REDACTED
35ixAaJhD2Yw64bd7g33EMNQZ7f_6Zfba4weJ1Qy3PmQWeoCW==>YOUR_NGROK_AUTH_TOKEN
"@

$replacementsFile = "git-secret-replacements.txt"
$replacements | Out-File -FilePath $replacementsFile -Encoding utf8 -NoNewline
Write-Host "✅ Replacement file created: $replacementsFile" -ForegroundColor Green

# Step 4: Run cleanup
Write-Host ""
Write-Host "🧹 Step 4: Cleaning Git history..." -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "   [DRY RUN] Would run cleanup..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "To actually clean, run:" -ForegroundColor Yellow
    if ($hasFilterRepo) {
        Write-Host "   git filter-repo --path STRIPE_WEBHOOK_SETUP.md --replace-text $replacementsFile" -ForegroundColor White
    } elseif ($hasBFG) {
        Write-Host "   java -jar bfg.jar --replace-text $replacementsFile .git" -ForegroundColor White
    }
} else {
    if ($hasFilterRepo -and -not $UseBFG) {
        Write-Host "   Using git-filter-repo..." -ForegroundColor Gray
        git filter-repo --path STRIPE_WEBHOOK_SETUP.md --replace-text $replacementsFile
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Git history cleaned successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Error cleaning Git history" -ForegroundColor Red
            exit 1
        }
    } elseif ($hasBFG) {
        Write-Host "   Using BFG Repo-Cleaner..." -ForegroundColor Gray
        # BFG requires a bare repository
        Write-Host "⚠️  BFG requires a bare repository clone" -ForegroundColor Yellow
        Write-Host "   See GIT_SECRET_CLEANUP_GUIDE.md for BFG instructions" -ForegroundColor Yellow
    }
}

# Step 5: Verify
Write-Host ""
Write-Host "✅ Step 5: Verifying cleanup..." -ForegroundColor Cyan

if (-not $DryRun) {
    $secretsInHistory = git log --all --full-history -p | Select-String -Pattern "__REDACTED__"
    
    if ($secretsInHistory) {
        Write-Host "⚠️  Warning: Secrets may still exist in history" -ForegroundColor Yellow
        Write-Host "   Review the output above" -ForegroundColor Yellow
    } else {
        Write-Host "✅ No secrets found in Git history" -ForegroundColor Green
    }
}

# Cleanup
Remove-Item $replacementsFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Review the changes: git log --all --full-history -- STRIPE_WEBHOOK_SETUP.md" -ForegroundColor White
Write-Host "   2. Verify no secrets: git log -p --all | Select-String -Pattern 'sk_test_|pk_test_'" -ForegroundColor White
Write-Host "   3. Force push (if ready): git push origin --force --all" -ForegroundColor White
Write-Host "   4. Rotate exposed keys in Stripe/ngrok dashboards" -ForegroundColor White
Write-Host ""
Write-Host "📚 See GIT_SECRET_CLEANUP_GUIDE.md for detailed instructions" -ForegroundColor Cyan


