-- Add Supporter tier to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS supporter_status TEXT CHECK (supporter_status IN ('active', 'expired', NULL)) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS supporter_purchased_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS supporter_expires_at TIMESTAMP WITH TIME ZONE;

-- Index for supporter status queries
CREATE INDEX IF NOT EXISTS idx_users_supporter_status ON public.users(supporter_status) WHERE supporter_status = 'active';

