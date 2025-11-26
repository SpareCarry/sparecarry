# Implementation Plan: Fix Authentication Mocking

Based on HAR file analysis and debug tests:

## Findings

1. **Function matchers work!** ✅ Verified in debug test
2. **Supabase DOES make network requests** ✅ Confirmed in HAR file
3. **Routes are registered but not intercepting** ❌ Still failing

## Root Cause

The issue is likely **route registration timing**. Routes need to be registered BEFORE navigation, and they need to be in the correct order.

## Solution

1. **Clear localStorage BEFORE setting up routes** - Forces Supabase to make network requests
2. **Register routes BEFORE navigation** - Ensure routes are active when requests are made
3. **Use function matchers** - We know these work from debug tests
4. **Match exact URL format** - Based on HAR: `https://gujyzwqcwecbeznlablx.supabase.co/auth/v1/user`

## Implementation Steps

1. Update `mockUserAuth` to clear localStorage first
2. Ensure routes are registered before `page.goto()`
3. Use function matchers (already done)
4. Add proper CORS headers in route responses

