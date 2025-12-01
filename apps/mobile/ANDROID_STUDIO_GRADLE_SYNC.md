# How to Sync Gradle Files in Android Studio

After adding `google-services.json` to your project, you need to sync Gradle files so Android Studio recognizes the changes.

## Method 1: Sync Now Banner (Easiest)

1. **Open Android Studio**
2. **Open your project**: `apps/mobile/android/`
3. Look for a **"Sync Now"** banner at the top of the editor
4. Click **"Sync Now"**

## Method 2: File Menu

1. In Android Studio, go to **File** → **Sync Project with Gradle Files**
2. Wait for the sync to complete (you'll see progress in the status bar)

## Method 3: Gradle Toolbar Icon

1. Look for the **Gradle sync icon** in the toolbar (elephant icon with circular arrow)
2. Click it to sync

## Method 4: Keyboard Shortcut

- **Windows/Linux**: `Ctrl + Shift + O`
- **Mac**: `Cmd + Shift + I`

## What to Expect

After syncing:
- ✅ You should see "Gradle sync finished" in the status bar
- ✅ No errors related to `google-services.json`
- ✅ The Firebase plugin should be recognized

## If You See Errors

1. **Check the Build output panel** (View → Tool Windows → Build)
2. **Common issues**:
   - `google-services.json` not found → Make sure it's in `apps/mobile/android/app/`
   - Plugin version mismatch → The version should be 4.4.4
   - Missing dependencies → Try **File → Invalidate Caches / Restart**

## Verify It Worked

After syncing, you can verify Firebase is configured by:
1. Opening `apps/mobile/android/app/build.gradle`
2. You should see the plugin applied: `apply plugin: "com.google.gms.google-services"`
3. No red error underlines

## Next Steps

Once Gradle sync is successful:
1. Build your app: **Build → Make Project** (or `Ctrl+F9`)
2. Run on device/emulator
3. The Firebase push notification warning should be gone!

