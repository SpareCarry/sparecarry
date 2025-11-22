# CRON_SECRET Generation Guide

## What is CRON_SECRET?

`CRON_SECRET` is a secure random string used to authenticate cron job requests to `/api/payments/auto-release`. This prevents unauthorized access to the auto-release endpoint.

## How to Generate CRON_SECRET

### Option 1: Using OpenSSL (Recommended)
```bash
openssl rand -hex 32
```

### Option 2: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option 3: Using PowerShell (Windows)
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Minimum length**: 16 characters (32 hex characters = 16 bytes is recommended)

## Where to Add CRON_SECRET

1. **Local Development** - Add to `.env.local`:
   ```env
   CRON_SECRET=your_generated_secret_here
   ```

2. **Vercel Production** - Add to Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add `CRON_SECRET` with your generated value
   - Set for **ALL environments** (Production, Preview, Development)

## Example Generated Secret

```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

**Important**: 
- Keep this secret secure and private
- Never commit it to git (already in `.gitignore`)
- Use different secrets for different environments if needed
- Rotate it periodically for security

## Verify It Works

After adding `CRON_SECRET` to Vercel and deploying, the cron job will automatically call:
```
POST /api/payments/auto-release
Authorization: Bearer YOUR_CRON_SECRET
```

The endpoint validates this secret before processing auto-releases.

