-- Enable Realtime for emergency requests
-- Run this in Supabase SQL Editor

-- Enable Realtime for requests table (for emergency notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;

-- Create a function to notify on emergency request insert
CREATE OR REPLACE FUNCTION notify_emergency_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.emergency = true THEN
    PERFORM pg_notify(
      'emergency_request',
      json_build_object(
        'id', NEW.id,
        'from_location', NEW.from_location,
        'to_location', NEW.to_location,
        'reward', NEW.max_reward,
        'deadline', NEW.deadline_latest,
        'user_id', NEW.user_id
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for emergency requests
DROP TRIGGER IF EXISTS emergency_request_notification ON public.requests;
CREATE TRIGGER emergency_request_notification
  AFTER INSERT ON public.requests
  FOR EACH ROW
  WHEN (NEW.emergency = true)
  EXECUTE FUNCTION notify_emergency_request();

