-- CarrySpace Waitlist Table Schema
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL, -- 'Plane traveler', 'Sailor', 'Need stuff delivered', 'All of the above'
  trip_from TEXT,
  trip_to TEXT,
  approximate_dates TEXT,
  spare_capacity TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  position INTEGER -- Will be calculated based on order of signup
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_user_type ON waitlist(user_type);

-- Optional: Add a unique constraint on email to prevent duplicates
-- ALTER TABLE waitlist ADD CONSTRAINT unique_email UNIQUE (email);

