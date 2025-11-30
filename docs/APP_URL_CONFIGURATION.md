# APP_URL Configuration Guide

## When to Use Which URL

### Local Development

**For `.env.local` (root):**

```env
# Option 1: Use localhost (works for web only)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Option 2: Use network IP (works for both web and mobile)
NEXT_PUBLIC_APP_URL=http://192.168.1.238:3000
```

**For `apps/mobile/.env` (mobile):**

```env
# MUST use network IP (localhost won't work on mobile)
EXPO_PUBLIC_APP_URL=http://192.168.1.238:3000
```

### Production

**For both `.env.local` and `apps/mobile/.env`:**

```env
NEXT_PUBLIC_APP_URL=https://sparecarry.com
EXPO_PUBLIC_APP_URL=https://sparecarry.com
```

## Quick Decision Guide

| Environment            | NEXT_PUBLIC_APP_URL         | EXPO_PUBLIC_APP_URL         | Why                      |
| ---------------------- | --------------------------- | --------------------------- | ------------------------ |
| **Local Dev (Web)**    | `http://localhost:3000`     | N/A                         | Web can access localhost |
| **Local Dev (Mobile)** | `http://192.168.1.238:3000` | `http://192.168.1.238:3000` | Mobile needs network IP  |
| **Production**         | `https://sparecarry.com`    | `https://sparecarry.com`    | Production domain        |

## Recommended Setup

### For Local Development (Both Web & Mobile)

**`.env.local` (root):**

```env
# Use network IP so both web and mobile work
NEXT_PUBLIC_APP_URL=http://192.168.1.238:3000
EXPO_PUBLIC_APP_URL=http://192.168.1.238:3000
```

**`apps/mobile/.env`:**

```env
# Mobile MUST use network IP
EXPO_PUBLIC_APP_URL=http://192.168.1.238:3000
```

### For Production

**Vercel Environment Variables:**

```env
NEXT_PUBLIC_APP_URL=https://sparecarry.com
```

**EAS Build Environment Variables:**

```env
EXPO_PUBLIC_APP_URL=https://sparecarry.com
```

## Why Network IP for Mobile?

- ❌ `localhost:3000` - Your phone can't access your computer's localhost
- ❌ `127.0.0.1:3000` - Same issue, phone can't reach it
- ✅ `192.168.1.238:3000` - Your phone on the same WiFi can reach this
- ✅ `https://sparecarry.com` - Works everywhere (production)

## Finding Your Network IP

Run this command to find your network IP:

```bash
node apps/mobile/scripts/get-network-ip.js
```

Or manually:

- **Windows**: `ipconfig` → Look for "IPv4 Address"
- **Mac/Linux**: `ifconfig` → Look for "inet" under your active network

## Summary

**For local development:**

- ✅ Use `http://192.168.1.238:3000` (your network IP)
- ❌ Don't use `localhost:3000` if you're testing mobile

**For production:**

- ✅ Use `https://sparecarry.com`

**Best practice:** Use network IP for local dev, production URL for production! 🎯
