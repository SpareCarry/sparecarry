/**
 * Zod Schemas for API Request/Response Validation
 * These schemas are used for runtime validation and can generate TypeScript types
 */

import { z } from "zod";

// ============================================
// Match API Schemas
// ============================================

export const autoMatchRequestSchema = z.object({
  type: z.enum(["trip", "request"]),
  id: z.string().uuid(),
});

export const checkMatchRequestSchema = z.object({
  tripId: z.string().uuid(),
  requestId: z.string().uuid(),
});

export const checkMatchResponseSchema = z.object({
  isMatch: z.boolean(),
  routeMatch: z.boolean(),
  dateOverlap: z.boolean(),
  capacityFit: z.boolean(),
  methodMatch: z.boolean(),
  error: z.string().optional(),
});

export const createMatchRequestSchema = z.object({
  tripId: z.string().uuid(),
  requestId: z.string().uuid(),
  rewardAmount: z.number().positive(),
});

// ============================================
// Payment API Schemas
// ============================================

export const insuranceInfoSchema = z.object({
  policy_number: z.string(),
  premium: z.number().nonnegative(),
  coverage_amount: z.number().positive(),
});

export const createPaymentIntentRequestSchema = z.object({
  matchId: z.string().uuid(),
  amount: z.number().positive(),
  insurance: insuranceInfoSchema.nullable(),
  useCredits: z.boolean(),
});

export const createPaymentIntentResponseSchema = z.object({
  clientSecret: z.string().nullable(),
  paymentIntentId: z.string(),
  error: z.string().optional(),
});

export const confirmDeliveryRequestSchema = z.object({
  matchId: z.string().uuid(),
  proofPhotos: z.array(z.string().url()),
  gpsLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
});

// ============================================
// Notification API Schemas
// ============================================

export const sendMessageNotificationRequestSchema = z.object({
  matchId: z.string().uuid(),
  recipientId: z.string().uuid(),
  senderName: z.string().min(1),
  messagePreview: z.string().optional(),
});

export const sendMatchNotificationRequestSchema = z.object({
  matchId: z.string().uuid(),
  userId: z.string().uuid(),
  tripType: z.enum(["plane", "boat"]),
  rewardAmount: z.number().positive(),
});

export const sendCounterOfferNotificationRequestSchema = z.object({
  matchId: z.string().uuid(),
  recipientId: z.string().uuid(),
  newRewardAmount: z.number().positive(),
});

export const registerTokenRequestSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});

export const registerPushTokenRequestSchema = z.object({
  expoPushToken: z.string().min(1),
  enableNotifications: z.boolean().optional().default(true),
});

export const confirmDeliveryRequestSchema = z.object({
  matchId: z.string().uuid(),
});

export const updatePurchaseLinkRequestSchema = z.object({
  matchId: z.string().uuid(),
});

export const createSubscriptionCheckoutRequestSchema = z.object({
  priceId: z.enum(["monthly", "yearly"]),
});

export const verifySupporterPaymentRequestSchema = z.object({
  sessionId: z.string().startsWith("cs_"),
});

export const emergencyRequestNotificationSchema = z.object({
  requestId: z.string().uuid(),
  fromLocation: z.string().min(1),
  toLocation: z.string().min(1),
  reward: z.number().positive(),
  deadline: z.string().datetime(),
});

export const processReferralCreditsRequestSchema = z.object({
  matchId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const createStripeVerificationRequestSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email().optional(),
});

export const checkStripeVerificationRequestSchema = z.object({
  // No body needed, uses authenticated user
});

export const processPayoutRequestSchema = z.object({
  matchId: z.string().uuid(),
  stripeAccountId: z.string().startsWith("acct_"),
  amount: z.number().int().positive(),
});

// ============================================
// Subscription API Schemas
// ============================================

export const createCheckoutRequestSchema = z.object({
  priceId: z.string().startsWith("price_"),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

// ============================================
// Waitlist API Schemas
// ============================================

export const waitlistRequestSchema = z.object({
  email: z.string().email(),
  userType: z.enum(["traveler", "requester", "both"]),
  tripFrom: z.string().optional(),
  tripTo: z.string().optional(),
  approximateDates: z.string().optional(),
  spareCapacity: z.number().positive().optional(),
});

// ============================================
// Group Buy API Schemas
// ============================================

export const createGroupBuyRequestSchema = z.object({
  tripId: z.string().uuid(),
  maxParticipants: z.number().int().min(2).max(10),
  discountPercent: z.number().min(0).max(50),
});

export const joinGroupBuyRequestSchema = z.object({
  groupBuyId: z.string().uuid(),
  requestId: z.string().uuid(),
});

// ============================================
// Stripe API Schemas
// ============================================

export const stripeVerificationRequestSchema = z.object({
  accountId: z.string().startsWith("acct_"),
});

// ============================================
// Type Inference from Schemas
// ============================================

export type AutoMatchRequest = z.infer<typeof autoMatchRequestSchema>;
export type CheckMatchRequest = z.infer<typeof checkMatchRequestSchema>;
export type CheckMatchResponse = z.infer<typeof checkMatchResponseSchema>;
export type CreateMatchRequest = z.infer<typeof createMatchRequestSchema>;
export type InsuranceInfo = z.infer<typeof insuranceInfoSchema>;
export type CreatePaymentIntentRequest = z.infer<typeof createPaymentIntentRequestSchema>;
export type CreatePaymentIntentResponse = z.infer<typeof createPaymentIntentResponseSchema>;
export type ConfirmDeliveryRequest = z.infer<typeof confirmDeliveryRequestSchema>;
export type SendMessageNotificationRequest = z.infer<typeof sendMessageNotificationRequestSchema>;
export type SendMatchNotificationRequest = z.infer<typeof sendMatchNotificationRequestSchema>;
export type SendCounterOfferNotificationRequest = z.infer<typeof sendCounterOfferNotificationRequestSchema>;
export type RegisterTokenRequest = z.infer<typeof registerTokenRequestSchema>;
export type CreateCheckoutRequest = z.infer<typeof createCheckoutRequestSchema>;
export type WaitlistRequest = z.infer<typeof waitlistRequestSchema>;
export type CreateGroupBuyRequest = z.infer<typeof createGroupBuyRequestSchema>;
export type JoinGroupBuyRequest = z.infer<typeof joinGroupBuyRequestSchema>;
export type StripeVerificationRequest = z.infer<typeof stripeVerificationRequestSchema>;
export type RegisterPushTokenRequest = z.infer<typeof registerPushTokenRequestSchema>;
export type ConfirmDeliveryRequest = z.infer<typeof confirmDeliveryRequestSchema>;
export type UpdatePurchaseLinkRequest = z.infer<typeof updatePurchaseLinkRequestSchema>;
export type CreateSubscriptionCheckoutRequest = z.infer<typeof createSubscriptionCheckoutRequestSchema>;
export type VerifySupporterPaymentRequest = z.infer<typeof verifySupporterPaymentRequestSchema>;
export type EmergencyRequestNotificationRequest = z.infer<typeof emergencyRequestNotificationSchema>;
export type ProcessReferralCreditsRequest = z.infer<typeof processReferralCreditsRequestSchema>;
export type CreateStripeVerificationRequest = z.infer<typeof createStripeVerificationRequestSchema>;
export type CheckStripeVerificationRequest = z.infer<typeof checkStripeVerificationRequestSchema>;
export type ProcessPayoutRequest = z.infer<typeof processPayoutRequestSchema>;

