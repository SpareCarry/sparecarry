# Debugging 500 Error

## Progress Made

✅ **404 Error Fixed** - Metro is now resolving `expo-router/entry` correctly
❌ **500 Error** - Runtime error during app initialization

## What to Check

### 1. **Check Metro Terminal Output**

Look for error messages with these prefixes:

- `[MODULE] ❌` - Module import failures
- `❌❌❌ CRITICAL` - Critical initialization errors
- `❌ Failed to initialize` - Supabase/client errors

### 2. **Common Causes of 500 Errors**

#### A. Missing Environment Variables

**Symptoms:**

- `EXPO_PUBLIC_SUPABASE_URL: MISSING`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY: MISSING`

**Fix:**

```bash
# Create apps/mobile/.env.local
cd apps/mobile
echo "EXPO_PUBLIC_SUPABASE_URL=your_url" > .env.local
echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key" >> .env.local
```

#### B. Module Import Errors

**Symptoms:**

- `[MODULE] ❌ Failed to import createClient`
- `[MODULE] ❌ Failed to import RealtimeManager`
- `[MODULE] ❌ Failed to import useAuth`

**Fix:**

- Check if packages are installed: `pnpm install`
- Check Metro terminal for specific import errors

#### C. Supabase Client Initialization

**Symptoms:**

- `❌❌❌ CRITICAL: Failed to initialize Supabase client`
- `createClient returned null`

**Fix:**

- Verify environment variables are set
- Check Supabase URL is accessible
- Restart Metro after changing .env.local

### 3. **Next Steps**

1. **Copy the FULL error message** from Metro terminal
2. **Look for lines starting with:**
   - `[MODULE] ❌`
   - `❌❌❌`
   - `Error:`
   - `TypeError:`
   - `ReferenceError:`

3. **Check your .env.local file:**

   ```bash
   cat apps/mobile/.env.local
   ```

4. **Share the error message** so I can provide a targeted fix

## Expected Metro Terminal Output

When working correctly, you should see:

```
[MODULE] ✅ createClient imported
[MODULE] ✅ RealtimeManager imported
[MODULE] ✅ useAuth imported
[MODULE] ✅ All imports successful
[MODULE] Initializing Supabase client...
[MODULE] Environment check:
  - EXPO_PUBLIC_SUPABASE_URL: SET
  - EXPO_PUBLIC_SUPABASE_ANON_KEY: SET
[MODULE] ✅ createClient() succeeded
✅ Supabase client initialized
🚀 MOBILE APP STARTED
```

If you see any `❌` messages, those indicate the problem.
