# Comprehensive Solution: Authentication Mocking

Based on HAR file analysis and extensive debugging:

## Key Findings

1. **HAR File Analysis** (`C:\Users\admin\Desktop\localhost.har`):
   - Supabase requests: `https://gujyzwqcwecbeznlablx.supabase.co/auth/v1/user` (GET)
   - Required header: `apikey` (JWT token)
   - Response format: User object directly (not wrapped in `{user: ..., error: null}`)
   - Requests ARE being made in real browser

2. **Function Matchers Work** ✅
   - Verified in `tests/e2e/debug/route-interception.spec.ts`
   - String patterns like `**/auth/v1/user**` don't match
   - Function matchers like `(url) => url.href.includes('/auth/v1/user')` work

3. **The Issue**:
   - Routes are registered but not intercepting in Playwright tests
   - NO network requests are logged in test output
   - This suggests Supabase client checks localStorage first

## Solution Implementation

### Approach 1: Ensure Routes Work (Current Attempt)

We've implemented:

1. ✅ Function matchers (confirmed working in debug test)
2. ✅ Route registration before navigation
3. ✅ localStorage injection
4. ✅ fetch override (as backup)

### Approach 2: Direct Client Override (Recommended)

Instead of intercepting network requests, directly override the Supabase client:

```typescript
// In mockUserAuth, override supabase.auth.getUser() at runtime
await page.addInitScript((userData) => {
  // Override createClient() to return a mocked client
  // This is more reliable than network interception
});
```

### Approach 3: Mock at React Query Level

Override React Query's cache directly:

```typescript
// Override React Query cache before components mount
await page.evaluate((userData) => {
  // Access React Query cache and set user data directly
});
```

## Next Steps

1. Try Approach 2 (Direct Client Override)
2. If that doesn't work, try Approach 3 (React Query Cache)
3. As last resort, use MSW (Mock Service Worker)
