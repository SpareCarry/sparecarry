# Supabase Edge Functions API Routes

**Generated**: 2024-12-19  
**Status**: ✅ **COMPLETE**

---

## Executive Summary

Complete Supabase Edge Functions (serverless API routes) have been created for all core SpareCarry operations. All functions include authentication, authorization, error handling, and CORS support.

**Overall Status**: ✅ **READY**

---

## Edge Functions Created

### 1. Get User Profile

**Path**: `/functions/v1/get-user`  
**Method**: `GET`  
**Query Parameters**: `id` (optional, defaults to authenticated user)

**Features**:

- ✅ Returns user profile
- ✅ Users can only access their own profile
- ✅ Admins can access any profile
- ✅ RLS enforced

**Example**:

```bash
curl -X GET "https://gujyzwqcwecbeznlablx.supabase.co/functions/v1/get-user?id=USER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Create Request

**Path**: `/functions/v1/create-request`  
**Method**: `POST`  
**Body**: `{ trip_id?, title, description?, item_category?, reward_amount }`

**Features**:

- ✅ Creates new delivery request
- ✅ Validates required fields
- ✅ Sets status to 'open'
- ✅ Returns created request

**Example**:

```bash
curl -X POST "https://gujyzwqcwecbeznlablx.supabase.co/functions/v1/create-request" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Deliver Package", "reward_amount": 100.00}'
```

---

### 3. List Requests

**Path**: `/functions/v1/list-requests`  
**Method**: `GET`  
**Query Parameters**: `status?`, `category?`

**Features**:

- ✅ Lists all requests (filtered by status/category)
- ✅ Non-authenticated users see only 'open' requests
- ✅ Authenticated users see all accessible requests
- ✅ Ordered by creation date (newest first)

**Example**:

```bash
curl -X GET "https://gujyzwqcwecbeznlablx.supabase.co/functions/v1/list-requests?status=open" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4. Create Match

**Path**: `/functions/v1/create-match`  
**Method**: `POST`  
**Body**: `{ request_id }`

**Features**:

- ✅ Creates match between traveler and request
- ✅ Verifies request is 'open'
- ✅ Prevents duplicate matches
- ✅ Updates request status to 'matched'
- ✅ Returns created match

**Example**:

```bash
curl -X POST "https://gujyzwqcwecbeznlablx.supabase.co/functions/v1/create-match" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"request_id": "REQUEST_ID"}'
```

---

### 5. Get Match with Messages

**Path**: `/functions/v1/get-match`  
**Method**: `GET`  
**Query Parameters**: `id` (required)

**Features**:

- ✅ Returns match details
- ✅ Includes all messages for the match
- ✅ Verifies user has access to match
- ✅ Messages ordered by creation date

**Example**:

```bash
curl -X GET "https://gujyzwqcwecbeznlablx.supabase.co/functions/v1/get-match?id=MATCH_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 6. Send Message

**Path**: `/functions/v1/send-message`  
**Method**: `POST`  
**Body**: `{ match_id, body }`

**Features**:

- ✅ Creates message in match conversation
- ✅ Verifies user is part of match
- ✅ Returns created message
- ✅ RLS enforced

**Example**:

```bash
curl -X POST "https://gujyzwqcwecbeznlablx.supabase.co/functions/v1/send-message" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"match_id": "MATCH_ID", "body": "Hello!"}'
```

---

### 7. Create Payment

**Path**: `/functions/v1/create-payment`  
**Method**: `POST`  
**Body**: `{ match_id, stripe_payment_intent, amount }`

**Features**:

- ✅ Creates payment record
- ✅ Links to Stripe payment intent
- ✅ Verifies user has access to match
- ✅ Sets status to 'pending'
- ✅ Returns created payment

**Example**:

```bash
curl -X POST "https://gujyzwqcwecbeznlablx.supabase.co/functions/v1/create-payment" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"match_id": "MATCH_ID", "stripe_payment_intent": "pi_xxx", "amount": 100.00}'
```

---

### 8. Get Payment Status

**Path**: `/functions/v1/get-payment`  
**Method**: `GET`  
**Query Parameters**: `id` (required)

**Features**:

- ✅ Returns payment details
- ✅ Verifies user has access to payment
- ✅ Returns payment status

**Example**:

```bash
curl -X GET "https://gujyzwqcwecbeznlablx.supabase.co/functions/v1/get-payment?id=PAYMENT_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 9. Create Dispute

