-- CarrySpace MVP Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for location data (optional, for advanced location queries)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Note: Supabase Auth handles the auth.users table automatically
-- This table extends auth.users with additional fields

CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('requester', 'traveler', 'sailor', 'admin')) DEFAULT 'requester',
  stripe_customer_id TEXT, -- Stripe Customer ID for subscriptions
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid', NULL)) DEFAULT NULL,
  subscription_current_period_end TIMESTAMP WITH TIME ZONE, -- When current subscription period ends
  referral_code TEXT UNIQUE, -- Unique referral code for user
  referred_by UUID REFERENCES public.users(id), -- User who referred this user
  referral_credits DECIMAL(10, 2) DEFAULT 0, -- Available referral credits (platform-only, cannot cash out)
  completed_deliveries_count INTEGER DEFAULT 0, -- Number of completed deliveries
  average_rating DECIMAL(3, 2), -- Average rating from completed deliveries
  total_referrals_count INTEGER DEFAULT 0, -- Total number of users referred
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  phone TEXT,
  stripe_account_id TEXT, -- Stripe Connect account ID
  stripe_verification_session_id TEXT, -- Stripe Identity verification session ID
  stripe_identity_verified_at TIMESTAMP WITH TIME ZONE,
  verified_sailor_at TIMESTAMP WITH TIME ZONE,
  boat_name TEXT,
  boat_type TEXT, -- e.g., 'sailboat', 'catamaran', 'motorboat'
  boat_length_ft INTEGER,
  verified_at TIMESTAMP WITH TIME ZONE,
  bio TEXT,
  avatar_url TEXT,
  expo_push_token TEXT, -- Expo push notification token for mobile app
  push_notifications_enabled BOOLEAN DEFAULT true, -- User preference for push notifications
  shipping_name TEXT, -- Full name for shipping
  shipping_address_line1 TEXT, -- Street address
  shipping_address_line2 TEXT, -- Apt/suite/etc
  shipping_city TEXT,
  shipping_state TEXT, -- State/province
  shipping_postal_code TEXT, -- ZIP/postal code
  shipping_country TEXT DEFAULT 'USA', -- Country code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TRIPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('plane', 'boat')),
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  flight_number TEXT, -- For plane trips
  departure_date DATE NOT NULL,
  eta_window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  eta_window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  spare_kg DECIMAL(10, 2) NOT NULL CHECK (spare_kg >= 0),
  spare_volume_liters DECIMAL(10, 2) NOT NULL CHECK (spare_volume_liters >= 0),
  max_dimensions TEXT, -- JSON string: {"length_cm": 100, "width_cm": 50, "height_cm": 30}
  can_oversize BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- GROUP_BUYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.group_buys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  organizer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 10,
  current_participants INTEGER NOT NULL DEFAULT 0,
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('open','full','closed','cancelled')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  deadline_earliest DATE,
  deadline_latest DATE NOT NULL,
  max_reward DECIMAL(10, 2) NOT NULL CHECK (max_reward > 0),
  item_photos TEXT[], -- Array of photo URLs
  dimensions_cm TEXT, -- JSON string: {"length_cm": 100, "width_cm": 50, "height_cm": 30}
  weight_kg DECIMAL(10, 2) NOT NULL CHECK (weight_kg > 0),
  value_usd DECIMAL(10, 2),
  preferred_method TEXT DEFAULT 'any' CHECK (preferred_method IN ('plane', 'boat', 'any')),
  emergency BOOLEAN DEFAULT false, -- Emergency request flag
  purchase_retailer TEXT CHECK (purchase_retailer IN ('west_marine', 'svb', 'amazon', NULL)), -- Preferred retailer for purchase
  purchase_link TEXT, -- Generated affiliate link (updated when match confirmed)
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matched', 'fulfilled', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- REFERRALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  referrer_credit_earned DECIMAL(10, 2) DEFAULT 0,
  referred_credit_earned DECIMAL(10, 2) DEFAULT 0,
  first_delivery_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- ============================================================================
