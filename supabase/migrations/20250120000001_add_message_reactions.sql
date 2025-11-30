-- Add message reactions support
-- Allows users to react to messages with emojis

-- Create reactions table for match-based messages
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL CHECK (char_length(emoji) <= 10), -- Emoji character(s)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji) -- One reaction per user per emoji per message
);

-- Create reactions table for post messages
CREATE TABLE IF NOT EXISTS public.post_message_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_message_id UUID NOT NULL, -- References post_messages but can't use FK (post_id can be trip or request)
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL CHECK (char_length(emoji) <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_message_id, user_id, emoji)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_message_reactions_post_message_id ON public.post_message_reactions(post_message_id);
CREATE INDEX IF NOT EXISTS idx_post_message_reactions_user_id ON public.post_message_reactions(user_id);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_reactions
CREATE POLICY "Users can view reactions on messages they can see"
  ON public.message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages
      JOIN public.conversations ON conversations.id = messages.conversation_id
      JOIN public.matches ON matches.id = conversations.match_id
      WHERE messages.id = message_reactions.message_id
      AND (
        EXISTS (SELECT 1 FROM public.trips WHERE trips.id = matches.trip_id AND trips.user_id = auth.uid())
        OR
        EXISTS (SELECT 1 FROM public.requests WHERE requests.id = matches.request_id AND requests.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can add reactions to messages they can see"
  ON public.message_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.messages
      JOIN public.conversations ON conversations.id = messages.conversation_id
      JOIN public.matches ON matches.id = conversations.match_id
      WHERE messages.id = message_reactions.message_id
      AND (
        EXISTS (SELECT 1 FROM public.trips WHERE trips.id = matches.trip_id AND trips.user_id = auth.uid())
        OR
        EXISTS (SELECT 1 FROM public.requests WHERE requests.id = matches.request_id AND requests.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can delete their own reactions"
  ON public.message_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for post_message_reactions
CREATE POLICY "Users can view reactions on post messages they can see"
  ON public.post_message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.post_messages
      WHERE post_messages.id = post_message_reactions.post_message_id
      AND (post_messages.sender_id = auth.uid() OR post_messages.receiver_id = auth.uid())
    )
  );

CREATE POLICY "Users can add reactions to post messages they can see"
  ON public.post_message_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.post_messages
      WHERE post_messages.id = post_message_reactions.post_message_id
      AND (post_messages.sender_id = auth.uid() OR post_messages.receiver_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete their own post message reactions"
  ON public.post_message_reactions FOR DELETE
  USING (auth.uid() = user_id);

