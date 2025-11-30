# Expo 500 Error + Module Resolution Issue - Updated Context

## CURRENT STATUS

**Progress Made:**

- ✅ Fixed React version (19.1.0 → 18.3.1) - PlatformConstants error resolved
- ✅ Created `apps/mobile/index.js` entry shim
- ✅ Updated Metro config for monorepo
- ✅ Moved react/react-native to peerDependencies in workspace packages
- ✅ Clean reinstall completed

**NEW ERROR:**

- **500 Internal Server Error** on phone when trying to load app
- **Metro Bundling Error**: `Unable to resolve "../../../../lib/services/shipping"`

## ERROR DETAILS

### Metro Bundling Error

```
Android Bundling failed 13868ms apps\mobile\index.js (1663 modules)

Unable to resolve "../../../../lib/services/shipping" from "apps\mobile\app\(tabs)\shipping-estimator.tsx"

  23 |   type ShippingEstimateInput,
  24 |   getAvailableCouriers,
> 25 | } from '../../../../lib/services/shipping';
     |         ^
```

### Expo Version Mismatch Warning

```
The following packages should be updated for best compatibility with the installed expo version:
  react@18.3.1 - expected version: 19.1.0
  react-dom@18.3.1 - expected version: 19.1.0
  react-native@0.76.0 - expected version: 0.81.5
```

**Note**: We intentionally downgraded React to 18.3.1 to fix PlatformConstants error. This warning is expected but may be causing issues.

## PROJECT STRUCTURE

### Monorepo Layout

```
C:\SpareCarry\
├── apps/
│   └── mobile/          # Expo app
│       ├── index.js      # NEW: Entry shim
│       ├── app/
│       │   └── (tabs)/
│       │       └── shipping-estimator.tsx  # ERROR: imports from root lib
│       └── metro.config.js
├── packages/
│   ├── ui/              # React Native components
│   ├── hooks/           # React hooks
│   └── lib/             # Shared utilities (doesn't have shipping service)
└── lib/                  # Root-level lib folder (has shipping service)
    └── services/
        └── shipping.ts   # Shipping service (NOT in packages/lib)
```

### The Problem

**shipping-estimator.tsx** is trying to import from:

```typescript
import { ... } from '../../../../lib/services/shipping';
```

This relative path goes:

- `apps/mobile/app/(tabs)/` → up 4 levels → `C:\SpareCarry\lib/services/shipping`

**But Metro bundler cannot resolve this** because:

1. The `lib` folder is at the root, outside the mobile app structure
2. Metro's `watchFolders` may not include the root `lib` folder
3. Relative paths from deep in app structure are fragile

## CURRENT CONFIGURATION

### apps/mobile/metro.config.js

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = path.resolve(__dirname);
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [
  path.resolve(workspaceRoot, "packages"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
  ],
  extraNodeModules: new Proxy(
    {},
    {
      get: (_, name) => path.join(projectRoot, "node_modules", name),
    }
  ),
  sourceExts: [...config.resolver.sourceExts, "cjs", "ts", "tsx"],
};
```

### apps/mobile/package.json

```json
{
  "main": "./index.js",
  "dependencies": {
    "@sparecarry/lib": "file:C:\\SpareCarry\\packages\\lib",
    "@sparecarry/ui": "file:C:\\SpareCarry\\packages\\ui",
    "@sparecarry/hooks": "file:C:\\SpareCarry\\packages\\hooks"
  }
}
```

## WHAT WE'VE TRIED

1. ✅ Created `apps/mobile/index.js` entry shim
2. ✅ Updated Metro config with monorepo-friendly settings
3. ✅ Moved react/react-native to peerDependencies
4. ✅ Clean reinstall
5. ⚠️ Added `lib` to watchFolders (may not be enough)

## THE CORE ISSUE

**The shipping service is in the wrong location for a monorepo:**

- It's in `lib/services/shipping.ts` (root level)
- It should be in `packages/lib/services/shipping.ts` (workspace package)
- OR Metro needs to be configured to resolve root `lib` folder properly

## REQUEST

Provide a solution that:

1. **Fixes the module resolution error** for `lib/services/shipping`
   - Option A: Move shipping service to `packages/lib` and export it
   - Option B: Configure Metro to properly resolve root `lib` folder
   - Option C: Create a Metro alias/resolver for the root lib folder

2. **Addresses the 500 error** (likely caused by the bundling failure)

3. **Handles the Expo version mismatch warning**
   - Should we ignore it? (React 18.3.1 is correct for Expo SDK 54)
   - Or is there a way to suppress the warning?

4. **Maintains monorepo best practices**
   - Services should ideally be in workspace packages
   - But if root `lib` must be used, ensure Metro can resolve it

## ADDITIONAL CONTEXT

- The shipping service (`lib/services/shipping.ts`) is a large file (1000+ lines)
- It imports from other root-level files (`src/constants/shippingFees.ts`, `lib/utils/plane-restrictions.ts`)
- Moving it to `packages/lib` would require updating all its imports
- The mobile app is the only consumer of this service currently

## FILES TO CHECK

- `lib/services/shipping.ts` - The service file
- `apps/mobile/app/(tabs)/shipping-estimator.tsx` - The file with the import error
- `packages/lib/index.ts` - Current exports (doesn't include shipping)
- `apps/mobile/metro.config.js` - Metro configuration

Please provide the best solution considering:

- Minimal code changes
- Proper monorepo structure
- Metro bundler compatibility
- Fast iteration (avoid breaking other parts of the app)
