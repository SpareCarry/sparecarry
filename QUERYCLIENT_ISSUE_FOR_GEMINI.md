# QueryClient Context Error in React Native Expo Router App

## Problem
Getting `Error: No QueryClient set, use QueryClientProvider to set one` when navigating to certain tab screens in an Expo Router mobile app. The error occurs specifically when components use the `useUserPreferences` hook, which internally uses `useQuery` from TanStack Query.

## Tech Stack
- **Framework**: Expo Router (file-based routing)
- **React Native**: Latest version
- **Query Library**: @tanstack/react-query v5.90.11
- **React**: 19.1.0
- **Structure**: Monorepo with shared packages (hooks in `packages/hooks/`)

## Error Details

### Error Message
```
ERROR [Error: No QueryClient set, use QueryClientProvider to set one]
Call Stack:
  useQueryClient (node_modules\.pnpm\@tanstack+react-query@5.90.11_react@19.1.0\node_modules\@tanstack\react-query\build\modern\QueryClientProvider.js)
  useBaseQuery (node_modules\.pnpm\@tanstack+react-query@5.90.11_react@19.1.0\node_modules\@tanstack\react-query\build\modern\useBaseQuery.js)
  useQuery (node_modules\.pnpm\@tanstack+react-query@5.90.11_react@19.1.0\node_modules\@tanstack\react-query\build\modern\useQuery.js)
  useUserPreferences (packages\hooks\useUserPreferences.ts)
  PostRequestScreenContent (apps\mobile\app\(tabs)\post-request.tsx)
```

### Which Screens Fail
- `post-request.tsx` - FAILS (uses `useUserPreferences`)
- `profile.tsx` - FAILS (uses `useUserPreferences`)
- `shipping-estimator.tsx` - FAILS (uses `useUserPreferences`)

### Which Screens Work
- `my-stuff.tsx` - WORKS (uses `useQuery` directly)
- `index.tsx` - WORKS (uses `useInfiniteQuery` directly)
- `post-trip.tsx` - WORKS (no React Query hooks)

## Current Setup

### 1. Shared QueryClient (`apps/mobile/lib/queryClient.ts`)
```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      placeholderData: (previousValue: any) => previousValue,
    },
  },
});
```

### 2. Root Layout (`apps/mobile/app/_layout.tsx`)
```typescript
import { queryClient } from "../lib/queryClient";

export default function RootLayout() {
  // ... other code ...
  
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationHandler />
      <Stack>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        {/* other screens */}
      </Stack>
    </QueryClientProvider>
  );
}
```

### 3. Tabs Layout (`apps/mobile/app/(tabs)/_layout.tsx`)
```typescript
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../lib/queryClient";

export default function TabsLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Tabs>
        <Tabs.Screen name="post-request" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="shipping-estimator" />
        {/* other tabs */}
      </Tabs>
    </QueryClientProvider>
  );
}
```

### 4. Problematic Screen (`apps/mobile/app/(tabs)/post-request.tsx`)
```typescript
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../lib/queryClient";
import { useUserPreferences } from "@sparecarry/hooks/useUserPreferences";

function PostRequestScreenContent() {
  const { preferImperial } = useUserPreferences(); // ERROR HERE
  // ... rest of component
}

export default function PostRequestScreen() {
  return (
    <QueryClientProvider client={queryClient}>
      <PostRequestScreenContent />
    </QueryClientProvider>
  );
}
```

### 5. Working Screen (`apps/mobile/app/(tabs)/my-stuff.tsx`)
```typescript
import { useQuery } from "@tanstack/react-query";

export default function MyStuffScreen() {
  const { data } = useQuery({ // WORKS FINE
    queryKey: ["my-stuff", user?.id],
    queryFn: async () => { /* ... */ }
  });
  // ... rest of component
}
```

### 6. useUserPreferences Hook (`packages/hooks/useUserPreferences.ts`)
```typescript
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export function useUserPreferences() {
  const { user } = useAuth();
  const isDevUser = user?.id === "dev-user-id";
  
  // This call fails - context not found
  const { data: preferImperial } = useQuery<boolean>({
    queryKey: ["user-imperial-preference", user?.id],
    queryFn: async (): Promise<boolean> => {
      // ... fetch logic
    },
    enabled: !!user && !isDevUser,
    staleTime: 5 * 60 * 1000,
    placeholderData: shouldUseImperial(),
  });
  
  // Second useQuery call also fails
  const { data: preferredCurrency } = useQuery<string>({
    queryKey: ["user-currency", user?.id],
    // ... similar structure
  });
  
  return { preferImperial, preferredCurrency, isLoading };
}
```

## What We've Tried

1. ✅ **Single Provider at Root**: Tried only root layout provider - didn't work
2. ✅ **Nested Providers**: Added provider at tabs layout level - didn't work
3. ✅ **Individual Screen Wrappers**: Wrapped each problematic screen with QueryClientProvider - didn't work
4. ✅ **Shared QueryClient Instance**: Using same `queryClient` instance across all providers - still fails
5. ✅ **Direct useQuery Works**: Confirmed that `useQuery` directly in components works fine
6. ✅ **Hook Import Path**: Confirmed hooks are in shared package (`packages/hooks/`)

## Key Observations

1. **Direct `useQuery` works** - When components call `useQuery` directly (like `my-stuff.tsx`), it works fine
2. **Indirect `useQuery` fails** - When components use `useUserPreferences` which calls `useQuery`, it fails
3. **Multiple Provider Layers** - Currently have 3 layers of providers (root → tabs → individual screen), all using same `queryClient` instance
4. **Expo Router Structure** - Using file-based routing with nested layouts: `app/_layout.tsx` → `app/(tabs)/_layout.tsx` → `app/(tabs)/post-request.tsx`

## Questions

1. Why does `useQuery` work when called directly but fail when called through `useUserPreferences`?
2. Could Expo Router's lazy loading or code splitting be causing context to not propagate correctly?
3. Is there a React Native/Expo-specific issue with React Query context propagation?
4. Should we avoid nested providers even with the same client instance?
5. Is there a way to make `useUserPreferences` more defensive to handle missing context?

## Request

Please provide a solution that ensures `useUserPreferences` can successfully use `useQuery` in the context of Expo Router with nested layouts. The solution should:
- Work with the current Expo Router structure
- Maintain the shared hook in `packages/hooks/`
- Support both working screens (direct `useQuery`) and problematic screens (indirect via `useUserPreferences`)
- Be production-ready and not rely on workarounds

