# Setup Complete - Final Steps

## ✅ What I've Done

1. ✅ **Removed Sentry Token from Files** - Removed from all current files
2. ✅ **Updated vercel-env-variables.env** - Added phone auth disabled and CRON_SECRET placeholder
3. ✅ **Created Setup Guides** - Added comprehensive guides for env vars and CRON_SECRET
4. ✅ **Disabled Phone Auth** - Set to `false` for free Supabase tier

## 📋 What You Need to Do Now

### 1. Generate CRON_SECRET and Add to .env.local

Run this command to generate a secure CRON_SECRET:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy the output** (it will be a 64-character hex string like: `a1b2c3d4e5f6...`)

Then add to your `.env.local` file:

```env
# Phone Auth Disabled (Free Supabase Tier)
NEXT_PUBLIC_ENABLE_PHONE_AUTH=false
NEXT_PUBLIC_ENABLE_STRIPE_IDENTITY=true
NEXT_PUBLIC_SUPPORT_EMAIL=support@sparecarry.com

# Cron Job Secret (paste your generated value here)
CRON_SECRET=paste_your_64_char_hex_string_here
```

### 2. Add to Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables and add:

```bash
NEXT_PUBLIC_ENABLE_PHONE_AUTH=false
NEXT_PUBLIC_ENABLE_STRIPE_IDENTITY=true
NEXT_PUBLIC_SUPPORT_EMAIL=support@sparecarry.com
CRON_SECRET=your_generated_64_char_hex_string_here
```

**Important**:

- Set for **ALL environments** (Production, Preview, Development)
- Use the same CRON_SECRET value you generated above
- Redeploy after adding variables

### 3. Handle Sentry Token Exposure (GitGuardian)

The Sentry token was exposed in an old commit in git history. I've removed it from all current files, but it still exists in history.

**You have two options:**

#### Option A: Rotate the Token (Recommended)

1. Go to Sentry Dashboard → Settings → Auth Tokens
2. Delete the old exposed token
3. Create a new token
4. Update it in `.env.local` and Vercel
5. The old token will stop working, so no security risk

#### Option B: Allow Once via GitHub

- Use this URL to allow the secret once:
  https://github.com/SpareCarry/sparecarry/security/secret-scanning/unblock-secret/35oJjvqS0QoAJNb5BleX3uh8Rvm
- **But this is less secure** - the token is still in git history

**Recommendation**: Rotate the token (Option A) since it's already exposed.

### 4. Verify Setup

After adding variables to Vercel and redeploying:

1. ✅ Cron job will run hourly (`vercel.json` configured)
2. ✅ Phone auth disabled (won't prompt users)
3. ✅ Stripe Identity can be enabled when needed
4. ✅ Support email links will work

## 🎯 Quick Checklist

- [ ] Generate CRON_SECRET using the command above
- [ ] Add CRON_SECRET and other vars to `.env.local`
- [ ] Add all vars to Vercel Dashboard
- [ ] Rotate Sentry token (recommended) or allow via GitHub URL
- [ ] Redeploy Vercel project
- [ ] Verify cron job runs (check Vercel logs)

## 📝 Files Created

- `CRON_SECRET_GENERATOR.md` - How to generate CRON_SECRET
- `ENV_VARS_SETUP.md` - Complete environment variables guide
- `QUICK_ENV_SETUP.md` - Quick reference guide
- `vercel-env-variables.env` - Template with all variables (already in .gitignore)

## 🔒 Security Notes

- ✅ `.env.local` is in `.gitignore` (won't be committed)
- ✅ `vercel-env-variables.env` is in `.gitignore` (won't be committed)
- ⚠️ Generate a unique CRON_SECRET for production
- ⚠️ Rotate Sentry token since it was exposed in git history

## ✅ All Code Changes Complete!

Everything is ready. Just complete the steps above and you're good to go! 🚀
