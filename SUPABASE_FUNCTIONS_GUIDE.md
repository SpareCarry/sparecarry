# Supabase Edge Functions Guide

**Location**: `supabase/functions/`  
**Type**: Edge Functions (Deno runtime), NOT SQL files  
**Deployment**: Use Supabase CLI or Dashboard

---

## ⚠️ Important: These Are NOT SQL Files

The files in `supabase/functions/` are **TypeScript Edge Functions**, not SQL scripts.  
**DO NOT** run them in the SQL Editor!

They need to be **deployed** as Supabase Edge Functions using:

- Supabase CLI (`supabase functions deploy`)
- Or Supabase Dashboard → Edge Functions

---

## What Are Edge Functions?

Supabase Edge Functions are serverless functions that run on Deno. They're similar to:

- AWS Lambda
- Vercel Serverless Functions
- Cloudflare Workers

They provide API endpoints that can be called from your app.

---

## Functions in This Project

### 1. `get-user/index.ts` ✅

**Purpose**: Fetch user profile data  
**Endpoint**: `GET /functions/v1/get-user`  
**Status**: ✅ Ready to deploy

### 2. `create-request/index.ts` ✅

**Purpose**: Create a new delivery request  
**Endpoint**: `POST /functions/v1/create-request`  
**Status**: ✅ Ready to deploy

### 3. `list-requests/index.ts` ✅

**Purpose**: List delivery requests with filters  
**Endpoint**: `GET /functions/v1/list-requests`  
**Status**: ✅ Ready to deploy

### 4. `create-match/index.ts` ✅

**Purpose**: Create a match between trip and request  
**Endpoint**: `POST /functions/v1/create-match`  
**Status**: ✅ Ready to deploy

### 5. `get-match/index.ts` ✅

**Purpose**: Get match details with messages  
**Endpoint**: `GET /functions/v1/get-match`  
**Status**: ✅ Ready to deploy

### 6. `send-message/index.ts` ✅

**Purpose**: Send a message in a match  
**Endpoint**: `POST /functions/v1/send-message`  
**Status**: ✅ Ready to deploy

### 7. `create-payment/index.ts` ✅

**Purpose**: Create a payment intent  
**Endpoint**: `POST /functions/v1/create-payment`  
**Status**: ✅ Ready to deploy

### 8. `get-payment/index.ts` ✅

**Purpose**: Get payment status  
**Endpoint**: `GET /functions/v1/get-payment`  
**Status**: ✅ Ready to deploy

### 9. `create-dispute/index.ts` ✅

**Purpose**: Open a dispute  
**Endpoint**: `POST /functions/v1/create-dispute`  
**Status**: ✅ Ready to deploy

### 10. `list-disputes/index.ts` ✅

**Purpose**: List disputes (admin)  
**Endpoint**: `GET /functions/v1/list-disputes`  
**Status**: ✅ Ready to deploy

---

## Do You Need These Functions?

### Option A: Use Next.js API Routes Instead ✅ (Recommended)

Your app already has Next.js API routes in `app/api/` that do the same thing:

- `app/api/users/[id]/route.ts` - Get user
- `app/api/requests/route.ts` - Create/list requests
- `app/api/matches/route.ts` - Create/get matches
- `app/api/messages/route.ts` - Send messages
- `app/api/payments/route.ts` - Payment operations
- `app/api/disputes/route.ts` - Dispute operations

**Recommendation**: Skip Edge Functions if you're using Next.js API routes.

---

### Option B: Use Edge Functions (If Needed)

**When to use Edge Functions:**

- You want serverless functions separate from Next.js
- You need Deno-specific features
- You want to call them from mobile apps directly
- You're building a headless API

**When NOT to use:**

- You're using Next.js API routes (which you are)
- You want simpler deployment
- You don't need Deno features

---

## How to Deploy Edge Functions (If Needed)

### Prerequisites

1. Install Supabase CLI:

   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:

   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref gujyzwqcwecbeznlablx
   ```

### Deploy All Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy get-user
supabase functions deploy create-request
# ... etc
```

### Deploy via Dashboard

1. Go to: https://supabase.com/dashboard/project/gujyzwqcwecbeznlablx
2. Click "Edge Functions" in left sidebar
3. Click "Create a new function"
4. Copy/paste the TypeScript code
5. Set function name
6. Deploy

---

## My Recommendation

**For SpareCarry app**: ❌ **Skip Edge Functions**

**Why?**

- You already have Next.js API routes that do the same thing
- Simpler deployment (Next.js handles it)
- No need for separate Deno runtime
- Less complexity

**When you WOULD need them:**

- If you want to call Supabase directly from mobile apps (bypassing Next.js)
- If you need Deno-specific features
- If you're building a headless API

---

## Summary

| File Type      | Location                      | Run Where?        | Status                   |
| -------------- | ----------------------------- | ----------------- | ------------------------ |
| SQL Migrations | `supabase/migrations/`        | ✅ SQL Editor     | Already done             |
| Storage Setup  | `supabase/storage-setup.sql`  | ✅ SQL Editor     | Run this                 |
| Realtime Setup | `supabase/realtime-setup.sql` | ✅ SQL Editor     | Fixed, run this          |
| Edge Functions | `supabase/functions/`         | ❌ NOT SQL Editor | Optional, deploy via CLI |

---

## Quick Decision

**Do you need Edge Functions?**

- ✅ Using Next.js API routes → **Skip Edge Functions**
- ❌ Need direct mobile access → **Deploy Edge Functions**

**For now**: Focus on getting your Next.js app working. Edge Functions can be added later if needed.

---

**Last Updated**: 2024-12-19
