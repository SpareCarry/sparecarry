# Quick Reference: Production Features

Quick guide for using the new production-ready features.

## 🔒 Security Features

### Using API Protection in Routes

```typescript
import {
  withApiProtection,
  withAuthProtection,
} from "@/lib/security/api-protection";

// Basic protection (rate limiting, size limits, timeout)
export async function POST(request: NextRequest) {
  return withApiProtection(request, async (req) => {
    // Your handler code here
    return NextResponse.json({ success: true });
  });
}

// With authentication
export async function PUT(request: NextRequest) {
  return withAuthProtection(request, async (req, userId) => {
    // User is authenticated, userId available
    return NextResponse.json({ success: true });
  });
}
```

### Input Validation

```typescript
import { validateRequestBody } from "@/lib/validation/server-validation";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const { data, error } = await validateRequestBody(request, schema);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  // Use validated data
}
```

## 🎨 UI Components

### Skeleton Loading

```typescript
import { SkeletonFeedItem, SkeletonCard, SkeletonForm } from '@/components/ui/skeleton';

// In your component
{isLoading ? (
  <SkeletonFeedItem />
) : (
  <FeedItem data={data} />
)}
```

### Toast Notifications

```typescript
import { useToast } from "@/components/ui/toast";

function MyComponent() {
  const { success, error, warning, info } = useToast();

  const handleSubmit = async () => {
    try {
      await saveData();
      success("Data saved successfully!");
    } catch (err) {
      error("Failed to save data");
    }
  };
}
```

### Offline Detection

```typescript
import { useOnlineStatus } from '@/lib/utils/offline-detection';

function MyComponent() {
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return <div>You are offline</div>;
  }
  // Normal component
}
```

## ♿ Accessibility

### Using Skip Link

Already added to root layout. Links to `#main-content` on all pages.

### Adding Main Content Landmark

```typescript
<div id="main-content" role="main">
  {/* Your page content */}
</div>
```

### ARIA Labels

```typescript
<button aria-label="Close dialog">
  <X />
</button>

<input
  aria-label="Email address"
  aria-describedby="email-help"
/>
<span id="email-help">We'll never share your email</span>
```

## 🔄 Error Handling with Retry

### Using useQueryWithRetry

```typescript
import { useQueryWithRetry } from "@/lib/hooks/use-query-with-retry";

const { data, error } = useQueryWithRetry({
  queryKey: ["my-data"],
  queryFn: fetchData,
  retryOptions: {
    maxRetries: 3,
    showErrorToast: true,
  },
});
```

### Manual Retry Hook

```typescript
import { useRetry } from "@/lib/utils/offline-detection";

const [retryFn, { isRetrying }] = useRetry(myAsyncFunction);

await retryFn(arg1, arg2);
```

---

For more details, see:

- `docs/ACCESSIBILITY_GUIDELINES.md`
- `docs/API_VALIDATION_EXAMPLE.md`
- `PRODUCTION_READINESS_COMPLETE.md`
