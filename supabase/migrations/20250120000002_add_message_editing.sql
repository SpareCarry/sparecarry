-- Add message editing and deletion support

-- Add edited_at and deleted_at to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add edited_at and deleted_at to post_messages table
ALTER TABLE public.post_messages
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Indexes for filtering deleted messages
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON public.messages(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_post_messages_deleted_at ON public.post_messages(deleted_at) WHERE deleted_at IS NULL;

