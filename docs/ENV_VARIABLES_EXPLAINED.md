# Environment Variables Explained

## Supabase Variables: EXPO vs NEXT

### ✅ They Should Be THE SAME Values

Both `EXPO_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` should point to the **same Supabase project**. They're just different variable names for different platforms:

- **`NEXT_PUBLIC_*`**: Used by Next.js (web app)
- **`EXPO_PUBLIC_*`**: Used by Expo/React Native (mobile app)

### Why Two Names?

Different build systems use different prefixes:

- **Next.js** looks for `NEXT_PUBLIC_*` variables
- **Expo** looks for `EXPO_PUBLIC_*` variables
- Both need access to the same Supabase project

### How The Code Handles It

The code has a fallback system:

```typescript
// In lib/supabase/mobile.ts
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
```

This means:

- ✅ If `EXPO_PUBLIC_*` is set, it uses that
- ✅ If not, it falls back to `NEXT_PUBLIC_*`
- ✅ **Best practice**: Set both to the same value

### Recommended Setup

**`.env.local` (root):**

```env
# Supabase - Same values for both web and mobile
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Also set Expo versions (same values)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**`apps/mobile/.env`:**

```env
# Supabase - Same values as root
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Quick Answer

**Yes, they are the same thing!** Just different variable names for the same Supabase project credentials.

- ✅ Same Supabase project URL
- ✅ Same anon key
- ✅ Different variable names for different platforms
- ✅ Code has fallback, but set both to be safe

### Where to Get These Values

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Summary

| Variable                        | Platform      | Value                         |
| ------------------------------- | ------------- | ----------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Next.js (Web) | Your Supabase project URL     |
| `EXPO_PUBLIC_SUPABASE_URL`      | Expo (Mobile) | **Same** Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Next.js (Web) | Your Supabase anon key        |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Expo (Mobile) | **Same** Supabase anon key    |

**They're the same credentials, just different variable names!** 🎯