**Path**: `/functions/v1/create-dispute`  
**Method**: `POST`  
**Body**: `{ match_id, reason }`

**Features**:

- ✅ Creates dispute record
- ✅ Verifies user is part of match
- ✅ Prevents duplicate open disputes
- ✅ Updates match status to 'disputed'
- ✅ Returns created dispute

**Example**:

```bash
curl -X POST "https://gujyzwqcwecbeznlablx.supabase.co/functions/v1/create-dispute" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"match_id": "MATCH_ID", "reason": "Package damaged"}'
```

---

### 10. List Disputes

**Path**: `/functions/v1/list-disputes`  
**Method**: `GET`  
**Query Parameters**: `status?`

**Features**:

- ✅ Lists disputes
- ✅ Non-admins see only their own disputes
- ✅ Admins see all disputes
- ✅ Can filter by status
- ✅ Ordered by creation date (newest first)

**Example**:

```bash
curl -X GET "https://gujyzwqcwecbeznlablx.supabase.co/functions/v1/list-disputes?status=open" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Deployment

### Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref gujyzwqcwecbeznlablx

# Deploy all functions
supabase functions deploy

# Or deploy individual function
supabase functions deploy get-user
supabase functions deploy create-request
# ... etc
```

### Using Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/gujyzwqcwecbeznlablx
2. Click "Edge Functions" in left sidebar
3. Click "Create a new function"
4. Copy function code from `supabase/functions/{function-name}/index.ts`
5. Deploy

---

## Authentication

All functions require authentication via JWT token in Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Get JWT token from Supabase Auth:

```javascript
const {
  data: { session },
} = await supabase.auth.getSession();
const token = session?.access_token;
```

---

## Error Handling

All functions return standardized error responses:

```json
{
  "error": "Error message"
}
```

**Status Codes**:

- `200` - Success
- `201` - Created
- `400` - Bad Request (missing/invalid fields)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (no access)
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Server Error

---

## CORS

All functions include CORS headers:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`

---

## Security

- ✅ All functions verify authentication
- ✅ Authorization checks for user access
- ✅ RLS policies enforced
- ✅ Input validation
- ✅ Error messages sanitized

---

## Testing

### Local Testing

```bash
# Start Supabase locally
supabase start

# Serve functions locally
supabase functions serve

# Test function
curl -X GET "http://localhost:54321/functions/v1/get-user" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Production Testing

Use the production URLs:

```
https://gujyzwqcwecbeznlablx.supabase.co/functions/v1/{function-name}
```

---

## Function Locations

All functions are located in:

```
supabase/functions/
├── get-user/
│   └── index.ts
├── create-request/
│   └── index.ts
├── list-requests/
│   └── index.ts
├── create-match/
│   └── index.ts
├── get-match/
│   └── index.ts
├── send-message/
│   └── index.ts
├── create-payment/
│   └── index.ts
├── get-payment/
│   └── index.ts
├── create-dispute/
│   └── index.ts
└── list-disputes/
    └── index.ts
```

---

## Next Steps

1. **Deploy Functions**:

   ```bash
   supabase functions deploy
   ```

2. **Test Functions**:
   - Use Postman or curl
   - Test with authenticated users
   - Verify RLS policies

3. **Integrate in App**:
   - Update API calls to use Edge Functions
   - Handle errors appropriately
   - Add loading states

---

## Conclusion

**Overall Status**: ✅ **COMPLETE**

All 10 Supabase Edge Functions have been created with full authentication, authorization, error handling, and CORS support. Functions are ready for deployment and use.

**Ready for**: Deployment and integration

---

**Last Updated**: 2024-12-19  
**Report Version**: 1.0.0
