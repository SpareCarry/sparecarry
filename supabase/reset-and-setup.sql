-- ============================================================================
-- SPARECARRY - COMPLETE DATABASE RESET AND SETUP
-- ============================================================================
-- ⚠️  WARNING: This will DELETE ALL DATA in your database!
-- ⚠️  Only run this if you want to start completely fresh
-- ⚠️  Run this ENTIRE file in Supabase SQL Editor to reset everything
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING OBJECTS (SAFELY)
-- ============================================================================

-- Drop triggers first (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS update_users_updated_at ON public.users CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trips') THEN
        DROP TRIGGER IF EXISTS update_trips_updated_at ON public.trips CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_buys') THEN
        DROP TRIGGER IF EXISTS update_group_buys_updated_at ON public.group_buys CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'requests') THEN
        DROP TRIGGER IF EXISTS update_requests_updated_at ON public.requests CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referrals') THEN
        DROP TRIGGER IF EXISTS update_referrals_updated_at ON public.referrals CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'matches') THEN
        DROP TRIGGER IF EXISTS update_matches_updated_at ON public.matches CASCADE;
        DROP TRIGGER IF EXISTS update_delivery_stats_trigger ON public.matches CASCADE;
        DROP TRIGGER IF EXISTS on_match_created ON public.matches CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
        DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deliveries') THEN
        DROP TRIGGER IF EXISTS update_deliveries_updated_at ON public.deliveries CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'meetup_locations') THEN
        DROP TRIGGER IF EXISTS update_meetup_locations_updated_at ON public.meetup_locations CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'disputes') THEN
        DROP TRIGGER IF EXISTS update_disputes_updated_at ON public.disputes CASCADE;
    END IF;
END $$;

-- Drop auth trigger separately
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- Drop tables in reverse dependency order (CASCADE handles dependencies)
-- Using IF EXISTS to avoid errors if tables don't exist
DROP TABLE IF EXISTS public.deliveries CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.ratings CASCADE;
DROP TABLE IF EXISTS public.disputes CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.requests CASCADE;
DROP TABLE IF EXISTS public.group_buys CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.meetup_locations CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.waitlist CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Double-check: Drop any remaining tables in public schema (except system tables)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT IN ('users', 'profiles', 'trips', 'group_buys', 'requests', 'referrals', 'waitlist', 'matches', 'conversations', 'messages', 'meetup_locations', 'deliveries', 'ratings', 'disputes')
    ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_match() CASCADE;
DROP FUNCTION IF EXISTS public.add_referral_credit(UUID, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS public.use_referral_credit(UUID, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_delivery_stats() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop all policies (they will be recreated) - safer approach
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Only drop policies for tables that actually exist (using JOIN instead of EXISTS with r)
    FOR r IN (
        SELECT p.schemaname, p.tablename, p.policyname 
        FROM pg_policies p
        JOIN information_schema.tables t 
            ON t.table_schema = p.schemaname 
            AND t.table_name = p.tablename
        WHERE p.schemaname = 'public'
    ) LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors if table/policy doesn't exist
            NULL;
        END;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: CREATE EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 3: CREATE ALL TABLES (IN CORRECT ORDER)
-- ============================================================================

-- USERS TABLE
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('requester', 'traveler', 'sailor', 'admin')) DEFAULT 'requester',
  stripe_customer_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid', NULL)) DEFAULT NULL,
  subscription_current_period_end TIMESTAMP WITH TIME ZONE,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.users(id),
  referral_credits DECIMAL(10, 2) DEFAULT 0,
  completed_deliveries_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),
  total_referrals_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  phone TEXT,
  stripe_account_id TEXT,
  stripe_verification_session_id TEXT,
  stripe_identity_verified_at TIMESTAMP WITH TIME ZONE,
  verified_sailor_at TIMESTAMP WITH TIME ZONE,
  boat_name TEXT,
  boat_type TEXT,
  boat_length_ft INTEGER,
  verified_at TIMESTAMP WITH TIME ZONE,
  bio TEXT,
  avatar_url TEXT,
  expo_push_token TEXT,
  push_notifications_enabled BOOLEAN DEFAULT true,
  shipping_name TEXT,
  shipping_address_line1 TEXT,
  shipping_address_line2 TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT DEFAULT 'USA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TRIPS TABLE
CREATE TABLE public.trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('plane', 'boat')),
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  flight_number TEXT,
  departure_date DATE NOT NULL,
  eta_window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  eta_window_end TIMESTAMP WITH TIME ZONE NOT NULL,
  spare_kg DECIMAL(10, 2) NOT NULL CHECK (spare_kg >= 0),
  spare_volume_liters DECIMAL(10, 2) NOT NULL CHECK (spare_volume_liters >= 0),
  max_dimensions TEXT,
  can_oversize BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GROUP_BUYS TABLE
