# Feature Flags System

**Date**: November 20, 2025  
**Status**: ✅ **FEATURE FLAGS SYSTEM COMPLETE**

---

## Overview

SpareCarry uses **Unleash** (open-source) for feature flag management, with optional support for **LaunchDarkly**. Feature flags allow you to enable/disable features without code deployments, perform gradual rollouts, and quickly disable features in emergencies.

---

## 1. Architecture

### Components

- **Unleash Server**: Self-hosted or cloud-hosted feature flag service
- **Client SDK**: React provider and hooks for accessing flags
- **Admin UI**: Web interface for managing flags
- **Caching**: Local storage (web) and Capacitor Preferences (mobile)

### Default Feature Flags

- `enable_push_notifications` - Enable push notifications (default: off)
- `email_notifications` - Enable email notifications (default: off)
- `dispute_refund_flow` - Enable dispute and refund flow (default: off)
- `emergency_toggle_push` - Emergency toggle for push notifications (default: off)

---

## 2. Setup

### Option A: Self-Hosted Unleash (Recommended for Development)

#### Using Docker Compose

1. **Start Unleash Server:**

   ```bash
   docker-compose -f docker-compose.unleash.yml up -d
   ```

2. **Access Unleash UI:**
   - URL: http://localhost:4242
   - Username: `admin`
   - Password: `unleash4all` (change immediately!)

3. **Create API Token:**
   - Go to Settings → API Access
   - Create a new token with "Client" type
   - Copy the token

4. **Configure Environment Variables:**
   ```env
   NEXT_PUBLIC_UNLEASH_URL=http://localhost:4242
   NEXT_PUBLIC_UNLEASH_CLIENT_KEY=your-client-token
   NEXT_PUBLIC_UNLEASH_ADMIN_KEY=your-admin-token
   ```

#### Manual Setup

1. **Install Unleash:**

   ```bash
   npm install -g unleash-server
   ```

2. **Start Unleash:**

   ```bash
   unleash-server
   ```

3. **Follow Docker Compose steps above for configuration**

### Option B: Unleash Cloud

1. **Sign up**: https://www.getunleash.io/
2. **Create a project**
3. **Get API tokens** from Settings
4. **Configure environment variables:**
   ```env
   NEXT_PUBLIC_UNLEASH_URL=https://your-instance.getunleash.io
   NEXT_PUBLIC_UNLEASH_CLIENT_KEY=your-client-token
   NEXT_PUBLIC_UNLEASH_ADMIN_KEY=your-admin-token
   ```

### Option C: LaunchDarkly (Alternative)

1. **Sign up**: https://launchdarkly.com/
2. **Create a project**
3. **Get Client-side ID** from Settings
4. **Install SDK:**
   ```bash
   pnpm add launchdarkly-js-client-sdk
   ```
5. **Configure environment variables:**
   ```env
   NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID=your-client-id
   ```
6. **Update provider** to use LaunchDarkly:
   ```typescript
   import { initializeLaunchDarkly } from "@/lib/flags/launchdarklyClient";
   ```

---

## 3. Usage

### In React Components

#### Basic Usage

```tsx
import { useFlag } from "@/app/providers/FeatureFlagProvider";

function MyComponent() {
  const pushEnabled = useFlag("enable_push_notifications");

  if (!pushEnabled) {
    return <div>Push notifications are disabled</div>;
  }

  return <PushNotificationSettings />;
}
```

#### With Default Value

```tsx
const emailEnabled = useFlag("email_notifications", false);
```

#### Get Full Flag Object

```tsx
import { useFeatureFlag } from "@/app/providers/FeatureFlagProvider";

function MyComponent() {
  const flag = useFeatureFlag("dispute_refund_flow");

  if (flag?.enabled) {
    return <DisputeFlow variant={flag.variant} />;
  }

  return null;
}
```

#### Access All Flags

