# Dev Mode - Quick Start

## 🚀 Skip Authentication for Testing

### Mobile App (Expo)

1. **Enable dev mode:**
   ```bash
   # Create apps/mobile/.env
   echo "EXPO_PUBLIC_DEV_MODE=true" > apps/mobile/.env
   ```

2. **Restart dev server:**
   ```bash
   pnpm dev:mobile
   ```

3. **App will skip login and go straight to home screen!**

### Web App (Next.js)

1. **Enable dev mode:**
   ```bash
   # Add to .env.local
   echo "NEXT_PUBLIC_DEV_MODE=true" >> .env.local
   ```

2. **Restart dev server:**
   ```bash
   pnpm dev:web
   ```

3. **All routes accessible without authentication!**

## ⚠️ Before Production

**Always disable dev mode:**

```bash
# Mobile
echo "EXPO_PUBLIC_DEV_MODE=false" > apps/mobile/.env

# Web
# Remove NEXT_PUBLIC_DEV_MODE from .env.local or set to false
```

## Features

- ✅ Skip authentication completely
- ✅ Visual warning banner when enabled
- ✅ Automatically disabled in production builds
- ✅ Easy to enable/disable via env variable

See `docs/DEV_MODE_SETUP.md` for full documentation.

