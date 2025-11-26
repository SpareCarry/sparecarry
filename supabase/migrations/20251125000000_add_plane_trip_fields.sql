-- Add arrival_date and prohibited_items_confirmed to trips table
-- For plane trips: arrival_date is required, prohibited_items_confirmed is required

-- Add arrival_date column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trips' 
    AND column_name = 'arrival_date'
  ) THEN
    ALTER TABLE public.trips 
    ADD COLUMN arrival_date DATE;
  END IF;
END $$;

-- Add prohibited_items_confirmed column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trips' 
    AND column_name = 'prohibited_items_confirmed'
  ) THEN
    ALTER TABLE public.trips 
    ADD COLUMN prohibited_items_confirmed BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN public.trips.arrival_date IS 'Arrival date for plane trips';
COMMENT ON COLUMN public.trips.prohibited_items_confirmed IS 'User confirmation that shipment does not contain prohibited items';