-- WAITLIST TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL,
  trip_from TEXT,
  trip_to TEXT,
  approximate_dates TEXT,
  spare_capacity TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MATCHES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  group_buy_id UUID REFERENCES public.group_buys(id), -- If part of a group buy
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'chatting', 'escrow_paid', 'delivered', 'completed', 'cancelled', 'disputed')),
  reward_amount DECIMAL(10, 2) NOT NULL CHECK (reward_amount > 0),
  platform_fee_percent DECIMAL(5, 4), -- Platform fee percentage applied
  escrow_payment_intent_id TEXT, -- Stripe Payment Intent ID
  insurance_policy_number TEXT, -- Allianz insurance policy number
  insurance_premium DECIMAL(10, 2), -- Insurance premium paid
  conversation_id UUID REFERENCES public.conversations(id),
  delivered_at TIMESTAMP WITH TIME ZONE, -- When delivery was confirmed by traveler
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, request_id)
);

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- DELIVERIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE UNIQUE NOT NULL,
  proof_photos TEXT[], -- Array of photo URLs
  gps_lat_long TEXT, -- JSON string: {"lat": 12.123, "lng": -61.456}
  meetup_location_id UUID REFERENCES public.meetup_locations(id),
  delivered_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  auto_release_at TIMESTAMP WITH TIME ZONE, -- Auto-release escrow 24h after delivery
  dispute_opened_at TIMESTAMP WITH TIME ZONE, -- If requester disputes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- RATINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  ratee_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, rater_id)
);

-- ============================================================================
-- MEETUP_LOCATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.meetup_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('airport', 'marina', 'fuel_dock')),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account_id ON public.profiles(stripe_account_id);

-- Trips indexes
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_type ON public.trips(type);
CREATE INDEX IF NOT EXISTS idx_trips_from_location ON public.trips(from_location);
CREATE INDEX IF NOT EXISTS idx_trips_to_location ON public.trips(to_location);
CREATE INDEX IF NOT EXISTS idx_trips_departure_date ON public.trips(departure_date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_eta_window ON public.trips(eta_window_start, eta_window_end);

-- Group buys indexes
CREATE INDEX IF NOT EXISTS idx_group_buys_trip_id ON public.group_buys(trip_id);
CREATE INDEX IF NOT EXISTS idx_group_buys_status ON public.group_buys(status);

-- Requests indexes
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON public.requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_from_location ON public.requests(from_location);
CREATE INDEX IF NOT EXISTS idx_requests_to_location ON public.requests(to_location);
CREATE INDEX IF NOT EXISTS idx_requests_deadline_latest ON public.requests(deadline_latest);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_preferred_method ON public.requests(preferred_method);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);

-- Waitlist indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist(created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_user_type ON public.waitlist(user_type);

-- Matches indexes
CREATE INDEX IF NOT EXISTS idx_matches_trip_id ON public.matches(trip_id);
CREATE INDEX IF NOT EXISTS idx_matches_request_id ON public.matches(request_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_match_id ON public.conversations(match_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Deliveries indexes
CREATE INDEX IF NOT EXISTS idx_deliveries_match_id ON public.deliveries(match_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_meetup_location_id ON public.deliveries(meetup_location_id);

-- Meetup locations indexes
CREATE INDEX IF NOT EXISTS idx_meetup_locations_type ON public.meetup_locations(type);
CREATE INDEX IF NOT EXISTS idx_meetup_locations_location ON public.meetup_locations(latitude, longitude);

-- Ratings indexes
CREATE INDEX IF NOT EXISTS idx_ratings_match_id ON public.ratings(match_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON public.ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee_id ON public.ratings(ratee_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_buys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetup_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trips policies
CREATE POLICY "Trips are viewable by everyone"
  ON public.trips FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips"
  ON public.trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips"
  ON public.trips FOR DELETE
  USING (auth.uid() = user_id);

-- Requests policies
CREATE POLICY "Requests are viewable by everyone"
  ON public.requests FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own requests"
  ON public.requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests"
  ON public.requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own requests"
  ON public.requests FOR DELETE
  USING (auth.uid() = user_id);

-- Referrals policies
CREATE POLICY "Referrals are viewable by participants"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Group buys policies
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

-- Waitlist policies
CREATE POLICY "Waitlist readable by everyone"
  ON public.waitlist FOR SELECT
  USING (true);

CREATE POLICY "Public can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

-- Matches policies
CREATE POLICY "Matches are viewable by participants"
  ON public.matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = matches.trip_id AND trips.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.requests
      WHERE requests.id = matches.request_id AND requests.user_id = auth.uid()
    )
  );

CREATE POLICY "Matches can be created by system"
  ON public.matches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Matches can be updated by participants"
  ON public.matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = matches.trip_id AND trips.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.requests
      WHERE requests.id = matches.request_id AND requests.user_id = auth.uid()
    )
  );

-- Conversations policies
CREATE POLICY "Conversations are viewable by participants"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      JOIN public.trips ON trips.id = matches.trip_id
      JOIN public.requests ON requests.id = matches.request_id
      WHERE matches.id = conversations.match_id
      AND (trips.user_id = auth.uid() OR requests.user_id = auth.uid())
    )
  );

