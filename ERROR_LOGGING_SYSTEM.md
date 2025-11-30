# Error Logging System

**Date**: November 20, 2025  
**Status**: ✅ **ERROR LOGGING SYSTEM COMPLETE**

---

## Overview

The SpareCarry application includes a comprehensive error boundary and logging system with optional Sentry integration. All errors are caught, logged, and optionally sent to Sentry for monitoring.

---

## 1. Architecture

### Components

- **`app/_components/ErrorBoundary.tsx`** - Global React error boundary
- **`lib/logger/index.ts`** - Centralized logging system
- **`lib/logger/mobile.ts`** - Mobile (Capacitor) logging
- **`lib/api/error-handler.ts`** - API error handling middleware
- **`sentry.*.config.ts`** - Sentry configuration files

---

## 2. Global Error Boundary

### Features

- Catches React render errors
- User-friendly fallback UI
- Automatic error logging
- Retry functionality
- Works with Next.js App Router

### Usage

The error boundary is automatically wrapped around the root layout:

```tsx
// app/layout.tsx
<ErrorBoundary>
  <Providers>{children}</Providers>
</ErrorBoundary>
```

### Custom Error Boundary

Wrap specific components:

```tsx
import { ErrorBoundary } from "@/app/_components/ErrorBoundary";

<ErrorBoundary
  fallback={<CustomErrorUI />}
  onError={(error, errorInfo) => {
    // Custom error handling
  }}
>
  <YourComponent />
</ErrorBoundary>;
```

### HOC Pattern

```tsx
import { withErrorBoundary } from "@/app/_components/ErrorBoundary";

const SafeComponent = withErrorBoundary(MyComponent, <CustomFallback />);
```

---

## 3. Centralized Logger

### Features

- Structured logging (info, warn, error, debug)
- Automatic Sentry integration (if enabled)
- Sensitive data sanitization
- Debug mode (disabled in production)

### Usage

```typescript
import { logger, logInfo, logWarn, logError, logDebug } from "@/lib/logger";

// Info logging
logger.info("User logged in", { userId: "123" });
logInfo("User logged in", { userId: "123" });

// Warning logging
logger.warn("Rate limit approaching", { remaining: 10 });
logWarn("Rate limit approaching", { remaining: 10 });

// Error logging
logger.error("Failed to fetch data", error, { url: "/api/data" });
logError("Failed to fetch data", error, { url: "/api/data" });

// Debug logging (only in development)
logger.debug("Cache hit", { key: "user:123" });
logDebug("Cache hit", { key: "user:123" });
```

### Sensitive Data Sanitization

The logger automatically redacts sensitive data:

```typescript
// These fields are automatically redacted:
// password, token, jwt, secret, key, authorization, cookie, session, access_token, refresh_token

logger.info("Request", {
  password: "secret123", // Will be logged as '[REDACTED]'
  email: "user@example.com", // Will be logged as-is
});
```

### Sentry Integration

When `NEXT_PUBLIC_SENTRY_DSN` is set, errors are automatically sent to Sentry:

```typescript
// Automatically captures to Sentry
logger.error("API error", error, { endpoint: "/api/data" });
```

### User Context

Set user context for Sentry:

```typescript
import { logger } from "@/lib/logger";

await logger.setUser({
  id: "user-123",
  email: "user@example.com",
  username: "johndoe",
});

// Clear user context
await logger.setUser(null);
```

### Breadcrumbs

Add breadcrumbs for better error context:

```typescript
import { logger } from "@/lib/logger";

await logger.addBreadcrumb("User clicked button", "ui", "info", {
  buttonId: "submit",
  page: "/checkout",
});
```

---

## 4. API Error Handling

### Features

- Standardized error responses
- Typed error codes
- Never exposes stack traces in production
- Automatic error logging

### Usage

```typescript
import {
  withApiErrorHandler,
  createApiError,
  ErrorCodes,
} from "@/lib/api/error-handler";

// Wrap API route handler
export const POST = withApiErrorHandler(async function POST(
  request: NextRequest
) {
  // Your handler code
  return NextResponse.json({ ok: true, data: result });
}, "Failed to process request");

// Throw API errors
throw createApiError("NOT_FOUND", "User not found", 404);
throw createApiError("VALIDATION_ERROR", "Invalid input", 400, {
  field: "email",
});
```

### Error Response Format

All API errors follow this format:

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly error message",
    "details": {} // Only in development
  }
}
```

### Error Codes

```typescript
ErrorCodes = {
  // Authentication
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_TOKEN: "INVALID_TOKEN",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",

  // Not Found
  NOT_FOUND: "NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // Server Errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",

  // Business Logic
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  INVALID_STATE: "INVALID_STATE",
  CONFLICT: "CONFLICT",
};
```

### Example API Route

```typescript
import {
  withApiErrorHandler,
  createApiError,
  ErrorCodes,
} from "@/lib/api/error-handler";
import { NextRequest, NextResponse } from "next/server";

export const GET = withApiErrorHandler(async function GET(
  request: NextRequest
) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    throw createApiError("VALIDATION_ERROR", "ID is required", 400);
  }

  const data = await fetchData(id);

  if (!data) {
    throw createApiError("NOT_FOUND", "Resource not found", 404);
  }

  return NextResponse.json({ ok: true, data });
}, "Failed to fetch resource");
```

---

## 5. Sentry Integration

### Setup

1. Install Sentry (if not already installed):

```bash
pnpm add @sentry/nextjs
```

2. Set environment variable:

```env
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

