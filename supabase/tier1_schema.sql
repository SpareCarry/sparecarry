-- Tier-1 Features Schema
-- Run this SQL in your Supabase SQL Editor

-- 1) badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL, -- e.g., trusted_traveller, early_bird
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- UI icon name or url
  created_at timestamptz DEFAULT now()
);

-- 2) user_badges (assign badges to users)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- 3) listing_photos
CREATE TABLE IF NOT EXISTS public.listing_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID REFERENCES public.requests(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4) listing_safety (store scoring metadata)
CREATE TABLE IF NOT EXISTS public.listing_safety (
  listing_id UUID PRIMARY KEY REFERENCES public.requests(id) ON DELETE CASCADE,
  safety_score INTEGER NOT NULL, -- 0-100
  reasons TEXT[], -- array of short reasons
  computed_at timestamptz DEFAULT now()
);

-- 5) trusted_traveller_stats (for automatic badge granting)
CREATE TABLE IF NOT EXISTS public.traveller_stats (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  completed_jobs_count INTEGER DEFAULT 0,
  last_completed_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_list_photos_listing ON public.listing_photos(listing_id);
CREATE INDEX IF NOT EXISTS idx_traveller_stats_completed ON public.traveller_stats(completed_jobs_count);

-- RLS: enable RLS on each new table and add simple policies
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_safety ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traveller_stats ENABLE ROW LEVEL SECURITY;

-- Badges: everyone can read badges
CREATE POLICY "read_badges" ON public.badges FOR SELECT USING (true);

-- User badges: only user can view their badges
CREATE POLICY "user_badges_select_own" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_badges_insert" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_badges_delete" ON public.user_badges FOR DELETE USING (auth.uid() = user_id);

-- Photos: public read by anyone (to show image), inserts allowed if auth user == uploader
CREATE POLICY "photos_select_public" ON public.listing_photos FOR SELECT USING (true);
CREATE POLICY "photos_insert_own" ON public.listing_photos FOR INSERT WITH CHECK (auth.uid() = uploader_id);

-- Safety: read public, update only by server (service role) or owner
CREATE POLICY "safety_select" ON public.listing_safety FOR SELECT USING (true);
CREATE POLICY "safety_update_owner" ON public.listing_safety FOR UPDATE USING (auth.uid() = (SELECT user_id FROM public.requests WHERE id = listing_safety.listing_id));
CREATE POLICY "safety_insert_owner" ON public.listing_safety FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM public.requests WHERE id = listing_safety.listing_id));

-- Traveller stats: only the user can view/update their own stat
CREATE POLICY "traveller_stats_own" ON public.traveller_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "traveller_stats_update_own" ON public.traveller_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "traveller_stats_insert_own" ON public.traveller_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed initial badges
INSERT INTO public.badges (slug, title, description, icon) VALUES
('trusted_traveller', 'Trusted Traveller', 'Completed 3 successful jobs without incidents', 'shield-check'),
('early_bird', 'Early Bird', 'Often accepts last-minute requests', 'sunrise')
ON CONFLICT (slug) DO NOTHING;

-- Function to auto-award trusted traveller badge (can be called from server-side triggers)
CREATE OR REPLACE FUNCTION public.check_and_award_trusted_traveller()
RETURNS TRIGGER AS $$
DECLARE
  badge_uuid UUID;
BEGIN
  -- Get the trusted_traveller badge ID
  SELECT id INTO badge_uuid FROM public.badges WHERE slug = 'trusted_traveller' LIMIT 1;
  
  -- Check if user already has the badge
  IF NOT EXISTS (
    SELECT 1 FROM public.user_badges 
    WHERE user_id = NEW.user_id AND badge_id = badge_uuid
  ) THEN
    -- If completed_jobs_count >= 3, award the badge
    IF NEW.completed_jobs_count >= 3 THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (NEW.user_id, badge_uuid)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-award badge when stats are updated
CREATE TRIGGER trigger_check_trusted_traveller
AFTER INSERT OR UPDATE OF completed_jobs_count ON public.traveller_stats
FOR EACH ROW
EXECUTE FUNCTION public.check_and_award_trusted_traveller();

