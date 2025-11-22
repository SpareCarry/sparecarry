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
    };
  };
}

// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  email: string;
  created_at: string;
  subscription_status: "active" | "trialing" | "canceled" | "past_due" | null;
  supporter_status: "active" | "inactive" | null;
  completed_deliveries_count: number;
  average_rating: number;
  referral_credits: number;
}

export interface UserInsert {
  id: string;
  email: string;
  subscription_status?: User["subscription_status"];
  supporter_status?: User["supporter_status"];
  completed_deliveries_count?: number;
  average_rating?: number;
  referral_credits?: number;
}

export interface UserUpdate {
  email?: string;
  subscription_status?: User["subscription_status"];
  supporter_status?: User["supporter_status"];
  completed_deliveries_count?: number;
  average_rating?: number;
  referral_credits?: number;
}

// ============================================
// Profile Types
// ============================================

export interface Profile {
  user_id: string;
  full_name: string | null;
  verified_identity: boolean;
  verified_sailor: boolean;
  stripe_account_id: string | null;
  expo_push_token: string | null;
  push_notifications_enabled: boolean;
  boat_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  user_id: string;
  full_name?: string | null;
  verified_identity?: boolean;
  verified_sailor?: boolean;
  stripe_account_id?: string | null;
  expo_push_token?: string | null;
  push_notifications_enabled?: boolean;
  boat_name?: string | null;
}

export interface ProfileUpdate {
  full_name?: string | null;
  verified_identity?: boolean;
  verified_sailor?: boolean;
  stripe_account_id?: string | null;
  expo_push_token?: string | null;
  push_notifications_enabled?: boolean;
  boat_name?: string | null;
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
  created_at: string;
  updated_at: string;
}

export interface RequestInsert {
  user_id: string;
  title: string;
  description?: string | null;
  from_location: string;
  to_location: string;
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
}

// ============================================
// Match Types
// ============================================

export interface Match {
  id: string;
  trip_id: string;
  request_id: string;
  group_buy_id?: string | null;
  status: "pending" | "chatting" | "escrow_paid" | "delivered" | "completed" | "cancelled" | "disputed";
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
  created_at: string;
}

export interface MessageInsert {
  conversation_id: string;
  sender_id: string;
  content: string;
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
  created_at: string;
  updated_at: string;
}

export interface ReferralInsert {
  referrer_id: string;
  referred_id: string;
  referrer_credit_earned?: number | null;
  referred_credit_earned?: number | null;
  first_delivery_completed_at?: string | null;
}

export interface ReferralUpdate {
  referrer_id?: string;
  referred_id?: string;
  referrer_credit_earned?: number | null;
  referred_credit_earned?: number | null;
  first_delivery_completed_at?: string | null;
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

