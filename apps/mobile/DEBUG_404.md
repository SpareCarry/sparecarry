# Debugging 404 Error

## What to Check

When you get a 404 error, please check:

### 1. **Where is the 404 appearing?**
- [ ] On your phone screen (in Expo Go app)
- [ ] In Metro terminal
- [ ] Both

### 2. **What does the Metro terminal show?**
Look for these messages when you run `pnpm start`:
- [ ] "Metro waiting on exp://..."
- [ ] QR code displayed
- [ ] Any error messages (copy them here)
- [ ] Bundle completion message

### 3. **What does your phone show?**
- [ ] "Unable to connect to development server"
- [ ] "404 Page Not Found" screen
- [ ] White screen
- [ ] Other error message (describe it)

### 4. **Connection Method**
- [ ] Scanning QR code
- [ ] Entering URL manually
- [ ] Using tunnel mode
- [ ] Using LAN mode

### 5. **Metro Terminal Output**
Please copy the FULL output from Metro terminal, especially:
- Any error messages
- The "Metro waiting on..." line
- Bundle status messages

## Quick Test

Run this and share the output:

```bash
cd apps/mobile
pnpm start:clear
```

Then:
1. Wait for Metro to fully start
2. Look for QR code and "Metro waiting on..." message
3. Try connecting from your phone
4. Copy ALL output from Metro terminal (especially any errors)
5. Describe what you see on your phone

## Common 404 Causes

1. **Metro bundler not running** - Check if you see "Metro waiting on..."
2. **Wrong URL** - Make sure you're using the URL from Metro terminal
3. **Network issue** - Try tunnel mode: `pnpm start:tunnel`
4. **Route not found** - Check if app loads but shows 404 screen (this is different from connection 404)
5. **Entry point issue** - Check if `node_modules/expo-router/entry.js` exists

## Next Steps

Once you share:
1. Where the 404 appears
2. Metro terminal output
3. What you see on your phone

I can provide a targeted fix.

