## SpareCarry Mobile App – Current Status & TODOs

### Overview

SpareCarry is a pnpm monorepo with:

- `apps/mobile` – Expo Router + React Native mobile app
- `web` (Next.js) – web app sharing Supabase client and hooks
- `packages/*` – shared UI, hooks, lib

The mobile app now runs via **EAS Dev Client** (not Expo Go), uses a **single React / React Native instance**, and shares the same **Supabase project** and auth logic as the web app.

---

## Work Completed (Mobile)

### 1. Dev client, Metro, and monorepo wiring

- **EAS Dev Client**
  - Added dev build scripts in the root `package.json`:
    - `dev:mobile` → `cd apps/mobile && expo start --dev-client`
    - `build:dev:android` / `build:dev:ios` → EAS development builds.
  - Configured `eas.json` with:
    - `project.id` matching `apps/mobile/app.config.ts` (`extra.eas.projectId`).
    - `development`, `preview`, and `production` profiles.
    - `appVersionSource: "remote"` and pinned `cli.version`.

- **Monorepo / Metro setup**
  - Ensured **single React / React Native** instance:
    - `react`, `react-dom`, `react-native` live in the root `node_modules`.
    - Shared packages (`packages/ui`, `packages/hooks`, `packages/lib`) depend on React / RN via **peerDependencies** only.
    - `apps/mobile/metro.config.js` uses `extraNodeModules` to point React / RN / JSX runtime to the root installation.
  - Fixed pnpm + EAS resolution issues:
    - Replaced Windows `file:C:\SpareCarry\...` paths with `"workspace:*"` references in `apps/mobile/package.json`.
  - Added `watchFolders` for:
    - `modules` – Auto-Measure and other shared native features.
    - `assets` – JSON data for shipping rates, customs, etc.
  - Removed temporary React diagnostics (`checkReact` and `require.resolve`) that caused runtime warnings/errors on native.

- **Route and app structure conflicts**
  - Renamed the root Next.js `app` folder to `web-routes` so it no longer conflicts with `apps/mobile/app` in Metro / Expo Router.
  - Cleaned conflicting `app.json` vs `app.config.ts` and removed stale `android` code when needed so `expo prebuild` / EAS can regenerate.

---

### 2. React / React Native / Expo alignment

- Addressed `expo doctor` dependency mismatches by:
  - Ensuring React / RN versions are consistent with the targeted Expo SDK.
  - Adding an `expo.install.exclude` block in `apps/mobile/package.json` to ignore React / RN / `@types/react*` for Expo’s dependency validation (so Expo doesn’t try to “fix” them).
- Resolved EAS build blockers:
  - Fixed `Invalid UUID appId` by aligning `eas.json` and `app.config.ts` project IDs.
  - Fixed `ERR_PNPM_LINKED_PKG_DIR_NOT_FOUND` by removing Windows-only file paths.
  - Migrated from ad-hoc Kotlin hacks to `expo-build-properties` with `android.kotlinVersion: '2.0.20'` and removed the `forceKotlin` plugin.
  - Accepted that local Windows `expo prebuild` has a `files.map is not a function` bug; rely on EAS’s Linux prebuild instead.

---

### 3. Supabase client (shared web + mobile)

