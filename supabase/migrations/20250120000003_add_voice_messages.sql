-- Add voice message support to messages
-- Allows users to send audio messages (voice notes)

-- Add audio_url column to messages table (match-based)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Add audio_url column to post_messages table
ALTER TABLE public.post_messages
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Create storage bucket for voice messages
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-messages', 'voice-messages', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for voice-messages bucket
-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Users can upload their own voice messages" ON storage.objects;
DROP POLICY IF EXISTS "Users can view voice messages" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own voice messages" ON storage.objects;

-- Users can upload their own voice messages
CREATE POLICY "Users can upload their own voice messages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-messages' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view voice messages (for participants in conversation)
CREATE POLICY "Users can view voice messages"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'voice-messages');

-- Users can delete their own voice messages
CREATE POLICY "Users can delete their own voice messages"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice-messages' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

COMMENT ON COLUMN public.messages.audio_url IS 'URL of audio file attached to the message';
COMMENT ON COLUMN public.post_messages.audio_url IS 'URL of audio file attached to the message';

