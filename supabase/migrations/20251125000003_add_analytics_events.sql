-- Create analytics_events table for feature usage tracking
-- Events only, no invasive tracking

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event TEXT NOT NULL,
  data JSONB NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  platform TEXT CHECK (platform IN ('web', 'ios', 'android')),
  user_agent TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON public.analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON public.analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_platform ON public.analytics_events(platform);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own events (for privacy)
CREATE POLICY "Users can view their own analytics events"
  ON public.analytics_events FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Authenticated users can insert events
CREATE POLICY "Authenticated users can insert analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Add comments
COMMENT ON TABLE public.analytics_events IS 'Feature usage tracking events for product insights';
COMMENT ON COLUMN public.analytics_events.event IS 'Event type (post_created, shipping_estimator_used, etc.)';
COMMENT ON COLUMN public.analytics_events.data IS 'Event-specific data in JSON format';
COMMENT ON COLUMN public.analytics_events.user_id IS 'User who triggered the event (nullable for anonymous events)';

