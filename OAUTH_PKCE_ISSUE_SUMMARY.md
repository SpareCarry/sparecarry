# OAuth PKCE Flow Issue - Code Verifier Missing

## Problem Summary
When completing Google OAuth sign-in, the callback page fails with:
```
Error: invalid request: both auth code and code verifier should be non-empty
```

The OAuth code is received correctly, but the `code_verifier` that was stored in localStorage during the OAuth initiation cannot be found when trying to exchange the code for a session.

## Error Flow

1. **User clicks "Sign in with Google"** on login page (`/auth/login`)
2. **Supabase `signInWithOAuth()` is called** - stores PKCE `code_verifier` in localStorage
3. **User redirected to Google** for authentication
4. **Google redirects back to** `http://localhost:3000/?code=XXX` (homepage, NOT `/auth/callback`)
5. **Homepage detects code** and redirects to `/auth/callback?code=XXX`
6. **Callback page tries to exchange code** - `code_verifier` is missing from localStorage
7. **Error occurs**: "invalid request: both auth code and code verifier should be non-empty"

## Technical Details

### Environment
- **Framework**: Next.js 14+ (App Router)
- **Supabase Client**: `@supabase/ssr` with `createBrowserClient`
- **OAuth Flow**: PKCE (Proof Key for Code Exchange)
- **Development URL**: `http://localhost:3000`
- **Environment Variable**: `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### Key Files

#### 1. OAuth Initiation (`app/auth/login/page.tsx`)
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: callbackUrl, // http://localhost:3000/auth/callback?redirect=/home
  },
});
```
- Called from login page
- Uses `createClient()` from `lib/supabase/client.ts`
- Supabase should store `code_verifier` in localStorage automatically

#### 2. Homepage Redirect (`app/page.tsx`)
```typescript
useEffect(() => {
  const code = searchParams.get("code");
  if (code) {
    // Redirect from homepage to callback page
    const callbackUrl = `${baseUrl}/auth/callback?${currentParams.toString()}`;
    window.location.href = callbackUrl;
  }
}, [searchParams]);
```
- Detects OAuth code on homepage
- Redirects to `/auth/callback?code=XXX`
- **Potential issue**: This redirect might cause a page reload that loses localStorage context

#### 3. Callback Handler (`app/auth/callback/page.tsx`)
```typescript
// Wait for Supabase automatic exchange
await new Promise((resolve) => setTimeout(resolve, 1000));

const { data: { session }, error: sessionError } = await supabase.auth.getSession();

if (!autoSession) {
  // Try manual exchange
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
}
```
- Waits for Supabase's automatic code exchange
- Falls back to manual exchange if needed
- **Both fail** because `code_verifier` is missing

#### 4. Supabase Client (`lib/supabase/client.ts`)
```typescript
browserClientInstance = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);
```
- Uses `@supabase/ssr`'s `createBrowserClient`
- Should automatically handle PKCE and localStorage
- Uses singleton pattern (single instance)

### OAuth State Analysis

From the logs, the OAuth state JWT shows:
```json
{
  "site_url": "http://192.168.1.238:3000",
  "referrer": "http://localhost:3000/",
  "provider": "google"
}
```

**Issue**: The `site_url` in the OAuth state is `192.168.1.238:3000` but the actual flow is happening on `localhost:3000`. This mismatch might affect where Supabase stores/looks for the `code_verifier`.

## Root Cause Hypotheses

1. **localStorage key mismatch**: Supabase might store the `code_verifier` with a key that includes the origin. When redirecting from homepage to callback, or when the origin changes, the key lookup fails.

2. **Timing issue**: The `code_verifier` might not be persisted to localStorage before the redirect happens, or localStorage isn't accessible when Supabase tries to read it.

3. **Multiple Supabase client instances**: The singleton pattern might not be working, causing different client instances to look for the `code_verifier` in different places.

4. **Homepage redirect clears context**: The redirect from homepage to callback page might cause a full page reload that loses the localStorage context or timing.

5. **Site URL mismatch**: The OAuth state has `site_url: "http://192.168.1.238:3000"` but we're on `localhost:3000`. Supabase might be storing the `code_verifier` with a key that includes the `site_url` from the state.

## Relevant Code Sections

### OAuth Callback URL Generation (`lib/supabase/mobile.ts`)
```typescript
export function getAuthCallbackUrl(redirectPath: string = "/home"): string {
  const nextAppUrl = process.env.NEXT_PUBLIC_APP_URL; // http://localhost:3000
  if (nextAppUrl) {
    return `${nextAppUrl}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`;
  }
  // Fallback to window.location.origin...
}
```

