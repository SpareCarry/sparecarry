# RLS Policy Fix Guide

## Issue: "new row violates row-level security policy" when creating posts

### Root Cause
The RLS policies require `auth.uid() = user_id` to match. This can fail if:
1. User is not properly authenticated
2. Session token is missing or expired
3. Supabase client is not using authenticated session

### Solution
The RLS policies are correct:
- `CREATE POLICY "Users can create their own trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);`
- `CREATE POLICY "Users can create their own requests" ON public.requests FOR INSERT WITH CHECK (auth.uid() = user_id);`

### Debugging Steps

1. **Verify Authentication**:
   - Check that `supabase.auth.getUser()` returns a valid user
   - Verify the user ID matches the one being inserted

2. **Check Supabase Client**:
   - Ensure using `createClient()` from `lib/supabase/client` (not server)
   - Verify session cookies are being sent

3. **Check User ID in Insert**:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) {
     // User not authenticated - redirect to login
     router.push("/auth/login");
     return;
   }
   
   // Ensure user.id is being used in insert
   const { data, error } = await supabase
     .from("trips")
     .insert({
       user_id: user.id, // Must match auth.uid()
       // ... other fields
     });
   ```

4. **Temporary Debug Policy** (remove after debugging):
   ```sql
   -- Temporarily allow all authenticated users to insert (for debugging)
   CREATE POLICY "Debug: Allow authenticated users" 
   ON public.trips FOR INSERT 
   WITH CHECK (auth.role() = 'authenticated');
   ```

### Common Issues

1. **User not authenticated**: Make sure login flow completes and session is stored
2. **Session expired**: Refresh the session or re-authenticate
3. **Wrong user_id**: Ensure you're using `user.id` from `auth.getUser()`, not a different ID

### Testing

After fixing, test by:
1. Logging in as a user
2. Creating a trip/request
3. Verifying it saves correctly
4. Checking the database to confirm `user_id` matches authenticated user

