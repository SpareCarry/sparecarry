-- Create post_messages table for one-to-one messaging on posts/jobs
-- This is separate from the match-based messaging system

CREATE TABLE IF NOT EXISTS public.post_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID NOT NULL, -- Can be either trip_id or request_id
  post_type TEXT NOT NULL CHECK (post_type IN ('trip', 'request')),
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We can't add direct foreign keys since post_id can reference either trips or requests
-- We also can't use subqueries in CHECK constraints, so validation is handled by:
-- 1. RLS policies (which CAN use subqueries) - see policies below
-- 2. Application-level validation in the frontend/backend

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_messages_post_id ON public.post_messages(post_id, post_type);
CREATE INDEX IF NOT EXISTS idx_post_messages_sender_id ON public.post_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_post_messages_receiver_id ON public.post_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_post_messages_read_status ON public.post_messages(receiver_id, read_status) WHERE read_status = FALSE;
CREATE INDEX IF NOT EXISTS idx_post_messages_created_at ON public.post_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.post_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see messages where they are sender or receiver
CREATE POLICY "Users can view their own messages"
  ON public.post_messages FOR SELECT
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- Users can only send messages where they are the sender
-- Note: RLS policies can use subqueries, so we validate participants here
CREATE POLICY "Users can send messages as sender"
  ON public.post_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      -- For trips: sender must be trip owner or receiver must be trip owner
      (post_type = 'trip' AND EXISTS (
        SELECT 1 FROM public.trips
        WHERE trips.id = post_messages.post_id
        AND (trips.user_id = post_messages.sender_id OR trips.user_id = post_messages.receiver_id)
      ))
      OR
      -- For requests: sender must be request owner or receiver must be request owner
      (post_type = 'request' AND EXISTS (
        SELECT 1 FROM public.requests
        WHERE requests.id = post_messages.post_id
        AND (requests.user_id = post_messages.sender_id OR requests.user_id = post_messages.receiver_id)
      ))
    )
  );

-- Users can only update read_status for messages they received
CREATE POLICY "Users can mark their received messages as read"
  ON public.post_messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Add comments
COMMENT ON TABLE public.post_messages IS 'One-to-one messaging threads for posts/jobs (trips and requests)';
COMMENT ON COLUMN public.post_messages.post_id IS 'ID of the trip or request this message belongs to';
COMMENT ON COLUMN public.post_messages.post_type IS 'Type of post: trip or request';
COMMENT ON COLUMN public.post_messages.sender_id IS 'User who sent the message';
COMMENT ON COLUMN public.post_messages.receiver_id IS 'User who should receive the message';
COMMENT ON COLUMN public.post_messages.read_status IS 'Whether the receiver has read this message';

