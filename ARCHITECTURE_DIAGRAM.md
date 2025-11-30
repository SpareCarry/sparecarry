# SpareCarry Architecture & Workflow Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         SPARECARRY APP                          │
│                    (React Native + Next.js)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UNIFIED SERVICES                          │
│  ┌──────────────────┐         ┌──────────────────┐           │
│  │ Location Service │         │ Shipping Service │           │
│  │ (lib/services/   │         │ (lib/services/   │           │
│  │  location.ts)    │         │  shipping.ts)    │           │
│  │                  │         │                  │           │
│  │ • Autocomplete   │         │ • Courier Rates  │           │
│  │ • Reverse Geo    │         │ • Customs Calc   │           │
│  │ • Forward Geo    │         │ • SpareCarry     │           │
│  │ • Caching        │         │   Pricing        │           │
│  │ • Debouncing     │         │ • Platform Fees  │           │
│  └──────────────────┘         └──────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CORE FEATURES                                │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Location   │  │   Shipping   │  │  Messaging   │        │
│  │   System     │  │  Estimator   │  │   System     │        │
│  │              │  │              │  │              │        │
│  │ • Autocomplete│ │ • Price Calc │ │ • Real-time  │        │
│  │ • Map Picker │ │ • Comparison │ │ • Threads     │        │
│  │ • GPS        │ │ • Premium    │ │ • Badges      │        │
│  │ • Marina Snap│ │ • Karma      │ │ • Templates   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Job Post   │  │   Matching   │  │   Payments   │        │
│  │   Creation   │  │   System     │  │   & Stripe   │        │
│  │              │  │              │  │              │        │
│  │ • Forms      │ │ • Score Calc │ │ • Escrow      │        │
│  │ • Validation │ │ • Filters    │ │ • Fees        │        │
│  │ • Photos     │ │ • Ranking    │ │ • Credits     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Database   │  │   Auth        │  │   Storage    │        │
│  │              │  │              │  │              │        │
│  │ • RLS        │ │ • Users      │ │ • Photos     │        │
│  │ • Functions  │ │ • Sessions   │ │ • Documents  │        │
│  │ • Triggers   │ │ • Providers  │ │ • Assets     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Realtime   │  │   Edge       │  │   Functions  │        │
│  │              │  │   Functions  │  │              │        │
│  │ • Messages   │ │ • Webhooks   │ │ • Auto-release│        │
│  │ • Matches    │ │ • Cron Jobs  │ │ • Notifications│        │
│  │ • Updates    │ │ • Processing │ │ • Analytics  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Job Creation

```
User Input
    │
    ▼
┌─────────────────────────────────────┐
│  Post Request Form                  │
│  • Location (cached autocomplete)   │
│  • Dimensions & Weight              │
│  • Shipping Estimator (cached)      │
│  • Validation (Zod)                 │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  Shipping Service                   │
│  • Calculate courier price          │
│  • Calculate SpareCarry price       │
│  • Calculate savings                │
│  • Platform fee (hidden)            │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  Supabase Insert                    │
│  • RLS Policy Check                 │
│  • Validation                       │
│  • Trigger: Update stats            │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  Realtime Broadcast                 │
│  • New request available             │
│  • Match scoring                     │
└─────────────────────────────────────┘
```

## Data Flow: Matching & Messaging

```
New Request Created
    │
    ▼
┌─────────────────────────────────────┐
│  Match Scoring System               │
│  • Route match (40%)                 │
│  • Date match (25%)                  │
│  • Capacity (20%)                    │
│  • Trust (15%)                       │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  Match Created                      │
│  • Trigger: Create conversation     │
│  • Notification sent                │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  Messaging Thread                   │
│  • Real-time updates (Supabase)     │
│  • Unread badges                    │
│  • Template messages                │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  Payment Flow                       │
│  • Stripe escrow                    │
│  • Platform fee calculation         │
│  • Referral credits                 │
└─────────────────────────────────────┘
```

## Performance Optimization Points

