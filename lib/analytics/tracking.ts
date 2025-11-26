/**
 * Analytics Tracking Utility
 * 
 * Basic feature usage tracking for beta testing and product insights
 * Events only, no invasive tracking
 */

export type AnalyticsEvent = 
  | { type: 'post_created'; data: { post_type: 'trip' | 'request'; has_photos: boolean; has_restricted_items: boolean } }
  | { type: 'shipping_estimator_used'; data: { origin_country: string; destination_country: string; has_emergency: boolean } }
  | { type: 'message_sent'; data: { post_type: 'trip' | 'request'; thread_id: string } }
  | { type: 'emergency_selected'; data: { base_reward: number; bonus_percentage: number; extra_amount: number } }
  | { type: 'karma_points_earned'; data: { points: number; weight: number; platform_fee: number } }
  | { type: 'restricted_items_selected'; data: { post_type: 'trip' | 'request'; transport_method: string } }
  | { type: 'category_selected'; data: { category: string; is_other: boolean } }
  | { type: 'photo_uploaded'; data: { count: number; post_type: 'trip' | 'request' } }
  | { type: 'location_selected'; data: { method: 'autocomplete' | 'map' | 'gps'; location_type: 'departure' | 'arrival' } }
  | { type: 'premium_discount_applied'; data: { original_price: number; discounted_price: number; savings: number } }
  | { type: 'buy_ship_directly_selected'; data: { retailer: string } }
  | { type: 'watchlist_added'; data: { type: 'route' | 'item'; payload: any } }
  | { type: 'watchlist_removed'; data: { type: 'route' | 'item' } }
  | { type: 'suggested_match_clicked'; data: { trip_id: string; request_id: string; confidence: 'high' | 'medium' | 'low'; score: number } }
  | { type: 'cancellation_reason_selected'; data: { reason_id: string; entity_type: 'trip' | 'request' | 'match' } }
  | { type: 'tip_seen'; data: { tip_id: string; context: string } }
  | { type: 'tip_dismissed'; data: { tip_id: string } }
  | { type: 'auto_translate_toggled'; data: { enabled: boolean } }
  | { type: 'reliability_score_viewed'; data: { user_id: string; score: number } }
  | { type: 'idea_opened'; data: { user_id?: string; platform?: string } }
  | { type: 'idea_submitted'; data: { idea_id?: string; user_id?: string; platform?: string } }
  | { type: 'idea_accepted'; data: { idea_id: string; user_id: string; reward_granted: boolean } }
  | { type: 'idea_reward_granted'; data: { idea_id: string; user_id: string } };

interface AnalyticsData {
  event: AnalyticsEvent['type'];
  data: AnalyticsEvent['data'];
  userId?: string;
  timestamp: string;
  platform: 'web' | 'ios' | 'android';
  userAgent?: string;
}

class AnalyticsTracker {
  private enabled: boolean;
  private events: AnalyticsData[] = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds

  constructor() {
    // Only enable in production or when explicitly enabled
    this.enabled = process.env.NODE_ENV === 'production' || 
                   process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';
    
    if (this.enabled && typeof window !== 'undefined') {
      // Flush events periodically
      setInterval(() => this.flush(), this.flushInterval);
      
      // Flush on page unload
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  private getPlatform(): 'web' | 'ios' | 'android' {
    if (typeof window === 'undefined') return 'web';
    
    const ua = window.navigator.userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
    if (ua.includes('android')) return 'android';
    return 'web';
  }

  track(event: AnalyticsEvent): void {
    if (!this.enabled) return;

    const analyticsData: AnalyticsData = {
      event: event.type,
      data: event.data,
      timestamp: new Date().toISOString(),
      platform: this.getPlatform(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    };

    // Get user ID if available
    if (typeof window !== 'undefined') {
      try {
        const supabase = require('../supabase/client').createClient();
        supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
          if (user) {
            analyticsData.userId = user.id;
          }
        }).catch(() => {
          // Ignore errors
        });
      } catch (e) {
        // Ignore errors
      }
    }

    this.events.push(analyticsData);

    // Flush if batch size reached
    if (this.events.length >= this.batchSize) {
      this.flush();
    }

    // Also send to Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.type, event.data);
    }
  }

  private async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToFlush = [...this.events];
    this.events = [];

    try {
      // Send to Supabase analytics table (if exists)
      if (typeof window !== 'undefined') {
        const supabase = require('../supabase/client').createClient();
        await supabase.from('analytics_events').insert(eventsToFlush).catch(() => {
          // Table might not exist, that's okay
        });
      }

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics]', eventsToFlush.length, 'events flushed');
      }
    } catch (error) {
      console.error('[Analytics] Error flushing events:', error);
      // Re-add events if flush failed
      this.events.unshift(...eventsToFlush);
    }
  }

  // Force flush (useful for testing)
  async forceFlush(): Promise<void> {
    await this.flush();
  }
}

