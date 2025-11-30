-- Add saved routes feature for Pro subscribers
-- Allows users to save multi-destination routes for automatic matching

-- Create saved_routes table (Pro feature)
CREATE TABLE IF NOT EXISTS public.saved_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- e.g., "Caribbean Loop 2025"
  type TEXT NOT NULL CHECK (type IN ('boat', 'plane')),
  destinations JSONB NOT NULL, -- Array of {location, lat, lng, order, min_stay_days}
  is_active BOOLEAN DEFAULT true,
  notification_preferences JSONB DEFAULT '{}', -- {min_reward, max_weight, categories, etc.}
  
  -- Plane-specific features
  airport_preferences JSONB, -- {"NYC": ["JFK", "LGA"], "London": ["LHR", "LGW"]}
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('one_time', 'monthly', 'quarterly', 'custom')) DEFAULT 'one_time',
  next_occurrence_date DATE, -- For recurring routes
  flexibility_days INTEGER DEFAULT 3, -- Allow matching requests within ±X days of planned travel
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create route_notifications table (tracks sent notifications)
CREATE TABLE IF NOT EXISTS public.route_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  saved_route_id UUID REFERENCES public.saved_routes(id) ON DELETE CASCADE NOT NULL,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  segment_index INTEGER, -- Which segment of the route (0, 1, 2, etc.)
  segment_from TEXT, -- From location of the matched segment
  segment_to TEXT, -- To location of the matched segment
  match_score DECIMAL(5,2), -- Match score (0-100)
  notified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_viewed_at TIMESTAMP WITH TIME ZONE,
  user_responded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(saved_route_id, request_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_routes_user_id ON public.saved_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_routes_type ON public.saved_routes(type);
CREATE INDEX IF NOT EXISTS idx_saved_routes_is_active ON public.saved_routes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_saved_routes_destinations ON public.saved_routes USING GIN (destinations);
CREATE INDEX IF NOT EXISTS idx_saved_routes_next_occurrence ON public.saved_routes(next_occurrence_date) WHERE next_occurrence_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_route_notifications_saved_route_id ON public.route_notifications(saved_route_id);
CREATE INDEX IF NOT EXISTS idx_route_notifications_request_id ON public.route_notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_route_notifications_notified_at ON public.route_notifications(notified_at);
CREATE INDEX IF NOT EXISTS idx_route_notifications_user_responded ON public.route_notifications(user_responded) WHERE user_responded = false;

-- Enable RLS
ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_routes
-- Users can view their own saved routes
CREATE POLICY "Users can view their own saved routes"
  ON public.saved_routes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saved routes (Pro subscribers only - checked at application level)
CREATE POLICY "Users can insert their own saved routes"
  ON public.saved_routes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved routes
CREATE POLICY "Users can update their own saved routes"
  ON public.saved_routes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved routes
CREATE POLICY "Users can delete their own saved routes"
  ON public.saved_routes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for route_notifications
-- Users can view notifications for their saved routes
CREATE POLICY "Users can view their route notifications"
  ON public.route_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.saved_routes
      WHERE saved_routes.id = route_notifications.saved_route_id
      AND saved_routes.user_id = auth.uid()
    )
  );

-- System can insert route notifications (requires service role)
-- Users cannot insert their own notifications - this is handled by the system
CREATE POLICY "System can insert route notifications"
  ON public.route_notifications FOR INSERT
  WITH CHECK (true); -- Service role will be used, RLS bypassed

-- Users can update their route notifications (mark as viewed, responded)
CREATE POLICY "Users can update their route notifications"
  ON public.route_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.saved_routes
      WHERE saved_routes.id = route_notifications.saved_route_id
      AND saved_routes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.saved_routes
      WHERE saved_routes.id = route_notifications.saved_route_id
      AND saved_routes.user_id = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_saved_routes_updated_at
  BEFORE UPDATE ON public.saved_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.saved_routes IS 'Pro feature: Saved multi-destination routes for automatic request matching';
COMMENT ON COLUMN public.saved_routes.destinations IS 'JSONB array of destinations: [{"location": "Port A", "lat": 12.34, "lng": -45.67, "order": 0, "min_stay_days": 2}, ...]';
COMMENT ON COLUMN public.saved_routes.notification_preferences IS 'JSONB: {"min_reward": 50, "max_weight": 20, "categories": ["electronics"], "enabled": true}';
COMMENT ON TABLE public.route_notifications IS 'Tracks notifications sent to users when requests match their saved routes';

