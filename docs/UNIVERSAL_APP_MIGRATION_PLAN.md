# Universal App Migration Plan

## PHASE 0 - ANALYSIS COMPLETE

### Current State

- **Framework**: Next.js 14.2.5 (Web only)
- **Mobile**: Capacitor (not Expo)
- **Structure**: Flat monorepo (not organized)
- **RealtimeManager**: Already exists in `lib/realtime/RealtimeManager.ts`
- **Supabase Client**: Unified client in `lib/supabase/client.ts` with mobile support

### Key Findings

1. **RealtimeManager exists** but needs to be moved to shared packages
2. **Supabase client** already has mobile detection
3. **No Expo setup** - currently using Capacitor
4. **No monorepo structure** - everything is flat

### Migration Strategy

- Convert from Capacitor to Expo (as requested)
- Create monorepo structure
- Move shared code to packages
- Keep web app working during migration
- Add Expo mobile app alongside

## PHASE 1 - MONOREPO STRUCTURE

### Target Structure

```
/
├── apps/
│   ├── web/              # Current Next.js app (migrated)
│   └── mobile/           # New Expo app
├── packages/
│   ├── ui/               # Universal UI components
│   ├── hooks/            # Shared React hooks
│   └── lib/              # Shared utilities (Supabase, RealtimeManager, etc.)
├── package.json          # Root workspace config
└── pnpm-workspace.yaml   # PNPM workspace config
```

## PHASE 2-15 - Implementation Phases

See individual phase implementations below.