### Supabase Client Creation (`lib/supabase/client.ts`)
- Uses `createBrowserClient` from `@supabase/ssr`
- Should handle PKCE automatically
- Uses localStorage by default (browser environment)

## What's Working

✅ OAuth initiation works correctly
✅ Google authentication completes
✅ OAuth code is returned correctly
✅ Homepage detects code and redirects to callback
✅ Callback page receives the code

## What's Not Working

❌ `code_verifier` cannot be found in localStorage when exchanging code
❌ Both automatic and manual code exchange fail
❌ User cannot complete authentication

## Potential Solutions to Try

1. **Check localStorage keys**: Add debugging to check what keys Supabase is using to store the `code_verifier`:
   ```javascript
   // In callback page, before exchange
   console.log('All localStorage keys:', Object.keys(localStorage));
   console.log('Supabase-related keys:', Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('auth') || k.includes('pkce')));
   ```

2. **Ensure same Supabase client instance**: Verify the same Supabase client instance is used on login page and callback page.

3. **Remove homepage redirect**: Try having Google redirect directly to `/auth/callback` instead of homepage first.

4. **Check Supabase storage key format**: Supabase might be using a key like `sb-${projectRef}-auth-code-verifier` or similar. The project ref or URL might be causing the mismatch.

5. **Use sessionStorage instead**: Try configuring Supabase to use sessionStorage for PKCE (if supported) to avoid localStorage issues.

6. **Wait longer for localStorage**: Increase the wait time before checking for automatic exchange to ensure localStorage is accessible.

7. **Manually preserve code_verifier**: If Supabase stores it in a known key, manually copy it from login page to callback page via URL params or sessionStorage.

8. **Fix OAuth state site_url**: Ensure the OAuth state always uses `localhost:3000` instead of the IP address to match the actual callback URL.

## DEFINITIVE SOLUTION ✅

**Root Cause Confirmed by Gemini**: The client-side redirect from homepage (`/`) to callback page (`/auth/callback`) was breaking the PKCE flow. The `code_verifier` stored during OAuth initiation is lost when JavaScript performs `window.location.href` redirects because Supabase's automatic code exchange logic expects to run immediately when the browser lands on the `redirectTo` URL.

**Critical Fix Applied**:
1. ✅ **Removed homepage redirect logic** from `app/page.tsx` - This was causing the verifier loss
2. ✅ Updated callback URL to use `window.location.origin` dynamically (already done)

**Required Supabase Dashboard Configuration**:
1. **For Web Development (localhost)**:
   - **Site URL**: `http://localhost:3000` (MUST match the origin where OAuth starts)
   - **Redirect URLs**: `http://localhost:3000/auth/callback`

2. **Important**: The Site URL must match the origin where the OAuth flow starts. If you're testing on `localhost:3000`, the Site URL MUST be `localhost:3000`, NOT `192.168.1.238:3000`.

3. **For Mobile Development**: 
   - Use a tunneling service (ngrok, Expo Go) OR
   - Configure a separate Supabase project/environment for mobile testing
   - The `code_verifier` localStorage key is derived from the Site URL, so mismatches break PKCE

**Why This Matters**:
- Supabase stores `code_verifier` in localStorage with a key tied to the Site URL/project ref
- If OAuth starts on `localhost:3000` but Site URL is `192.168.1.238:3000`, the verifier lookup fails
- The homepage redirect was a symptom - the root cause is the Site URL mismatch

**Expected Behavior After Fix**:
- Google redirects DIRECTLY to `http://localhost:3000/auth/callback?code=XXX` (no intermediate homepage)
- Supabase automatically detects the code and retrieves `code_verifier` from localStorage
- Code exchange completes successfully
- User is authenticated and redirected to `/home`

## Error Logs

```
[AuthCallback] Found code, waiting for Supabase automatic exchange...
TypeError: Failed to fetch (from Supabase automatic exchange attempt)
[AuthCallback] Automatic exchange didn't work, trying manual exchange...
POST https://gujyzwqcwecbeznlablx.supabase.co/auth/v1/token?grant_type=pkce 400 (Bad Request)
Error: invalid request: both auth code and code verifier should be non-empty
```

## Additional Context

- The issue happens consistently every time
- Same error with both automatic and manual code exchange
- No localStorage errors in console (it's accessible, just missing the key)
- Using `@supabase/ssr` version that supports PKCE
- Next.js development server on localhost:3000
- No browser extensions blocking localStorage
- Incognito mode was tested (same issue)

