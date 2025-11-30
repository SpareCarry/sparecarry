-- Support Tickets System
-- Run this SQL in your Supabase SQL Editor

-- ============================================================================
-- SUPPORT_TICKETS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id TEXT UNIQUE NOT NULL, -- Human-readable ticket ID (e.g., TKT-1234567890-ABC123)
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  initial_message TEXT NOT NULL,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL, -- Optional: link to a match
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Support agent assigned
  resolution_notes TEXT, -- Internal notes from support team
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SUPPORT_TICKET_MESSAGES TABLE (for follow-up messages)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- NULL if from support team
  message TEXT NOT NULL,
  is_from_support BOOLEAN DEFAULT false, -- true if message is from support team, false if from user
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_id ON public.support_tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_created_at ON public.support_ticket_messages(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Users can create messages for their tickets" ON public.support_ticket_messages;

-- Users can only see their own tickets
CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own tickets
CREATE POLICY "Users can create their own tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets (limited fields)
CREATE POLICY "Users can update their own tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can view messages for their tickets
CREATE POLICY "Users can view messages for their tickets"
  ON public.support_ticket_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE support_tickets.id = support_ticket_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

-- Users can create messages for their tickets
CREATE POLICY "Users can create messages for their tickets"
  ON public.support_ticket_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE support_tickets.id = support_ticket_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
    AND is_from_support = false
  );

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

-- Create or replace the function (safe to run multiple times)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists, then create it (safe to run multiple times)
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

