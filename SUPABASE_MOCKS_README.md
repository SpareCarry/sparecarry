# Supabase Mocking System

Complete in-memory Supabase mocking system for testing without external API calls.

## Overview

The SpareCarry test suite uses a comprehensive Supabase mocking system that provides:
- **In-memory database** - No external calls
- **Full query builder** - All Supabase query methods
- **Authentication mocking** - Login, logout, OAuth
- **Storage mocking** - File uploads and downloads
- **Realtime mocking** - Fake realtime events
- **Auto-injection** - Works automatically in all tests

## Quick Start

### Basic Usage

```typescript
import { supabase, seedMockData, resetMockDataStore } from '@/tests/mocks/supabase/mockClient';

describe('My Test', () => {
  beforeEach(() => {
    resetMockDataStore();
    
    // Seed test data
    seedMockData('trips', [
      { id: 'trip-1', from_location: 'Miami', to_location: 'St. Martin' },
    ]);
  });

  it('should query data', async () => {
    const { data } = await supabase
      .from('trips')
      .select('*')
      .eq('from_location', 'Miami')
      .then((r) => r.data || []);
    
    expect(data).toHaveLength(1);
  });
});
```

## File Structure

```
tests/mocks/supabase/
├── mockClient.ts          # Main mock client export
├── types.ts               # TypeScript type definitions
├── mockDataStore.ts       # In-memory data store
├── mockAuth.ts            # Authentication mocking
├── mockAuthState.ts       # Auth state management
├── mockQueryBuilder.ts    # Query builder implementation
├── mockStorage.ts         # Storage mocking
├── mockRealtime.ts        # Realtime mocking
└── helpers.ts             # Helper functions
```

## Helper Functions

### Authentication

```typescript
import { mockUserLogin, mockUserLogout, mockAuthEvents } from '@/tests/mocks/supabase/helpers';

// Login a user
const session = mockUserLogin({
  id: 'user-123',
  email: 'test@example.com',
});

// Logout
mockUserLogout();

// Simulate auth state change
mockAuthEvents('SIGNED_IN', session);
```

### Data Operations

```typescript
import {
  mockInsert,
  mockSelect,
  mockUpdate,
  mockDelete,
  seedTestData,
} from '@/tests/mocks/supabase/helpers';

// Insert data
const inserted = mockInsert('trips', {
  from_location: 'Miami',
  to_location: 'St. Martin',
});

// Query data
const trips = await mockSelect('trips', {
  filters: [{ column: 'from_location', operator: 'eq', value: 'Miami' }],
  orderBy: { column: 'created_at', ascending: false },
  limit: 10,
});

// Update data
const updated = await mockUpdate('trips', 
  { status: 'completed' },
  { column: 'id', value: 'trip-123' }
);

// Delete data
const deleted = await mockDelete('trips', { column: 'id', value: 'trip-123' });

// Seed common test data
seedTestData(); // Seeds users, profiles, trips, requests, matches
```

### Storage

```typescript
import { mockStorageUpload, mockStorageGetPublicUrl } from '@/tests/mocks/supabase/helpers';

// Upload file
const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
const { path } = await mockStorageUpload('images', 'test.jpg', file);

// Get public URL
const url = mockStorageGetPublicUrl('images', 'test.jpg');
```

## Query Builder

The mock query builder supports all Supabase query methods:

### Filtering

```typescript
// Equality
.eq('status', 'active')
.neq('status', 'inactive')

// Comparison
.gt('spare_kg', 10)
.gte('spare_kg', 10)
.lt('spare_kg', 50)
.lte('spare_kg', 50)

// Text search
.like('from_location', '%Miami%')
.ilike('from_location', '%miami%') // case-insensitive

// Null checks
.is('deleted_at', null)

// Array operations
.in('status', ['active', 'pending'])
.contains('tags', 'urgent')

// Logical
.or('status.eq.active,status.eq.pending')
```

### Ordering & Limiting

