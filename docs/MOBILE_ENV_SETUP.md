# 📱 Mobile App Environment Setup

## ❌ 500 Error Fix

The **500 error** you're seeing is likely because **Supabase environment variables are missing**.

## ✅ Quick Fix

### 1. **Create `.env` file**

Create `apps/mobile/.env` with your Supabase credentials:

```bash
cd apps/mobile
```

Create `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. **Get Your Supabase Credentials**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 3. **Restart Metro**

After creating `.env`:

```bash
# Stop Metro (Ctrl+C)
# Clear cache
pnpm clear-cache

# Start again
pnpm start:clear
```

## 🔍 Verify Setup

Run the check script:

```bash
node scripts/check-env.js
```

You should see:

```
✅ EXPO_PUBLIC_SUPABASE_URL: SET
✅ EXPO_PUBLIC_SUPABASE_ANON_KEY: SET
✅ All required environment variables are set!
```

## 📋 Example `.env` File

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example

# Optional: EAS Project ID
# EAS_PROJECT_ID=your-eas-project-id
```

## ⚠️ Important Notes

1. **`.env` is gitignored** - Don't commit your real keys
2. **Use `.env.example`** as a template
3. **Restart Metro** after changing `.env`
4. **Clear cache** if variables don't load: `pnpm clear-cache`

## 🐛 If Still Getting 500 Error

1. **Check Metro terminal** for actual error message
2. **Verify `.env` file exists** in `apps/mobile/`
3. **Check variable names** - Must start with `EXPO_PUBLIC_`
4. **Restart Metro** after changes
5. **Clear cache**: `pnpm clear-cache && pnpm start:clear`

## ✅ After Setup

Once `.env` is created and Metro restarted:

- ✅ App should load without 500 error
- ✅ Supabase client will initialize
- ✅ Authentication will work
- ✅ All features will function

The 500 error should be gone! 🎉
