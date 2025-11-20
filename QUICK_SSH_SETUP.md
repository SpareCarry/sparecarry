# Quick SSH Setup for GitHub

## Problem
Your Personal Access Token doesn't have `workflow` scope. SSH bypasses this limitation.

## Quick Setup (3 Steps)

### Step 1: Check if you have SSH key

```powershell
ls ~/.ssh
```

If you see `id_ed25519.pub` or `id_rsa.pub`, skip to Step 2.

### Step 2: Generate SSH Key (if needed)

```powershell
ssh-keygen -t ed25519 -C "your_email@example.com"
```

- Press Enter to accept default location
- Press Enter twice for no passphrase (or set one if you prefer)

### Step 3: Add SSH Key to GitHub

```powershell
# Copy your public key
cat ~/.ssh/id_ed25519.pub
# Or on Windows:
Get-Content ~/.ssh/id_ed25519.pub
```

1. Copy the entire output (starts with `ssh-ed25519` or `ssh-rsa`)
2. Go to: https://github.com/settings/keys
3. Click **"New SSH key"**
4. Paste the key
5. Click **"Add SSH key"**

### Step 4: Change Git Remote to SSH

```powershell
git remote set-url origin git@github.com:SpareCarry/sparecarry.git
```

### Step 5: Test Connection

```powershell
ssh -T git@github.com
```

You should see: `Hi SpareCarry! You've successfully authenticated...`

### Step 6: Push

```powershell
git push origin --force main
```

## That's It!

SSH doesn't require managing PAT scopes. Once set up, you can push workflow files without issues.

---

**Alternative**: If you prefer to keep using HTTPS, update your PAT at https://github.com/settings/tokens and add the `workflow` scope.

