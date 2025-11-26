# Manual Deployment Steps Guide

## 1. Deploy Edge Function `notify-route-matches` to Supabase

**📖 Detailed instructions:** See `DEPLOY_EDGE_FUNCTION.md` for complete step-by-step guide.

### Option A: Using Supabase CLI (Recommended)

```bash
# Step 1: Install Supabase CLI (if not installed)
# See DEPLOY_EDGE_FUNCTION.md for the recommended install method on Windows

# Step 2: Login to Supabase
supabase login

# Step 3: Link to your project (replace with your project ref)
supabase link --project-ref your-project-ref

# Step 4: Deploy the edge function
supabase functions deploy notify-route-matches

# Step 5: Set edge function environment variables
# NOTE: Secret names CANNOT start with SUPABASE_, so we use EDGE_* names.
supabase secrets set EDGE_SUPABASE_URL=https://your-project.supabase.co
supabase secrets set EDGE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**To find your project reference:**
- Go to Supabase Dashboard → Settings → General
- Copy the "Reference ID"

**To find your service role key:**
- Go to Supabase Dashboard → Settings → API
- Copy the **service_role** key (secret) - ⚠️ Keep this secure!

### Option B: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** in the left sidebar
3. Click **Create a new function**
4. Name it `notify-route-matches`
5. Copy the contents of `supabase/functions/notify-route-matches/index.ts`
6. Paste into the function editor
7. Click **Deploy**
8. Go to **Settings** → **Environment Variables**
9. Add:
   - `EDGE_SUPABASE_URL`: Your project URL
   - `EDGE_SUPABASE_SERVICE_ROLE_KEY`: Your service role key

## 2. Set Environment Variables in Supabase

### For Edge Function

1. Go to **Edge Functions** → **notify-route-matches**
2. Click **Settings** or **Environment Variables**
3. Add the following variables (matching what the function reads):
   - `EDGE_SUPABASE_URL`: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
   - `EDGE_SUPABASE_SERVICE_ROLE_KEY`: Your service role key (found in Settings → API)

### Where to Find Your Keys

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy:
   - **Project URL** → Use as the value for `EDGE_SUPABASE_URL`
   - **service_role** key (secret) → Use as the value for `EDGE_SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Security Note**: Never expose the service role key in client-side code. It's already handled server-side in `/api/notifications/notify-route-matches/route.ts`.

## 3. Verify Match Status Updates to 'completed'

The database trigger `update_user_delivery_stats()` only fires when match status changes to `'completed'`. Verify these completion points:

### Check Points:

1. **Auto-release escrow** (`supabase/functions/auto-release-escrow/index.ts`)
   - ✅ Already updates to `'completed'` (line 78)

2. **Delivery confirmation** (`components/chat/delivery-confirmation.tsx`)
   - ✅ **FIXED**: Now updates to `'completed'` (was `'delivered'`)
   - Status change triggers `update_user_delivery_stats()` which increments `completed_deliveries`
   - This also triggers `process_referral_credits_trigger` for referral credit awards

3. **Payment button completion** (`components/chat/payment-button.tsx`)
   - ✅ **CORRECT**: Updates to `'escrow_paid'` when payment is made (line 244)
   - Status then changes to `'completed'` when delivery is confirmed
   - This is the correct flow: `escrow_paid` → `completed` (on delivery)

### Status Summary:

✅ **All completion points verified:**
- Auto-release escrow: Updates to `'completed'` ✅
- Delivery confirmation: Updates to `'completed'` ✅ (FIXED)
- Payment button: Sets `'escrow_paid'`, then `'completed'` on delivery ✅

The database trigger `update_user_delivery_stats()` fires when match status changes to `'completed'`, which now happens at all completion points.

## 4. Runtime Testing of Push Notifications

### Test Steps:

1. **Enable notifications on a test device:**
   - Open the app on a physical device or emulator
   - Grant notification permissions when prompted
   - Verify `profiles.expo_push_token` is set in the database

2. **Create a test request:**
   - Post a request with locations that match an active trip
   - Check that the edge function is called (check Supabase logs)
   - Verify push notification is received on matching devices

3. **Check Supabase Logs:**
   - Go to **Edge Functions** → **notify-route-matches** → **Logs**
   - Look for successful executions and any errors

4. **Verify Notification Delivery:**
   - Check device receives notification
   - Verify notification deep link works
   - Test notification click navigation

### Troubleshooting:

- **No notifications received:**
  - Check `profiles.notify_route_matches` is `true` for test users
    ```sql
    SELECT user_id, notify_route_matches, expo_push_token 
    FROM profiles 
    WHERE notify_route_matches = true;
    ```
  - Verify `profiles.expo_push_token` is set (not NULL)
  - Check edge function logs in Supabase Dashboard → Edge Functions → notify-route-matches → Logs
  - Verify environment variables are set correctly:
    - `EDGE_SUPABASE_URL` should be your project URL
    - `EDGE_SUPABASE_SERVICE_ROLE_KEY` should be the service_role key (not anon key)
  - Verify the API route `/api/notifications/notify-route-matches` is being called
    - Check browser network tab when creating a request
    - Should see a POST request to this endpoint

- **Edge function errors:**
  - Check Supabase logs for detailed error messages:
    - Dashboard → Edge Functions → notify-route-matches → Logs
  - Verify service role key has correct permissions:
    - Should be the `service_role` key from Settings → API
    - Not the `anon` or `service_role` key
  - Ensure Supabase URL is correct:
    - Format: `https://xxxxx.supabase.co`
    - No trailing slash
  - Check function deployment:
    - Verify function exists in Edge Functions list
    - Check function code matches `supabase/functions/notify-route-matches/index.ts`

- **API route errors:**
  - Check Next.js server logs for errors
  - Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local` or production environment
  - Test the API route directly:
    ```bash
    curl -X POST http://localhost:3000/api/notifications/notify-route-matches \
      -H "Content-Type: application/json" \
      -H "Cookie: your-auth-cookie" \
      -d '{"request_id":"test","from_location":"A","to_location":"B"}'
    ```

## 5. Verify Database Migrations

Run these migrations in order in your Supabase SQL Editor:

1. `supabase/migrations/20250103000000_add_first_3_deliveries_and_referral_updates.sql`
2. `supabase/migrations/20250104000000_add_8_features.sql`

### How to Run:

1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Copy and paste the migration SQL
4. Click **Run**
5. Verify no errors

## 6. Test Referral API Routes

Test the new API routes:

```bash
# Test get-or-create (requires auth)
curl -X POST http://localhost:3000/api/referrals/get-or-create \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie"

# Test stats (requires auth)
curl http://localhost:3000/api/referrals/stats \
  -H "Cookie: your-auth-cookie"

# Test leaderboard (public)
curl http://localhost:3000/api/referrals/leaderboard
```

## 7. Enable Auth Leaked Password Protection

1. Go to **Authentication** → **Settings** in Supabase dashboard
2. Find **Password Security** section
3. Enable **Leaked Password Protection**
4. This checks passwords against HaveIBeenPwned.org

---

**Next Steps After Manual Setup:**
- Monitor edge function logs for the first few requests
- Test push notifications on multiple devices
- Verify referral credits are awarded correctly
- Check that `completed_deliveries` increments properly