3. Sentry is automatically initialized when DSN is set.

### Configuration Files

- **`sentry.client.config.ts`** - Client-side Sentry config
- **`sentry.server.config.ts`** - Server-side Sentry config
- **`sentry.edge.config.ts`** - Edge runtime Sentry config

### Automatic Capture

Sentry automatically captures:

- Uncaught errors
- Unhandled promise rejections
- API route exceptions
- React error boundary errors

### Manual Capture

```typescript
import { logger } from "@/lib/logger";

// Errors are automatically sent to Sentry via logger
logger.error("Manual error", error, { context: "data" });

// Or use Sentry directly
import * as Sentry from "@sentry/nextjs";
Sentry.captureException(error);
Sentry.captureMessage("Something went wrong", "error");
```

### Performance Tracing

Sentry automatically traces:

- API route performance
- Database queries (via performance profiler)
- React component renders

### User Context

```typescript
import { logger } from "@/lib/logger";

await logger.setUser({
  id: "user-123",
  email: "user@example.com",
});
```

---

## 6. Mobile Logging (Capacitor)

### Features

- Captures device logs
- Runtime errors in WebView
- Network failures
- Unhandled promise rejections

### Automatic Capture

Mobile logging is automatically enabled on Capacitor platforms:

```typescript
// Automatically captures:
// - Unhandled promise rejections
// - Global errors
// - Console errors
// - Network failures
```

### Manual Logging

```typescript
import { mobileLogger } from "@/lib/logger/mobile";

// Log network failure
mobileLogger.logNetworkFailure("/api/data", error);

// Log device info
mobileLogger.logDeviceInfo();
```

---

## 7. Error Handling Best Practices

### 1. Always Use Error Boundaries

Wrap components that might fail:

```tsx
<ErrorBoundary>
  <RiskyComponent />
</ErrorBoundary>
```

### 2. Use Typed Errors

```typescript
throw createApiError("NOT_FOUND", "User not found", 404);
```

### 3. Provide Context

```typescript
logger.error("Failed to process payment", error, {
  userId: user.id,
  amount: 100,
  paymentMethod: "card",
});
```

### 4. Never Expose Stack Traces

Stack traces are automatically filtered in production:

```typescript
// In production: "An error occurred"
// In development: Full error message
```

### 5. Use Appropriate Log Levels

```typescript
logger.info("User action", { action: "click" });
logger.warn("Rate limit warning", { remaining: 5 });
logger.error("Critical error", error, { context: "payment" });
logger.debug("Debug info", { cache: "hit" });
```

---

## 8. Example Usage

### React Component

```tsx
"use client";

import { useState } from "react";
import { logger } from "@/lib/logger";
import { ErrorBoundary } from "@/app/_components/ErrorBoundary";

function MyComponent() {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      logger.info("Fetching data");
      const response = await fetch("/api/data");
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      setData(result);
    } catch (error) {
      logger.error("Failed to fetch data", error, { endpoint: "/api/data" });
      throw error; // Let error boundary handle it
    }
  };

  return (
    <ErrorBoundary>
      <div>{/* Component content */}</div>
    </ErrorBoundary>
  );
}
```

### API Route

```typescript
import { withApiErrorHandler, createApiError } from "@/lib/api/error-handler";
import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticated } from "@/lib/security/auth-guards";

export const GET = withApiErrorHandler(async function GET(
  request: NextRequest
) {
  const user = await assertAuthenticated(request);

  const data = await fetchUserData(user.id);

  if (!data) {
    throw createApiError("NOT_FOUND", "User data not found", 404);
  }

  return NextResponse.json({ ok: true, data });
}, "Failed to fetch user data");
```

### Manual Error Capture

```typescript
import { logger } from "@/lib/logger";

try {
  await riskyOperation();
} catch (error) {
  logger.error("Risky operation failed", error, {
    operation: "riskyOperation",
    userId: user.id,
  });

  // Re-throw if needed
  throw error;
}
```

---

## 9. Configuration

### Environment Variables

```env
# Enable Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Debug mode (development only)
NODE_ENV=development
```

### Logger Configuration

The logger automatically:

- Enables debug mode in development
- Initializes Sentry if DSN is provided
- Sanitizes sensitive data
- Formats logs consistently

---

## 10. Troubleshooting

### Errors Not Being Caught

1. Check error boundary is wrapped correctly
2. Verify error is thrown (not just logged)
3. Check Sentry DSN is set (if using Sentry)

### Sentry Not Working

1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set
2. Check Sentry project is active
3. Verify network requests to Sentry
4. Check browser console for Sentry errors

### Too Many Logs

1. Disable debug mode in production
2. Adjust log levels
3. Filter logs in Sentry

---

## 11. Summary

✅ **Error Logging System Complete**

- Global error boundary for React
- Centralized logger with Sentry support
- API error handling middleware
- Mobile logging (Capacitor)
- Sensitive data sanitization
- Production-ready error handling

**Status**: Production-ready error logging system.

---

**Last Updated**: November 20, 2025
