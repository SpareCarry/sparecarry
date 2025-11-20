# Secret Scanner for SpareCarry
# Scans repository for potential secrets and API keys

Write-Host "🔍 Scanning repository for secrets..." -ForegroundColor Cyan
Write-Host ""

$secretsFound = @()
$patterns = @{
    "Stripe Secret Key" = "sk_test_[A-Za-z0-9]{32,}"
    "Stripe Live Key" = "sk_live_[A-Za-z0-9]{32,}"
    "Stripe Publishable Key" = "pk_test_[A-Za-z0-9]{32,}"
    "Stripe Live Publishable" = "pk_live_[A-Za-z0-9]{32,}"
    "Stripe Webhook Secret" = "whsec_[A-Za-z0-9]{32,}"
    "Supabase Service Role Key" = "eyJ.*service_role"
    "Supabase Anon Key" = "eyJ.*anon"
    "JWT Token" = "eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}"
    "API Key" = "api[_-]?key[=:]\s*[A-Za-z0-9_-]{20,}"
    "Password" = "password[=:]\s*[^\s]{8,}"
    "Secret" = "secret[=:]\s*[A-Za-z0-9_-]{16,}"
    "Token" = "token[=:]\s*[A-Za-z0-9_-]{20,}"
    "ngrok Auth Token" = "[A-Za-z0-9_-]{40,}"
}

$excludedDirs = @("node_modules", ".git", ".next", "out", "build", "dist", "coverage", "qa-results")
$excludedFiles = @("*.lock", "*.log", "pnpm-lock.yaml", "package-lock.json")

Get-ChildItem -Path . -Recurse -File | Where-Object {
    $excluded = $false
    foreach ($dir in $excludedDirs) {
        if ($_.FullName -like "*\$dir\*") {
            $excluded = $true
            break
        }
    }
    if (-not $excluded) {
        foreach ($pattern in $excludedFiles) {
            if ($_.Name -like $pattern) {
                $excluded = $true
                break
            }
        }
    }
    -not $excluded
} | ForEach-Object {
    $file = $_
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            foreach ($name in $patterns.Keys) {
                $pattern = $patterns[$name]
                if ($content -match $pattern) {
                    $matches = [regex]::Matches($content, $pattern)
                    foreach ($match in $matches) {
                        $secret = $match.Value
                        # Mask the secret for display
                        if ($secret.Length -gt 20) {
                            $masked = $secret.Substring(0, 8) + "..." + $secret.Substring($secret.Length - 8)
                        } else {
                            $masked = "***REDACTED***"
                        }
                        $secretsFound += [PSCustomObject]@{
                            File = $file.FullName.Replace((Get-Location).Path + "\", "")
                            Type = $name
                            Pattern = $masked
                            Line = ($content.Substring(0, $match.Index) -split "`n").Count
                        }
                    }
                }
            }
        }
    } catch {
        # Skip files that can't be read
    }
}

if ($secretsFound.Count -gt 0) {
    Write-Host "⚠️  SECRETS FOUND:" -ForegroundColor Red
    Write-Host ""
    $secretsFound | Format-Table -AutoSize
    Write-Host ""
    Write-Host "Total secrets found: $($secretsFound.Count)" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  ACTION REQUIRED:" -ForegroundColor Yellow
    Write-Host "1. Remove these secrets from the files"
    Write-Host "2. Rotate any exposed keys in your service providers"
    Write-Host "3. Clean Git history using the provided commands"
    exit 1
} else {
    Write-Host "✅ No secrets found in repository files" -ForegroundColor Green
    exit 0
}