-- Messages policies
CREATE POLICY "Messages are viewable by conversation participants"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      JOIN public.matches ON matches.id = conversations.match_id
      JOIN public.trips ON trips.id = matches.trip_id
      JOIN public.requests ON requests.id = matches.request_id
      WHERE conversations.id = messages.conversation_id
      AND (trips.user_id = auth.uid() OR requests.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND
    EXISTS (
      SELECT 1 FROM public.conversations
      JOIN public.matches ON matches.id = conversations.match_id
      JOIN public.trips ON trips.id = matches.trip_id
      JOIN public.requests ON requests.id = matches.request_id
      WHERE conversations.id = messages.conversation_id
      AND (trips.user_id = auth.uid() OR requests.user_id = auth.uid())
    )
  );

-- Deliveries policies
CREATE POLICY "Deliveries are viewable by match participants"
  ON public.deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      JOIN public.trips ON trips.id = matches.trip_id
      JOIN public.requests ON requests.id = matches.request_id
      WHERE matches.id = deliveries.match_id
      AND (trips.user_id = auth.uid() OR requests.user_id = auth.uid())
    )
  );

CREATE POLICY "Deliveries can be updated by match participants"
  ON public.deliveries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      JOIN public.trips ON trips.id = matches.trip_id
      JOIN public.requests ON requests.id = matches.request_id
      WHERE matches.id = deliveries.match_id
      AND (trips.user_id = auth.uid() OR requests.user_id = auth.uid())
    )
  );

-- Meetup locations policies (public read)
CREATE POLICY "Meetup locations are viewable by everyone"
  ON public.meetup_locations FOR SELECT
  USING (true);

