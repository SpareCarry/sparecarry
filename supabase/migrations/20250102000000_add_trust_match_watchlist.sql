-- ============================================================================
-- Migration: Add Trust & Safety, Smart Matching, Watchlist, and Related Features
-- Date: 2025-01-02
-- Description: Adds trust badges, reliability scores, watchlists, cancellation reasons,
--              top routes view, matched candidates view, and related functionality
-- ============================================================================

-- ============================================================================
-- 1. TRUST & SAFETY: Add columns to users table
-- ============================================================================

-- Add trust badge columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_member BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reliability_score DECIMAL(5, 2) DEFAULT 0.0 CHECK (reliability_score >= 0 AND reliability_score <= 100);

-- Add auto-translate preference to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS auto_translate_messages BOOLEAN DEFAULT false;

-- Create index on reliability_score for faster queries
CREATE INDEX IF NOT EXISTS idx_users_reliability_score ON public.users(reliability_score DESC);

-- ============================================================================
-- 2. WATCHLIST: Create watchlists table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('route', 'item')),
  payload JSONB NOT NULL, -- Stores route/item data
  -- For routes: {from_location, to_location, date_range}
  -- For items: {request_id or trip_id, title, description}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  -- Note: UNIQUE constraint on JSONB is complex, handled via application logic
);

-- Indexes for watchlists
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_type ON public.watchlists(type);
CREATE INDEX IF NOT EXISTS idx_watchlists_created_at ON public.watchlists(created_at DESC);

-- ============================================================================
-- 3. CANCELLATION REASONS: Create cancellations table
-- ============================================================================

-- Create cancellation reasons lookup table
CREATE TABLE IF NOT EXISTS public.cancellation_reasons (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('requester', 'traveler', 'external', 'other')),
  requires_notes BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default cancellation reasons
INSERT INTO public.cancellation_reasons (id, label, category, requires_notes, display_order) VALUES
  ('requester_found_alternative', 'Found alternative delivery method', 'requester', false, 1),
  ('requester_item_unavailable', 'Item no longer available', 'requester', false, 2),
  ('requester_changed_mind', 'Changed my mind', 'requester', false, 3),
  ('traveler_trip_cancelled', 'Trip cancelled', 'traveler', false, 4),
  ('traveler_no_capacity', 'No longer have capacity', 'traveler', false, 5),
  ('traveler_schedule_change', 'Schedule changed', 'traveler', false, 6),
  ('external_weather', 'Weather conditions', 'external', false, 7),
  ('external_restrictions', 'Travel restrictions', 'external', false, 8),
  ('other', 'Other reason', 'other', true, 99)
ON CONFLICT (id) DO NOTHING;

-- Create cancellations table
CREATE TABLE IF NOT EXISTS public.cancellations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('trip', 'request', 'match')),
  entity_id UUID NOT NULL, -- References trips.id, requests.id, or matches.id
  reason_id TEXT REFERENCES public.cancellation_reasons(id) NOT NULL,
  notes TEXT, -- Optional free-text notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for cancellations
CREATE INDEX IF NOT EXISTS idx_cancellations_user_id ON public.cancellations(user_id);
CREATE INDEX IF NOT EXISTS idx_cancellations_entity ON public.cancellations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_cancellations_reason_id ON public.cancellations(reason_id);
CREATE INDEX IF NOT EXISTS idx_cancellations_created_at ON public.cancellations(created_at DESC);

-- ============================================================================
-- 4. TOP ROUTES: Create materialized view for trending routes
-- ============================================================================

