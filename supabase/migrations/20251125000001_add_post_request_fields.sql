-- Add new fields to requests table for Post Request upgrades
-- Emergency add-on pricing, category, restricted items, etc.

ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS item_category TEXT,
ADD COLUMN IF NOT EXISTS category_other_description TEXT,
ADD COLUMN IF NOT EXISTS restricted_items BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS emergency_bonus_percentage DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS emergency_extra_amount DECIMAL(10, 2);

-- Add constraint to prevent Plane transport for restricted items
-- This will be enforced at the application level, but we add a check constraint
ALTER TABLE public.requests
ADD CONSTRAINT check_restricted_items_no_plane 
CHECK (
  (restricted_items = FALSE) OR 
  (restricted_items = TRUE AND preferred_method != 'plane')
);

-- Add comments
COMMENT ON COLUMN public.requests.item_category IS 'Item category (electronics, marine, food, etc.)';
COMMENT ON COLUMN public.requests.category_other_description IS 'Free-text description when category is "Other"';
COMMENT ON COLUMN public.requests.restricted_items IS 'True if item contains restricted goods (lithium batteries, liquids, flammable items) - only transport by boat';
COMMENT ON COLUMN public.requests.emergency_bonus_percentage IS 'Percentage bonus applied for emergency requests (25%, 15%, or 10% based on base reward)';
COMMENT ON COLUMN public.requests.emergency_extra_amount IS 'Dollar amount of emergency bonus (capped at $15)';

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_requests_category ON public.requests(item_category) WHERE item_category IS NOT NULL;

-- Create index for restricted items filtering
CREATE INDEX IF NOT EXISTS idx_requests_restricted_items ON public.requests(restricted_items) WHERE restricted_items = TRUE;

