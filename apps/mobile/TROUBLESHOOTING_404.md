# Troubleshooting 404 Development Server Error

## Quick Diagnosis

The 404 error can mean different things. Let's identify which one you're seeing:

### Type 1: Metro Bundler 404 (Can't Connect to Dev Server)
**Symptoms:**
- Error appears immediately when opening Expo Go
- Shows "development server returned response error code: 404"
- App never loads, just shows error screen

**Causes:**
- Device can't reach your computer's IP address
- Firewall blocking port 8081
- Wrong network (device and computer on different WiFi)
- Metro bundler not running

**Solutions:**
1. **Use Tunnel Mode** (Most Reliable):
   ```bash
   pnpm start:tunnel
   ```
   Wait for tunnel URL, then scan QR code.

2. **Check Network Connection**:
   ```bash
   # Get your LAN IP
   pnpm get-lan-ip
   
   # Should output something like: 192.168.1.238
   # Make sure your phone is on the same WiFi network
   ```

3. **Check Windows Firewall**:
   - Open Windows Defender Firewall
   - Allow Node.js through firewall
   - Or temporarily disable firewall for testing

4. **Verify Metro is Running**:
   - Look for "Metro waiting on exp://..." in terminal
   - Should show both LAN IP and localhost URLs
   - If not showing, restart: `pnpm start:clear`

### Type 2: Route 404 (App Loads but Route Not Found)
**Symptoms:**
- App loads successfully
- Shows 404 screen with route information
- Navigation works but specific route fails

**Causes:**
- Route file doesn't exist
- Route name mismatch
- Navigation to non-existent route

**Solutions:**
1. **Check Metro Terminal**:
   - Look for "❌❌❌ 404 PAGE NOT FOUND ❌❌❌"
   - Check the "Failing Route" shown in error
   - Verify route file exists in `app/` directory

2. **Verify Route Structure**:
   ```bash
   # Check if route file exists
   ls app/your-route.tsx
   ```

3. **Check Route Name**:
   - Route name must match file name
   - Use `/(tabs)` for tab routes, not `/tabs`
   - Use `[param]` for dynamic routes

### Type 3: Initial Load 404
**Symptoms:**
- App tries to load but gets 404 immediately
- Metro terminal shows bundle errors
- QR code doesn't work

**Causes:**
- Entry point not found
- Metro config issue
- Module resolution failure

**Solutions:**
1. **Clear All Caches**:
   ```bash
   pnpm start:clear
   ```

2. **Reinstall Dependencies**:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

3. **Check Entry Point**:
   - Verify `package.json` has: `"main": "expo-router/entry"`
   - Verify `app/_layout.tsx` exists
   - Verify `app/(tabs)/index.tsx` exists

## Step-by-Step Fix

### Step 1: Try Tunnel Mode First
```bash
cd apps/mobile
pnpm start:tunnel
```

This is the most reliable method and works even if you're on different networks.

### Step 2: Check Metro Terminal Output
When you run `pnpm start`, you should see:
```
Metro waiting on exp://192.168.1.238:8081
Metro waiting on exp://localhost:8081
```

If you don't see these, Metro isn't running correctly.

### Step 3: Verify Network
```bash
# Get your IP
pnpm get-lan-ip

# Should output: 192.168.1.xxx
# Make sure your phone is on the same WiFi
```

### Step 4: Manual Connection
If QR code doesn't work:
1. Open Expo Go app
2. Tap "Enter URL manually"
3. Enter: `exp://YOUR_IP:8081` (replace YOUR_IP with output from `get-lan-ip`)
4. Example: `exp://192.168.1.238:8081`

### Step 5: Check for Errors in Metro Terminal
Look for:
- ❌ Error messages
- Module not found errors
- Network errors
- Route errors

## Common Commands

```bash
# Normal start (online mode)
pnpm start

# Clear cache and start
pnpm start:clear

# Tunnel mode (most reliable)
pnpm start:tunnel

# LAN mode (explicit)
pnpm start:lan

# Get your LAN IP
pnpm get-lan-ip
```

## Still Not Working?

1. **Check Expo Go Version**: Update to latest version
2. **Restart Everything**:
   - Close Expo Go app
   - Stop Metro (Ctrl+C)
   - Clear cache: `pnpm start:clear`
   - Restart Metro
   - Reopen Expo Go

3. **Try Different Network**:
   - Switch to mobile hotspot
   - Use tunnel mode instead

4. **Check Metro Logs**:
   - Look for any error messages
   - Check if bundle completes successfully
   - Verify no module resolution errors

## Expected Behavior

When working correctly:
1. Metro terminal shows QR code
2. Metro terminal shows "Metro waiting on exp://..."
3. Scanning QR code in Expo Go connects successfully
4. App loads and shows home screen
5. No 404 errors in Metro terminal

If any of these fail, follow the troubleshooting steps above.

