/**
 * Promo Card Wrapper
 *
 * Smart wrapper that shows the appropriate promo card based on user status
 * Handles fallback logic after promo ends
 */

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { EarlySupporterPromoCard } from "./EarlySupporterPromoCard";
import { FirstDeliveryPromoCard } from "./FirstDeliveryPromoCard";
import { getPromoCardToShow } from "../../lib/promo/promo-utils";
import { useUser } from "../../hooks/useUser";

interface PromoCardWrapperProps {
  className?: string;
  suppressOnPages?: string[]; // Pages where promo should not show
  currentPath?: string;
}

export function PromoCardWrapper({
  className,
  suppressOnPages = [],
  currentPath,
}: PromoCardWrapperProps) {
  const [promoCardType, setPromoCardType] = useState<
    "early-supporter" | "first-delivery" | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser(); // Use shared hook instead of creating new supabase client

  // Memoize suppress check to prevent unnecessary re-renders
  const isSuppressed = useMemo(() => {
    return (
      currentPath && suppressOnPages.some((page) => currentPath.includes(page))
    );
  }, [currentPath, suppressOnPages]);

  useEffect(() => {
    const checkPromo = async () => {
      setIsLoading(true);

      try {
        if (typeof window !== "undefined") {
          const params = new URL(window.location.href).searchParams;
          if (params.get("resetPromo") === "1") {
            localStorage.removeItem("promo_dismissed_until");
          }
        }
      } catch (error) {
        console.warn("Failed to reset promo state:", error);
      }

      // Check if suppressed on current page
      if (isSuppressed) {
        setPromoCardType(null);
        setIsLoading(false);
        return;
      }

      try {
        const cardType = await getPromoCardToShow(user?.id);
        setPromoCardType(cardType);
      } catch (error) {
        console.warn("Failed to determine promo card:", error);
        setPromoCardType(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkPromo();
  }, [user?.id, isSuppressed]); // Only depend on user ID and suppress status

  if (isLoading) {
    return null; // Don't show loading state, just hide
  }

  if (promoCardType === "early-supporter") {
    return <EarlySupporterPromoCard className={className} />;
  }

  if (promoCardType === "first-delivery") {
    return <FirstDeliveryPromoCard className={className} />;
  }

  return null;
}
