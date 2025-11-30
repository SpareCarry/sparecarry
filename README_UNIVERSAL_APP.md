# SpareCarry - Universal App (Web + iOS + Android)

SpareCarry is now a **universal application** that runs on Web (Next.js), iOS (Expo), and Android (Expo) with shared code.

## 🏗️ Project Structure

```
/
├── apps/
│   └── mobile/              # Expo mobile app (iOS + Android)
│       ├── app/             # Expo Router app directory
│       ├── package.json
│       ├── app.json
│       ├── app.config.ts
│       └── eas.json         # EAS Build configuration
│
├── packages/
│   ├── lib/                 # Shared utilities
│   │   ├── supabase/       # Universal Supabase client
│   │   ├── realtime/        # RealtimeManager (MAX 5 channels)
│   │   ├── platform.ts     # Platform detection (isWeb, isMobile, etc.)
│   │   └── package.json
│   ├── hooks/               # Universal React hooks
│   │   ├── useRealtime.ts  # Realtime subscriptions
│   │   ├── useLocation.ts  # GPS/location (web + mobile)
│   │   ├── useCamera.ts    # Camera access (web + mobile)
│   │   └── package.json
│   └── ui/                  # Universal UI components
│       ├── CameraButton.*   # Platform-specific variants
│       ├── MapView.*        # Platform-specific variants
│       └── package.json
│
├── pnpm-workspace.yaml      # PNPM workspace configuration
└── package.json             # Root workspace package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js 22+ (see `package.json` engines)
- pnpm 8.15.0+
- For mobile: Expo CLI (`npm install -g expo-cli`)

### Installation

```bash
# Install all dependencies (workspace + apps + packages)
pnpm install
```

### Environment Variables

Create `.env.local` in the root directory:

```env
# Supabase (required for both web and mobile)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# For mobile app (Expo)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Stripe (web only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Other variables...
NEXT_PUBLIC_APP_URL=https://sparecarry.com
NEXT_PUBLIC_APP_ENV=development
```

## 🖥️ Running the Web App

The existing Next.js app runs at the root level:

```bash
# Development
pnpm dev:web
# or
pnpm dev

# Production build
pnpm build:web
# or
pnpm build

# Start production server
pnpm start
```

Visit: http://localhost:3000

## 📱 Running the Mobile App

### Development (Expo Go)

```bash
# Start Expo dev server
pnpm dev:mobile

# Or from mobile directory
cd apps/mobile
pnpm start
```

Then:

- **iOS**: Scan QR code with Camera app (opens in Expo Go)
- **Android**: Scan QR code with Expo Go app

### Building for Production

#### Using EAS Build (Recommended)

```bash
# Build for Android
pnpm eas:build:android

# Build for iOS
pnpm eas:build:ios

# Build for both
pnpm eas:build:all
```

#### Build Profiles

- **development**: Development client build (for testing)
- **preview**: Internal distribution (APK/IPA)
- **production**: App Store / Play Store builds

See `apps/mobile/eas.json` for configuration.

## 📦 Workspace Packages

### `@sparecarry/lib`

Shared utilities and Supabase client.

```typescript
import { createClient } from "@sparecarry/lib/supabase";
import { RealtimeManager } from "@sparecarry/lib/realtime";
import { isWeb, isMobile, isAndroid, isIOS } from "@sparecarry/lib/platform";
```

### `@sparecarry/hooks`

Universal React hooks.

```typescript
import { useRealtime, useLocation, useCamera } from "@sparecarry/hooks";
```

### `@sparecarry/ui`

Universal UI components with platform variants.

```typescript
import { CameraButton, MapView } from "@sparecarry/ui";
```

## 🔧 RealtimeManager (Supabase Realtime)

**Critical**: RealtimeManager now enforces a **MAX of 5 channels** to prevent quota issues.

### Initialization

```typescript
import { createClient } from "@sparecarry/lib/supabase";
import { RealtimeManager } from "@sparecarry/lib/realtime";

// Initialize in your app root (once)
const supabase = createClient();
RealtimeManager.setSupabaseClient(supabase);
```

### Usage

```typescript
import { useRealtime } from "@sparecarry/hooks";