```typescript
.order('created_at', { ascending: false })
.limit(10)
.range(0, 9) // Pagination
```

### Query Execution

```typescript
// Single record
const { data } = await supabase
  .from('trips')
  .select('*')
  .eq('id', 'trip-123')
  .single();

// Multiple records (using then)
const trips = await supabase
  .from('trips')
  .select('*')
  .then((r) => r.data || []);

// Maybe single (returns null if 0 or >1 records)
const { data } = await supabase
  .from('trips')
  .select('*')
  .eq('id', 'trip-123')
  .maybeSingle();
```

## Data Store Management

### Reset Data

```typescript
import { resetMockDataStore, clearMockTable } from '@/tests/mocks/supabase/mockClient';

// Reset all tables
resetMockDataStore();

// Reset specific table
clearMockTable('trips');
```

### Seed Data

```typescript
import { seedMockData, addMockData } from '@/tests/mocks/supabase/mockClient';

// Seed multiple records
seedMockData('trips', [
  { id: 'trip-1', from_location: 'Miami' },
  { id: 'trip-2', from_location: 'Miami' },
]);

// Add single record
addMockData('trips', { id: 'trip-3', from_location: 'Miami' });
```

### Direct Access

```typescript
import { getMockData, updateMockData, deleteMockData } from '@/tests/mocks/supabase/mockDataStore';

// Get all data
const allTrips = getMockData('trips');

// Update directly
updateMockData('trips', 'trip-123', { status: 'completed' });

// Delete directly
deleteMockData('trips', 'trip-123');
```

## Authentication

### Mock Auth State

```typescript
import { mockAuthState } from '@/tests/mocks/supabase/mockAuthState';

// Get current user
const user = mockAuthState.currentUser;

// Get current session
const session = mockAuthState.currentSession;

// Reset auth state
mockAuthState.reset();
```

### Auth State Changes

```typescript
import { supabase } from '@/tests/mocks/supabase/mockClient';

// Subscribe to auth changes
const { data } = supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});

// Unsubscribe
data.subscription.unsubscribe();
```

## Storage

### Upload Files

```typescript
const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

const { data, error } = await supabase
  .storage
  .from('images')
  .upload('test.jpg', file, { upsert: true });

if (data) {
  console.log('Uploaded to:', data.path);
}
```

### Download Files

```typescript
const { data, error } = await supabase
  .storage
  .from('images')
  .download('test.jpg');

if (data) {
  console.log('File size:', data.size);
}
```

### List Files

```typescript
const { data } = await supabase
  .storage
  .from('images')
  .list('folder', { limit: 10, offset: 0 });
```

### Get Public URL

```typescript
const { data } = supabase
  .storage
  .from('images')
  .getPublicUrl('test.jpg');

console.log('Public URL:', data.publicUrl);
```

## Realtime

### Subscribe to Channels

```typescript
const channel = supabase
  .realtime
  .channel('matches')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'matches' },
    (payload) => {
      console.log('New match:', payload);
    }
  )
  .subscribe();
```

### Send Events

```typescript
await channel.send('broadcast', { type: 'test', data: 'hello' });
```

### Unsubscribe

```typescript
await channel.unsubscribe();
```

## Auto-Injection

Mocks are automatically injected into all tests via `tests/setup-supabase-mock.ts`:

- ✅ Unit tests
- ✅ Integration tests
- ✅ API route tests
- ✅ Component tests

No manual setup required! Just import and use:

```typescript
import { supabase } from '@/tests/mocks/supabase/mockClient';
```

## Best Practices

### 1. Reset Between Tests

```typescript
beforeEach(() => {
  resetMockDataStore();
  mockAuthState.reset();
});
```

### 2. Use Helper Functions

```typescript
// Good
import { mockUserLogin, seedTestData } from '@/tests/mocks/supabase/helpers';
mockUserLogin();
seedTestData();

// Avoid
// Manually creating mock data structures
```

### 3. Type Safety

