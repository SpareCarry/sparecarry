-- Add karma_points column to users table
-- Karma points are awarded for helping travelers complete deliveries

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS karma_points INTEGER DEFAULT 0;

-- Add index for karma points queries
CREATE INDEX IF NOT EXISTS idx_users_karma_points ON public.users(karma_points);

-- Add comment
COMMENT ON COLUMN public.users.karma_points IS 'Karma points earned by helping travelers. Awarded based on weight and platform fee of completed deliveries.';

