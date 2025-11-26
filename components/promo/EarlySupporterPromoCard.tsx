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
import { getDaysLeft } from '@/utils/getDaysLeft';
import { PLATFORM_FEE_PERCENT } from '../../config/platformFees';
import { createClient } from '../../lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

type PromoProfile = {
  promo_dismissed_until?: string | null;
};

// A/B testing text variants (localization-ready)
const PROMO_COPY = {
  title: "🔥 Early Supporter Reward",
  message: (actualPlatformFee: number) => 
    `As an early SpareCarry user, you automatically pay 0% platform fees (normally ${(actualPlatformFee * 100).toFixed(0)}%) until Feb 18, 2026.`,
  countdown: (daysLeft: number) => `⏳ ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`,
  footer: "Stripe processing fees still apply.",
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
  const [daysLeft, setDaysLeft] = useState(getDaysLeft());
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  // Memoize supabase client to prevent creating new instances on every render
  const supabase = useMemo(() => createClient() as SupabaseClient, []);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const newDaysLeft = getDaysLeft();
      setDaysLeft(newDaysLeft);
      
      // Hide if expired
      if (newDaysLeft === 0) {
        setIsVisible(false);
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

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

  const actualPlatformFee = PLATFORM_FEE_PERCENT;

  // Reduced motion support (must be called before early return)
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Don't show if dismissed or expired
  if (isDismissed || !isVisible || daysLeft === 0) {
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
              {PROMO_COPY.message(actualPlatformFee)}
            </p>

            {/* Countdown */}
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                "text-sm font-semibold text-teal-700",
                !prefersReducedMotion && "animate-[fadeIn_0.5s_ease-in-out]"
              )}>
                {PROMO_COPY.countdown(daysLeft)}
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