- **Unified Supabase client** (`lib/supabase/client.ts`):
  - Uses `createBrowserClient` from `@supabase/ssr` plus a mobile-specific client from `lib/supabase/mobile`.
  - Prefers **Expo-style env vars** for mobile:
    - `EXPO_PUBLIC_SUPABASE_URL || NEXT_PUBLIC_SUPABASE_URL`
    - `EXPO_PUBLIC_SUPABASE_ANON_KEY || NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Supports a **test/bypass mode** (for QA/dev) that returns a mocked user and session.

- **Mobile-specific module** (`lib/supabase/mobile.ts`):
  - `createMobileClient`:
    - Uses Capacitor/Preferences-like storage or falls back to `localStorage` / in-memory map.
    - Reads Supabase env from `EXPO_PUBLIC_*` first, then `NEXT_PUBLIC_*`.
    - Uses implicit auth flow (`flowType: "implicit"`) with `detectSessionInUrl: false` (deep linking handled manually).
  - `getAuthCallbackUrl(redirectPath)`:
    - Builds a web callback URL using `NEXT_PUBLIC_APP_URL || "http://localhost:3000"`.
    - Works in both browser and React Native (does not assume `window.location` exists; falls back cleanly).
  - `getAppScheme()`:
    - Returns the mobile deep link scheme (currently `"carryspace://"`), used for routing back into the app from the web callback.

- **Env loading for mobile**
  - Verified that `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`:
    - Are loaded from `.env.local` / `.env` when running `npx expo start --dev-client`.
    - Are logged as `SET` when the mobile app boots.

---

### 4. Auth hook and mobile auth screens

- **Shared auth hook** (`packages/hooks/useAuth.ts`):
  - Provides:
    - `user`, `session`, `loading`, `error` state.
    - Methods: `signIn`, `signUp`, `signOut`, `signInWithMagicLink`, `signInWithOAuth`.
  - Environment / dev mode:
    - `isDevModeEnabled()` checks `EXPO_PUBLIC_DEV_MODE` and `NEXT_PUBLIC_DEV_MODE`.
    - In dev mode, returns a mocked user and session without network calls.
    - Dev mode is **off by default** for mobile unless `EXPO_PUBLIC_DEV_MODE === "true"`.
  - Uses the unified Supabase client and `getAuthCallbackUrl('/home')` to ensure web + mobile share the same `/auth/callback` redirect.
  - `signInWithMagicLink`:
    - Calls `supabase.auth.signInWithOtp` with `emailRedirectTo` = shared callback URL and `shouldCreateUser: true`.
  - `signInWithOAuth`:
    - Calls `supabase.auth.signInWithOAuth(provider, { redirectTo })`.
    - If the Supabase JS client returns a `data.url` on React Native, it now **opens it via `Linking.openURL(data.url)`** so the system browser shows Google’s OAuth page.
    - Resets `loading` after attempting to open the URL; further navigation happens via browser/deep link.

- **Mobile login screen** (`apps/mobile/app/auth/login.tsx`):
  - UI features:
    - Toggle between **magic link** and **password** login.
    - Email input (always visible) and password input (for password mode).
    - Button that shows **“Send magic link”** or **“Login”**, with `loading` state.
    - Google sign-in button (“Sign in with Google”).
    - Link to `auth/signup` (“Need an account? Sign up”).
  - Error handling:
    - Shows `Alert.alert` messages for failed password or magic link attempts.
    - Delegates OAuth errors to `signInWithOAuth` (which sets `state.error` and logs).

- **Mobile signup screen** (`apps/mobile/app/auth/signup.tsx`):
  - Simple email/password sign-up using `useAuth().signUp` with alerts for errors and success.

- **Routing / guards** (`apps/mobile/app/_layout.tsx`):
  - Uses `useAuth` and Expo Router segments to:
    - Redirect unauthenticated users from `(tabs)` to `auth/login`.
    - Avoid auto-skipping auth unless dev mode is explicitly on.

---

### 5. Other plumbing & fixes

- **Push notifications hook** (`packages/hooks/usePushNotifications.ts`):
  - Uses `EXPO_PUBLIC_EAS_PROJECT_ID` or `EAS_PROJECT_ID` if set.
  - Falls back to `Constants.expoConfig.extra.eas.projectId` when env vars are missing.
- **Shipping & modules**:
  - `lib/services/shipping.ts` now successfully loads JSON assets thanks to Metro `watchFolders` including `assets`.
  - `modules/autoMeasure` and other custom modules are resolved from the monorepo root via Metro.
- **Logging / diagnostics**:
  - Entry logging in `apps/mobile/index.js` confirms one-time module evaluation and AppRegistry registration.
  - Auth and navigation logs show when screens are focused and when unauthenticated users are redirected.

---

## Remaining TODOs for Production / Store Release

### 1. Finalize and verify all auth flows end-to-end

- **Google OAuth (mobile)**  
  _Goal: Sign in with Google from the mobile app should open the browser, complete OAuth, and return to the app authenticated._

Steps:

- Confirm in Supabase dashboard:
  - Google provider is enabled with correct client ID/secret.
  - Redirect URLs include your `/auth/callback` (both production and local dev URLs).
- On a real device with the dev client:
  - Tap **“Sign in with Google”**.
  - Verify:
    - The **system browser opens** to Google’s login page.
    - After login, you’re redirected to `/auth/callback` and eventually back into the app via the deep link scheme.
  - If the app doesn’t re-open:
    - Confirm deep link configuration in `app.config.ts` (scheme, host) matches `getAppScheme()` in `lib/supabase/mobile.ts`.
    - Confirm the web `/auth/callback` route redirects to the correct deep link when it detects a mobile user agent or platform.

- **Magic link (email)**  
  _Goal: Sending a magic link from mobile should send an email and logging in via that link should end with an authenticated session in the app._

Steps:

- From the mobile login screen (magic link mode):
  - Enter an email and press “Send magic link”.
  - Confirm:
    - An email is actually delivered from Supabase.
    - Clicking the link:
      - Opens browser → `/auth/callback`.
      - Sets a Supabase session.
      - Redirects into the app via the deep link scheme.
- If “Magic link failed: error sending magic link email” appears:
  - Capture the **exact Supabase error message**.
  - Check Supabase **SMTP / Resend** settings: API key, from email, and domain configuration.

- **Password login & sign-up**
  _Goal: Mobile password login should behave exactly like web, against the same Supabase project._

Steps:

- Confirm `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `apps/mobile/.env` match the production web values.
- On device:
  - Use a known-good email/password from web → login should succeed and navigate to `(tabs)`.
  - Use the mobile sign-up flow to create a new user; verify sign-in on web with the same credentials.