CREATE TABLE public.group_buys (
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

-- REQUESTS TABLE
CREATE TABLE public.requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  deadline_earliest DATE,
  deadline_latest DATE NOT NULL,
  max_reward DECIMAL(10, 2) NOT NULL CHECK (max_reward > 0),
  item_photos TEXT[],
  dimensions_cm TEXT,
  weight_kg DECIMAL(10, 2) NOT NULL CHECK (weight_kg > 0),
  value_usd DECIMAL(10, 2),
  preferred_method TEXT DEFAULT 'any' CHECK (preferred_method IN ('plane', 'boat', 'any')),
  emergency BOOLEAN DEFAULT false,
  purchase_retailer TEXT CHECK (purchase_retailer IN ('west_marine', 'svb', 'amazon', NULL)),
  purchase_link TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matched', 'fulfilled', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REFERRALS TABLE
CREATE TABLE public.referrals (
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

-- WAITLIST TABLE
CREATE TABLE public.waitlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL,
  trip_from TEXT,
  trip_to TEXT,
  approximate_dates TEXT,
  spare_capacity TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MATCHES TABLE (created before conversations to break circular dependency)
CREATE TABLE public.matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE NOT NULL,
  group_buy_id UUID REFERENCES public.group_buys(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'chatting', 'escrow_paid', 'delivered', 'completed', 'cancelled', 'disputed')),
  reward_amount DECIMAL(10, 2) NOT NULL CHECK (reward_amount > 0),
  platform_fee_percent DECIMAL(5, 4),
  escrow_payment_intent_id TEXT,
  insurance_policy_number TEXT,
  insurance_premium DECIMAL(10, 2),
  conversation_id UUID, -- Will add foreign key constraint after conversations table is created
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, request_id)
);

-- CONVERSATIONS TABLE (created after matches since it references matches)
CREATE TABLE public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint to matches.conversation_id after conversations table exists
ALTER TABLE public.matches 
  ADD CONSTRAINT matches_conversation_id_fkey 
  FOREIGN KEY (conversation_id) 
  REFERENCES public.conversations(id) 
  ON DELETE SET NULL;

-- MESSAGES TABLE
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MEETUP_LOCATIONS TABLE (must be before deliveries)
CREATE TABLE public.meetup_locations (
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

-- DELIVERIES TABLE
CREATE TABLE public.deliveries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE UNIQUE NOT NULL,
  proof_photos TEXT[],
  gps_lat_long TEXT,
  meetup_location_id UUID REFERENCES public.meetup_locations(id),
  delivered_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  auto_release_at TIMESTAMP WITH TIME ZONE,
  dispute_opened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RATINGS TABLE
CREATE TABLE public.ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  ratee_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, rater_id)
);

-- DISPUTES TABLE
CREATE TABLE public.disputes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  opened_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'rejected')),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_stripe_account_id ON public.profiles(stripe_account_id);
CREATE INDEX idx_trips_user_id ON public.trips(user_id);
CREATE INDEX idx_trips_type ON public.trips(type);
CREATE INDEX idx_trips_from_location ON public.trips(from_location);
CREATE INDEX idx_trips_to_location ON public.trips(to_location);
CREATE INDEX idx_trips_departure_date ON public.trips(departure_date);
CREATE INDEX idx_trips_status ON public.trips(status);
CREATE INDEX idx_trips_eta_window ON public.trips(eta_window_start, eta_window_end);
CREATE INDEX idx_group_buys_trip_id ON public.group_buys(trip_id);
CREATE INDEX idx_group_buys_status ON public.group_buys(status);
CREATE INDEX idx_requests_user_id ON public.requests(user_id);
CREATE INDEX idx_requests_from_location ON public.requests(from_location);
CREATE INDEX idx_requests_to_location ON public.requests(to_location);
CREATE INDEX idx_requests_deadline_latest ON public.requests(deadline_latest);
CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_requests_preferred_method ON public.requests(preferred_method);
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX idx_waitlist_email ON public.waitlist(email);
CREATE INDEX idx_waitlist_created_at ON public.waitlist(created_at);
CREATE INDEX idx_waitlist_user_type ON public.waitlist(user_type);
CREATE INDEX idx_matches_trip_id ON public.matches(trip_id);
CREATE INDEX idx_matches_request_id ON public.matches(request_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_conversations_match_id ON public.conversations(match_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_deliveries_match_id ON public.deliveries(match_id);
CREATE INDEX idx_deliveries_meetup_location_id ON public.deliveries(meetup_location_id);
CREATE INDEX idx_meetup_locations_type ON public.meetup_locations(type);
CREATE INDEX idx_meetup_locations_location ON public.meetup_locations(latitude, longitude);
CREATE INDEX idx_ratings_match_id ON public.ratings(match_id);
CREATE INDEX idx_ratings_rater_id ON public.ratings(rater_id);
CREATE INDEX idx_ratings_ratee_id ON public.ratings(ratee_id);
CREATE INDEX idx_disputes_match_id ON public.disputes(match_id);
CREATE INDEX idx_disputes_opened_by ON public.disputes(opened_by);
CREATE INDEX idx_disputes_status ON public.disputes(status);

-- ============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

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
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================================================

-- Users policies
CREATE POLICY "Users can view their own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trips policies
CREATE POLICY "Trips are viewable by everyone" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Users can create their own trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trips" ON public.trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trips" ON public.trips FOR DELETE USING (auth.uid() = user_id);

-- Requests policies
CREATE POLICY "Requests are viewable by everyone" ON public.requests FOR SELECT USING (true);
CREATE POLICY "Users can create their own requests" ON public.requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own requests" ON public.requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own requests" ON public.requests FOR DELETE USING (auth.uid() = user_id);

-- Referrals policies
CREATE POLICY "Referrals are viewable by participants" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Group buys policies
CREATE POLICY "Group buys readable by everyone" ON public.group_buys FOR SELECT USING (true);
CREATE POLICY "Users can create group buys" ON public.group_buys FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Authenticated users can update group buys" ON public.group_buys FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Group buys deletable by organizer" ON public.group_buys FOR DELETE USING (auth.uid() = organizer_id);

-- Waitlist policies
CREATE POLICY "Waitlist readable by everyone" ON public.waitlist FOR SELECT USING (true);
CREATE POLICY "Public can join waitlist" ON public.waitlist FOR INSERT WITH CHECK (true);

-- Matches policies
CREATE POLICY "Matches are viewable by participants" ON public.matches FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.trips WHERE trips.id = matches.trip_id AND trips.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.requests WHERE requests.id = matches.request_id AND requests.user_id = auth.uid())
);
CREATE POLICY "Matches can be created by system" ON public.matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Matches can be updated by participants" ON public.matches FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.trips WHERE trips.id = matches.trip_id AND trips.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.requests WHERE requests.id = matches.request_id AND requests.user_id = auth.uid())
);

