# Quick Deploy Commands

## Install and Deploy Edge Function

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link to your project (replace YOUR_PROJECT_REF with your actual project reference)
supabase link --project-ref YOUR_PROJECT_REF

# 4. Deploy the edge function
supabase functions deploy notify-route-matches

# 5. Set environment variables (replace with your actual values)
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Find Your Project Reference

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **General**
4. Copy the **Reference ID** (looks like: `abcdefghijklmnop`)

## Find Your Service Role Key

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **service_role** key (the secret one, not the anon key)
5. ⚠️ **Keep this secret!** Never commit it to git.

## Verify Deployment

```bash
# List all deployed functions
supabase functions list

# View function logs
supabase functions logs notify-route-matches

# Test the function
supabase functions invoke notify-route-matches --data '{"request_id":"test","from_location":"A","to_location":"B"}'
```

## Alternative: Deploy via Dashboard

If CLI doesn't work:

1. Go to **Edge Functions** → **Create a new function**
2. Name: `notify-route-matches`
3. Copy code from `supabase/functions/notify-route-matches/index.ts`
4. Paste and click **Deploy**
5. Go to **Settings** → **Environment Variables**
6. Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