- If you still see “incorrect credentials” or “already a user” when that’s not expected:
  - Log the raw Supabase error (status code & message).
  - Check Supabase Auth settings (password policies, email confirmation requirements, sign-up restrictions).

---

### 2. Deep linking & auth callback routing

_Goal: Auth flows via web (magic links, Google) should reliably drop users into the correct screen in the native app._

Steps:

- In `app.config.ts`:
  - Verify the app scheme (`carryspace://` or final choice) and any associated URL patterns are configured for Android and iOS.
- On the web side (`/auth/callback` route):
  - Ensure it can recognize when the user is on mobile and redirect to the app’s scheme (e.g., `carryspace://auth/callback?...` or directly to `/home` in-app).
- Test both:
  - Magic link login from email on a device.
  - Google OAuth login from the device.

---

### 3. Native features and stability (camera, auto-measure, etc.)

_Goal: All core native features behave reliably on both platforms._

Steps:

- Camera / Auto-Measure:
  - Run through the full flow on at least one Android and one iOS device.
  - Confirm permissions dialogs, camera preview, measurements, and uploads all work.
  - Investigate and address any `Unable to activate keep awake` or related warnings if they cause user-visible problems.
- Other native integrations:
  - Verify push notifications (using `usePushNotifications`) obtain a token and receive a test notification.
  - Confirm any file pickers, geolocation, and other native modules are working.

---

### 4. Production EAS builds & store submission

_Goal: Produce App Store / Play Store-ready binaries and publish._

Steps:

- **EAS profiles & builds**
  - Confirm `eas.json` has:
    - `development` with `developmentClient: true` for dev builds.
    - `preview` and `production` for release builds (no dev client).
  - Run:
    - `eas build --platform android --profile production`.
    - `eas build --platform ios --profile production`.
- **Store assets & metadata**
  - Prepare and attach:
    - Icons, splash screens.
    - Screenshots, descriptions, categories.
    - Bundle IDs / package names consistent with App Store Connect & Google Play Console.
  - Ensure versioning is aligned (using `appVersionSource: "remote"` and updating versions when needed).

---

### 5. Final QA & polish

_Goal: High confidence in stability and UX before launch._

Steps:

- Full regression pass on mobile:
  - Onboarding & auth (all flows).
  - Core flows: creating shipments, auto-measure, tracking, payments, and history.
  - Settings, notifications, and account management.
- Test on multiple devices and network conditions:
  - At least one lower-end Android device and one modern iPhone.
  - Slow and spotty networks to check error handling and loading states.
- Confirm analytics / crash reporting (e.g., Sentry) capture errors and key metrics.

---

### How to use this document next time

When resuming work:

- **Point the assistant to** `MOBILE_APP_STATUS.md` in the repo root.
- State which section you want to focus on (e.g., “finish Google OAuth,” “test magic links end-to-end,” or “prepare production EAS build”).
  This file contains the authoritative snapshot of what’s already done and what’s left to reach App Store / Play Store readiness.
