# Route Interception Debugging Findings

## Summary

After extensive debugging, we've discovered:

1. **Function matchers work!** ✅
   - String patterns like `**/auth/v1/user**` don't reliably match Supabase URLs
   - Function matchers like `(url) => url.href.includes('/auth/v1/user')` work correctly
   - Manual fetch requests ARE intercepted when using function matchers

2. **Route order matters** ✅
   - Playwright checks routes in reverse order (last registered = first checked)
   - Function matchers should be registered AFTER catch-all routes
   - Routes that `fulfill()` should be registered AFTER routes that `continue()`

3. **The real issue: No network requests are being made!** ❌
   - When navigating to the profile page, NO Supabase network requests are logged
   - This suggests the Supabase client checks localStorage/cookies FIRST
   - If localStorage has invalid session data, the client might not make network requests
   - OR the client is using cached data

## Test Results

### ✅ Manual Fetch Test (PASSING)

```typescript
// This test PASSES - manual fetch IS intercepted
const response = await page.evaluate(async (url) => {
  return await fetch(url); // Routes intercept this correctly
}, supabaseUrl + "/auth/v1/user");
```

### ❌ Profile Page Navigation Test (FAILING)

```typescript
// This test FAILS - no routes are triggered
await page.goto("/home/profile"); // No Supabase requests are made!
```

## Next Steps

### Option 1: Ensure Supabase Client Makes Network Requests

The Supabase client might be checking localStorage first. We need to:

1. **Clear localStorage before setting up mocks**
   - This forces the client to make network requests
   - Or set valid-looking session data that expires immediately

2. **Use `addInitScript` to inject session data BEFORE page loads**
   - Current implementation might be too late
   - Need to inject before React components mount

### Option 2: Mock at a Different Level

Instead of mocking network requests, we could:

1. **Mock the Supabase client directly** (runtime mocking)
   - Override `supabase.auth.getUser()` in the page context
   - More reliable but requires understanding Supabase SSR internals

2. **Use MSW (Mock Service Worker)**
   - Service worker-based mocking that works at a lower level
   - More reliable for complex scenarios

3. **Mock localStorage/cookies directly**
   - Set session data in localStorage that Supabase client will read
   - Bypass network requests entirely

## Implementation Recommendations

### Immediate Fix: Use Function Matchers

✅ **DONE**: Updated `mockUserAuth` to use function matchers instead of string patterns.

### Next Fix: Ensure Network Requests Are Made

```typescript
// In mockUserAuth, inject session data BEFORE routes are registered
await page.addInitScript((userData) => {
  // Clear localStorage to force network requests
  localStorage.clear();

  // OR set expired session data that forces refresh
  const expiredSession = {
    access_token: "expired-token",
    expires_at: Math.floor(Date.now() / 1000) - 1000, // Expired 1000 seconds ago
    user: userData,
  };
  localStorage.setItem("sb-auth-token", JSON.stringify(expiredSession));
}, supabaseUser);
```

### Alternative: Runtime Client Mocking

```typescript
await page.addInitScript((userData) => {
  // Override Supabase client creation
  window.__MOCK_SUPABASE_USER__ = userData;

  // Monkey-patch getUser if possible
  // This is more complex but more reliable
}, supabaseUser);
```

## Current Status

- ✅ Route interception works (verified with manual fetch)
- ✅ Function matchers work correctly
- ❌ Profile page navigation doesn't trigger network requests
- ❌ Routes never intercept because requests aren't made

## Debugging Commands

```bash
# Run route interception debug tests
npx playwright test tests/e2e/debug/route-interception.spec.ts

# Run subscription flow test with verbose logging
npx playwright test tests/e2e/subscription-flow.spec.ts:165 --project=chromium --reporter=line
```