```tsx
import { useFeatureFlags } from "@/app/providers/FeatureFlagProvider";

function AdminPanel() {
  const { flags, isLoading, refresh } = useFeatureFlags();

  return (
    <div>
      {Array.from(flags.entries()).map(([key, flag]) => (
        <div key={key}>
          {key}: {flag.enabled ? "Enabled" : "Disabled"}
        </div>
      ))}
    </div>
  );
}
```

### In Server-Side Code

```typescript
import { isFeatureEnabled } from "@/lib/flags/unleashClient";

// Initialize first (in API route or middleware)
await initializeUnleash(
  {
    url: process.env.UNLEASH_URL!,
    clientKey: process.env.UNLEASH_CLIENT_KEY!,
  },
  userId,
  { email: userEmail }
);

// Check flag
if (isFeatureEnabled("email_notifications")) {
  await sendEmail();
}
```

### In API Routes

```typescript
import { NextRequest, NextResponse } from "next/server";
import { isFeatureEnabled } from "@/lib/flags/unleashClient";

export async function POST(request: NextRequest) {
  // Check feature flag
  if (!isFeatureEnabled("dispute_refund_flow")) {
    return NextResponse.json(
      { error: "Dispute flow is not enabled" },
      { status: 403 }
    );
  }

  // Process dispute...
}
```

---

## 4. Adding New Feature Flags

### Step 1: Define Flag in Code

Add to `app/_admin/feature-flags/page.tsx`:

```typescript
const DEFAULT_FLAGS: FlagDefinition[] = [
  // ... existing flags
  {
    key: "new_feature",
    name: "New Feature",
    description: "Enable new feature",
    defaultValue: false,
  },
];
```

### Step 2: Create Flag in Unleash

1. Go to Unleash UI
2. Click "Add feature toggle"
3. Enter:
   - Name: `new_feature`
   - Description: "Enable new feature"
   - Toggle type: Release
4. Click "Create feature toggle"

### Step 3: Use Flag in Code

```tsx
const newFeatureEnabled = useFlag("new_feature");
```

---

## 5. Rollout Strategies

### Gradual Rollout

1. **Enable for 10% of users:**
   - Go to feature flag in Unleash
   - Add strategy: "Gradual rollout"
   - Set percentage: 10%

2. **Enable for specific users:**
   - Add strategy: "User with ID"
   - Enter user IDs

3. **Enable for specific segments:**
   - Create segment in Unleash
   - Add strategy: "For users with"
   - Select segment

### Canary Release

1. Enable flag for 5% of users
2. Monitor metrics
3. Gradually increase to 50%, then 100%

### Emergency Toggle

```tsx
const emergencyToggle = useFlag("emergency_toggle_push");

if (emergencyToggle) {
  // Disable all push notifications
  return null;
}
```

---

## 6. Admin UI

### Access Admin Page

Navigate to: `/admin/feature-flags`

### Features

- View all feature flags
- Toggle flags on/off
- See current server state
- Save changes
- Reset to defaults

### Permissions

**Note**: In production, protect this route with authentication:

```typescript
// app/_admin/feature-flags/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

export default async function FeatureFlagsPage() {
  const session = await getServerSession();

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  // ... rest of component
}
```

---

## 7. Caching and Fallbacks

### Caching Strategy

- **Web**: LocalStorage (1 hour TTL)
- **Mobile**: Capacitor Preferences (1 hour TTL)
- **Refresh**: Every 30 seconds (configurable)

### Fallback Behavior

If Unleash server is unreachable:

1. **Use cached flags** (if available and < 1 hour old)
2. **Use default values** (safe-off for all flags)
3. **Log warning** to console

### Safe-Off Defaults

All flags default to `false` when service is unreachable:

```typescript
const DEFAULT_FLAGS: Record<string, boolean> = {
  enable_push_notifications: false,
  email_notifications: false,
  dispute_refund_flow: false,
  emergency_toggle_push: false,
};
```

