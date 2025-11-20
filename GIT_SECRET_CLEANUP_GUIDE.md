# Git Secret Cleanup Guide for SpareCarry

## ⚠️ CRITICAL: Secrets Found in Repository

The following secrets were found in the repository and need to be removed from Git history:

1. **Stripe Test Secret Key** (`sk_test_...`) in `STRIPE_WEBHOOK_SETUP.md`
2. **Stripe Test Publishable Key** (`pk_test_...`) in `STRIPE_WEBHOOK_SETUP.md`
3. **ngrok Auth Token** in `STRIPE_WEBHOOK_SETUP.md`

## 🔐 Step 1: Rotate Exposed Keys (DO THIS FIRST!)

**Before cleaning Git history, you MUST rotate these keys:**

### Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. **Revoke** the exposed test secret key: `sk_test_51SVMG2Gf57CmEub7dYxGCVXuJWqkRRurenoAYDFEP0dzvwmaY8yKJOX7ROle6jRBwAMhfu0Yg7lXwRyOjdHtZFkQ008Fjplm1u`
3. **Create new test keys**
4. Update your `.env.local` and `.env.staging` with new keys

### ngrok Auth Token
1. Go to [ngrok Dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)
2. **Revoke** the exposed token: `35ixAaJhD2Yw64bd7g33EMNQZ7f_6Zfba4weJ1Qy3PmQWeoCW`
3. **Generate a new auth token**
4. Update your local ngrok config

## 🧹 Step 2: Clean Current Files

The secrets have been removed from `STRIPE_WEBHOOK_SETUP.md` in the current working directory. Verify:

```powershell
# Check that secrets are removed
.\scripts\scan-secrets.ps1
```

## 📜 Step 3: Clean Git History

### Option A: Using git-filter-repo (Recommended)

**Install git-filter-repo:**
```powershell
# Install via pip (requires Python)
pip install git-filter-repo

# Or download from: https://github.com/newren/git-filter-repo
```

**Backup your repository first:**
```powershell
# Create a backup branch
git branch backup-before-cleanup

# Create a full backup
git bundle create backup.bundle --all
```

**Remove secrets from history:**
```powershell
# Remove Stripe secret key from all commits
git filter-repo --path STRIPE_WEBHOOK_SETUP.md --invert-paths
git filter-repo --path STRIPE_WEBHOOK_SETUP.md --replace-text <(echo "sk_test_51SVMG2Gf57CmEub7dYxGCVXuJWqkRRurenoAYDFEP0dzvwmaY8yKJOX7ROle6jRBwAMhfu0Yg7lXwRyOjdHtZFkQ008Fjplm1u==>sk_test_REDACTED")

# Remove Stripe publishable key
git filter-repo --path STRIPE_WEBHOOK_SETUP.md --replace-text <(echo "pk_test_51SVMG2Gf57CmEub7fSsGPRCSQ0JqXIW78GYQxPr4C3KPxXFECs9uLjkAEhetXqWeoyQb53YDN5uwZobtRuZ1iY4K00IxU9wB7W==>pk_test_REDACTED")

# Remove ngrok token
git filter-repo --path STRIPE_WEBHOOK_SETUP.md --replace-text <(echo "35ixAaJhD2Yw64bd7g33EMNQZ7f_6Zfba4weJ1Qy3PmQWeoCW==>YOUR_NGROK_AUTH_TOKEN")
```

**Windows PowerShell alternative (using file):**
```powershell
# Create replacement file
@"
sk_test_51SVMG2Gf57CmEub7dYxGCVXuJWqkRRurenoAYDFEP0dzvwmaY8yKJOX7ROle6jRBwAMhfu0Yg7lXwRyOjdHtZFkQ008Fjplm1u==>sk_test_REDACTED
pk_test_51SVMG2Gf57CmEub7fSsGPRCSQ0JqXIW78GYQxPr4C3KPxXFECs9uLjkAEhetXqWeoyQb53YDN5uwZobtRuZ1iY4K00IxU9wB7W==>pk_test_REDACTED
35ixAaJhD2Yw64bd7g33EMNQZ7f_6Zfba4weJ1Qy3PmQWeoCW==>YOUR_NGROK_AUTH_TOKEN
"@ | Out-File -FilePath replacements.txt -Encoding utf8

# Run filter-repo
git filter-repo --path STRIPE_WEBHOOK_SETUP.md --replace-text replacements.txt
```

### Option B: Using BFG Repo-Cleaner (Easier for Windows)

**Download BFG:**
```powershell
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
# Save as: bfg.jar
```

