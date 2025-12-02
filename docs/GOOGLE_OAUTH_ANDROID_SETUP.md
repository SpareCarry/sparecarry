# Google OAuth Android Setup - Package Name & SHA-1

## Package Name

**Package Name**: `com.sparecarry.app`

This is already configured in your `apps/mobile/app.json`:
```json
"android": {
  "package": "com.sparecarry.app"
}
```

Use this exact value when creating the Android OAuth Client ID in Google Cloud Console.

## SHA-1 Certificate Fingerprint

The SHA-1 fingerprint is needed to verify your app's identity with Google Sign-In. You need the SHA-1 from your **debug keystore** (for development/testing) and potentially a **release keystore** (for production).

### Option 1: Get SHA-1 from Debug Keystore (Development)

**Location**: `C:\Users\<YourUsername>\.android\debug.keystore`

**Command to get SHA-1**:
```powershell
keytool -list -v -keystore $env:USERPROFILE\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Look for the line that says:
```
SHA1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

**Copy the entire SHA-1 value** (including the colons).

### Option 2: Get SHA-1 from Gradle (If Android Folder Exists)

If you've run `expo prebuild` and have an `android` folder:

```powershell
cd apps\mobile\android
.\gradlew signingReport
```

Look for the **debug** variant and copy the SHA-1 value.

### Option 3: Get SHA-1 After First Build

If the debug keystore doesn't exist yet, it will be created automatically when you:
1. Build your first Android app, OR
2. Run `npx expo run:android` for the first time

After that, use Option 1 to get the SHA-1.

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Navigate to: **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Application type**: **Android**
6. Fill in:
   - **Name**: `SpareCarry Android` (or any name you prefer)
   - **Package name**: `com.sparecarry.app` ⬅️ Use this exact value
   - **SHA-1 certificate fingerprint**: Paste your SHA-1 here ⬅️ From above
7. Click **Create**

## Important Notes

- **Debug SHA-1**: Use for development/testing builds
- **Release SHA-1**: If you have a release keystore for production, you'll need to add that SHA-1 too (separate Android OAuth Client ID)
- **Multiple SHA-1s**: You can add multiple SHA-1 fingerprints to the same Android OAuth Client ID if needed
- **Format**: SHA-1 should be in format: `XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX`

## Quick Reference

**Package Name**: `com.sparecarry.app`

**SHA-1 Location (Debug)**: `C:\Users\<YourUsername>\.android\debug.keystore`

**Get SHA-1 Command**:
```powershell
keytool -list -v -keystore $env:USERPROFILE\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Look for `SHA1:` in the output and copy that value to Google Cloud Console.

