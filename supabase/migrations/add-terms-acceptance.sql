-- Add terms acceptance tracking to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS terms_version TEXT;

-- Index for queries
CREATE INDEX IF NOT EXISTS idx_users_terms_accepted ON public.users(terms_accepted_at);

