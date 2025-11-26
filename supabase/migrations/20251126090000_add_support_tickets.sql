-- Create support_tickets table to capture inbound support conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'support_tickets'
  ) THEN
    CREATE TABLE public.support_tickets (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      ticket_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

-- Ensure ticket IDs remain unique for external references
CREATE UNIQUE INDEX IF NOT EXISTS idx_support_tickets_ticket_id ON public.support_tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_match_id ON public.support_tickets(match_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);

-- Enable row level security so we can scope visibility
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own tickets; staff can read via service role
CREATE POLICY "Users can view their own support tickets"
  ON public.support_tickets
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Allow users to insert tickets for themselves
CREATE POLICY "Users can create support tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL));

-- Allow authenticated users to update their own tickets (status updates handled by staff via service role)
CREATE POLICY "Users can update their own support tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.support_tickets IS 'Inbound customer support tickets collected from the app';
COMMENT ON COLUMN public.support_tickets.status IS 'Workflow status for the support ticket';

