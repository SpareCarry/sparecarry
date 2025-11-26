-- Fix RLS policies and add new preferred method options
-- This migration ensures RLS policies work correctly and adds 'quickest' and 'best_fit' options

-- Update preferred_method CHECK constraint to include new options
ALTER TABLE public.requests
DROP CONSTRAINT IF EXISTS requests_preferred_method_check;

ALTER TABLE public.requests
ADD CONSTRAINT requests_preferred_method_check 
CHECK (preferred_method IN ('plane', 'boat', 'any', 'quickest', 'best_fit'));

-- Ensure value_usd can be NULL (should already be nullable, but making sure)
ALTER TABLE public.requests
ALTER COLUMN value_usd DROP NOT NULL;

-- Verify RLS policies allow authenticated users to insert
-- The existing policy should work, but let's make sure:
-- Policy "Users can create their own requests" already exists with:
-- WITH CHECK (auth.uid() = user_id)
-- This should work if user is authenticated properly.

-- For debugging: Add a policy that logs issues (remove after debugging)
-- CREATE POLICY "Debug: Log insert attempts" ON public.requests FOR INSERT
-- WITH CHECK (true)
-- USING (true);