**Clean secrets:**
```powershell
# Clone a fresh copy (BFG needs a bare repo)
git clone --mirror https://github.com/SpareCarry/sparecarry-dev-fixed.git sparecarry-clean.git

# Create passwords file
@"
sk_test_51SVMG2Gf57CmEub7dYxGCVXuJWqkRRurenoAYDFEP0dzvwmaY8yKJOX7ROle6jRBwAMhfu0Yg7lXwRyOjdHtZFkQ008Fjplm1u
pk_test_51SVMG2Gf57CmEub7fSsGPRCSQ0JqXIW78GYQxPr4C3KPxXFECs9uLjkAEhetXqWeoyQb53YDN5uwZobtRuZ1iY4K00IxU9wB7W
35ixAaJhD2Yw64bd7g33EMNQZ7f_6Zfba4weJ1Qy3PmQWeoCW
"@ | Out-File -FilePath passwords.txt -Encoding utf8

# Run BFG
java -jar bfg.jar --replace-text passwords.txt sparecarry-clean.git

# Clean up
cd sparecarry-clean.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Option C: Manual Git Filter-Branch (If above tools unavailable)

**⚠️ WARNING: This is slower and more complex. Use only if necessary.**

```powershell
# Create a script to replace secrets
git filter-branch --force --index-filter `
  "git rm --cached --ignore-unmatch STRIPE_WEBHOOK_SETUP.md" `
  --prune-empty --tag-name-filter cat -- --all

# Then manually edit the file in each commit (complex - not recommended)
```

## 🚀 Step 4: Force Push to GitHub

**⚠️ CRITICAL: Coordinate with your team before force pushing!**

```powershell
# Verify the cleanup worked
git log --all --full-history -- STRIPE_WEBHOOK_SETUP.md

# Check that secrets are gone
git log -p --all | Select-String -Pattern "sk_test_51SVMG2Gf57CmEub7dYxGCVXuJWqkRRurenoAYDFEP0dzvwmaY8yKJOX7ROle6jRBwAMhfu0Yg7lXwRyOjdHtZFkQ008Fjplm1u"
# Should return nothing

# Force push (if branch protection allows, or temporarily disable it)
git push origin --force --all
git push origin --force --tags
```

**If branch protection is enabled:**
1. Go to GitHub → Settings → Branches
2. Temporarily disable branch protection for `main`
3. Force push
4. Re-enable branch protection

## ✅ Step 5: Verify Cleanup

```powershell
# Run secret scanner
.\scripts\scan-secrets.ps1

# Check Git history
git log --all --full-history -p | Select-String -Pattern "sk_test_|pk_test_|whsec_"

# Verify no secrets in current files
Get-Content STRIPE_WEBHOOK_SETUP.md | Select-String -Pattern "sk_test_|pk_test_"
```

## 🔒 Step 6: Prevent Future Secret Commits

### Update .gitignore
Already configured! ✅
- `.env*.local`
- `.env`
- `.env.production`
- `.env.staging`

### Install Git Hooks

**Create pre-commit hook:**
```powershell
# Create .git/hooks/pre-commit
@"
#!/bin/sh
# Run secret scanner before commit
powershell -ExecutionPolicy Bypass -File .\scripts\scan-secrets.ps1
if [ `$? -ne 0 ]; then
    echo "❌ Secrets detected! Commit blocked."
    exit 1
fi
"@ | Out-File -FilePath .git\hooks\pre-commit -Encoding utf8

# Make executable (if using Git Bash)
chmod +x .git/hooks/pre-commit
```

### Use Git Secrets (Advanced)

```powershell
# Install git-secrets
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
.\install.ps1

# Configure patterns
git secrets --register-aws
git secrets --add 'sk_test_[A-Za-z0-9]{32,}'
git secrets --add 'pk_test_[A-Za-z0-9]{32,}'
git secrets --add 'whsec_[A-Za-z0-9]{32,}'
```

## 📋 Checklist

- [ ] Rotate Stripe test keys in Stripe Dashboard
- [ ] Rotate ngrok auth token
- [ ] Update `.env.local` with new keys
- [ ] Update `.env.staging` with new keys
- [ ] Remove secrets from current files (✅ Done)
- [ ] Backup repository (`git bundle create backup.bundle --all`)
- [ ] Clean Git history using git-filter-repo or BFG
- [ ] Verify secrets are removed from history
- [ ] Force push to GitHub (coordinate with team)
- [ ] Verify cleanup with secret scanner
- [ ] Install pre-commit hooks
- [ ] Document new keys securely (use password manager)

## 🆘 Emergency: If Secrets Were Exposed Publicly

1. **Immediately rotate ALL exposed keys**
2. **Check GitHub Security Alerts** (if repository is public)
3. **Review access logs** in Stripe/ngrok dashboards
4. **Consider making repository private** temporarily
5. **Monitor for unauthorized usage**

## 📚 Best Practices Going Forward

1. **Never commit secrets** - Always use `.env` files
2. **Use `.env.local.example`** - Template with placeholders
3. **Scan before commit** - Run `.\scripts\scan-secrets.ps1`
4. **Use environment variables** - Never hardcode
5. **Rotate keys regularly** - Especially after exposure
6. **Use secret management** - Consider Vercel Environment Variables, GitHub Secrets, or AWS Secrets Manager

## 🔗 Resources

- [Git Filter Repo](https://github.com/newren/git-filter-repo)
- [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Stripe: Rotating API Keys](https://stripe.com/docs/keys)

---

**Last Updated**: 2024-12-19
**Status**: Secrets removed from current files ✅ | Git history cleanup required ⚠️