-- Ratings policies
CREATE POLICY "Ratings are viewable by everyone"
  ON public.ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can create ratings for their matches"
  ON public.ratings FOR INSERT
  WITH CHECK (
    auth.uid() = rater_id
    AND
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = ratings.match_id
      AND (matches.trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
        OR matches.request_id IN (SELECT id FROM public.requests WHERE user_id = auth.uid()))
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_buys_updated_at BEFORE UPDATE ON public.group_buys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetup_locations_updated_at BEFORE UPDATE ON public.meetup_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create a profile when a user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'requester');
  
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user and profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to automatically create a conversation when a match is created
CREATE OR REPLACE FUNCTION public.handle_new_match()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.conversations (match_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create conversation on match insert
CREATE TRIGGER on_match_created
  AFTER INSERT ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_match();

-- Function to add referral credit
CREATE OR REPLACE FUNCTION add_referral_credit(user_id UUID, amount DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET referral_credits = referral_credits + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use referral credit (deducts from balance)
CREATE OR REPLACE FUNCTION use_referral_credit(user_id UUID, amount DECIMAL)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance DECIMAL;
BEGIN
  SELECT referral_credits INTO current_balance
  FROM public.users
  WHERE id = user_id;
  
  IF current_balance IS NULL OR current_balance < amount THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.users
  SET referral_credits = referral_credits - amount
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user delivery stats after match completion
CREATE OR REPLACE FUNCTION update_user_delivery_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update requester stats
    UPDATE public.users
    SET completed_deliveries_count = completed_deliveries_count + 1
    WHERE id = (SELECT user_id FROM public.requests WHERE id = NEW.request_id);
    
    -- Update traveler stats
    UPDATE public.users
    SET completed_deliveries_count = completed_deliveries_count + 1
    WHERE id = (SELECT user_id FROM public.trips WHERE id = NEW.trip_id);
    
    -- Update average rating (if ratings exist)
    UPDATE public.users u
    SET average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM public.ratings r
      WHERE r.ratee_id = u.id
    )
    WHERE u.id IN (
      SELECT user_id FROM public.requests WHERE id = NEW.request_id
      UNION
      SELECT user_id FROM public.trips WHERE id = NEW.trip_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update delivery stats
CREATE TRIGGER update_delivery_stats_trigger
AFTER UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION update_user_delivery_stats();

-- ============================================================================
-- SEED DATA: MEETUP LOCATIONS (20 Popular Locations)
-- ============================================================================

INSERT INTO public.meetup_locations (name, type, latitude, longitude, address, city, country) VALUES
-- Caribbean Marinas
('Grenada Marine', 'marina', 12.0522, -61.7556, 'Prickly Bay', 'St. George''s', 'Grenada'),
('Rodney Bay Marina', 'marina', 14.0833, -60.9500, 'Rodney Bay', 'Gros Islet', 'Saint Lucia'),
('Luperón Marina', 'marina', 19.8833, -70.9500, 'Luperón', 'Puerto Plata', 'Dominican Republic'),
('Simpson Bay Lagoon', 'marina', 18.0333, -63.1000, 'Simpson Bay', 'Sint Maarten', 'Sint Maarten'),
('Nanny Cay Marina', 'marina', 18.4167, -64.6167, 'Nanny Cay', 'Road Town', 'British Virgin Islands'),
('Chaguaramas Bay', 'marina', 10.6833, -61.6167, 'Chaguaramas', 'Port of Spain', 'Trinidad and Tobago'),
('Port Louis Marina', 'marina', 14.7833, -61.0667, 'Port Louis', 'Fort-de-France', 'Martinique'),
('Marigot Bay', 'marina', 14.0667, -60.9500, 'Marigot Bay', 'Castries', 'Saint Lucia'),

-- Caribbean Airports
('Maurice Bishop International Airport', 'airport', 12.0042, -61.7861, 'Point Salines', 'St. George''s', 'Grenada'),
('Grantley Adams International Airport', 'airport', 13.0747, -59.4925, 'Christ Church', 'Bridgetown', 'Barbados'),
('Princess Juliana International Airport', 'airport', 18.0406, -63.1089, 'Simpson Bay', 'Philipsburg', 'Sint Maarten'),
('Luis Muñoz Marín International Airport', 'airport', 18.4394, -66.0018, 'Carolina', 'San Juan', 'Puerto Rico'),

-- Pacific Marinas
('Port Denarau Marina', 'marina', -18.1167, 177.3167, 'Denarau Island', 'Nadi', 'Fiji'),
('Vava''u Port', 'marina', -18.6500, -173.9833, 'Neiafu', 'Vava''u', 'Tonga'),
('Papeete Marina', 'marina', -17.5333, -149.5667, 'Papeete', 'Papeete', 'French Polynesia'),

-- Pacific Airports
('Nadi International Airport', 'airport', -17.7554, 177.4433, 'Nadi', 'Nadi', 'Fiji'),
('Faa''a International Airport', 'airport', -17.5567, -149.6114, 'Faa''a', 'Papeete', 'French Polynesia'),

-- Fuel Docks
('St. George''s Fuel Dock', 'fuel_dock', 12.0522, -61.7556, 'Prickly Bay', 'St. George''s', 'Grenada'),
('Rodney Bay Fuel Dock', 'fuel_dock', 14.0833, -60.9500, 'Rodney Bay', 'Gros Islet', 'Saint Lucia'),
('Simpson Bay Fuel Dock', 'fuel_dock', 18.0333, -63.1000, 'Simpson Bay', 'Sint Maarten', 'Sint Maarten')
ON CONFLICT DO NOTHING;

