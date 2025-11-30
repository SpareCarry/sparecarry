# Mobile Testing Setup for Your Network

## ✅ Your Configuration (IP: 192.168.1.238)

### Step 1: Add to `.env.local` (root directory)

```env
# Mobile Testing - Use your network IP
NEXT_PUBLIC_APP_URL=http://192.168.1.238:3000
EXPO_PUBLIC_APP_URL=http://192.168.1.238:3000
NEXT_PUBLIC_APP_ENV=development
```

**Important:** Port is **3000** (Next.js server), not 8081 (Expo dev server)

---

### Step 2: Supabase Dashboard Configuration

**Go to:** Supabase Dashboard → Authentication → URL Configuration

**Set Site URL:**

```
http://192.168.1.238:3000
```

**Add these Redirect URLs** (one per line):

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

**Click "Save"** and wait 30 seconds for changes to propagate.

---

### Step 3: Restart Servers

1. Stop Next.js: `Ctrl+C` in terminal running `npm run dev`
2. Stop Expo: `Ctrl+C` in terminal running Expo
3. Start Next.js: `npm run dev`
4. Start Expo: `npx expo start` (if using Expo Go)

---

### Step 4: Test

1. Open app on your phone
2. Try logging in
3. Should work! ✅

---

## 🔍 Quick Troubleshooting

**"Invalid redirect URL" error?**

- ✅ Check Supabase redirect URLs match exactly
- ✅ Make sure IP is still `192.168.1.238` (run `ipconfig` to verify)
- ✅ Restart both servers after changing env vars

**Can't connect?**

- ✅ Check firewall allows port 3000
- ✅ Test in phone browser: `http://192.168.1.238:3000` (should show your app)
- ✅ Make sure phone and computer on same WiFi

**IP changed?**

- Run `ipconfig` to get new IP
- Update `.env.local` with new IP
- Update Supabase redirect URLs
- Restart servers

---

## 📝 Summary

| What                  | Value                       | Notes                               |
| --------------------- | --------------------------- | ----------------------------------- |
| Network IP            | `192.168.1.238`             | Your computer's IP on local network |
| Next.js Port          | `3000`                      | Web server (handles auth)           |
| Expo Port             | `8081`                      | Expo dev server (mobile bundle)     |
| `NEXT_PUBLIC_APP_URL` | `http://192.168.1.238:3000` | Must use port 3000                  |
| `EXPO_PUBLIC_APP_URL` | `http://192.168.1.238:3000` | Must use port 3000                  |
| `NEXT_PUBLIC_APP_ENV` | `development`               | Environment identifier              |

---

## ✅ Checklist

- [ ] Added env vars to `.env.local`
- [ ] Updated Supabase Site URL to `http://192.168.1.238:3000`
- [ ] Added all redirect URLs to Supabase
- [ ] Saved Supabase changes and waited 30 seconds
- [ ] Restarted Next.js dev server
- [ ] Restarted Expo dev server
- [ ] Tested connection from phone browser: `http://192.168.1.238:3000`
- [ ] Tried logging in from mobile app

---

**Need more help?** See:

- `docs/QUICK_SETUP_MOBILE_TESTING.md` - Quick reference
- `docs/MOBILE_TESTING_CONFIGURATION.md` - Detailed guide
