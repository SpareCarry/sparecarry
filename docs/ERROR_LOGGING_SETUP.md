# Error Logging Setup ✅

## What Was Added

I've set up comprehensive error logging so **all 404s and errors now appear in your terminal** instead of just on your phone.

## Changes Made

### 1. **Enhanced Middleware Logging** (`middleware.ts`)

- Logs all requests in development mode
- Specifically logs 404 errors with full details
- Logs server errors (500+) with stack traces
- Shows request duration for performance monitoring

### 2. **Client-Side 404 Logging** (`app/not-found.tsx`)

- Logs 404s to browser console
- Sends 404 details to server API for terminal logging
- Includes URL, pathname, referrer, and user agent

### 3. **Server Logger** (`lib/logger/server-logger.ts`)

- Centralized logging system
- Formats errors with timestamps, URLs, status codes
- Outputs to console (terminal) with structured format

### 4. **404 Logging API** (`app/api/log-404/route.ts`)

- Receives 404 reports from client
- Logs them to terminal with full context

### 5. **Verbose Next.js Config** (`next.config.js`)

- Enabled detailed error logging
- Added verbose webpack logging in development

### 6. **Environment Variables** (`.env.local`)

- Added `NEXT_DEBUG=1` for Next.js debug mode
- Added `NODE_OPTIONS=--trace-warnings` for detailed warnings

## How to See Errors

### **Restart Your Dev Server**

```bash
# Stop current server (Ctrl+C)
# Then restart:
pnpm dev:web
```

### **What You'll See in Terminal**

When a 404 occurs, you'll see output like this:

```
[2025-11-28T10:30:00.000Z] [WARN] 404 Not Found: GET /some-missing-page | URL: /some-missing-page | Method: GET | Status: 404 | Duration: 15ms
```

For errors, you'll see:

```
[2025-11-28T10:30:00.000Z] [ERROR] Server Error: GET /api/some-endpoint | URL: /api/some-endpoint | Method: GET | Status: 500 | Duration: 120ms | Error: Error message here | Stack: ...
```

### **All Requests Logged in Development**

In development mode, you'll see:

- Every request (GET, POST, etc.)
- Response status codes
- Request duration
- Full URLs and paths

## Testing the Logging

1. **Test 404 logging:**

   ```bash
   # Visit a non-existent page in your browser
   http://localhost:3000/this-page-does-not-exist
   ```

   You should see in terminal:

   ```
   [WARN] 404 Not Found: GET /this-page-does-not-exist
   ```

2. **Test health endpoint:**

   ```bash
   curl http://localhost:3000/api/health
   ```

   You should see:

   ```
   [INFO] Health check requested
   ```

## What Information is Logged

For each 404/error, you'll see:

- ✅ **Timestamp** - When it occurred
- ✅ **URL** - Full URL that failed
- ✅ **Method** - HTTP method (GET, POST, etc.)
- ✅ **Status Code** - 404, 500, etc.
- ✅ **Duration** - How long the request took
- ✅ **Error Message** - What went wrong
- ✅ **Stack Trace** - Where the error occurred (for server errors)
- ✅ **Referrer** - Where the user came from
- ✅ **User Agent** - Browser/device info

## Next Steps

1. **Restart your dev server** to enable logging
2. **Try accessing a non-existent page** to see 404 logging
3. **Check your terminal** - all errors will appear there now
4. **Share the terminal output** with me if you need help fixing specific errors

## Troubleshooting

If you don't see errors in terminal:

1. **Check `.env.local`** - Make sure `NEXT_DEBUG=1` is set
2. **Restart dev server** - Logging only works after restart
3. **Check terminal output** - Errors appear in the same terminal where you ran `pnpm dev:web`
4. **Look for `[WARN]` or `[ERROR]`** - These prefixes mark logged errors

## Example Output

```
[2025-11-28T10:30:15.123Z] [INFO] Request: GET /home | URL: /home | Method: GET
[2025-11-28T10:30:15.145Z] [DEBUG] Response: GET /home - 200 | URL: /home | Method: GET | Status: 200 | Duration: 22ms
[2025-11-28T10:30:20.456Z] [WARN] 404 Not Found: GET /missing-page | URL: /missing-page | Method: GET | Status: 404 | Duration: 5ms
[2025-11-28T10:30:25.789Z] [ERROR] Server Error: GET /api/broken | URL: /api/broken | Method: GET | Status: 500 | Duration: 100ms | Error: Database connection failed | Stack: Error: Database connection failed...
```

Now you can see all errors in your terminal! 🎉