-- Conversations policies
CREATE POLICY "Conversations are viewable by participants" ON public.conversations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.matches
    JOIN public.trips ON trips.id = matches.trip_id
    JOIN public.requests ON requests.id = matches.request_id
    WHERE matches.id = conversations.match_id
    AND (trips.user_id = auth.uid() OR requests.user_id = auth.uid())
  )
);

-- Messages policies
CREATE POLICY "Messages are viewable by conversation participants" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    JOIN public.matches ON matches.id = conversations.match_id
    JOIN public.trips ON trips.id = matches.trip_id
    JOIN public.requests ON requests.id = matches.request_id
    WHERE conversations.id = messages.conversation_id
    AND (trips.user_id = auth.uid() OR requests.user_id = auth.uid())
  )
);
CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.conversations
    JOIN public.matches ON matches.id = conversations.match_id
    JOIN public.trips ON trips.id = matches.trip_id
    JOIN public.requests ON requests.id = matches.request_id
    WHERE conversations.id = messages.conversation_id
    AND (trips.user_id = auth.uid() OR requests.user_id = auth.uid())
  )
);

-- Deliveries policies
CREATE POLICY "Deliveries are viewable by match participants" ON public.deliveries FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.matches
    JOIN public.trips ON trips.id = matches.trip_id
    JOIN public.requests ON requests.id = matches.request_id
    WHERE matches.id = deliveries.match_id
    AND (trips.user_id = auth.uid() OR requests.user_id = auth.uid())
  )
);
CREATE POLICY "Deliveries can be updated by match participants" ON public.deliveries FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.matches
    JOIN public.trips ON trips.id = matches.trip_id
    JOIN public.requests ON requests.id = matches.request_id
    WHERE matches.id = deliveries.match_id
    AND (trips.user_id = auth.uid() OR requests.user_id = auth.uid())
  )
);

-- Meetup locations policies
CREATE POLICY "Meetup locations are viewable by everyone" ON public.meetup_locations FOR SELECT USING (true);

-- Ratings policies
CREATE POLICY "Ratings are viewable by everyone" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Users can create ratings for their matches" ON public.ratings FOR INSERT WITH CHECK (
  auth.uid() = rater_id
  AND EXISTS (
    SELECT 1 FROM public.matches
    WHERE matches.id = ratings.match_id
    AND (matches.trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
      OR matches.request_id IN (SELECT id FROM public.requests WHERE user_id = auth.uid()))
  )
);

