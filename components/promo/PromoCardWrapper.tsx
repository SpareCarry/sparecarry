/**
 * Promo Card Wrapper
 * 
 * Smart wrapper that shows the appropriate promo card based on user status
 * Handles fallback logic after promo ends
 */

"use client";

import React, { useState, useEffect } from 'react';
import { EarlySupporterPromoCard } from './EarlySupporterPromoCard';
import { FirstDeliveryPromoCard } from './FirstDeliveryPromoCard';
import { getPromoCardToShow } from '../../lib/promo/promo-utils';
import { createClient } from '../../lib/supabase/client';

interface PromoCardWrapperProps {
  className?: string;
  suppressOnPages?: string[]; // Pages where promo should not show
  currentPath?: string;
}

export function PromoCardWrapper({ 
  className, 
  suppressOnPages = [],
  currentPath 
}: PromoCardWrapperProps) {
  const [promoCardType, setPromoCardType] = useState<'early-supporter' | 'first-delivery' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkPromo = async () => {
      setIsLoading(true);
      
      // Check if suppressed on current page
      if (currentPath && suppressOnPages.some(page => currentPath.includes(page))) {
        setPromoCardType(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        const cardType = await getPromoCardToShow(user?.id);
        setPromoCardType(cardType);
      } catch (error) {
        console.warn('Failed to determine promo card:', error);
        setPromoCardType(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkPromo();
  }, [supabase, currentPath, suppressOnPages]);

  if (isLoading) {
    return null; // Don't show loading state, just hide
  }

  if (promoCardType === 'early-supporter') {
    return <EarlySupporterPromoCard className={className} />;
  }

  if (promoCardType === 'first-delivery') {
    return <FirstDeliveryPromoCard className={className} />;
  }

  return null;
}

