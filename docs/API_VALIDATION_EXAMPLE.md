# API Route Validation Example

This document shows how to integrate server-side validation into API routes.

## Example: Adding Validation to an API Route

Here's an example of how to add validation to an API route:

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateRequestBody } from "@/lib/validation/server-validation";
import {
  withApiProtection,
  withAuthProtection,
} from "@/lib/security/api-protection";
import { z } from "zod";

// Define validation schema
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export async function POST(request: NextRequest) {
  // Option 1: With API protection (rate limiting, size limits, timeout)
  return withApiProtection(request, async (req) => {
    // Validate and sanitize request body
    const { data, error } = await validateRequestBody(req, createPostSchema);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // Use validated and sanitized data
    const { title, description, tags } = data;

    // Continue with business logic...
    return NextResponse.json({ success: true });
  });
}

// Option 2: With auth protection
export async function PUT(request: NextRequest) {
  return withAuthProtection(request, async (req, userId) => {
    const { data, error } = await validateRequestBody(req, createPostSchema);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // User is authenticated, userId is available
    // Continue with business logic...
    return NextResponse.json({ success: true });
  });
}
```

## Manual Validation Example

If you need more control, you can validate manually:

```typescript
import {
  validateString,
  validateNumber,
  validateArray,
} from "@/lib/validation/server-validation";
import { escapeUserContent } from "@/lib/validation/server-validation";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate title
  const titleResult = validateString(body.title, {
    required: true,
    minLength: 1,
    maxLength: 200,
  });

  if (!titleResult.valid) {
    return NextResponse.json({ error: titleResult.error }, { status: 400 });
  }

  // Escape HTML in user-generated content
  const safeDescription = escapeUserContent(body.description);

  // Use validated data
  const title = titleResult.value!;
  // ...
}
```

## Integration Checklist

- [ ] Add validation schema using Zod
- [ ] Use `validateRequestBody` with schema
- [ ] Use `withApiProtection` for rate limiting
- [ ] Use `withAuthProtection` for authenticated routes
- [ ] Escape user-generated content before storing/displaying
- [ ] Return clear error messages to client
- [ ] Log validation errors for debugging