-- Disputes policies
CREATE POLICY "Users can read own disputes" ON public.disputes FOR SELECT USING (
  opened_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = disputes.match_id
    AND (
      EXISTS (SELECT 1 FROM public.trips t WHERE t.id = m.trip_id AND t.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.requests r WHERE r.id = m.request_id AND r.user_id = auth.uid())
    )
  )
);
CREATE POLICY "Users can create disputes" ON public.disputes FOR INSERT WITH CHECK (
  opened_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = disputes.match_id
    AND (
      EXISTS (SELECT 1 FROM public.trips t WHERE t.id = m.trip_id AND t.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.requests r WHERE r.id = m.request_id AND r.user_id = auth.uid())
    )
  )
);
CREATE POLICY "Admins can manage all disputes" ON public.disputes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- STEP 7: CREATE FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Function to automatically create a conversation when a match is created
CREATE OR REPLACE FUNCTION public.handle_new_match()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.conversations (match_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add referral credit
CREATE OR REPLACE FUNCTION public.add_referral_credit(user_id UUID, amount DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET referral_credits = referral_credits + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use referral credit
CREATE OR REPLACE FUNCTION public.use_referral_credit(user_id UUID, amount DECIMAL)
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

-- Function to update user delivery stats
CREATE OR REPLACE FUNCTION public.update_user_delivery_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.users
    SET completed_deliveries_count = completed_deliveries_count + 1
    WHERE id = (SELECT user_id FROM public.requests WHERE id = NEW.request_id);
    
    UPDATE public.users
    SET completed_deliveries_count = completed_deliveries_count + 1
    WHERE id = (SELECT user_id FROM public.trips WHERE id = NEW.trip_id);
    
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

-- ============================================================================
-- STEP 8: CREATE TRIGGERS
-- ============================================================================

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

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_match_created
  AFTER INSERT ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_match();

CREATE TRIGGER update_delivery_stats_trigger
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_delivery_stats();

-- ============================================================================
-- STEP 9: SEED DATA - MEETUP LOCATIONS
-- ============================================================================

INSERT INTO public.meetup_locations (name, type, latitude, longitude, address, city, country) VALUES
('Grenada Marine', 'marina', 12.0522, -61.7556, 'Prickly Bay', 'St. George''s', 'Grenada'),
('Rodney Bay Marina', 'marina', 14.0833, -60.9500, 'Rodney Bay', 'Gros Islet', 'Saint Lucia'),
('Luperón Marina', 'marina', 19.8833, -70.9500, 'Luperón', 'Puerto Plata', 'Dominican Republic'),
('Simpson Bay Lagoon', 'marina', 18.0333, -63.1000, 'Simpson Bay', 'Sint Maarten', 'Sint Maarten'),
('Nanny Cay Marina', 'marina', 18.4167, -64.6167, 'Nanny Cay', 'Road Town', 'British Virgin Islands'),
('Chaguaramas Bay', 'marina', 10.6833, -61.6167, 'Chaguaramas', 'Port of Spain', 'Trinidad and Tobago'),
('Port Louis Marina', 'marina', 14.7833, -61.0667, 'Port Louis', 'Fort-de-France', 'Martinique'),
('Marigot Bay', 'marina', 14.0667, -60.9500, 'Marigot Bay', 'Castries', 'Saint Lucia'),
('Maurice Bishop International Airport', 'airport', 12.0042, -61.7861, 'Point Salines', 'St. George''s', 'Grenada'),
('Grantley Adams International Airport', 'airport', 13.0747, -59.4925, 'Christ Church', 'Bridgetown', 'Barbados'),
('Princess Juliana International Airport', 'airport', 18.0406, -63.1089, 'Simpson Bay', 'Philipsburg', 'Sint Maarten'),
('Luis Muñoz Marín International Airport', 'airport', 18.4394, -66.0018, 'Carolina', 'San Juan', 'Puerto Rico'),
('Port Denarau Marina', 'marina', -18.1167, 177.3167, 'Denarau Island', 'Nadi', 'Fiji'),
('Vava''u Port', 'marina', -18.6500, -173.9833, 'Neiafu', 'Vava''u', 'Tonga'),
('Papeete Marina', 'marina', -17.5333, -149.5667, 'Papeete', 'Papeete', 'French Polynesia'),
('Nadi International Airport', 'airport', -17.7554, 177.4433, 'Nadi', 'Nadi', 'Fiji'),
('Faa''a International Airport', 'airport', -17.5567, -149.6114, 'Faa''a', 'Papeete', 'French Polynesia'),
('St. George''s Fuel Dock', 'fuel_dock', 12.0522, -61.7556, 'Prickly Bay', 'St. George''s', 'Grenada'),
('Rodney Bay Fuel Dock', 'fuel_dock', 14.0833, -60.9500, 'Rodney Bay', 'Gros Islet', 'Saint Lucia'),
('Simpson Bay Fuel Dock', 'fuel_dock', 18.0333, -63.1000, 'Simpson Bay', 'Sint Maarten', 'Sint Maarten')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMPLETE! Your database has been reset and set up from scratch.
-- ============================================================================

