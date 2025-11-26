/**
 * Type definitions for Supabase mock responses
 * Derived from Supabase schema to ensure type safety
 */

/**
 * Supabase Auth User type
 */
export interface SupabaseUser {
  id: string;
  email?: string;
  phone?: string;
  confirmed_at?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  last_sign_in_at?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Supabase Auth Response types
 */
export interface SupabaseAuthResponse<T = any> {
  data: T;
  error: null | {
    message: string;
    status?: number;
  };
}

/**
 * OTP Response (empty on success)
 */
export type OTPResponse = Record<string, never>;

/**
 * User Response
 */
export interface UserResponse {
  user: SupabaseUser | null;
  error: null | {
    message: string;
    status?: number;
  };
}

/**
 * Token Response
 */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: SupabaseUser;
}

/**
 * REST API Table types (based on schema)
 */
export interface Trip {
  id: string;
  user_id: string;
  type: 'plane' | 'boat';
  from_location: string;
  to_location: string;
  departure_date: string;
  eta_window_start: string;
  eta_window_end: string;
  spare_kg: number;
  spare_volume_liters: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Request {
  id: string;
  user_id: string;
  from_location: string;
  to_location: string;
  deadline_earliest: string;
  deadline_latest: string;
  max_reward?: number;
  status: 'open' | 'matched' | 'closed' | 'cancelled';
  emergency?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  phone?: string;
  verified_sailor_at?: string;
  stripe_identity_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  role: 'requester' | 'traveler' | 'sailor' | 'admin';
  subscription_status?: string;
  supporter_status?: string;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  trip_id: string;
  request_id: string;
  status: 'pending' | 'chatting' | 'escrow_paid' | 'delivered' | 'completed' | 'cancelled' | 'disputed';
  reward_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  match_id: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

/**
 * Mock response builders
 */
export const createMockOTPResponse = (): OTPResponse => ({});

export const createMockUserResponse = (user: SupabaseUser | null = null): UserResponse => ({
  user,
  error: null,
});

export const createMockTokenResponse = (user: SupabaseUser): TokenResponse => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user,
});

export const createMockTripsResponse = (trips: Trip[] = []): Trip[] => trips;

export const createMockRequestsResponse = (requests: Request[] = []): Request[] => requests;

export const createMockProfilesResponse = (profiles: Profile[] = []): Profile[] => profiles;

export const createMockUsersResponse = (users: User[] = []): User[] => users;

