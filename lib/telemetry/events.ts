/**
 * Telemetry Events
 * 
 * Centralized event definitions for analytics and monitoring
 * Used by Sentry, analytics, and custom telemetry
 */

export type TelemetryEvent = 
  | 'user.signup'
  | 'user.login'
  | 'user.logout'
  | 'match.created'
  | 'match.accepted'
  | 'match.rejected'
  | 'match.completed'
  | 'trade.initiated'
  | 'trade.completed'
  | 'payment.intent_created'
  | 'payment.completed'
  | 'payment.failed'
  | 'dispute.submitted'
  | 'dispute.resolved'
  | 'chat.message_sent'
  | 'chat.message_received'
  | 'notification.sent'
  | 'notification.delivered'
  | 'notification.opened'
  | 'page.view'
  | 'page.load'
  | 'api.request'
  | 'api.error'
  | 'performance.metric';

export interface TelemetryEventData {
  event: TelemetryEvent;
  userId?: string;
  sessionId?: string;
  timestamp: number;
  environment: 'development' | 'staging' | 'production';
  platform: 'web' | 'ios' | 'android';
  metadata?: Record<string, unknown>;
  performance?: {
    duration?: number;
    ttfb?: number;
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
  };
}

/**
 * Create a telemetry event
 */
export function createTelemetryEvent(
  event: TelemetryEvent,
  metadata?: Record<string, unknown>,
  performance?: TelemetryEventData['performance']
): TelemetryEventData {
  return {
    event,
    timestamp: Date.now(),
    environment: (process.env.NEXT_PUBLIC_APP_ENV as any) || 'development',
    platform: typeof window !== 'undefined' ? 'web' : 'web', // Will be overridden by mobile
    metadata,
    performance,
  };
}

/**
 * Event metadata schemas
 */
export interface SignupEventMetadata {
  method: 'email' | 'google' | 'apple';
  userType?: 'traveler' | 'requester' | 'both';
}

export interface LoginEventMetadata {
  method: 'email' | 'google' | 'apple';
}

export interface MatchCreatedEventMetadata {
  matchId: string;
  tripId: string;
  requestId: string;
  rewardAmount: number;
  route: {
    from: string;
    to: string;
  };
}

export interface TradeInitiatedEventMetadata {
  matchId: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
}

export interface DisputeSubmittedEventMetadata {
  matchId: string;
  disputeType: 'delivery' | 'payment' | 'other';
  description?: string;
}

export interface ChatMessageSentEventMetadata {
  matchId: string;
  messageLength: number;
  hasAttachment: boolean;
}

export interface NotificationEventMetadata {
  type: 'match' | 'message' | 'payment' | 'dispute' | 'system';
  notificationId?: string;
  delivered: boolean;
  opened?: boolean;
}

export interface PageViewEventMetadata {
  path: string;
  referrer?: string;
  searchParams?: Record<string, string>;
}

export interface ApiRequestEventMetadata {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  error?: string;
}

export interface PerformanceMetricEventMetadata {
  metric: 'ttfb' | 'fcp' | 'lcp' | 'fid' | 'cls' | 'cold_start' | 'warm_start';
  value: number;
  unit: 'ms' | 'score';
  page?: string;
}

