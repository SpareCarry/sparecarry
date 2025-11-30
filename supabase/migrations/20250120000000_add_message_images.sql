-- Add image support to messages
-- Allows users to share photos in messages

-- Add image_urls array to messages table (match-based)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Add image_urls array to post_messages table
ALTER TABLE public.post_messages
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Create storage bucket for message images
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-images', 'message-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for message-images bucket
-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Users can upload their own message images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view message images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own message images" ON storage.objects;

-- Users can upload their own message images
CREATE POLICY "Users can upload their own message images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view message images (for participants in conversation)
CREATE POLICY "Users can view message images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'message-images');

-- Users can delete their own message images
CREATE POLICY "Users can delete their own message images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