function MyComponent() {
  useRealtime({
    table: "messages",
    callback: (payload) => {
      console.log("New message:", payload);
    },
  });
}
```

### Direct Usage (Advanced)

```typescript
import { RealtimeManager } from "@sparecarry/lib/realtime";

// Listen
const channelName = RealtimeManager.listen(
  { table: "messages", event: "INSERT" },
  (payload) => {
    console.log("New message:", payload);
  }
);

// Remove
RealtimeManager.remove(channelName, callback);
```

## 📍 Location (GPS)

```typescript
import { useLocation, getCurrentLocation } from "@sparecarry/hooks";

function MyComponent() {
  const { location, loading, error } = useLocation({
    enabled: true,
    watch: true, // Continuous updates
  });

  // Or one-time
  const handleGetLocation = async () => {
    const loc = await getCurrentLocation();
    console.log(loc.latitude, loc.longitude);
  };
}
```

**Platforms**:

- **Web**: Uses `navigator.geolocation`
- **Mobile**: Uses `expo-location` with permission handling

## 📷 Camera

```typescript
import { useCamera } from "@sparecarry/hooks";

function MyComponent() {
  const { takePicture, pickImage, loading } = useCamera();

  const handleCapture = async () => {
    const result = await takePicture();
    if (result) {
      console.log("Photo:", result.uri);
    }
  };
}
```

**Platforms**:

- **Web**: Uses `<input type="file">`
- **Mobile**: Uses `expo-image-picker` with permission handling

## 🎨 Platform-Specific Components

Components automatically resolve to the correct platform variant:

```
CameraButton.tsx          # Universal (exports web by default)
CameraButton.web.tsx     # Web implementation
CameraButton.native.tsx   # iOS/Android implementation
```

**Usage**:

```typescript
import { CameraButton } from '@sparecarry/ui';

// Automatically uses .web.tsx on web, .native.tsx on mobile
<CameraButton onCapture={(result) => console.log(result)} />
```

## 🔐 Authentication

### Web (Next.js)

Uses existing Next.js auth flow with Supabase SSR.

### Mobile (Expo)

Uses Expo SecureStore for token persistence.

```typescript
import { createClient } from "@sparecarry/lib/supabase";

const supabase = createClient();

// Sign in
await supabase.auth.signInWithPassword({ email, password });

// Sign out
await supabase.auth.signOut();
```

## 📱 Push Notifications

### Setup

1. Configure in `apps/mobile/app.json`:

```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/icon.png",
        "color": "#14b8a6"
      }
    ]
  ]
}
```

2. Register for push tokens:

```typescript
import * as Notifications from "expo-notifications";

const token = await Notifications.getExpoPushTokenAsync();
// Send token to your backend
```

3. Handle notifications:

```typescript
Notifications.addNotificationReceivedListener((notification) => {
  console.log("Notification:", notification);
});
```

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests (Playwright)
pnpm test:e2e

# Type checking
pnpm typecheck
```

## 📚 Documentation

- **Migration Summary**: `docs/UNIVERSAL_APP_MIGRATION_SUMMARY.md`
- **Migration Plan**: `docs/UNIVERSAL_APP_MIGRATION_PLAN.md`
- **RealtimeManager**: See `packages/lib/realtime/RealtimeManager.ts`

## ⚠️ Important Notes

1. **RealtimeManager MAX_CHANNELS = 5**: This is enforced to prevent Supabase quota issues. If you need more channels, contact the team.

2. **Platform Detection**: Always use `isWeb`, `isMobile`, `isAndroid`, `isIOS` from `@sparecarry/lib/platform` instead of checking `typeof window`.

3. **Workspace Packages**: All packages use `workspace:*` protocol. Run `pnpm install` after adding new packages.

4. **Existing Next.js App**: The web app remains at the root level. It will be migrated to use the new packages gradually.

## 🐛 Troubleshooting

### Mobile app won't start

```bash
cd apps/mobile
pnpm install
pnpm start --clear
```

### RealtimeManager errors

Make sure to initialize RealtimeManager with Supabase client:

```typescript
RealtimeManager.setSupabaseClient(createClient());
```

### Workspace packages not found

```bash
# Reinstall all dependencies
pnpm install

# Clear cache
pnpm store prune
```

## 📝 License

Private - SpareCarry