```
┌─────────────────────────────────────────────────────────────┐
│                    OPTIMIZATION LAYERS                      │
│                                                             │
│  Layer 1: Caching                                          │
│  • Location autocomplete (5min TTL)                        │
│  • Reverse geocode (10min TTL)                             │
│  • Shipping calculations (session cache)                   │
│                                                             │
│  Layer 2: Debouncing                                       │
│  • Autocomplete input (300ms)                              │
│  • Shipping estimator inputs                               │
│                                                             │
│  Layer 3: Lazy Loading                                      │
│  • Google Maps API                                         │
│  • Photo upload modal                                      │
│  • Admin components                                        │
│                                                             │
│  Layer 4: Code Splitting                                    │
│  • Route-based splitting                                   │
│  • Component-based splitting                               │
│                                                             │
│  Layer 5: Memoization                                       │
│  • React.memo for list items                                │
│  • useMemo for calculations                                │
│  • useCallback for handlers                                │
└─────────────────────────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY STACK                           │
│                                                             │
│  Frontend:                                                  │
│  • Zod validation                                           │
│  • Input sanitization                                       │
│  • Error boundaries                                         │
│                                                             │
│  API Layer:                                                 │
│  • Rate limiting                                            │
│  • Request validation                                       │
│  • Auth checks                                              │
│                                                             │
│  Database:                                                  │
│  • Row Level Security (RLS)                                 │
│  • Function security (SECURITY INVOKER)                     │
│  • Input validation                                         │
│  • Secure search_path                                       │
│                                                             │
│  External APIs:                                             │
│  • API keys in env vars                                     │
│  • Server-side proxy for secrets                            │
│  • HTTPS only                                               │
└─────────────────────────────────────────────────────────────┘
```

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────┐
│              PERFORMANCE MONITORING                         │
│                                                             │
│  Component Level:                                           │
│  • Render time tracking                                     │
│  • Re-render detection                                      │
│  • Prop change analysis                                     │
│                                                             │
│  Network Level:                                             │
│  • API call duration                                        │
│  • Cache hit rates                                          │
│  • Error rates                                              │
│                                                             │
│  User Level:                                                │
│  • Interaction tracking                                     │
│  • Feature adoption                                         │
│  • Conversion funnels                                       │
│                                                             │
│  Auto-Analysis:                                             │
│  • Bottleneck detection                                     │
│  • Optimization suggestions                                 │
│  • Performance regression alerts                            │
└─────────────────────────────────────────────────────────────┘
```

## Key Dependencies

```
Location System
    ├── Geoapify API (external)
    ├── Location Service (lib/services/location.ts)
    ├── Location Config (config/location.config.ts)
    └── Components
        ├── LocationInput
        ├── LocationDraggablePicker
        ├── LocationMapPreview
        └── UseCurrentLocationButton

Shipping System
    ├── Shipping Service (lib/services/shipping.ts)
    ├── Shipping Fees (src/constants/shippingFees.ts)
    ├── Courier Rates (assets/data/courierRates.json)
    ├── Customs Rates (assets/data/countryCustoms.json)
    └── Components
        ├── Shipping Estimator Page
        └── Post Request Form

Messaging System
    ├── Supabase Realtime
    ├── Message Components
    │   ├── MessageThread
    │   ├── MessageInput
    │   └── MessageBadge
    └── Hooks
        ├── usePostMessages
        └── useUnreadMessages

Payment System
    ├── Stripe (external)
    ├── Payment Components
    │   ├── PaymentButton
    │   └── NegotiationButtons
    └── Platform Fee Calculation
```

## Cache Points

```
1. Location Autocomplete
   └── Cache Key: "autocomplete:{query}:{limit}:{filter}:{bbox}"
   └── TTL: 5 minutes

2. Reverse Geocode
   └── Cache Key: "reverse:{lat}:{lon}"
   └── TTL: 10 minutes

3. Forward Geocode
   └── Cache Key: "forward:{name}"
   └── TTL: 5 minutes

4. Shipping Calculations
   └── Session-based (not persisted)
   └── Cleared on navigation
```

## Lazy Loaded Modules

```
1. Google Maps API
   └── Loaded only when map component mounts

2. Photo Upload Modal
   └── Dynamic import on user action

3. Buy & Ship Directly
   └── Route-based code splitting

4. Admin Components
   └── Protected route + lazy load
```
