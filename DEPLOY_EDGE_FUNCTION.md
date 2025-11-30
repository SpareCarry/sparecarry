# Deploy Edge Function Using Supabase CLI

## Prerequisites

1. **Install Supabase CLI:**

   ```bash
   # Using npm (recommended)
   npm install -g supabase

   # Or using Scoop (Windows)
   scoop install supabase

   # Or download from: https://github.com/supabase/cli/releases
   ```

2. **Verify installation:**
   ```bash
   supabase --version
   ```

## Step 1: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate. After successful login, you'll be authenticated.

## Step 2: Link to Your Project

```bash
# Option A: Link using project reference (recommended)
supabase link --project-ref your-project-ref

# Option B: Link interactively (will prompt for project)
supabase link
```

To find your project reference:

1. Go to Supabase Dashboard
2. Select your project
3. Go to Settings → General
4. Copy the "Reference ID"

## Step 3: Deploy the Edge Function

```bash
# Deploy notify-route-matches function
supabase functions deploy notify-route-matches
```

This will:

- Upload the function code from `supabase/functions/notify-route-matches/`
- Deploy it to your Supabase project
- Show deployment status

## Step 4: Set Environment Variables

### Option A: Using Supabase CLI

```bash
# Set SUPABASE_URL
supabase secrets set SUPABASE_URL=https://your-project.supabase.co

# Set SUPABASE_SERVICE_ROLE_KEY
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Option B: Using Supabase Dashboard

1. Go to **Edge Functions** → **notify-route-matches**
2. Click **Settings** or the gear icon
3. Under **Environment Variables**, add:
   - `SUPABASE_URL`: Your project URL (e.g., `https://xxxxx.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

To find your service role key:

1. Go to **Settings** → **API**
2. Copy the **service_role** key (secret) - ⚠️ Keep this secure!

## Step 5: Verify Deployment

```bash
# List deployed functions
supabase functions list

# Check function logs
supabase functions logs notify-route-matches
```

## Step 6: Test the Function

You can test the function using the Supabase Dashboard:

1. Go to **Edge Functions** → **notify-route-matches**
2. Click **Invoke**
3. Use this test payload:
   ```json
   {
     "request_id": "test-request-id",
     "from_location": "Australia",
     "to_location": "Indonesia",
     "departure_lat": -25.2744,
     "departure_lon": 133.7751,
     "arrival_lat": -0.7893,
     "arrival_lon": 113.9213
   }
   ```
4. Click **Invoke Function**
5. Check the response and logs

## Troubleshooting

### "Function not found" error

- Verify the function exists in `supabase/functions/notify-route-matches/`
- Check the function name matches exactly

### "Authentication failed" error

- Run `supabase login` again
- Verify you're linked to the correct project

### "Environment variable not set" error

- Verify secrets are set: `supabase secrets list`
- Check dashboard settings match CLI secrets

### Function deployment fails

- Check function code for syntax errors
- Verify Deno imports are correct
- Check Supabase logs for detailed errors

## Alternative: Deploy via Dashboard

If CLI doesn't work, you can deploy via the Supabase Dashboard:

1. Go to **Edge Functions** → **Create a new function**
2. Name it: `notify-route-matches`
3. Copy contents from `supabase/functions/notify-route-matches/index.ts`
4. Paste into the editor
5. Click **Deploy**
6. Set environment variables in Settings

## Next Steps

After deployment:

1. Test with a real request creation
2. Monitor logs for any errors
3. Verify push notifications are received
4. Check that matching users receive notifications
