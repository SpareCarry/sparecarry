-- Add Location Fields to Posts and Requests Tables
-- Run this migration in your Supabase SQL Editor

-- Enable required extensions for geospatial indexing
-- cube extension is required by earthdistance
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Add location fields to trips (posts) table
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS departure_location text,
ADD COLUMN IF NOT EXISTS departure_lat double precision,
ADD COLUMN IF NOT EXISTS departure_lon double precision,
ADD COLUMN IF NOT EXISTS departure_category text,
ADD COLUMN IF NOT EXISTS arrival_location text,
ADD COLUMN IF NOT EXISTS arrival_lat double precision,
ADD COLUMN IF NOT EXISTS arrival_lon double precision,
ADD COLUMN IF NOT EXISTS arrival_category text;

-- Add location fields to requests table
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS departure_location text,
ADD COLUMN IF NOT EXISTS departure_lat double precision,
ADD COLUMN IF NOT EXISTS departure_lon double precision,
ADD COLUMN IF NOT EXISTS departure_category text,
ADD COLUMN IF NOT EXISTS arrival_location text,
ADD COLUMN IF NOT EXISTS arrival_lat double precision,
ADD COLUMN IF NOT EXISTS arrival_lon double precision,
ADD COLUMN IF NOT EXISTS arrival_category text;

-- Create spatial indexes for geospatial queries
-- Note: This requires earthdistance extension (enabled above). 
-- If earthdistance is not available, use regular indexes (commented below).
CREATE INDEX IF NOT EXISTS idx_trips_departure_location 
ON trips USING gist (ll_to_earth(departure_lat, departure_lon))
WHERE departure_lat IS NOT NULL AND departure_lon IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trips_arrival_location 
ON trips USING gist (ll_to_earth(arrival_lat, arrival_lon))
WHERE arrival_lat IS NOT NULL AND arrival_lon IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_requests_departure_location 
ON requests USING gist (ll_to_earth(departure_lat, departure_lon))
WHERE departure_lat IS NOT NULL AND departure_lon IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_requests_arrival_location 
ON requests USING gist (ll_to_earth(arrival_lat, arrival_lon))
WHERE arrival_lat IS NOT NULL AND arrival_lon IS NOT NULL;

-- Alternative: If PostGIS is not available, create regular indexes
-- CREATE INDEX IF NOT EXISTS idx_trips_departure_lat_lon ON trips(departure_lat, departure_lon) WHERE departure_lat IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_trips_arrival_lat_lon ON trips(arrival_lat, arrival_lon) WHERE arrival_lat IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_requests_departure_lat_lon ON requests(departure_lat, departure_lon) WHERE departure_lat IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_requests_arrival_lat_lon ON requests(arrival_lat, arrival_lon) WHERE arrival_lat IS NOT NULL;

-- Add indexes for category filtering
CREATE INDEX IF NOT EXISTS idx_trips_departure_category ON trips(departure_category) WHERE departure_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trips_arrival_category ON trips(arrival_category) WHERE arrival_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_requests_departure_category ON requests(departure_category) WHERE departure_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_requests_arrival_category ON requests(arrival_category) WHERE arrival_category IS NOT NULL;

-- RLS policies already exist for trips and requests tables
-- These new columns will inherit the existing RLS policies
-- Verify that authenticated users can insert/update their own posts:

-- Example RLS check (should already exist):
-- CREATE POLICY "allow insert" ON trips
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (auth.uid() = user_id);
--
-- CREATE POLICY "allow update own" ON trips
-- FOR UPDATE
-- TO authenticated
-- USING (auth.uid() = user_id)
-- WITH CHECK (auth.uid() = user_id);

COMMENT ON COLUMN trips.departure_location IS 'Human-readable departure location name';
COMMENT ON COLUMN trips.departure_lat IS 'Departure latitude (WGS84)';
COMMENT ON COLUMN trips.departure_lon IS 'Departure longitude (WGS84)';
COMMENT ON COLUMN trips.departure_category IS 'Location category (e.g., marina, port, poi)';
COMMENT ON COLUMN trips.arrival_location IS 'Human-readable arrival location name';
COMMENT ON COLUMN trips.arrival_lat IS 'Arrival latitude (WGS84)';
COMMENT ON COLUMN trips.arrival_lon IS 'Arrival longitude (WGS84)';
COMMENT ON COLUMN trips.arrival_category IS 'Location category (e.g., marina, port, poi)';

COMMENT ON COLUMN requests.departure_location IS 'Human-readable departure location name';
COMMENT ON COLUMN requests.departure_lat IS 'Departure latitude (WGS84)';
COMMENT ON COLUMN requests.departure_lon IS 'Departure longitude (WGS84)';
COMMENT ON COLUMN requests.departure_category IS 'Location category (e.g., marina, port, poi)';
COMMENT ON COLUMN requests.arrival_location IS 'Human-readable arrival location name';
COMMENT ON COLUMN requests.arrival_lat IS 'Arrival latitude (WGS84)';
COMMENT ON COLUMN requests.arrival_lon IS 'Arrival longitude (WGS84)';
COMMENT ON COLUMN requests.arrival_category IS 'Location category (e.g., marina, port, poi)';

