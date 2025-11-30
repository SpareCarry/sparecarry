# Mobile Testing Configuration Guide

## Quick Answer

When testing on your phone, you see `http://192.168.1.238:8081` - this is your **Expo dev server** URL. Here's what you need to configure:

### For Local Development on Phone

**In your `.env.local` file (root directory):**

```env
# Your network IP - the port should match your Next.js dev server (usually 3000, not 8081)
NEXT_PUBLIC_APP_URL=http://192.168.1.238:3000
EXPO_PUBLIC_APP_URL=http://192.168.1.238:3000

# Environment
NEXT_PUBLIC_APP_ENV=development

# Supabase (use your actual values)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Important Notes:

1. **Port 8081** is the Expo dev server (for the mobile app bundle)
2. **Port 3000** is your Next.js server (for the web app that handles auth callbacks)
3. Both must use the **same network IP** (`192.168.1.238`)

---

## Detailed Configuration

### Step 1: Find Your Network IP

Your phone already shows it: `192.168.1.238`

**To verify or find it manually:**

**Windows:**

```powershell
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

**Mac/Linux:**

```bash
ifconfig
# Or
ip addr show
# Look for inet address (usually 192.168.x.x)
```

### Step 2: Configure Environment Variables

**Create/Update `.env.local` in root directory:**

```env
# ============================================
# APP URL CONFIGURATION
# ============================================

# Use your network IP for mobile testing
# Replace 192.168.1.238 with YOUR actual IP if different
NEXT_PUBLIC_APP_URL=http://192.168.1.238:3000
EXPO_PUBLIC_APP_URL=http://192.168.1.238:3000

# Environment (development, staging, or production)
NEXT_PUBLIC_APP_ENV=development

# ============================================
# SUPABASE CONFIGURATION
# ============================================

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# ============================================
# OTHER CONFIGURATION (your existing vars)
# ============================================
# ... rest of your env vars
```

### Step 3: Configure Supabase Redirect URLs

**Go to your Supabase Dashboard:**

1. Navigate to: **Authentication** → **URL Configuration**
2. Add these **Site URL** and **Redirect URLs**:

**For Local Development:**

```
Site URL:
http://192.168.1.238:3000

Redirect URLs (add all of these):
http://192.168.1.238:3000/auth/callback
http://192.168.1.238:3000/auth/callback/*
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback/*
sparecarry://auth/callback
sparecarry://auth/callback/*
```

**For Production (add these too):**

```
https://sparecarry.com
https://sparecarry.com/auth/callback
https://sparecarry.com/auth/callback/*
```

**Complete Supabase Redirect URLs List:**

```
# Development (local network)
http://192.168.1.238:3000
http://192.168.1.238:3000/auth/callback
http://192.168.1.238:3000/auth/callback/*
http://localhost:3000
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback/*

# Mobile deep links
sparecarry://auth/callback
sparecarry://auth/callback/*

# Production
https://sparecarry.com
https://sparecarry.com/auth/callback
https://sparecarry.com/auth/callback/*
```

### Step 4: Verify Your Setup

1. **Check Next.js is running on port 3000:**

   ```bash
   npm run dev
   # Should show: Local: http://localhost:3000
   ```

2. **Check Expo is running (if using Expo Go):**

   ```bash
   npx expo start
   # Should show network URL like: http://192.168.1.238:8081
   ```

3. **Test the connection:**
   - From your phone's browser, try: `http://192.168.1.238:3000`
   - You should see your Next.js app

---

## Common Issues & Solutions

### Issue: "OAuth redirect failed" or "Invalid redirect URL"

**Solution:**

- Verify the URL is added to Supabase redirect URLs exactly as shown
- Make sure your IP hasn't changed (check `ipconfig` again)
- Restart both Next.js and Expo dev servers after changing env vars

### Issue: "Can't connect to http://192.168.1.238:3000"

**Solutions:**

1. **Check firewall:** Windows Firewall might be blocking port 3000
   - Allow Node.js through Windows Firewall
   - Or temporarily disable firewall for testing

2. **Check network:** Make sure phone and computer are on same WiFi network
   - Not on guest network
   - Not using mobile hotspot from the computer

3. **Verify IP hasn't changed:**
   - Run `ipconfig` again
   - Update `.env.local` if IP changed

### Issue: Expo shows port 8081 but Next.js is on 3000

**This is correct!**

- **8081** = Expo dev server (for mobile app bundle)
- **3000** = Next.js server (for web/auth callbacks)

Both should use the same IP (`192.168.1.238`), just different ports.

---

## Environment Variables Reference

### Development (Local Testing)

| Variable              | Value                       | Purpose                |
| --------------------- | --------------------------- | ---------------------- |
| `NEXT_PUBLIC_APP_URL` | `http://192.168.1.238:3000` | Web app base URL       |
| `EXPO_PUBLIC_APP_URL` | `http://192.168.1.238:3000` | Mobile app base URL    |
| `NEXT_PUBLIC_APP_ENV` | `development`               | Environment identifier |

### Production

| Variable              | Value                    | Purpose                |
| --------------------- | ------------------------ | ---------------------- |
| `NEXT_PUBLIC_APP_URL` | `https://sparecarry.com` | Production web URL     |
| `EXPO_PUBLIC_APP_URL` | `https://sparecarry.com` | Production mobile URL  |
| `NEXT_PUBLIC_APP_ENV` | `production`             | Environment identifier |

---

## Quick Setup Checklist

- [ ] Found your network IP (`192.168.1.238` or similar)
- [ ] Set `NEXT_PUBLIC_APP_URL=http://YOUR_IP:3000` in `.env.local`
- [ ] Set `EXPO_PUBLIC_APP_URL=http://YOUR_IP:3000` in `.env.local`
- [ ] Set `NEXT_PUBLIC_APP_ENV=development` in `.env.local`
- [ ] Added all redirect URLs to Supabase dashboard
- [ ] Restarted Next.js dev server (`npm run dev`)
- [ ] Restarted Expo dev server (if using Expo)
- [ ] Tested connection from phone browser: `http://YOUR_IP:3000`
- [ ] Verified firewall allows connections on port 3000

---

## How It Works

1. **User opens app on phone** → Connects to `http://192.168.1.238:8081` (Expo)
2. **User tries to log in** → App requests auth from Supabase
3. **Supabase redirects to** → `http://192.168.1.238:3000/auth/callback` (Next.js)
4. **Next.js callback route** → Processes auth, redirects back to app
5. **App receives auth** → User is logged in

The key is that **both servers must be accessible from your phone** using the network IP.

---

## Still Having Issues?

1. **Double-check Supabase redirect URLs** - they must match exactly
2. **Check console logs** - Look for errors about redirect URLs
3. **Verify network connectivity** - Can phone reach `http://YOUR_IP:3000`?
4. **Check port conflicts** - Make sure nothing else is using port 3000
5. **Restart everything** - Close and reopen dev servers after env changes

For more help, see:

- `docs/APP_URL_CONFIGURATION.md`
- `docs/GOOGLE_OAUTH_SETUP.md`
