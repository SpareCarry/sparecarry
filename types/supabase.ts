/**
 * Supabase Database Type Definitions
 * Strongly typed interfaces for database tables and queries
 */

// ============================================
// Database Table Types
// ============================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      trips: {
        Row: Trip;
        Insert: TripInsert;
        Update: TripUpdate;
      };
      group_buys: {
        Row: GroupBuy;
        Insert: GroupBuyInsert;
        Update: GroupBuyUpdate;
      };
      requests: {
        Row: Request;
        Insert: RequestInsert;
        Update: RequestUpdate;
      };
      matches: {
        Row: Match;
        Insert: MatchInsert;
        Update: MatchUpdate;
      };
      conversations: {
        Row: Conversation;
        Insert: ConversationInsert;
        Update: ConversationUpdate;
      };
      messages: {
        Row: Message;
        Insert: MessageInsert;
        Update: MessageUpdate;
      };
      deliveries: {
        Row: Delivery;
        Insert: DeliveryInsert;
        Update: DeliveryUpdate;
      };
      referrals: {
        Row: Referral;
        Insert: ReferralInsert;
        Update: ReferralUpdate;
      };
      waitlist: {
        Row: WaitlistEntry;
        Insert: WaitlistEntryInsert;
        Update: WaitlistEntryUpdate;
      };
      support_tickets: {
        Row: SupportTicket;
        Insert: SupportTicketInsert;
        Update: SupportTicketUpdate;
      };
    };
  };
}

// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  email: string;
  role?: "requester" | "traveler" | "sailor" | "admin";
  stripe_customer_id?: string | null;
  subscription_status: "active" | "trialing" | "canceled" | "past_due" | null;
  subscription_current_period_end?: string | null;
  supporter_status: "active" | "inactive" | "expired" | null;
  supporter_purchased_at?: string | null;
  supporter_expires_at?: string | null;
  referral_code?: string | null;
  referred_by?: string | null;
  referral_credits: number;
  completed_deliveries_count: number;
  average_rating: number;
  total_referrals_count?: number;
  karma_points: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserInsert {
  id: string;
  email: string;
  role?: User["role"];
  stripe_customer_id?: string | null;
  subscription_status?: User["subscription_status"];
  subscription_current_period_end?: string | null;
  supporter_status?: User["supporter_status"];
  supporter_purchased_at?: string | null;
  supporter_expires_at?: string | null;
  referral_code?: string | null;
  referred_by?: string | null;
  referral_credits?: number;
  completed_deliveries_count?: number;
  average_rating?: number;
  total_referrals_count?: number;
  karma_points?: number;
}

export interface UserUpdate {
  email?: string;
  role?: User["role"];
  stripe_customer_id?: string | null;
  subscription_status?: User["subscription_status"];
  subscription_current_period_end?: string | null;
  supporter_status?: User["supporter_status"];
  supporter_purchased_at?: string | null;
  supporter_expires_at?: string | null;
  referral_code?: string | null;
  referred_by?: string | null;
  referral_credits?: number;
  completed_deliveries_count?: number;
  average_rating?: number;
  total_referrals_count?: number;
  karma_points?: number;
}

// ============================================
// Profile Types
// ============================================