---

## 8. Mobile (Capacitor) Support

### Automatic Detection

The client automatically detects Capacitor and uses Preferences API:

```typescript
if (Capacitor.isNativePlatform()) {
  // Uses Capacitor Preferences
} else {
  // Uses localStorage
}
```

### Offline Support

- Flags cached locally
- Works offline with cached values
- Refreshes when online

---

## 9. Testing

### Unit Tests

```typescript
import { renderHook } from "@testing-library/react";
import { useFlag } from "@/app/providers/FeatureFlagProvider";

test("feature flag defaults to false", () => {
  const { result } = renderHook(() => useFlag("test_flag"));
  expect(result.current).toBe(false);
});
```

### Integration Tests

```typescript
// Mock Unleash client
jest.mock("@/lib/flags/unleashClient", () => ({
  isFeatureEnabled: jest.fn(() => true),
}));
```

### E2E Tests

```typescript
// Enable flag in test environment
await enableFeatureFlag("test_flag");

// Test feature
await page.click('[data-testid="new-feature-button"]');
```

---

## 10. Best Practices

### 1. Always Provide Defaults

```tsx
// Good
const enabled = useFlag("feature", false);

// Bad
const enabled = useFlag("feature"); // May be undefined
```

### 2. Use Descriptive Flag Names

```tsx
// Good
useFlag("enable_push_notifications");

// Bad
useFlag("push");
```

### 3. Document Flags

Add comments explaining flag purpose:

```tsx
// Emergency toggle to disable all push notifications
// Used during incidents to stop notification spam
const emergencyToggle = useFlag("emergency_toggle_push");
```

### 4. Remove Dead Flags

After feature is fully rolled out:

1. Remove flag check from code
2. Delete flag from Unleash
3. Update documentation

### 5. Monitor Flag Usage

- Track flag toggles in analytics
- Monitor error rates when flags change
- Set up alerts for flag failures

---

## 11. Troubleshooting

### Flags Not Updating

1. **Check network connection**
2. **Verify Unleash URL and key**
3. **Check browser console for errors**
4. **Clear cache:**
   ```javascript
   localStorage.removeItem("sparecarry_feature_flags");
   ```

### Flags Always False

1. **Check flag exists in Unleash**
2. **Verify flag is enabled in correct environment**
3. **Check user context matches strategy**
4. **Verify API token has correct permissions**

### Mobile Flags Not Working

1. **Check Capacitor Preferences:**

   ```typescript
   import { Preferences } from "@capacitor/preferences";
   const flags = await Preferences.get({ key: "sparecarry_feature_flags" });
   ```

2. **Verify network connectivity**
3. **Check Unleash URL is accessible from mobile**

---

## 12. Security Considerations

### API Keys

- **Client Key**: Public, safe to expose in client code
- **Admin Key**: Secret, only use in server-side code
- **Never commit keys** to version control

### User Context

Only send non-sensitive user data:

```typescript
// Good
await initializeUnleash(config, userId, {
  email: user.email,
  subscription_status: user.subscription_status,
});

// Bad
await initializeUnleash(config, userId, {
  password: user.password, // Never!
  credit_card: user.credit_card, // Never!
});
```

---

## 13. Migration from Hard-Coded Flags

### Before

```tsx
const PUSH_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PUSH === "true";
```

### After

```tsx
const pushEnabled = useFlag("enable_push_notifications");
```

### Benefits

- No deployment needed to change flags
- Gradual rollouts
- Emergency toggles
- A/B testing support

---

## 14. Summary

✅ **Feature Flags System Complete**

- Unleash integration (self-hosted or cloud)
- LaunchDarkly alternative support
- React provider and hooks
- Admin UI for flag management
- Mobile (Capacitor) support
- Caching and fallbacks
- Comprehensive documentation

**Status**: Production-ready feature flag system.

---

**Last Updated**: November 20, 2025
