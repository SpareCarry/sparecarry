/**
 * Telemetry Client
 * 
 * Unified telemetry client for web and mobile
 * Sends events to Sentry and analytics services
 */

import { createTelemetryEvent, TelemetryEvent, TelemetryEventData } from './events';
import { getAppEnvironment } from '../env/config';
import { logger } from '../logger';

interface TelemetryClient {
  track(event: TelemetryEvent, metadata?: Record<string, unknown>, performance?: TelemetryEventData['performance']): void;
  setUser(userId: string, email?: string): void;
  clearUser(): void;
  setSession(sessionId: string): void;
}

class TelemetryClientImpl implements TelemetryClient {
  private userId: string | null = null;
  private sessionId: string | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.NEXT_PUBLIC_ENABLE_TELEMETRY !== 'false';
    
    // Generate session ID
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('telemetry_session_id');
      this.sessionId = stored || this.generateSessionId();
      if (!stored) {
        sessionStorage.setItem('telemetry_session_id', this.sessionId);
      }
    } else {
      this.sessionId = this.generateSessionId();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Track an event
   */
  track(
    event: TelemetryEvent,
    metadata?: Record<string, unknown>,
    performance?: TelemetryEventData['performance']
  ): void {
    if (!this.enabled) return;

    try {
      const eventData = createTelemetryEvent(event, metadata, performance);
      eventData.userId = this.userId || undefined;
      eventData.sessionId = this.sessionId || undefined;

      // Send to Sentry (if configured)
      this.sendToSentry(eventData);

      // Send to analytics (if configured)
      this.sendToAnalytics(eventData);

      // Log in development
      if (getAppEnvironment() === 'development') {
        logger.debug('Telemetry Event', eventData);
      }
    } catch (error) {
      // Silently fail - telemetry should never break the app
      if (getAppEnvironment() === 'development') {
        logger.warn('Telemetry tracking failed', { event, error });
      }
    }
  }

  /**
   * Send event to Sentry
   */
  private async sendToSentry(eventData: TelemetryEventData): Promise<void> {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

    try {
      const Sentry = await import('@sentry/nextjs');
      
      // Add event as breadcrumb
      Sentry.addBreadcrumb({
        category: 'telemetry',
        message: eventData.event,
        level: 'info',
        data: {
          ...eventData.metadata,
          performance: eventData.performance,
        },
      });

      // For error events, capture as exception
      if (eventData.event.includes('error') || eventData.event.includes('failed')) {
        Sentry.captureMessage(`Telemetry: ${eventData.event}`, {
          level: 'error',
          extra: eventData.metadata,
        });
      }

      // For performance events, add to transaction
      if (eventData.performance && eventData.performance.duration) {
        const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
        if (transaction) {
          transaction.setData('telemetry', {
            event: eventData.event,
            ...eventData.performance,
          });
        }
      }
    } catch {
      // Sentry not available
    }
  }

  /**
   * Send event to analytics
   */
  private sendToAnalytics(eventData: TelemetryEventData): void {
    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      try {
        (window as any).gtag('event', eventData.event, {
          event_category: 'telemetry',
          event_label: eventData.event,
          value: eventData.performance?.duration,
          ...eventData.metadata,
        });
      } catch {
        // Analytics not available
      }
    }

    // Meta Pixel
    if (typeof window !== 'undefined' && (window as any).fbq) {
      try {
        (window as any).fbq('trackCustom', eventData.event, eventData.metadata);
      } catch {
        // Meta Pixel not available
      }
    }
  }

  /**
   * Set user context
   */
  setUser(userId: string, email?: string): void {
    this.userId = userId;
    
    // Update Sentry user
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.setUser({
          id: userId,
          email,
        });
      }).catch(() => {
        // Sentry not available
      });
    }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    this.userId = null;
    
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.setUser(null);
      }).catch(() => {
        // Sentry not available
      });
    }
  }

  /**
   * Set session ID
   */
  setSession(sessionId: string): void {
    this.sessionId = sessionId;
  }
}

// Singleton instance
export const telemetry = new TelemetryClientImpl();

/**
 * Convenience functions
 */
export function trackEvent(
  event: TelemetryEvent,
  metadata?: Record<string, unknown>,
  performance?: TelemetryEventData['performance']
): void {
  telemetry.track(event, metadata, performance);
}

export function setTelemetryUser(userId: string, email?: string): void {
  telemetry.setUser(userId, email);
}

export function clearTelemetryUser(): void {
  telemetry.clearUser();
}

