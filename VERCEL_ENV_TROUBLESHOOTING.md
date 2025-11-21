# Vercel Environment Variables Troubleshooting

## Issue: Variables Not Detected During Build

If you're getting errors that environment variables are missing even after importing, try these steps:

### Step 1: Verify Variables Are Set

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Check that all required variables are listed:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_APP_ENV`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `NOTIFICATIONS_EMAIL_FROM`

### Step 2: Check Environment Scope

Make sure variables are set for **ALL environments**:
- ✅ Production
- ✅ Preview
- ✅ Development

**Important**: Vercel builds can run in Preview mode, so variables must be set for Preview too!

### Step 3: Manual Verification

If import didn't work, add variables manually:

1. Click "Add New" for each variable
2. Enter Key and Value
3. **Select all three environments** (Production, Preview, Development)
4. Click "Save"

### Step 4: Redeploy

After adding/updating variables:
1. Go to Deployments tab
2. Click "..." on the latest deployment
3. Click "Redeploy"
4. Or push a new commit to trigger a new build

### Step 5: Verify Values

Double-check the values match exactly what's in `vercel-env-variables.env`:
- No extra spaces
- No line breaks
- Complete values (not truncated)

### Common Issues

**Issue**: Variables show in Vercel but build still fails
- **Solution**: Make sure variables are set for **Preview** environment, not just Production

**Issue**: Import says "successful" but variables don't appear
- **Solution**: Refresh the page and check again, or add manually

**Issue**: Some variables work but others don't
- **Solution**: Check for typos in variable names (case-sensitive!)

### Quick Fix: Set All Required Variables Manually

Copy and paste these into Vercel (make sure to select ALL environments):

```
NEXT_PUBLIC_APP_URL=https://sparecarry.com
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://gujyzwqcwecbeznlablx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1anl6d3Fjd2VjYmV6bmxhYmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTM4NjMsImV4cCI6MjA3OTE2OTg2M30.xPAZEskBBp3S8fmpB3kbddNhp755BU1cfKS4WAG1jyg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1anl6d3Fjd2VjYmV6bmxhYmx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU5Mzg2MywiZXhwIjoyMDc5MTY5ODYzfQ.8KYtGs6VUzBi1iTxlRkl55M2A5pDMMj7rzYMmVVWEbw
RESEND_API_KEY=3dnauYJh_NoHEaVRYikMs4D4i96q4i9MD
NOTIFICATIONS_EMAIL_FROM=SpareCarry <notifications@sparecarry.com>
EXPO_ACCESS_TOKEN=WPGnB7vBBa8jcne3iCw_9RBGOUlKjv5Dq-CU_-ru
```

