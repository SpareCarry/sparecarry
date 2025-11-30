# Real API Testing Guide

## Overview

The real API test runner (`npm run test:real-api`) makes **actual API calls** to validate connectivity and integration. Use this **sparingly** for pre-deployment validation.

## ⚠️ Important Warnings

### This Test Makes Real API Calls!

- ✅ Uses your **Supabase API quota** (real database queries)
- ✅ Creates **Stripe test payment intents** (if configured)
- ✅ Sends **test emails** via Resend (if configured)
- ✅ Makes **real HTTP calls** to your API endpoints

### When to Use

✅ **Good Times to Run:**

- Before deploying to production
- After major API changes
- For smoke tests (occasionally)
- Pre-release validation

❌ **DON'T Run:**

- During regular development
- In CI/CD pipelines (use mock tests)
- Frequently (hits rate limits)
- When near service quota limits

## Usage

### Basic Usage

```bash
npm run test:real-api
```

**What happens:**

1. Shows warning message
2. Waits 5 seconds (you can press Ctrl+C to cancel)
3. Runs real API tests
4. Shows results and API call count
5. Saves results to `test-results/real-api-test-{timestamp}.json`

### Auto-Confirm (For Scripts)

Skip the 5-second wait:

```bash
AUTO_CONFIRM=true npm run test:real-api
```

## What Gets Tested

### 1. Real Supabase Connection

- Makes **1 real database query**
- Tests actual connectivity
- Validates authentication

### 2. Real Stripe Connection (Test Mode Only)

- Makes **1 real API call** to Stripe
- **Safety**: Only allows test keys (blocks live keys)
- Validates Stripe integration

### 3. Real API Endpoint Connectivity

- Makes **real HTTP calls** to your endpoints
- Tests if server is running
- Validates endpoint responses

## Safety Features

### Built-in Protections

1. **Confirmation Prompt**: 5-second warning before starting
2. **Test Keys Only**: Stripe live keys are blocked
3. **Minimal Calls**: Only 1-2 calls per service
4. **Rate Limiting**: Small delays between calls
5. **Clear Warnings**: Shows exactly what will happen

### API Call Limits

The test is designed to be minimal:

- **Supabase**: 1 query (users table, limit 1)
- **Stripe**: 1 API call (account info only)
- **API Endpoints**: 2-3 HTTP calls (health check + endpoints)

**Total**: ~4-5 API calls per run

## Results

### Console Output

```
⚠️  WARNING: Real API Testing Mode
============================================================
This will make REAL API calls to:
  • Supabase (database queries, auth)
  • Stripe (test payment intents)
  • Resend (test emails)
  • Your API endpoints

These will count against your service quotas!
============================================================

Press Ctrl+C to cancel, or wait 5 seconds to continue...
Starting real API tests...

🚀 Starting Real API Tests (NOT MOCKED)

🧪 Testing: Real Supabase Connection...
✅ PASSED: Real Supabase Connection
   connected: true
   canQuery: true
   apiCallsMade: 1

🧪 Testing: Real Stripe Connection (Test Mode)...
✅ PASSED: Real Stripe Connection (Test Mode)
   connected: true
   mode: "test"
   apiCallsMade: 1

📊 REAL API TEST SUMMARY

✅ Real Supabase Connection
✅ Real Stripe Connection (Test Mode)
✅ Real API Endpoint Connectivity

✅ Passed: 3
❌ Failed: 0
📈 Total: 3

📊 API Calls Made: 4
⚠️  Note: These calls count against your service quotas

🎉 All real API tests passed!
```

### JSON Results File

Saved to: `test-results/real-api-test-{timestamp}.json`

```json
{
  "timestamp": "2025-01-25T10:30:00.000Z",
  "type": "real_api_tests",
  "results": [
    {
      "feature": "Real Supabase Connection",
      "passed": true,
      "details": {
        "connected": true,
        "canQuery": true,
        "apiCallsMade": 1
      }
    }
  ],
  "summary": {
    "passed": 3,
    "failed": 0,
    "total": 3,
    "apiCallsMade": 4
  }
}
```

## Comparison with Mock Tests

| Feature       | Mock Tests                       | Real API Tests          |
| ------------- | -------------------------------- | ----------------------- |
| **Command**   | `npm run test:comprehensive:new` | `npm run test:real-api` |
| **API Calls** | 0                                | 4-5 real calls          |
| **Speed**     | Fast                             | Slower                  |
| **Cost**      | Free                             | Uses quotas             |
| **Use Case**  | Daily development                | Pre-deployment          |
| **Frequency** | Often                            | Rarely                  |

## Recommended Workflow

### Daily Development

```bash
# Use mock tests (fast, free)
npm run test:comprehensive:new
```

### Before Production

```bash
# 1. Run mock tests first
npm run test:comprehensive:new

# 2. Then run real API tests (final validation)
npm run test:real-api

# 3. Deploy with confidence! 🚀
```

## Troubleshooting

### "Server not running"

- Start your Next.js dev server: `pnpm dev`
- Or set `NEXT_PUBLIC_APP_URL` to your production URL

### "Stripe live key detected"

- Only test keys (`sk_test_...`) are allowed
- The test blocks live keys for safety

### "Supabase connection failed"

- Check your `.env.local` file
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Ensure you have API quota remaining

### Tests Pass But Want More Coverage

- Real API tests are intentionally minimal (to save quota)
- For full E2E testing, use Playwright tests
- For integration tests, use mock tests (they're comprehensive)

## Summary

**Use real API tests for:**

- ✅ Final validation before production
- ✅ Smoke tests (occasionally)
- ✅ Connectivity verification

**Use mock tests for:**

- ✅ Daily development
- ✅ CI/CD pipelines
- ✅ Regular testing

**Your testing strategy should be:**

- 95% mock tests (fast, free)
- 5% real API tests (final validation)

---

Remember: **Real API tests cost API calls**. Use them wisely! 🎯
