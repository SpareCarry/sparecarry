# RealtimeManager

Centralized Supabase Realtime Connection Manager that prevents duplicate connections and enforces connection limits.

## Features

- ✅ **Deduplication**: Same channel configuration = reuse existing channel
- ✅ **Global Tracking**: Know exactly how many channels are active
- ✅ **Automatic Cleanup**: Channels auto-close when not needed
- ✅ **Connection Limits**: Hard limit of **5 channels** to prevent quota issues
- ✅ **Verbose Logging**: See every create/destroy event

## Usage

### Initialization

**IMPORTANT**: You must initialize RealtimeManager with a Supabase client before using it.

```typescript
import { createClient } from '@sparecarry/lib/supabase';
import { RealtimeManager } from '@sparecarry/lib/realtime';

// In your app root (once)
const supabase = createClient();
RealtimeManager.setSupabaseClient(supabase);
```

### Using the Hook (Recommended)

```typescript
import { useRealtime } from '@sparecarry/hooks';

function MyComponent() {
  useRealtime({
    table: 'messages',
    event: 'INSERT',
    filter: 'conversation_id=eq.123',
    callback: (payload) => {
      console.log('New message:', payload);
    },
  });
}
```

### Direct Usage (Advanced)

```typescript
import { RealtimeManager } from '@sparecarry/lib/realtime';

// Listen to a table
const channelName = RealtimeManager.listen(
  {
    table: 'messages',
    event: 'INSERT',
    filter: 'conversation_id=eq.123',
  },
  (payload) => {
    console.log('New message:', payload);
  },
  'custom-channel-name' // Optional: custom name for deduplication
);

// Remove callback
RealtimeManager.remove(channelName, callback);

// Force remove entire channel
RealtimeManager.removeChannel(channelName);
```

### React Query Integration

```typescript
import { useRealtimeInvalidation } from '@sparecarry/hooks';
import { useQuery } from '@tanstack/react-query';

function MyComponent() {
  const { data } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchMessages(conversationId),
  });

  // Automatically invalidate query when messages table changes
  useRealtimeInvalidation('messages', ['messages', conversationId], {
    filter: `conversation_id=eq.${conversationId}`,
  });

  return <div>{/* render messages */}</div>;
}
```

## Connection Limits

**MAX_CHANNELS = 5**

This is a hard limit to prevent Supabase quota issues. If you try to create more than 5 channels, RealtimeManager will throw an error.

### Why 5?

- Supabase free tier allows limited concurrent realtime connections
- Most apps need 3-5 channels max:
  1. Messages
  2. Matches
  3. Requests
  4. User updates
  5. Emergency notifications

### What happens if limit is reached?

RealtimeManager will:
1. Log an error with active channel names
2. Throw an error to prevent creating the channel
3. Attempt to clean up inactive channels first

## Debugging

### Enable/Disable Logging

```typescript
RealtimeManager.setLogging(true);  // Enable verbose logging
RealtimeManager.setLogging(false); // Disable logging
```

### Get Connection Count

```typescript
const count = RealtimeManager.getConnectionCount();
console.log(`Active channels: ${count}`);
```

### Get Active Channels

```typescript
const channels = RealtimeManager.getActiveChannels();
console.log('Active channels:', channels);
```

### Get Debug Info

```typescript
const debugInfo = RealtimeManager.getDebugInfo();
console.log(debugInfo);
// {
//   totalChannels: 3,
//   channels: [
//     {
//       name: 'messages',
//       callbacks: 2,
//       createdAt: '2025-01-01T00:00:00.000Z',
//       lastUsed: '2025-01-01T00:05:00.000Z',
//       inactiveTime: 300000,
//       config: { table: 'messages', event: '*' }
//     }
//   ]
// }
```

### Browser DevTools

In development, RealtimeManager is exposed on `window`:

```javascript
// In browser console
window.__REALTIME_MANAGER__.getDebugInfo();
window.__REALTIME_MANAGER__.setLogging(true);
```

## Cleanup

RealtimeManager automatically:
- Cleans up inactive channels (5 minutes of no activity)
- Unsubscribes channels when no callbacks remain
- Destroys all channels on page unload (web)

### Manual Cleanup

```typescript
// Destroy all channels (e.g., on app exit)
RealtimeManager.destroyAll();
```

## Best Practices

1. **Always use the hook**: `useRealtime` handles cleanup automatically
2. **Use custom channel names**: For complex filters, use custom names for better deduplication
3. **Monitor connection count**: Log `getConnectionCount()` in development
4. **Don't create channels in loops**: Reuse existing channels
5. **Clean up on unmount**: The hook does this automatically, but if using direct API, remember to call `remove()`

## Migration from Direct Supabase Channels

### Before

```typescript
const channel = supabase
  .channel('messages')
  .on('postgres_changes', { table: 'messages' }, (payload) => {
    console.log(payload);
  })
  .subscribe();
```

### After

```typescript
// Option 1: Use hook (recommended)
useRealtime({
  table: 'messages',
  callback: (payload) => {
    console.log(payload);
  },
});

// Option 2: Use RealtimeManager directly
const channelName = RealtimeManager.listen(
  { table: 'messages' },
  (payload) => {
    console.log(payload);
  }
);
```

## Troubleshooting

### "Supabase client not set" error

Make sure to call `RealtimeManager.setSupabaseClient(client)` before using `listen()`.

### "Maximum channel limit reached" error

You have 5 active channels. Options:
1. Remove unused channels
2. Combine similar channels
3. Use polling instead of realtime for non-critical updates

### Channels not cleaning up

Check:
1. Are you calling `remove()` when done?
2. Are callbacks being removed properly?
3. Check `getDebugInfo()` to see active channels

