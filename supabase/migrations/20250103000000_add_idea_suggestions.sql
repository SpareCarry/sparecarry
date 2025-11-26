-- ============================================================================
-- Migration: Add Idea Suggestions Feature
-- Date: 2025-01-03
-- Description: Allows users to suggest ideas for improving SpareCarry.
--              If an idea is accepted, the user receives lifetime Pro subscription.
-- ============================================================================

-- Create idea_suggestions table
CREATE TABLE IF NOT EXISTS public.idea_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) >= 5),
  description TEXT NOT NULL CHECK (char_length(description) >= 20),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected')) NOT NULL,
  reward_granted BOOLEAN DEFAULT FALSE NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_idea_suggestions_user_id ON public.idea_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_idea_suggestions_status ON public.idea_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_idea_suggestions_created_at ON public.idea_suggestions(created_at DESC);

-- Enable RLS
ALTER TABLE public.idea_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can insert their own ideas
CREATE POLICY "Users can insert their own idea suggestions"
  ON public.idea_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own ideas
CREATE POLICY "Users can view their own idea suggestions"
  ON public.idea_suggestions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all ideas
-- Note: Admins can view all ideas via service role or by checking role in users table
-- For simplicity, admins can use service role key or we can add an admin policy here
-- The admin UI will use service role via API routes or admin RLS bypass

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_idea_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER idea_suggestions_updated_at
  BEFORE UPDATE ON public.idea_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_idea_suggestions_updated_at();

-- Add comments
COMMENT ON TABLE public.idea_suggestions IS 'User-submitted ideas for improving SpareCarry. Accepted ideas grant lifetime Pro subscription.';
COMMENT ON COLUMN public.idea_suggestions.status IS 'Status: pending, reviewing, accepted, rejected';
COMMENT ON COLUMN public.idea_suggestions.reward_granted IS 'Whether lifetime Pro subscription has been granted';

-- ============================================================================
-- RPC Functions
-- ============================================================================

-- Function to submit an idea
CREATE OR REPLACE FUNCTION public.submit_idea(
  idea_title TEXT,
  idea_description TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Validate input lengths
  IF char_length(idea_title) < 5 THEN
    RAISE EXCEPTION 'Title must be at least 5 characters';
  END IF;

  IF char_length(idea_description) < 20 THEN
    RAISE EXCEPTION 'Description must be at least 20 characters';
  END IF;

  -- Insert idea
  INSERT INTO public.idea_suggestions (user_id, title, description, status)
  VALUES (current_user_id, idea_title, idea_description, 'pending')
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.submit_idea IS 'Submit a new idea suggestion. Returns the ID of the created idea.';

