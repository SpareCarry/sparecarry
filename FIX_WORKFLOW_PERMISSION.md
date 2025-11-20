# Fix GitHub Workflow Permission Error

## Problem

Your Personal Access Token (PAT) doesn't have the `workflow` scope, which is required to modify files in `.github/workflows/`.

## Solution Options

### Option 1: Update Your PAT (Recommended)

1. Go to: https://github.com/settings/tokens
2. Find your current token (or create a new one)
3. Edit the token and check the **`workflow`** scope
4. Save the token
5. Update Git credentials:
   ```powershell
   # Windows Credential Manager
   # Or re-authenticate when Git prompts
   git push origin --force main
   ```

### Option 2: Use SSH Instead of HTTPS (Easiest)

SSH doesn't have this limitation:

```powershell
# Check if you have SSH keys
ls ~/.ssh

# If not, generate one
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: https://github.com/settings/keys
# Click "New SSH key", paste the key

# Change remote to SSH
git remote set-url origin git@github.com:SpareCarry/sparecarry.git

# Push
git push origin --force main
```

### Option 3: Temporarily Remove Workflow Files (Quick Fix)

If you need to push immediately:

```powershell
# Remove workflow files from this commit
git reset HEAD~1
git add -A
git reset .github/workflows/
git commit -m "Fix React version conflicts for Vercel build"

# Push (without workflow files)
git push origin --force main

# Then add workflow files in a separate commit with updated PAT
git add .github/workflows/
git commit -m "Add GitHub Actions workflows"
git push origin main
```

### Option 4: Use GitHub CLI

```powershell
# Install GitHub CLI if not installed
# winget install GitHub.cli

# Authenticate (this will use proper scopes)
gh auth login

# Push via CLI
gh repo sync
```

## Recommended: Use SSH (Option 2)

SSH is the easiest and doesn't require managing PAT scopes. Once set up, you won't have this issue again.

---

**Current Status**: Commit is ready, just needs proper authentication method.

