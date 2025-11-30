-- Add boat_photo_url field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS boat_photo_url TEXT;

