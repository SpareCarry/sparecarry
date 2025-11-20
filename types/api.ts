/**
 * API Route Type Definitions
 * Strongly typed interfaces for all API request/response bodies
 */

// ============================================
// Match API Types
// ============================================

export interface AutoMatchRequest {
  type: "trip" | "request";
  id: string;
}

export interface AutoMatchResponse {
  success: boolean;
  error?: string;
}

export interface CheckMatchRequest {
  tripId: string;
  requestId: string;
}

export interface CheckMatchResponse {
  isMatch: boolean;
  routeMatch: boolean;
  dateOverlap: boolean;
  capacityFit: boolean;
  methodMatch: boolean;
  error?: string;
}

export interface CreateMatchRequest {
  tripId: string;
  requestId: string;
  rewardAmount: number;
}

export interface CreateMatchResponse {
  success: boolean;
  matchId?: string;
  error?: string;
}

// ============================================
// Payment API Types
// ============================================

export interface InsuranceInfo {
  policy_number: string;
  premium: number;
  coverage_amount: number;
}

export interface CreatePaymentIntentRequest {
  matchId: string;
  amount: number;
  insurance: InsuranceInfo | null;
  useCredits: boolean;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string | null;
  paymentIntentId: string;
  error?: string;
}

export interface ConfirmDeliveryRequest {
  matchId: string;
  proofPhotos: string[];
  gpsLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface ConfirmDeliveryResponse {
  success: boolean;
  error?: string;
}

// ============================================
// Notification API Types
// ============================================

export interface SendMessageNotificationRequest {
  matchId: string;
  recipientId: string;
  senderName: string;
  messagePreview?: string;
}

export interface SendMatchNotificationRequest {
  matchId: string;
  userId: string;
  tripType: "plane" | "boat";
  rewardAmount: number;
}

export interface SendCounterOfferNotificationRequest {
  matchId: string;
  recipientId: string;
  newRewardAmount: number;
}

export interface NotificationResponse {
  success: boolean;
  error?: string;
}

export interface RegisterTokenRequest {
  token: string;
  platform: "ios" | "android";
}

// ============================================
// Subscription API Types
// ============================================

export interface CreateCheckoutRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutResponse {
  url: string | null;
  sessionId: string;
  error?: string;
}

// ============================================
// Waitlist API Types
// ============================================

export interface WaitlistRequest {
  email: string;
  userType: "traveler" | "requester" | "both";
  tripFrom?: string;
  tripTo?: string;
  approximateDates?: string;
  spareCapacity?: number;
}

export interface WaitlistResponse {
  success: boolean;
  position?: number;
  error?: string;
}

// ============================================
// Group Buy API Types
// ============================================

export interface CreateGroupBuyRequest {
  tripId: string;
  maxParticipants: number;
  discountPercent: number;
}

export interface JoinGroupBuyRequest {
  groupBuyId: string;
  requestId: string;
}

// ============================================
// Stripe API Types
// ============================================

export interface StripeVerificationRequest {
  accountId: string;
}

export interface StripeVerificationResponse {
  verified: boolean;
  requirements?: string[];
  error?: string;
}

// ============================================
// Error Response Types
// ============================================

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

