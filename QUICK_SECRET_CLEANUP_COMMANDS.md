# Quick Secret Cleanup - PowerShell Commands

## ⚠️ CRITICAL: Rotate Keys First!

**Before cleaning Git history, you MUST rotate these keys:**

1. **Stripe Dashboard**: https://dashboard.stripe.com/test/apikeys
   - Revoke: `__REDACTED__`
   - Create new test keys
   - Update `.env.local` and `.env.staging`

2. **ngrok Dashboard**: https://dashboard.ngrok.com/get-started/your-authtoken
   - Revoke: `35ixAaJhD2Yw64bd7g33EMNQZ7f_6Zfba4weJ1Qy3PmQWeoCW`
   - Generate new token
   - Update local config: `ngrok config add-authtoken YOUR_NEW_TOKEN`

---

## Step 1: Verify Secrets Removed from Current Files

```powershell
# Run secret scanner
.\scripts\scan-secrets.ps1
```

**Expected**: Should show no secrets (or only false positives in node_modules)

---

## Step 2: Create Backup

```powershell
# Navigate to repository
cd C:\SpareCarry

# Create full backup
git bundle create backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').bundle --all

# Also create a backup branch
git branch backup-before-cleanup-$(Get-Date -Format 'yyyyMMdd-HHmmss')
```

---

## Step 3: Install git-filter-repo (Recommended)

### Option A: Using pip (if Python installed)

```powershell
# Install Python package
pip install git-filter-repo

# Verify installation
git filter-repo --version
```

### Option B: Download Standalone

```powershell
# Download from: https://github.com/newren/git-filter-repo/releases
# Extract to a folder in PATH, or use full path
```

---

## Step 4: Clean Git History

### Using git-filter-repo (Recommended)

```powershell
# Create replacement file
@"
__REDACTED__==>sk_test_REDACTED
pk_test_51SVMG2Gf57CmEub7fSsGPRCSQ0JqXIW78GYQxPr4C3KPxXFECs9uLjkAEhetXqWeoyQb53YDN5uwZobtRuZ1iY4K00IxU9wB7W==>pk_test_REDACTED
35ixAaJhD2Yw64bd7g33EMNQZ7f_6Zfba4weJ1Qy3PmQWeoCW==>YOUR_NGROK_AUTH_TOKEN
"@ | Out-File -FilePath replacements.txt -Encoding utf8

# Run filter-repo (this rewrites history!)
git filter-repo --path STRIPE_WEBHOOK_SETUP.md --replace-text replacements.txt

# Clean up
Remove-Item replacements.txt
```

### Alternative: Using Automated Script

```powershell
# Dry run first (recommended)
.\scripts\clean-git-secrets.ps1 -DryRun

# Actual cleanup
.\scripts\clean-git-secrets.ps1
```

---

## Step 5: Verify Secrets Removed

```powershell
# Check Git history for secrets (should return nothing)
git log --all --full-history -p | Select-String -Pattern "__REDACTED__"

# Check for publishable key (should return nothing)
git log --all --full-history -p | Select-String -Pattern "pk_test_51SVMG2Gf57CmEub7fSsGPRCSQ0JqXIW78GYQxPr4C3KPxXFECs9uLjkAEhetXqWeoyQb53YDN5uwZobtRuZ1iY4K00IxU9wB7W"

# Check for ngrok token (should return nothing)
git log --all --full-history -p | Select-String -Pattern "35ixAaJhD2Yw64bd7g33EMNQZ7f_6Zfba4weJ1Qy3PmQWeoCW"

# Run secret scanner again
.\scripts\scan-secrets.ps1
```

---

## Step 6: Force Push to GitHub

### ⚠️ WARNING: Coordinate with Team First!

```powershell
# Verify current branch
git branch --show-current

# Check remote
git remote -v

# Force push all branches
git push origin --force --all

# Force push tags
git push origin --force --tags
```

### If Branch Protection Blocks Force Push:

1. Go to GitHub → Repository → Settings → Branches
2. Temporarily disable branch protection for `main`
3. Force push
4. Re-enable branch protection

---

## Step 7: Verify on GitHub

1. Go to your repository on GitHub
2. Search for the secret keys (should find nothing)
3. Check commit history - old commits should show redacted values

---

## Complete Command Sequence (Copy-Paste Ready)

```powershell
# Step 1: Navigate to repo
cd C:\SpareCarry

# Step 2: Verify secrets removed from files
.\scripts\scan-secrets.ps1

# Step 3: Create backup
git bundle create backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').bundle --all
git branch backup-before-cleanup-$(Get-Date -Format 'yyyyMMdd-HHmmss')

# Step 4: Install git-filter-repo (if not installed)
# pip install git-filter-repo

# Step 5: Create replacement file
@"
__REDACTED__==>sk_test_REDACTED
pk_test_51SVMG2Gf57CmEub7fSsGPRCSQ0JqXIW78GYQxPr4C3KPxXFECs9uLjkAEhetXqWeoyQb53YDN5uwZobtRuZ1iY4K00IxU9wB7W==>pk_test_REDACTED
35ixAaJhD2Yw64bd7g33EMNQZ7f_6Zfba4weJ1Qy3PmQWeoCW==>YOUR_NGROK_AUTH_TOKEN
"@ | Out-File -FilePath replacements.txt -Encoding utf8

# Step 6: Clean history (THIS REWRITES HISTORY!)
git filter-repo --path STRIPE_WEBHOOK_SETUP.md --replace-text replacements.txt

# Step 7: Verify
git log --all --full-history -p | Select-String -Pattern "__REDACTED__"
.\scripts\scan-secrets.ps1

# Step 8: Force push (COORDINATE WITH TEAM FIRST!)
# git push origin --force --all
# git push origin --force --tags

# Cleanup
Remove-Item replacements.txt -ErrorAction SilentlyContinue
```

---

## Troubleshooting

### "git-filter-repo: command not found"

```powershell
# Install via pip
pip install git-filter-repo

# Or add to PATH if downloaded standalone
$env:Path += ";C:\path\to\git-filter-repo"
```

### "Permission denied" on force push

- Temporarily disable branch protection in GitHub
- Or use GitHub's web interface to merge a cleanup PR

### "Repository is not clean"

```powershell
# Commit or stash changes
git add .
git commit -m "Remove secrets from files"

# Or stash
git stash
```

---

## After Cleanup: Prevent Future Issues

### Install Pre-commit Hook

```powershell
# Create pre-commit hook
@"
#!/bin/sh
powershell -ExecutionPolicy Bypass -File .\scripts\scan-secrets.ps1
if [ `$? -ne 0 ]; then
    echo "❌ Secrets detected! Commit blocked."
    exit 1
fi
"@ | Out-File -FilePath .git\hooks\pre-commit -Encoding utf8
```

### Verify .gitignore

```powershell
# Check .gitignore includes env files
Get-Content .gitignore | Select-String -Pattern "\.env"
```

Should show:
- `.env*.local`
- `.env`
- `.env.production`
- `.env.staging`

---

## Summary Checklist

- [ ] Rotate Stripe keys in Stripe Dashboard
- [ ] Rotate ngrok auth token
- [ ] Update `.env.local` with new keys
- [ ] Update `.env.staging` with new keys
- [ ] Run `.\scripts\scan-secrets.ps1` (verify no secrets in files)
- [ ] Create backup (`git bundle create backup.bundle --all`)
- [ ] Install git-filter-repo
- [ ] Clean Git history
- [ ] Verify secrets removed from history
- [ ] Coordinate with team
- [ ] Force push to GitHub
- [ ] Verify on GitHub
- [ ] Install pre-commit hook
- [ ] Document new keys securely

---

**See `GIT_SECRET_CLEANUP_GUIDE.md` for detailed explanations.**


