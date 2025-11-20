# Supabase Testing Environment

This document explains how Supabase is mocked for testing and CI/CD environments.

## Overview

The SpareCarry application uses a **mock Supabase environment** for:
- Unit and integration tests
- CI/CD pipelines
- Local development without Supabase credentials

This ensures tests run consistently and don't require external services or secrets.

## Mock Mode Activation

Mock mode is automatically enabled when:

1. **CI Environment**: `CI=true` (GitHub Actions, etc.)
2. **Environment Variable**: `SUPABASE_MOCK_MODE=true`
3. **Test Supabase URL**: `NEXT_PUBLIC_SUPABASE_URL` contains `test` or is not set

## Mock Implementation

### Location

- **Mock Client**: `lib/supabase/mock.ts`
- **Setup**: `tests/setup-supabase-mock.ts`
- **Integration**: `tests/setup.ts`

### Features

The mock Supabase client provides:

1. **Authentication Methods**:
   - `getUser()` - Returns mock user
   - `signInWithOtp()` - Simulates magic link
   - `signInWithOAuth()` - Simulates OAuth
   - `signOut()` - Simulates logout

2. **Database Queries**:
   - `from(table).select()` - Query mock data
   - `from(table).insert()` - Add mock data
   - `from(table).update()` - Update mock data
   - `from(table).delete()` - Delete mock data
   - Filtering: `eq()`, `neq()`, `gt()`, `gte()`, `lt()`, `lte()`, `or()`
   - Ordering: `order()`
   - Limiting: `limit()`
   - Single result: `single()`

3. **Storage**:
   - `storage.from(bucket).upload()` - Mock file upload
   - `storage.from(bucket).getPublicUrl()` - Mock public URL

### Mock Data Store

Mock data is stored in memory during test execution:

```typescript
import { seedMockData, resetMockDataStore } from '@/lib/supabase/mock';

// Seed data before tests
beforeEach(() => {
  resetMockDataStore();
  seedMockData('trips', [
    { id: 'trip-1', from_location: 'Miami', to_location: 'St. Martin' },
  ]);
  seedMockData('requests', [
    { id: 'req-1', from_location: 'Miami', to_location: 'St. Martin' },
  ]);
});
```

## Usage in Tests

### Automatic Mocking

Mocks are automatically set up when running tests:

```typescript
import { createClient } from '@/lib/supabase/client';

// This will use the mock in test environment
const supabase = createClient();
const { data } = await supabase.from('trips').select('*');
```

### Manual Mocking

For more control, you can use the mock directly:

```typescript
import { createMockSupabaseClient, seedMockData } from '@/lib/supabase/mock';

const supabase = createMockSupabaseClient();
seedMockData('trips', [{ id: 'trip-1', ... }]);

const { data } = await supabase.from('trips').select('*').eq('id', 'trip-1').single();
```

## CI/CD Configuration

### GitHub Actions

The CI pipeline automatically uses mocks:

```yaml
env:
  NODE_ENV: test
  NEXT_PUBLIC_SUPABASE_URL: https://test.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY: test-anon-key
  CI: true
```

### Local Testing

To use mocks locally:

```bash
# Set environment variable
export SUPABASE_MOCK_MODE=true

# Or use test URL
export NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co

# Run tests
pnpm test
```

## Mock Data Management

### Resetting Data

Reset mock data between tests:

```typescript
import { resetMockDataStore } from '@/lib/supabase/mock';

beforeEach(() => {
  resetMockDataStore();
});
```

### Seeding Data

Seed specific data for tests:

```typescript
import { seedMockData } from '@/lib/supabase/mock';

seedMockData('users', [
  { id: 'user-1', email: 'test@example.com' },
  { id: 'user-2', email: 'test2@example.com' },
]);
```

## Limitations

### Current Limitations

1. **Complex Queries**: Some complex Supabase queries may not be fully supported
2. **Real-time**: Real-time subscriptions are not mocked
3. **RLS Policies**: Row Level Security policies are not enforced
4. **Functions**: Database functions (RPC) are not mocked

### Workarounds

For complex scenarios:

1. **Use Integration Tests**: Test against a real Supabase instance in staging
2. **Mock at Higher Level**: Mock API routes instead of Supabase directly
3. **Test Utilities**: Create test utilities that abstract complex queries

## Best Practices

### 1. Keep Mocks Simple

Focus on testing business logic, not Supabase internals:

```typescript
// Good: Test your logic
const result = await calculateMatchScore(params);

// Avoid: Testing Supabase query syntax
const { data } = await supabase.from('trips').select('*');
```

### 2. Use Real Types

Always use TypeScript types from `types/supabase.ts`:

```typescript
import type { Trip } from '@/types/supabase';

seedMockData<Trip>('trips', [
  { id: 'trip-1', type: 'plane', ... },
]);
```

### 3. Reset Between Tests

Always reset mock data to avoid test pollution:

```typescript
afterEach(() => {
  resetMockDataStore();
});
```

### 4. Test Error Cases

Mock error scenarios:

```typescript
const supabase = createMockSupabaseClient();
vi.spyOn(supabase.from('trips'), 'select').mockRejectedValue(new Error('Network error'));
```

## Environment Variables

### Test Environment

```env
NODE_ENV=test
SUPABASE_MOCK_MODE=true
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
```

### CI Environment

```env
CI=true
NODE_ENV=test
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_123
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Troubleshooting

### Mocks Not Working

1. **Check Environment**: Ensure `SUPABASE_MOCK_MODE=true` or test URL is set
2. **Check Setup**: Verify `tests/setup-supabase-mock.ts` is imported
3. **Check Imports**: Ensure you're importing from the correct path

### Tests Failing

1. **Reset Data**: Call `resetMockDataStore()` between tests
2. **Seed Data**: Ensure required data is seeded before tests
3. **Check Types**: Verify types match between mocks and real Supabase

## Future Improvements

1. **Enhanced Query Support**: Add support for more complex queries
2. **RLS Simulation**: Simulate Row Level Security policies
3. **Real-time Mocks**: Mock real-time subscriptions
4. **Function Mocks**: Mock database functions (RPC)

## Related Documentation

- [Testing Guide](../TEST_READINESS_REPORT.md)
- [Type Coverage](../TYPECOVERAGE_REPORT.md)
- [CI/CD Pipeline](../.github/workflows/ci.yml)

---

**Last Updated**: November 20, 2025

