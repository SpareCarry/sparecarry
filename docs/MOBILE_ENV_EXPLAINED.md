# 📱 Environment Files Explained (.env vs .env.local)

## Quick Answer

**For Expo mobile apps, you can use either:**
- `.env` - General environment variables
- `.env.local` - Local overrides (takes precedence, usually gitignored)

**Both work, but `.env.local` is recommended for secrets!**

## 📋 File Priority (Expo)

Expo loads environment files in this order (later files override earlier ones):

1. `.env` - Base environment variables
2. `.env.local` - Local overrides (gitignored)
3. `.env.development` - Development-specific (if `NODE_ENV=development`)
4. `.env.production` - Production-specific (if `NODE_ENV=production`)

**`.env.local` always takes precedence** over `.env` if both exist.

## ✅ Recommended Setup

### **Option 1: Use `.env.local` (Recommended for Secrets)**

```bash
# apps/mobile/.env.local (gitignored - safe for secrets)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-secret-key-here
```

**Pros:**
- ✅ Automatically gitignored (won't be committed)
- ✅ Takes precedence over `.env`
- ✅ Safe for secrets/API keys
- ✅ Team members can have different values

### **Option 2: Use `.env` (For Non-Secrets)**

```bash
# apps/mobile/.env (can be committed if no secrets)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key-here
```

**Pros:**
- ✅ Can be committed to git (if no secrets)
- ✅ Shared across team
- ✅ Works out of the box

## 🔒 Security Best Practice

**For Supabase keys (which are sensitive):**

1. **Use `.env.local`** for your actual keys
2. **Create `.env.example`** as a template (can be committed):
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key-here
   ```
3. **Add `.env.local` to `.gitignore`** (usually already there)

## 📝 Example Setup

### 1. Create `.env.example` (committed to git):
```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Create `.env.local` (gitignored, your actual keys):
```env
# Your actual Supabase credentials (DO NOT COMMIT)
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. `.gitignore` should include:
```
.env.local
.env*.local
```

## ⚠️ Important Notes

1. **Variable Names**: Must start with `EXPO_PUBLIC_` to be accessible in the app
2. **Restart Required**: After changing `.env` files, restart Metro bundler
3. **No Quotes**: Don't use quotes around values in `.env` files
4. **No Spaces**: `KEY=value` not `KEY = value`

## 🔍 How Expo Loads Variables

Expo uses `expo-constants` to load environment variables:

```typescript
// In your app code
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
```

Variables are:
- ✅ Loaded at build time
- ✅ Embedded in the bundle
- ✅ Accessible via `process.env.EXPO_PUBLIC_*`
- ❌ NOT accessible for variables without `EXPO_PUBLIC_` prefix

## 📋 Quick Setup Guide

### For Your Mobile App:

1. **Create `.env.local`** in `apps/mobile/`:
   ```bash
   cd apps/mobile
   touch .env.local  # or create manually
   ```

2. **Add your Supabase keys**:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```

3. **Restart Metro**:
   ```bash
   pnpm start:clear
   ```

## ✅ Summary

- **`.env`** = General variables (can be committed)
- **`.env.local`** = Local secrets (gitignored, recommended)
- **Both work**, but `.env.local` is safer for API keys
- **`.env.local` takes precedence** if both exist
- **Must restart Metro** after changing env files

**For your Supabase setup, use `.env.local`!** 🔒

