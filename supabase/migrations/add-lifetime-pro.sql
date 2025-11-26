-- Add Lifetime Pro support to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS lifetime_pro BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lifetime_pro_purchased_at TIMESTAMP WITH TIME ZONE;

-- Index for lifetime pro queries
CREATE INDEX IF NOT EXISTS idx_users_lifetime_pro ON public.users(lifetime_pro) WHERE lifetime_pro = TRUE;

-- Update supporter_status if it doesn't exist (should already be there from previous migration)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'supporter_status'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN supporter_status TEXT CHECK (supporter_status IN ('active', 'expired', NULL)) DEFAULT NULL,
    ADD COLUMN supporter_purchased_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN supporter_expires_at TIMESTAMP WITH TIME ZONE;
    
    CREATE INDEX IF NOT EXISTS idx_users_supporter_status ON public.users(supporter_status) WHERE supporter_status = 'active';
  END IF;
END $$;

