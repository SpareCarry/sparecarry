/**
 * Early Supporter Reward Promo Card
 * 
 * High-conversion promo card with A/B testing hooks and localization support
 */

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Sparkles, X, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '../../lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useUser } from '../../hooks/useUser';

type PromoProfile = {
  promo_dismissed_until?: string | null;
};

type UserDeliveryData = {
  completed_deliveries_count?: number | null;
};

const FREE_DELIVERIES_LIMIT = 3;

// A/B testing text variants (localization-ready)
const PROMO_COPY = {
  title: "🔥 Early Supporter Reward",
  message: (remaining: number) => 
    `Your first ${FREE_DELIVERIES_LIMIT} deliveries are 100% profit for you — we take $0 platform fee.`,
  countdown: (remaining: number) => {
    if (remaining === 1) {
      return `⏳ ${remaining} free delivery left`;
    }
    return `⏳ ${remaining} free deliveries left`;
  },
  footer: "Stripe payment processing fees still apply.",
  dismiss: "Don't show again",
} as const;

interface EarlySupporterPromoCardProps {
  className?: string;
  onDismiss?: () => void;
  variant?: 'default' | 'compact';
}

export function EarlySupporterPromoCard({ 
  className, 
  onDismiss,
  variant = 'default' 
}: EarlySupporterPromoCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  // Memoize supabase client to prevent creating new instances on every render
  const supabase = useMemo(() => createClient() as SupabaseClient, []);
  const { user } = useUser();

  // Fetch user's completed deliveries count
  const { data: userDeliveryData } = useQuery<UserDeliveryData | null>({
    queryKey: ["user-deliveries", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const { data, error } = await supabase
          .from("users")
          .select("completed_deliveries_count")
          .eq("id", user.id)
          .single();
        
        if (error) {
          console.warn("Error fetching completed deliveries:", error);
          return null;
        }
        return (data ?? null) as UserDeliveryData | null;
      } catch (error) {
        console.warn("Exception fetching completed deliveries:", error);
        return null;
      }
    },
    enabled: !!user,
    staleTime: 30 * 1000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
    throwOnError: false,
  });

  // Calculate remaining free deliveries
  const completedDeliveries = userDeliveryData?.completed_deliveries_count ?? 0;
  const remainingFreeDeliveries = Math.max(0, FREE_DELIVERIES_LIMIT - completedDeliveries);

  // Check if dismissed in localStorage or Supabase
  useEffect(() => {
    const checkDismissed = async () => {
      // Check localStorage first
      const dismissedUntil = localStorage.getItem('promo_dismissed_until');
      if (dismissedUntil) {
        const dismissedDate = new Date(dismissedUntil);
        if (dismissedDate > new Date()) {
          setIsDismissed(true);
          setIsVisible(false);
          return;
        } else {
          // Expired, remove from localStorage
          localStorage.removeItem('promo_dismissed_until');
        }
      }

      // Check Supabase metadata if user is logged in
      // Note: promo_dismissed_until column doesn't exist in profiles table yet
      // For now, we only use localStorage. When the column is added, uncomment this:
      /*
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('promo_dismissed_until')
            .eq('user_id', user.id)
            .single();

          const profile = (profileData ?? null) as PromoProfile | null;

          if (profile?.promo_dismissed_until) {
            const dismissedDate = new Date(profile.promo_dismissed_until);
            if (dismissedDate > new Date()) {
              setIsDismissed(true);
              setIsVisible(false);
              return;
            }
          }
        }
      } catch (error) {
        // Silently fail - localStorage is fallback
        console.warn('Failed to check Supabase promo dismissal:', error);
      }
      */
    };

    checkDismissed();
  }, [supabase]);

  const handleDismiss = async () => {
    const dismissedUntil = new Date();
    dismissedUntil.setDate(dismissedUntil.getDate() + 30); // 30 days from now

    // Save to localStorage
    localStorage.setItem('promo_dismissed_until', dismissedUntil.toISOString());

    // Save to Supabase if user is logged in
    // Note: promo_dismissed_until column doesn't exist in profiles table yet
    // For now, we only use localStorage. When the column is added, uncomment this:
    /*
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ promo_dismissed_until: dismissedUntil.toISOString() })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.warn('Failed to save dismissal to Supabase:', error);
    }
    */

    setIsDismissed(true);
    setIsVisible(false);
    onDismiss?.();
  };

  // Reduced motion support (must be called before early return)
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Don't show if dismissed, no remaining free deliveries, or user not loaded yet
  if (isDismissed || !isVisible || remainingFreeDeliveries === 0 || (user && completedDeliveries === undefined)) {
    return null;
  }

  return (
    <Card 
      className={cn(
        "border-teal-200 bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 shadow-md",
        "hover:shadow-lg transition-shadow duration-300",
        className
      )}
      role="banner"
      aria-label="Early Supporter Reward"
    >
      <CardContent className={cn("p-4", variant === 'compact' && "p-3")}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-teal-100 to-blue-100 rounded-full flex items-center justify-center">
            <Sparkles className={cn(
              "h-6 w-6 text-teal-600",
              !prefersReducedMotion && "animate-pulse"
            )} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-bold text-lg text-slate-900 leading-tight">
                {PROMO_COPY.title}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 flex-shrink-0"
                onClick={handleDismiss}
                aria-label="Dismiss promo"
              >
                <X className="h-4 w-4 text-slate-400" />
              </Button>
            </div>

            <p className="text-sm text-slate-700 mb-2 leading-relaxed">
              {PROMO_COPY.message(remainingFreeDeliveries)}
            </p>

            {/* Countdown */}
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                "text-sm font-semibold text-teal-700",
                !prefersReducedMotion && "animate-[fadeIn_0.5s_ease-in-out]"
              )}>
                {PROMO_COPY.countdown(remainingFreeDeliveries)}
              </span>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
              <Shield className="h-3 w-3 flex-shrink-0" />
              <span>{PROMO_COPY.footer}</span>
            </div>

            {/* Dismiss button */}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-6 text-xs text-slate-500 hover:text-slate-700"
              onClick={handleDismiss}
            >
              {PROMO_COPY.dismiss}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

