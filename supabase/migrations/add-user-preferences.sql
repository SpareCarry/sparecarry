-- Add user preference fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS prefer_imperial_units BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS country_of_residence TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.prefer_imperial_units IS 'User preference for displaying units: true = imperial (lbs, ft/in), false = metric (kg, cm)';
COMMENT ON COLUMN public.profiles.preferred_currency IS 'User preferred currency code (USD, EUR, GBP, etc.)';
COMMENT ON COLUMN public.profiles.country_of_residence IS 'User country of residence (ISO country code, e.g., US, AU, GB)';

