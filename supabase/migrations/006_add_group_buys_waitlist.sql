-- Group Buys table
CREATE TABLE IF NOT EXISTS public.group_buys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 10,
  current_participants INTEGER NOT NULL DEFAULT 0,
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('open','full','closed','cancelled')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_buys_trip_id ON public.group_buys(trip_id);
CREATE INDEX IF NOT EXISTS idx_group_buys_status ON public.group_buys(status);

ALTER TABLE public.group_buys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group buys readable by everyone"
  ON public.group_buys FOR SELECT
  USING (true);

CREATE POLICY "Users can create group buys"
  ON public.group_buys FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Authenticated users can update group buys"
  ON public.group_buys FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Group buys deletable by organizer"
  ON public.group_buys FOR DELETE
  USING (auth.uid() = organizer_id);

CREATE TRIGGER update_group_buys_updated_at
  BEFORE UPDATE ON public.group_buys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  user_type TEXT NOT NULL,
  trip_from TEXT,
  trip_to TEXT,
  approximate_dates TEXT,
  spare_capacity TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist(created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_user_type ON public.waitlist(user_type);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Waitlist readable by everyone"
  ON public.waitlist FOR SELECT
  USING (true);

CREATE POLICY "Public can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

