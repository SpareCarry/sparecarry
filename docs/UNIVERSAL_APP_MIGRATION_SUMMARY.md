# Universal App Migration Summary

## ✅ Completed Phases

### PHASE 0 - Analysis ✅
- Analyzed current project structure (Next.js + Capacitor)
- Identified components using DOM APIs
- Created migration plan

### PHASE 1 - Monorepo Structure ✅
- Created `packages/lib` - Shared utilities (Supabase, RealtimeManager, platform detection)
- Created `packages/hooks` - Universal React hooks (useRealtime, useLocation, useCamera)
- Created `packages/ui` - Universal UI components with platform variants
- Created `apps/mobile` - Expo mobile app structure
- Added `pnpm-workspace.yaml` for workspace management

### PHASE 3 - Shared Supabase Client ✅
- Created `packages/lib/supabase/client.ts` - Universal client for web and Expo
- Supports both web (localStorage) and mobile (Expo SecureStore)
- Auto-detects platform and uses appropriate storage

### PHASE 4 - RealtimeManager Fix ✅
- Moved RealtimeManager to `packages/lib/realtime/RealtimeManager.ts`
- **Reduced MAX_CHANNELS from 10 to 5** for quota compliance
- Added `setSupabaseClient()` method for initialization
- Maintains all existing features (deduplication, cleanup, logging)

### PHASE 5 - Universal UI Components ✅
- Created `CameraButton` with `.web.tsx` and `.native.tsx` variants
- Created `MapView` with `.web.tsx` and `.native.tsx` variants
- Platform-specific files automatically resolved by bundlers

### PHASE 7 - GPS/Location Hook ✅
- Created `packages/hooks/useLocation.ts`
- Web: Uses `navigator.geolocation`
- Mobile: Uses `expo-location`
- Handles permissions automatically

### PHASE 8 - Camera Hook ✅
- Created `packages/hooks/useCamera.ts`
- Web: Uses `<input type="file">`
- Mobile: Uses `expo-image-picker`
- Supports both camera capture and gallery selection

### PHASE 2 - Expo Mobile App ✅
- Created `apps/mobile` with Expo Router
- Configured TypeScript, Babel, Metro
- Added basic app structure with tabs and auth screens
- Integrated RealtimeManager initialization

## 📋 Remaining Phases

### PHASE 6 - Universal Auth Flows
- Update auth screens to work across platforms
- Implement OAuth redirects for mobile
- Share auth state between web and mobile

### PHASE 9 - Push Notifications
- Configure Expo Notifications
- Set up FCM for Android
- Add push token registration

### PHASE 10 - Platform-Specific Screens
- Organize screens into `(web-only)`, `(mobile-only)`, `(universal)` folders
- Add platform detection helpers

### PHASE 11 - Performance Optimization
- Memoize expensive components
- Add request debouncing
- Lazy load screens
- Optimize RealtimeManager event batching

### PHASE 12 - Build + Dev Workflow
- Add workspace scripts to root `package.json` ✅ (partially done)
- Configure EAS build profiles ✅ (done)
- Add development commands

### PHASE 13 - Testing
- Add tests for RealtimeManager
- Add tests for useLocation
- Add tests for CameraButton

### PHASE 14 - Documentation
- Update README with monorepo structure
- Document how to run web vs mobile
- Document build commands
- Document RealtimeManager usage

### PHASE 15 - Final Safety Check
- Run type-check, lint, build
- Validate RealtimeManager < 5 channels
- Test both web and mobile
- Produce final summary

## 📁 New File Structure

```
/
├── apps/
│   └── mobile/              # Expo mobile app
│       ├── app/             # Expo Router app directory
│       ├── package.json
│       ├── app.json
│       ├── app.config.ts
│       ├── tsconfig.json
│       ├── babel.config.js
│       ├── metro.config.js
│       └── eas.json
├── packages/
│   ├── lib/                 # Shared utilities
│   │   ├── supabase/       # Universal Supabase client
│   │   ├── realtime/        # RealtimeManager (MAX 5 channels)
│   │   ├── platform.ts     # Platform detection
│   │   └── package.json
│   ├── hooks/               # Universal React hooks
│   │   ├── useRealtime.ts
│   │   ├── useLocation.ts
│   │   ├── useCamera.ts
│   │   └── package.json
│   └── ui/                  # Universal UI components
│       ├── CameraButton.web.tsx
│       ├── CameraButton.native.tsx
│       ├── MapView.web.tsx
│       ├── MapView.native.tsx
│       └── package.json
├── pnpm-workspace.yaml      # PNPM workspace config
└── package.json             # Root workspace (updated with new scripts)
```

## 🔧 Key Changes

### RealtimeManager
- **Location**: `packages/lib/realtime/RealtimeManager.ts`
- **MAX_CHANNELS**: Reduced to **5** (from 10)
- **Initialization**: Must call `RealtimeManager.setSupabaseClient(client)` before use
- **Usage**: Import from `@sparecarry/lib/realtime`

### Supabase Client
- **Location**: `packages/lib/supabase/client.ts`
- **Universal**: Works for both web and Expo
- **Storage**: Web uses localStorage, Mobile uses Expo SecureStore
- **Usage**: Import from `@sparecarry/lib/supabase`

### Hooks
- **Location**: `packages/hooks/`
- **useRealtime**: Auto-subscribe/unsubscribe, uses RealtimeManager
- **useLocation**: Universal location hook (web + mobile)
- **useCamera**: Universal camera hook (web + mobile)
- **Usage**: Import from `@sparecarry/hooks`

## 🚀 Next Steps

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Run web app** (existing Next.js app):
   ```bash
   pnpm dev:web
   ```

3. **Run mobile app** (new Expo app):
   ```bash
   pnpm dev:mobile
   ```

4. **Build mobile app**:
   ```bash
   pnpm eas:build:android
   pnpm eas:build:ios
   ```

5. **Migrate existing code**:
   - Update imports to use `@sparecarry/lib`, `@sparecarry/hooks`, `@sparecarry/ui`
   - Replace direct `supabase.channel()` calls with `RealtimeManager.listen()`
   - Initialize RealtimeManager with Supabase client in app root

## ⚠️ Important Notes

- **Existing Next.js app is NOT moved** - It remains at the root for now
- **RealtimeManager MAX_CHANNELS is now 5** - This should prevent quota issues
- **All packages use workspace protocol** - `workspace:*` in package.json
- **Platform detection** - Use `isWeb`, `isMobile`, `isAndroid`, `isIOS` from `@sparecarry/lib/platform`

## 📝 TODO

- [ ] Migrate existing Next.js app to use new packages
- [ ] Update all `supabase.channel()` calls to use RealtimeManager
- [ ] Initialize RealtimeManager in Next.js app root
- [ ] Add push notifications setup
- [ ] Complete auth flow migration
- [ ] Add comprehensive tests
- [ ] Update documentation