-- Create function to generate route hash
CREATE OR REPLACE FUNCTION public.route_hash(from_loc TEXT, to_loc TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Normalize and create hash-like identifier
  RETURN LOWER(TRIM(from_loc) || '|' || TRIM(to_loc));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create top_routes view (materialized for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.top_routes AS
WITH all_routes AS (
  SELECT 
    from_location,
    to_location,
    id,
    created_at,
    'trip' as source_type
  FROM public.trips
  WHERE status = 'active'
  
  UNION ALL
  
  SELECT 
    from_location,
    to_location,
    id,
    created_at,
    'request' as source_type
  FROM public.requests
  WHERE status = 'open'
),
route_stats AS (
  SELECT 
    public.route_hash(from_location, to_location) as route_hash,
    from_location,
    to_location,
    COUNT(DISTINCT id) as post_count,
    MAX(created_at) as last_activity,
    COUNT(DISTINCT CASE 
      WHEN created_at > NOW() - INTERVAL '30 days' 
      THEN id 
    END) as active_posts_30d
  FROM all_routes
  GROUP BY from_location, to_location
),
match_stats AS (
  SELECT 
    public.route_hash(
      COALESCE(t.from_location, r.from_location),
      COALESCE(t.to_location, r.to_location)
    ) as route_hash,
    COUNT(DISTINCT m.id) as match_count
  FROM public.matches m
  LEFT JOIN public.trips t ON t.id = m.trip_id
  LEFT JOIN public.requests r ON r.id = m.request_id
  GROUP BY route_hash
)
SELECT 
  rs.route_hash,
  rs.from_location,
  rs.to_location,
  rs.post_count,
  COALESCE(ms.match_count, 0) as match_count,
  rs.last_activity,
  rs.active_posts_30d
FROM route_stats rs
LEFT JOIN match_stats ms ON ms.route_hash = rs.route_hash
ORDER BY rs.active_posts_30d DESC, COALESCE(ms.match_count, 0) DESC, rs.last_activity DESC
LIMIT 100;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_top_routes_hash ON public.top_routes(route_hash);

-- Refresh function for top_routes
CREATE OR REPLACE FUNCTION public.refresh_top_routes()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.top_routes;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. MATCHED CANDIDATES: Create materialized view for precomputed matches
-- ============================================================================

-- Create matched_candidates materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.matched_candidates AS
WITH trip_data AS (
  SELECT 
    t.id,
    t.user_id as traveler_id,
    t.type,
    t.from_location,
    t.to_location,
    t.departure_date,
    t.eta_window_start,
    t.eta_window_end,
    t.spare_kg,
    t.spare_volume_liters,
    t.max_dimensions,
    t.can_oversize,
    t.status,
    u.reliability_score,
    u.average_rating,
    u.completed_deliveries_count,
    u.subscription_status
  FROM public.trips t
  JOIN public.users u ON u.id = t.user_id
  WHERE t.status = 'active'
),
request_data AS (
  SELECT 
    r.id,
    r.user_id as requester_id,
    r.from_location,
    r.to_location,
    r.deadline_earliest,
    r.deadline_latest,
    r.weight_kg,
    r.dimensions_cm,
    r.preferred_method,
    r.emergency,
    r.status
  FROM public.requests r
  WHERE r.status = 'open'
)
SELECT 
  t.id as trip_id,
  r.id as request_id,
  t.traveler_id,
  r.requester_id,
  -- Route match (simplified - exact match only for now)
  CASE 
    WHEN LOWER(TRIM(t.from_location)) = LOWER(TRIM(r.from_location)) 
     AND LOWER(TRIM(t.to_location)) = LOWER(TRIM(r.to_location))
    THEN 'exact'
    WHEN LOWER(TRIM(t.from_location)) LIKE '%' || LOWER(TRIM(r.from_location)) || '%'
     AND LOWER(TRIM(t.to_location)) LIKE '%' || LOWER(TRIM(r.to_location)) || '%'
    THEN 'nearby'
    ELSE 'none'
  END as route_match,
  -- Date overlap check
  CASE 
    WHEN t.type = 'plane' THEN
      t.departure_date BETWEEN COALESCE(r.deadline_earliest, r.deadline_latest) AND r.deadline_latest
    WHEN t.type = 'boat' THEN
      (t.eta_window_start <= r.deadline_latest AND t.eta_window_end >= COALESCE(r.deadline_earliest, r.deadline_latest))
    ELSE false
  END as date_overlap,
  -- Capacity check
  CASE 
    WHEN t.spare_kg >= r.weight_kg THEN 'fits'
    ELSE 'no_capacity'
  END as capacity_match,
  t.reliability_score,
  t.average_rating,
  t.completed_deliveries_count,
  CASE WHEN t.subscription_status = 'active' THEN true ELSE false END as traveler_premium,
  NOW() as computed_at
FROM trip_data t
CROSS JOIN request_data r
WHERE 
  -- Basic filters
  t.traveler_id != r.requester_id -- Don't match user with themselves
  AND NOT EXISTS (
    SELECT 1 FROM public.matches m 
    WHERE m.trip_id = t.id AND m.request_id = r.id
  ) -- Exclude existing matches
  AND (
    r.preferred_method = 'any' 
    OR r.preferred_method = t.type
  ) -- Method preference match
;

-- Create indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_matched_candidates_trip_id ON public.matched_candidates(trip_id);
CREATE INDEX IF NOT EXISTS idx_matched_candidates_request_id ON public.matched_candidates(request_id);
CREATE INDEX IF NOT EXISTS idx_matched_candidates_route_match ON public.matched_candidates(route_match);
CREATE INDEX IF NOT EXISTS idx_matched_candidates_reliability_score ON public.matched_candidates(reliability_score DESC);

-- Refresh function for matched_candidates
CREATE OR REPLACE FUNCTION public.refresh_matched_candidates()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.matched_candidates;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. RELIABILITY SCORE: Create function to calculate and update reliability score
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_reliability_score(user_id_param UUID)
RETURNS DECIMAL(5, 2) AS $$
DECLARE
  score DECIMAL(5, 2) := 0.0;
  completed_count INTEGER;
  cancelled_count INTEGER;
  avg_rating DECIMAL(3, 2);
  response_time_avg INTERVAL;
  completion_rate DECIMAL(5, 2);
BEGIN
  -- Get user stats
  SELECT 
    u.completed_deliveries_count,
    u.average_rating,
    COUNT(DISTINCT c.id) FILTER (WHERE c.entity_type IN ('trip', 'request', 'match'))
  INTO completed_count, avg_rating, cancelled_count
  FROM public.users u
  LEFT JOIN public.cancellations c ON c.user_id = u.id
  WHERE u.id = user_id_param
  GROUP BY u.completed_deliveries_count, u.average_rating;

  -- Base score from completed deliveries (0-40 points)
  IF completed_count >= 50 THEN
    score := score + 40;
  ELSIF completed_count >= 20 THEN
    score := score + 30;
  ELSIF completed_count >= 10 THEN
    score := score + 20;
  ELSIF completed_count >= 5 THEN
    score := score + 10;
  ELSIF completed_count > 0 THEN
    score := score + 5;
  END IF;

  -- Rating score (0-30 points)
  IF avg_rating IS NOT NULL THEN
    IF avg_rating >= 4.8 THEN
      score := score + 30;
    ELSIF avg_rating >= 4.5 THEN
      score := score + 25;
    ELSIF avg_rating >= 4.0 THEN
      score := score + 20;
    ELSIF avg_rating >= 3.5 THEN
      score := score + 15;
    ELSIF avg_rating >= 3.0 THEN
      score := score + 10;
    ELSE
      score := score + 5;
    END IF;
  END IF;

  -- Cancellation penalty (0-30 points deduction)
  IF cancelled_count > 0 THEN
    IF cancelled_count >= 10 THEN
      score := score - 30;
    ELSIF cancelled_count >= 5 THEN
      score := score - 20;
    ELSIF cancelled_count >= 3 THEN
      score := score - 10;
    ELSE
      score := score - 5;
    END IF;
  END IF;

  -- Completion rate bonus (0-20 points)
  IF completed_count + cancelled_count > 0 THEN
    completion_rate := (completed_count::DECIMAL / (completed_count + cancelled_count)::DECIMAL) * 100;
    IF completion_rate >= 95 THEN
      score := score + 20;
    ELSIF completion_rate >= 90 THEN
      score := score + 15;
    ELSIF completion_rate >= 80 THEN
      score := score + 10;
    ELSIF completion_rate >= 70 THEN
      score := score + 5;
    END IF;
  END IF;

  -- Cap score between 0 and 100
  score := GREATEST(0, LEAST(100, score));

  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to update reliability score for a user
CREATE OR REPLACE FUNCTION public.update_user_reliability_score(user_id_param UUID)
RETURNS void AS $$
DECLARE
  new_score DECIMAL(5, 2);
BEGIN
  new_score := public.calculate_reliability_score(user_id_param);
  UPDATE public.users
  SET reliability_score = new_score
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Trigger to update reliability score when deliveries complete or cancellations occur
CREATE OR REPLACE FUNCTION public.trigger_update_reliability_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Update reliability score for both requester and traveler
  IF TG_TABLE_NAME = 'matches' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM public.update_user_reliability_score(
      (SELECT user_id FROM public.requests WHERE id = NEW.request_id)
    );
    PERFORM public.update_user_reliability_score(
      (SELECT user_id FROM public.trips WHERE id = NEW.trip_id)
    );
  END IF;
  
  -- Update when cancellation is created
  IF TG_TABLE_NAME = 'cancellations' THEN
    PERFORM public.update_user_reliability_score(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_reliability_on_match_complete ON public.matches;
CREATE TRIGGER update_reliability_on_match_complete
  AFTER UPDATE OF status ON public.matches
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION public.trigger_update_reliability_score();

DROP TRIGGER IF EXISTS update_reliability_on_cancellation ON public.cancellations;
CREATE TRIGGER update_reliability_on_cancellation
  AFTER INSERT ON public.cancellations
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_reliability_score();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellation_reasons ENABLE ROW LEVEL SECURITY;

-- Watchlists policies
DROP POLICY IF EXISTS "Users can view their own watchlists" ON public.watchlists;
CREATE POLICY "Users can view their own watchlists"
  ON public.watchlists FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own watchlists" ON public.watchlists;
CREATE POLICY "Users can create their own watchlists"
  ON public.watchlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own watchlists" ON public.watchlists;
CREATE POLICY "Users can update their own watchlists"
  ON public.watchlists FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own watchlists" ON public.watchlists;
CREATE POLICY "Users can delete their own watchlists"
  ON public.watchlists FOR DELETE
  USING (auth.uid() = user_id);

-- Cancellations policies
DROP POLICY IF EXISTS "Users can view their own cancellations" ON public.cancellations;
CREATE POLICY "Users can view their own cancellations"
  ON public.cancellations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own cancellations" ON public.cancellations;
CREATE POLICY "Users can create their own cancellations"
  ON public.cancellations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Cancellation reasons policies (public read)
DROP POLICY IF EXISTS "Cancellation reasons are viewable by everyone" ON public.cancellation_reasons;
CREATE POLICY "Cancellation reasons are viewable by everyone"
  ON public.cancellation_reasons FOR SELECT
  USING (true);

-- Note: Materialized views (top_routes, matched_candidates) don't support RLS policies
-- Access control is handled via the underlying tables' RLS policies
-- These views are read-only and accessible to authenticated users via PostgREST

-- ============================================================================
-- 8. UPDATE TRIGGERS
-- ============================================================================

-- Add updated_at trigger for watchlists
DROP TRIGGER IF EXISTS update_watchlists_updated_at ON public.watchlists;
CREATE TRIGGER update_watchlists_updated_at BEFORE UPDATE ON public.watchlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.calculate_reliability_score(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_user_reliability_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_top_routes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_matched_candidates() TO authenticated;
GRANT EXECUTE ON FUNCTION public.route_hash(TEXT, TEXT) TO authenticated, anon;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Note: After running this migration, you may want to:
-- 1. Refresh materialized views: SELECT refresh_top_routes(); SELECT refresh_matched_candidates();
-- 2. Update existing users' reliability scores: 
--    SELECT update_user_reliability_score(id) FROM public.users;
-- 3. Set up a cron job to refresh materialized views periodically