export interface Profile {
  id?: string;
  user_id: string;
  phone?: string | null;
  full_name: string | null;
  verified_identity: boolean;
  verified_sailor: boolean;
  stripe_account_id?: string | null;
  stripe_verification_session_id?: string | null;
  stripe_identity_verified_at?: string | null;
  verified_sailor_at?: string | null;
  boat_name?: string | null;
  boat_type?: string | null;
  boat_length_ft?: number | null;
  verified_at?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  expo_push_token?: string | null;
  push_notifications_enabled: boolean;
  shipping_name?: string | null;
  shipping_address_line1?: string | null;
  shipping_address_line2?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  shipping_country?: string | null;
  lifetime_active?: boolean;
  lifetime_purchase_at?: string | null;
  completed_deliveries?: number;
  referral_credit_cents?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileInsert {
  user_id: string;
  phone?: string | null;
  full_name?: string | null;
  verified_identity?: boolean;
  verified_sailor?: boolean;
  stripe_account_id?: string | null;
  stripe_verification_session_id?: string | null;
  stripe_identity_verified_at?: string | null;
  verified_sailor_at?: string | null;
  boat_name?: string | null;
  boat_type?: string | null;
  boat_length_ft?: number | null;
  verified_at?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  expo_push_token?: string | null;
  push_notifications_enabled?: boolean;
  shipping_name?: string | null;
  shipping_address_line1?: string | null;
  shipping_address_line2?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  shipping_country?: string | null;
  lifetime_active?: boolean;
  lifetime_purchase_at?: string | null;
  completed_deliveries?: number;
  referral_credit_cents?: number;
  is_boater?: boolean;
  prefer_imperial_units?: boolean;
  notify_route_matches?: boolean;
  preferred_currency?: string;
}

export interface ProfileUpdate {
  phone?: string | null;
  full_name?: string | null;
  verified_identity?: boolean;
  verified_sailor?: boolean;
  stripe_account_id?: string | null;
  stripe_verification_session_id?: string | null;
  stripe_identity_verified_at?: string | null;
  verified_sailor_at?: string | null;
  boat_name?: string | null;
  boat_type?: string | null;
  boat_length_ft?: number | null;
  verified_at?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  expo_push_token?: string | null;
  push_notifications_enabled?: boolean;
  shipping_name?: string | null;
  shipping_address_line1?: string | null;
  shipping_address_line2?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  shipping_country?: string | null;
  lifetime_active?: boolean;
  lifetime_purchase_at?: string | null;
  completed_deliveries?: number;
  referral_credit_cents?: number;
  is_boater?: boolean;
  prefer_imperial_units?: boolean;
  notify_route_matches?: boolean;
  preferred_currency?: string;
}

// ============================================
// Trip Types
// ============================================

export interface Trip {
  id: string;
  user_id: string;
  type: "plane" | "boat";
  from_location: string;
  to_location: string;
  departure_location?: string | null;
  departure_lat?: number | null;
  departure_lon?: number | null;
  departure_category?: string | null;
  arrival_location?: string | null;
  arrival_lat?: number | null;
  arrival_lon?: number | null;
  arrival_category?: string | null;
  departure_date?: string | null; // For plane trips
  eta_window_start?: string | null; // For boat trips
  eta_window_end?: string | null; // For boat trips
  spare_kg: number;
  spare_volume_liters?: number | null;
  max_length_cm?: number | null;
  max_width_cm?: number | null;
  max_height_cm?: number | null;
  can_take_lithium_batteries?: boolean;
  can_take_outboard?: boolean;
  can_take_spar?: boolean;
  status: "active" | "completed" | "cancelled";
  flight_number?: string | null;
  from_airport?: string | null;
  to_airport?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TripInsert {
  user_id: string;
  type: "plane" | "boat";
  from_location: string;
  to_location: string;
  departure_location?: string | null;
  departure_lat?: number | null;
  departure_lon?: number | null;
  departure_category?: string | null;
  arrival_location?: string | null;
  arrival_lat?: number | null;
  arrival_lon?: number | null;
  arrival_category?: string | null;
  departure_date?: string | null;
  eta_window_start?: string | null;
  eta_window_end?: string | null;
  spare_kg: number;
  spare_volume_liters?: number | null;
  max_length_cm?: number | null;
  max_width_cm?: number | null;
  max_height_cm?: number | null;
  can_take_lithium_batteries?: boolean;
  can_take_outboard?: boolean;
  can_take_spar?: boolean;
  status?: "active" | "completed" | "cancelled";
  flight_number?: string | null;
  from_airport?: string | null;
  to_airport?: string | null;
}

export interface TripUpdate {
  type?: "plane" | "boat";
  from_location?: string;
  to_location?: string;
  departure_location?: string | null;
  departure_lat?: number | null;
  departure_lon?: number | null;
  departure_category?: string | null;
  arrival_location?: string | null;
  arrival_lat?: number | null;
  arrival_lon?: number | null;
  arrival_category?: string | null;
  departure_date?: string | null;
  eta_window_start?: string | null;
  eta_window_end?: string | null;
  spare_kg?: number;
  spare_volume_liters?: number | null;
  max_length_cm?: number | null;
  max_width_cm?: number | null;
  max_height_cm?: number | null;
  can_take_lithium_batteries?: boolean;
  can_take_outboard?: boolean;
  can_take_spar?: boolean;
  status?: "active" | "completed" | "cancelled";
  flight_number?: string | null;
  from_airport?: string | null;
  to_airport?: string | null;
}

// ============================================
// Group Buy Types
// ============================================

export interface GroupBuy {
  id: string;
  trip_id: string;
  organizer_id: string;
  from_location: string;
  to_location: string;
  max_participants: number;
  current_participants: number;
  discount_percent: number;
  status: "open" | "full" | "closed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface GroupBuyInsert {
  trip_id: string;
  organizer_id: string;
  from_location: string;
  to_location: string;
  max_participants?: number;
  current_participants?: number;
  discount_percent?: number;
  status?: GroupBuy["status"];
}

export interface GroupBuyUpdate {
  trip_id?: string;
  organizer_id?: string;
  from_location?: string;
  to_location?: string;
  max_participants?: number;
  current_participants?: number;
  discount_percent?: number;
  status?: GroupBuy["status"];
}

// ============================================
// Request Types
// ============================================

export interface Request {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  from_location: string;
  to_location: string;
  departure_location?: string | null;
  departure_lat?: number | null;
  departure_lon?: number | null;
  departure_category?: string | null;
  arrival_location?: string | null;
  arrival_lat?: number | null;
  arrival_lon?: number | null;
  arrival_category?: string | null;
  deadline_earliest?: string | null;
  deadline_latest: string;
  preferred_method: "plane" | "boat" | "any";
  max_reward: number;
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  value_usd?: number | null;
  emergency: boolean;
  emergency_days?: number | null;
  status: "open" | "matched" | "completed" | "cancelled";
  preferred_retailer?: "west_marine" | "svb" | "amazon" | null;
  size_tier?: "small" | "medium" | "large" | "extra_large" | null;
  created_at: string;
  updated_at: string;
}

export interface RequestInsert {
  user_id: string;
  title: string;
  description?: string | null;
  from_location: string;
  to_location: string;
  departure_location?: string | null;
  departure_lat?: number | null;
  departure_lon?: number | null;
  departure_category?: string | null;
  arrival_location?: string | null;
  arrival_lat?: number | null;
  arrival_lon?: number | null;
  arrival_category?: string | null;
  deadline_earliest?: string | null;
  deadline_latest: string;
  preferred_method?: "plane" | "boat" | "any";
  max_reward: number;
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  value_usd?: number | null;
  emergency?: boolean;
  emergency_days?: number | null;
  status?: "open" | "matched" | "completed" | "cancelled";
  preferred_retailer?: "west_marine" | "svb" | "amazon" | null;
}

export interface RequestUpdate {
  title?: string;
  description?: string | null;
  from_location?: string;
  to_location?: string;
  departure_location?: string | null;
  departure_lat?: number | null;
  departure_lon?: number | null;
  departure_category?: string | null;
  arrival_location?: string | null;
  arrival_lat?: number | null;
  arrival_lon?: number | null;
  arrival_category?: string | null;
  deadline_earliest?: string | null;
  deadline_latest?: string;
  preferred_method?: "plane" | "boat" | "any";
  max_reward?: number;
  weight_kg?: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  value_usd?: number | null;
  emergency?: boolean;
  emergency_days?: number | null;
  status?: "open" | "matched" | "completed" | "cancelled";
  preferred_retailer?: "west_marine" | "svb" | "amazon" | null;
  size_tier?: "small" | "medium" | "large" | "extra_large" | null;
}

// ============================================
// Match Types
// ============================================

export interface Match {
  id: string;
  trip_id: string;
  request_id: string;
  group_buy_id?: string | null;
  status:
    | "pending"
    | "chatting"
    | "escrow_paid"
    | "delivered"
    | "completed"
    | "cancelled"
    | "disputed";
  reward_amount: number;
  platform_fee_percent?: number | null;
  insurance_policy_number?: string | null;
  insurance_premium?: number | null;
  escrow_payment_intent_id?: string | null;
  conversation_id?: string | null;
  delivered_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchInsert {
  trip_id: string;
  request_id: string;
  group_buy_id?: string | null;
  status?: Match["status"];
  reward_amount: number;
  platform_fee_percent?: number | null;
  insurance_policy_number?: string | null;
  insurance_premium?: number | null;
  escrow_payment_intent_id?: string | null;
  conversation_id?: string | null;
  delivered_at?: string | null;
}

export interface MatchUpdate {
  status?: Match["status"];
  group_buy_id?: string | null;
  reward_amount?: number;
  platform_fee_percent?: number | null;
  insurance_policy_number?: string | null;
  insurance_premium?: number | null;
  escrow_payment_intent_id?: string | null;
  conversation_id?: string | null;
  delivered_at?: string | null;
}

// ============================================
// Conversation Types
// ============================================

export interface Conversation {
  id: string;
  match_id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationInsert {
  match_id: string;
}

export interface ConversationUpdate {
  // No updatable fields
}

// ============================================
// Message Types
// ============================================

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_urls?: string[] | null;
  audio_url?: string | null;
  created_at: string;
}

export interface MessageInsert {
  conversation_id: string;
  sender_id: string;
  content: string;
  image_urls?: string[] | null;
  audio_url?: string | null;
}

export interface MessageUpdate {
  content?: string;
}

// ============================================
// Delivery Types
// ============================================

export interface Delivery {
  id: string;
  match_id: string;
  proof_photos: string[];
  gps_latitude?: number | null;
  gps_longitude?: number | null;
  dispute_opened_at?: string | null;
  created_at: string;
}

export interface DeliveryInsert {
  match_id: string;
  proof_photos: string[];
  gps_latitude?: number | null;
  gps_longitude?: number | null;
}

export interface DeliveryUpdate {
  proof_photos?: string[];
  gps_latitude?: number | null;
  gps_longitude?: number | null;
  dispute_opened_at?: string | null;
}

// ============================================
// Referral Types
// ============================================

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referrer_credit_earned: number | null;
  referred_credit_earned: number | null;
  first_delivery_completed_at: string | null;
  first_paid_delivery_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralInsert {
  referrer_id: string;
  referred_id: string;
  referrer_credit_earned?: number | null;
  referred_credit_earned?: number | null;
  first_delivery_completed_at?: string | null;
  first_paid_delivery_completed_at?: string | null;
}

export interface ReferralUpdate {
  referrer_id?: string;
  referred_id?: string;
  referrer_credit_earned?: number | null;
  referred_credit_earned?: number | null;
  first_delivery_completed_at?: string | null;
  first_paid_delivery_completed_at?: string | null;
}

// ============================================
// Waitlist Types
// ============================================

export interface WaitlistEntry {
  id: string;
  email: string;
  user_type: string;
  trip_from?: string | null;
  trip_to?: string | null;
  approximate_dates?: string | null;
  spare_capacity?: string | null;
  created_at: string;
}

export interface WaitlistEntryInsert {
  email: string;
  user_type: string;
  trip_from?: string | null;
  trip_to?: string | null;
  approximate_dates?: string | null;
  spare_capacity?: string | null;
}

export interface WaitlistEntryUpdate {
  email?: string;
  user_type?: string;
  trip_from?: string | null;
  trip_to?: string | null;
  approximate_dates?: string | null;
  spare_capacity?: string | null;
}

// ============================================
// Support Ticket Types
// ============================================

export interface SupportTicket {
  id: string;
  user_id: string | null;
  ticket_id: string;
  subject: string;
  message: string;
  match_id: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
}

export interface SupportTicketInsert {
  user_id?: string | null;
  ticket_id: string;
  subject: string;
  message: string;
  match_id?: string | null;
  status?: SupportTicket["status"];
}

export interface SupportTicketUpdate {
  subject?: string;
  message?: string;
  match_id?: string | null;
  status?: SupportTicket["status"];
}

// ============================================
// Query Result Types
// ============================================

export interface MatchWithRelations extends Match {
  trips: Trip & {
    profiles: Pick<Profile, "stripe_account_id"> | null;
  };
  requests: Request;
}

export interface TripWithProfile extends Trip {
  profiles: Profile | null;
}

export interface RequestWithUser extends Request {
  users: User | null;
}
