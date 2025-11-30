# Quick Environment Variables Setup

## What You Need to Do

### 1. Generate CRON_SECRET

Run this command to generate a secure CRON_SECRET:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (it will be a 64-character hex string).

### 2. Add to .env.local

Add these lines to your `.env.local` file:

```env
# Phone Auth Disabled (Free Supabase)
NEXT_PUBLIC_ENABLE_PHONE_AUTH=false
NEXT_PUBLIC_ENABLE_STRIPE_IDENTITY=true
NEXT_PUBLIC_SUPPORT_EMAIL=support@sparecarry.com

# Cron Job Secret (paste your generated value here)
CRON_SECRET=paste_your_generated_64_char_hex_string_here
```

### 3. Add to Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables (or import `vercel-env-variables.env`):
   - `NEXT_PUBLIC_ENABLE_PHONE_AUTH=false`
   - `NEXT_PUBLIC_ENABLE_STRIPE_IDENTITY=true`
   - `NEXT_PUBLIC_SUPPORT_EMAIL=support@sparecarry.com`
   - `CRON_SECRET=your_generated_value_here` (paste the hex string you generated)
3. Set for **ALL environments** (Production, Preview, Development)
4. Click "Save"

## Notes

- **Phone Auth**: Disabled because you're on free Supabase tier. You can enable it later when you upgrade.
- **CRON_SECRET**: This is used to authenticate the hourly cron job that runs `/api/payments/auto-release`
- **Already in .gitignore**: `.env.local` and `vercel-env-variables.env` are already ignored

## That's It!

After adding these variables, redeploy your Vercel project and everything will work.