```typescript
import type { Trip } from '@/types/supabase';

seedMockData<Trip>('trips', [
  { id: 'trip-1', from_location: 'Miami', ... },
]);
```

### 4. Test Isolation

```typescript
describe('My Feature', () => {
  beforeEach(() => {
    resetAllMocks(); // Resets everything
  });

  it('should work', () => {
    // Test isolated from others
  });
});
```

## Examples

### Testing API Routes

```typescript
import { POST } from '@/app/api/matches/auto-match/route';
import { seedMockData, resetMockDataStore } from '@/tests/mocks/supabase/mockClient';
import type { Trip, Request } from '@/types/supabase';

describe('POST /api/matches/auto-match', () => {
  beforeEach(() => {
    resetMockDataStore();
    
    seedMockData<Trip>('trips', [
      { id: 'trip-1', from_location: 'Miami', to_location: 'St. Martin' },
    ]);
    
    seedMockData<Request>('requests', [
      { id: 'req-1', from_location: 'Miami', to_location: 'St. Martin' },
    ]);
  });

  it('should create matches', async () => {
    const request = new NextRequest('...', {
      method: 'POST',
      body: JSON.stringify({ type: 'trip', id: 'trip-1' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

### Testing Components

```typescript
import { render, screen } from '@/tests/utils/test-utils';
import { mockUserLogin } from '@/tests/mocks/supabase/helpers';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should show user data', () => {
    mockUserLogin({ id: 'user-1', email: 'test@example.com' });
    
    render(<MyComponent />);
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
});
```

### Testing Hooks

```typescript
import { renderHook } from '@testing-library/react';
import { useTrips } from '@/hooks/useTrips';
import { seedMockData, resetMockDataStore } from '@/tests/mocks/supabase/mockClient';

describe('useTrips', () => {
  beforeEach(() => {
    resetMockDataStore();
    seedMockData('trips', [
      { id: 'trip-1', from_location: 'Miami' },
    ]);
  });

  it('should fetch trips', async () => {
    const { result } = renderHook(() => useTrips());
    
    await waitFor(() => {
      expect(result.current.trips).toHaveLength(1);
    });
  });
});
```

## Troubleshooting

### Mocks Not Working

1. **Check setup file is imported**
   ```typescript
   // tests/setup.ts should import:
   import './setup-supabase-mock';
   ```

2. **Check environment variables**
   ```bash
   SUPABASE_MOCK_MODE=true
   # or
   CI=true
   ```

3. **Verify imports**
   ```typescript
   // Use this:
   import { supabase } from '@/tests/mocks/supabase/mockClient';
   
   // Not this:
   import { createClient } from '@/lib/supabase/client';
   ```

### Data Not Persisting

- Always call `resetMockDataStore()` in `beforeEach`
- Check that you're using the same mock client instance
- Verify data is seeded before queries

### Type Errors

- Import types from `@/types/supabase`
- Use generic types: `seedMockData<Trip>('trips', [...])`
- Check that mock types match Supabase types

## Migration Guide

### From Old Mocks

**Before:**
```typescript
import { createMockSupabaseClient } from '@/tests/utils/mocks';
const supabase = createMockSupabaseClient();
```

**After:**
```typescript
import { supabase } from '@/tests/mocks/supabase/mockClient';
// Ready to use!
```

### From Real Supabase

**Before:**
```typescript
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
```

**After:**
```typescript
import { supabase } from '@/tests/mocks/supabase/mockClient';
// Same API, no external calls!
```

## API Reference

See individual files for detailed API documentation:
- `mockClient.ts` - Main client interface
- `helpers.ts` - Helper functions
- `types.ts` - Type definitions

## Related Documentation

- [Testing Guide](./TEST_READINESS_REPORT.md)
- [CI/CD Pipeline](./CI_PIPELINE_REPORT.md)
- [Supabase Test Environment](./docs/SUPABASE_TEST.md)

---

**Last Updated**: November 20, 2025