// Singleton instance
export const analytics = new AnalyticsTracker();

// Convenience functions
export function trackPostCreated(postType: 'trip' | 'request', hasPhotos: boolean, hasRestrictedItems: boolean) {
  analytics.track({
    type: 'post_created',
    data: { post_type: postType, has_photos: hasPhotos, has_restricted_items: hasRestrictedItems },
  });
}

export function trackShippingEstimatorUsed(originCountry: string, destinationCountry: string, hasEmergency: boolean) {
  analytics.track({
    type: 'shipping_estimator_used',
    data: { origin_country: originCountry, destination_country: destinationCountry, has_emergency: hasEmergency },
  });
}

export function trackMessageSent(postType: 'trip' | 'request', threadId: string) {
  analytics.track({
    type: 'message_sent',
    data: { post_type: postType, thread_id: threadId },
  });
}

export function trackEmergencySelected(baseReward: number, bonusPercentage: number, extraAmount: number) {
  analytics.track({
    type: 'emergency_selected',
    data: { base_reward: baseReward, bonus_percentage: bonusPercentage, extra_amount: extraAmount },
  });
}

export function trackKarmaPointsEarned(points: number, weight: number, platformFee: number) {
  analytics.track({
    type: 'karma_points_earned',
    data: { points, weight, platform_fee: platformFee },
  });
}

export function trackRestrictedItemsSelected(postType: 'trip' | 'request', transportMethod: string) {
  analytics.track({
    type: 'restricted_items_selected',
    data: { post_type: postType, transport_method: transportMethod },
  });
}

export function trackCategorySelected(category: string, isOther: boolean) {
  analytics.track({
    type: 'category_selected',
    data: { category, is_other: isOther },
  });
}

export function trackPhotoUploaded(count: number, postType: 'trip' | 'request') {
  analytics.track({
    type: 'photo_uploaded',
    data: { count, post_type: postType },
  });
}

export function trackLocationSelected(method: 'autocomplete' | 'map' | 'gps', locationType: 'departure' | 'arrival') {
  analytics.track({
    type: 'location_selected',
    data: { method, location_type: locationType },
  });
}

export function trackPremiumDiscountApplied(originalPrice: number, discountedPrice: number, savings: number) {
  analytics.track({
    type: 'premium_discount_applied',
    data: { original_price: originalPrice, discounted_price: discountedPrice, savings },
  });
}

export function trackBuyShipDirectlySelected(retailer: string) {
  analytics.track({
    type: 'buy_ship_directly_selected',
    data: { retailer },
  });
}

export function trackWatchlistAdded(type: 'route' | 'item', payload: any) {
  analytics.track({
    type: 'watchlist_added',
    data: { type, payload },
  });
}

export function trackWatchlistRemoved(type: 'route' | 'item') {
  analytics.track({
    type: 'watchlist_removed',
    data: { type },
  });
}

export function trackSuggestedMatchClicked(tripId: string, requestId: string, confidence: 'high' | 'medium' | 'low', score: number) {
  analytics.track({
    type: 'suggested_match_clicked',
    data: { trip_id: tripId, request_id: requestId, confidence, score },
  });
}

export function trackCancellationReasonSelected(reasonId: string, entityType: 'trip' | 'request' | 'match') {
  analytics.track({
    type: 'cancellation_reason_selected',
    data: { reason_id: reasonId, entity_type: entityType },
  });
}

export function trackTipSeen(tipId: string, context: string) {
  analytics.track({
    type: 'tip_seen',
    data: { tip_id: tipId, context },
  });
}

export function trackTipDismissed(tipId: string) {
  analytics.track({
    type: 'tip_dismissed',
    data: { tip_id: tipId },
  });
}

export function trackAutoTranslateToggled(enabled: boolean) {
  analytics.track({
    type: 'auto_translate_toggled',
    data: { enabled },
  });
}

export function trackReliabilityScoreViewed(userId: string, score: number) {
  analytics.track({
    type: 'reliability_score_viewed',
    data: { user_id: userId, score },
  });
}

export function trackIdeaOpened(userId?: string, platform?: string) {
  analytics.track({
    type: 'idea_opened',
    data: { user_id: userId, platform },
  });
}

export function trackIdeaSubmitted(ideaId?: string, userId?: string, platform?: string) {
  analytics.track({
    type: 'idea_submitted',
    data: { idea_id: ideaId, user_id: userId, platform },
  });
}

export function trackIdeaAccepted(ideaId: string, userId: string, rewardGranted: boolean) {
  analytics.track({
    type: 'idea_accepted',
    data: { idea_id: ideaId, user_id: userId, reward_granted: rewardGranted },
  });
}

export function trackIdeaRewardGranted(ideaId: string, userId: string) {
  analytics.track({
    type: 'idea_reward_granted',
    data: { idea_id: ideaId, user_id: userId },
  });
}

