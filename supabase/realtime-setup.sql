-- Enable Realtime for requests table
-- Run this in Supabase SQL Editor
-- This enables real-time subscriptions so clients can listen for new requests

-- Enable Realtime for requests table
ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;

-- Note: If your requests table has an 'emergency' column, you can uncomment
-- the trigger below to send notifications for emergency requests.
-- Otherwise, realtime subscriptions will still work for all requests.

-- Optional: Create a function to notify on emergency request insert
-- (Only works if requests table has 'emergency' column)
/*
CREATE OR REPLACE FUNCTION notify_emergency_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.emergency = true THEN
    PERFORM pg_notify(
      'emergency_request',
      json_build_object(
        'id', NEW.id,
        'origin', NEW.origin,
        'destination', NEW.destination,
        'reward_amount', NEW.reward_amount,
        'created_at', NEW.created_at,
        'user_id', NEW.user_id
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create trigger for emergency requests
DROP TRIGGER IF EXISTS emergency_request_notification ON public.requests;
CREATE TRIGGER emergency_request_notification
  AFTER INSERT ON public.requests
  FOR EACH ROW
  WHEN (NEW.emergency = true)
  EXECUTE FUNCTION notify_emergency_request();
*/

