# Secret Removed - Ready to Push

## ✅ What Was Fixed

1. **Commit amended**: `4971c93` → `81fe8a8`
2. **Secrets removed** from `STRIPE_WEBHOOK_SETUP.md` in the commit
3. **File now contains**: Redacted placeholders (`sk_test_xxxxxxxx...`)

## 🚀 Push Command

```powershell
git push origin --force main
```

**Note**: Using `--force` is safe here because:
- You're replacing a commit that contained secrets
- The new commit has the same changes but without secrets
- You have a backup (`backup-*.bundle`)

## ⚠️ Important Notes

### If Push Still Fails

If GitHub still blocks the push, it may be detecting secrets in **older commits** in the history. In that case:

1. **Option 1: Use GitHub's Allow Secret URL** (Quick but not recommended)
   - Visit: https://github.com/SpareCarry/sparecarry/security/secret-scanning/unblock-secret/35jC3cYxpod08wMXLSJvAJLKil4
   - This allows the secret temporarily, but **you should still clean history**

2. **Option 2: Clean Full History** (Recommended)
   - Download git-filter-repo standalone: https://github.com/newren/git-filter-repo/releases
   - Or use BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/
   - Follow `GIT_SECRET_CLEANUP_GUIDE.md`

### After Successful Push

1. **Rotate the exposed keys** (if not done already):
   - Stripe Dashboard: Revoke old keys
   - ngrok Dashboard: Revoke old token

2. **Verify on GitHub**:
   - Check that `STRIPE_WEBHOOK_SETUP.md` shows redacted values
   - Search repository for the secret key (should find nothing)

3. **Install pre-commit hook** to prevent future issues:
   ```powershell
   .\scripts\scan-secrets.ps1
   ```

## 📋 Quick Command Sequence

```powershell
# Verify commit is clean
git show HEAD:STRIPE_WEBHOOK_SETUP.md | Select-String -Pattern "__REDACTED__"
# Should return nothing

# Push
git push origin --force main

# If successful, verify on GitHub
# If failed, see troubleshooting above
```

---

**Status**: ✅ Commit amended, ready to push


