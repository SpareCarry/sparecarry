# Quick Setup: Mobile Testing Configuration

## Your Situation

You're testing on your phone and seeing: `http://192.168.1.238:8081`

- **8081** = Expo dev server (mobile app)
- **3000** = Next.js server (handles auth callbacks)

Both need to use the same network IP: `192.168.1.238`

---

## ✅ Quick Setup Steps

### Step 1: Update `.env.local` (root directory)

Add/update these lines:

```env
# Use your network IP (192.168.1.238) with port 3000 for Next.js
NEXT_PUBLIC_APP_URL=http://192.168.1.238:3000
EXPO_PUBLIC_APP_URL=http://192.168.1.238:3000

# Set environment
NEXT_PUBLIC_APP_ENV=development
```

**Important:** Use port **3000** (Next.js), not 8081 (Expo)

### Step 2: Add Supabase Redirect URLs

Go to: **Supabase Dashboard → Authentication → URL Configuration**

Add these **Redirect URLs** (one per line):

```
http://192.168.1.238:3000/auth/callback
http://192.168.1.238:3000/auth/callback/*
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback/*
sparecarry://auth/callback
sparecarry://auth/callback/*
https://sparecarry.com/auth/callback
https://sparecarry.com/auth/callback/*
```

Set **Site URL** to:

```
http://192.168.1.238:3000
```

### Step 3: Restart Dev Servers

1. Stop Next.js dev server (Ctrl+C)
2. Stop Expo dev server (Ctrl+C)
3. Start Next.js: `npm run dev`
4. Start Expo: `npx expo start` (if using Expo Go)

### Step 4: Test

1. Open app on phone
2. Try logging in
3. Should work! ✅

---

## 🔍 Troubleshooting

### "Invalid redirect URL" error?

1. ✅ Check Supabase redirect URLs match exactly (no typos)
2. ✅ Verify IP hasn't changed (run `ipconfig` on Windows)
3. ✅ Restart both dev servers after changing env vars

### Can't connect to server?

1. ✅ Check firewall allows port 3000
2. ✅ Make sure phone and computer on same WiFi
3. ✅ Test in phone browser: `http://192.168.1.238:3000`

### IP changed?

1. Run `ipconfig` to get new IP
2. Update `.env.local` with new IP
3. Update Supabase redirect URLs
4. Restart servers

---

## 📋 Complete Environment Variables Template

```env
# ============================================
# MOBILE TESTING CONFIGURATION
# ============================================
NEXT_PUBLIC_APP_URL=http://192.168.1.238:3000
EXPO_PUBLIC_APP_URL=http://192.168.1.238:3000
NEXT_PUBLIC_APP_ENV=development

# ============================================
# SUPABASE (use your actual values)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ... rest of your env vars
```

---

## 📝 Summary

| What                   | Value                       | Why                           |
| ---------------------- | --------------------------- | ----------------------------- |
| `NEXT_PUBLIC_APP_URL`  | `http://192.168.1.238:3000` | Next.js server (handles auth) |
| `EXPO_PUBLIC_APP_URL`  | `http://192.168.1.238:3000` | Mobile app base URL           |
| `NEXT_PUBLIC_APP_ENV`  | `development`               | Environment identifier        |
| Supabase Redirect URLs | Multiple (see Step 2)       | Allows auth redirects         |

**Key Points:**

- ✅ Use network IP (`192.168.1.238`) not `localhost`
- ✅ Use port **3000** (Next.js) not 8081 (Expo)
- ✅ Add ALL redirect URLs to Supabase
- ✅ Restart servers after changes

---

**Need more details?** See `docs/MOBILE_TESTING_CONFIGURATION.md` for comprehensive guide.
