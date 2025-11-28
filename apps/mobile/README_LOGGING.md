# 📱 Mobile App Logging Guide (Expo Go)

## ✅ Console Logs Appear in Metro Terminal

When you run `pnpm start` in `apps/mobile`, **ALL console logs appear in that terminal window**.

### How to See Logs

1. **Open a terminal** and run:
   ```bash
   cd apps/mobile
   pnpm start
   ```

2. **Look at the terminal output** - all `console.log()`, `console.error()`, `console.warn()` appear there

3. **When you get a 404**, you'll see:
   ```
   ❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌
   ❌       404 PAGE NOT FOUND        ❌
   ❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌
   
   Pathname: /your-missing-route
   Segments: your/missing/route
   ```

## 🎯 What Gets Logged

### ✅ App Startup
```
🚀 MOBILE APP STARTED
📱 Expo Go - Console logs appear here!
```

### ✅ Navigation Events
```
📍 Navigation: (tabs)
📍 Navigation: /auth/login
```

### ❌ 404 Errors (VERY VISIBLE)
```
❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌
❌       404 PAGE NOT FOUND        ❌
❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌
```

### ❌ Navigation Errors
```
❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌
❌      NAVIGATION ERROR       ❌
❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌
```

## 🔍 Finding the 404

When you see a 404 error in the app:

1. **Check the Metro terminal** (where you ran `pnpm start`)
2. **Look for the big red error box** with `404 PAGE NOT FOUND`
3. **Copy the "Pathname" and "Segments"** values
4. **Share them with me** so I can fix the route

## 📋 Example Terminal Output

```
🚀 MOBILE APP STARTED
📱 Expo Go - Console logs appear here!

📍 Navigation: (tabs)
📍 Navigation: /auto-measure
📷 Auto-Measure screen opened

❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌
❌       404 PAGE NOT FOUND        ❌
❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌

Pathname: /missing-route
Segments: missing/route
```

## 💡 Tips

- **Keep the Metro terminal visible** - that's where all logs appear
- **Look for red text** - errors are in red
- **Look for the big ❌ boxes** - those are 404s
- **Scroll up** if you miss an error - logs stay in terminal

## 🐛 Debugging

If you don't see logs:

1. **Make sure Metro is running** (`pnpm start`)
2. **Check you're looking at the right terminal** (the one running Metro)
3. **Restart Metro** if needed: `Ctrl+C` then `pnpm start` again
4. **Check Expo Go is connected** - you should see "Connected" in Metro

All logs appear in the **Metro bundler terminal** automatically! 🎉

