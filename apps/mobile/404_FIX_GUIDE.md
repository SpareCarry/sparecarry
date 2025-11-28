# Fixing 404 Development Server Error on Mobile

## Problem
Getting "development server returned response error code: 404" when trying to launch the app on Android mobile device.

## Root Causes
1. **Offline Mode**: The `--offline` flag prevents network connections
2. **Network Connectivity**: Device can't reach the development server
3. **Firewall**: Windows Firewall blocking connections
4. **Wrong IP Address**: Device trying to connect to localhost instead of LAN IP

## Solutions

### Solution 1: Use Online Mode (Recommended)
The default `start` script now uses online mode. Run:
```bash
cd apps/mobile
pnpm start
```

Or with cache cleared:
```bash
pnpm start:clear
```

### Solution 2: Use Tunnel Mode (For Remote Testing)
If you're testing outside your local network or having LAN issues:
```bash
pnpm start:tunnel
```

This creates a secure tunnel through Expo's servers. Wait for the tunnel URL and scan the QR code.

### Solution 3: Use LAN Mode (For Same Network)
If you're on the same WiFi network:
```bash
pnpm start:lan
```

This explicitly uses your LAN IP address.

### Solution 4: Check Network Connection

1. **Verify Same Network**:
   - Ensure your computer and mobile device are on the same WiFi network
   - Check your computer's IP address: `pnpm get-lan-ip`
   - The IP should be something like `192.168.1.xxx`

2. **Check Windows Firewall**:
   - Open Windows Defender Firewall
   - Allow Node.js through firewall if prompted
   - Or temporarily disable firewall for testing

3. **Verify Metro Bundler is Running**:
   - Look for "Metro waiting on exp://..." in terminal
   - Should show both LAN IP and localhost URLs
   - Example: `Metro waiting on exp://192.168.1.238:8081`

### Solution 5: Manual Connection

If automatic connection fails:

1. **Get Your LAN IP**:
   ```bash
   pnpm get-lan-ip
   ```
   This will output something like: `192.168.1.238`

2. **In Expo Go App**:
   - Tap "Enter URL manually"
   - Enter: `exp://192.168.1.238:8081`
   - Replace with your actual IP from step 1

### Solution 6: Check Environment Variables

Ensure your `.env.local` file exists and has correct values:
```bash
cd apps/mobile
cat .env.local
```

Should contain:
```
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## Testing Steps

1. **Start Metro Bundler**:
   ```bash
   cd apps/mobile
   pnpm start:clear
   ```

2. **Check Terminal Output**:
   - Look for QR code
   - Look for "Metro waiting on exp://..."
   - Should show both `exp://192.168.x.x:8081` and `exp://localhost:8081`

3. **On Your Device**:
   - Open Expo Go app
   - Scan QR code OR manually enter URL
   - Wait for bundle to load

4. **If Still Getting 404**:
   - Try tunnel mode: `pnpm start:tunnel`
   - Check firewall settings
   - Verify both devices on same network
   - Restart Metro bundler: Press `r` in terminal

## Common Issues

### Issue: "Network request failed"
**Solution**: Use tunnel mode or check firewall

### Issue: "Unable to resolve host"
**Solution**: Use tunnel mode or verify network connection

### Issue: "Connection refused"
**Solution**: 
- Check Metro bundler is running
- Verify port 8081 is not blocked
- Try different port: `expo start --port 8082`

### Issue: QR code not working
**Solution**: 
- Manually enter URL from terminal
- Use tunnel mode for remote access

## Quick Reference

| Command | Use Case |
|---------|----------|
| `pnpm start` | Normal development (online) |
| `pnpm start:clear` | Clear cache and start |
| `pnpm start:tunnel` | Remote testing or LAN issues |
| `pnpm start:lan` | Explicit LAN mode |
| `pnpm start:offline` | Offline mode (not recommended for mobile) |

## Still Having Issues?

1. **Check Metro Logs**: Look for error messages in terminal
2. **Try Tunnel Mode**: Most reliable for remote testing
3. **Restart Everything**: 
   - Close Expo Go app
   - Stop Metro bundler (Ctrl+C)
   - Clear cache: `pnpm start:clear`
   - Restart Metro bundler
   - Reopen Expo Go and connect

4. **Check Expo Go Version**: Ensure you have the latest Expo Go app installed

