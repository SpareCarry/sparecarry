/**
 * Promo Scroll Indicator
 *
 * Shows "Early Supporter Reward applied!" when user scrolls
 */

"use client";

import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { getDaysLeft } from "@/utils/getDaysLeft";
import { cn } from "../../lib/utils";

export function PromoScrollIndicator() {
  const [showIndicator, setShowIndicator] = useState(false);
  const daysLeft = getDaysLeft();

  useEffect(() => {
    if (daysLeft === 0) return;

    let scrollTimeout: ReturnType<typeof setTimeout> | undefined;
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show indicator when scrolling down
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowIndicator(true);

        // Hide after 3 seconds
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(() => {
          setShowIndicator(false);
        }, 3000);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [daysLeft]);

  if (!showIndicator || daysLeft === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed left-1/2 top-20 z-50 -translate-x-1/2 transform",
        "rounded-full bg-teal-600 px-4 py-2 text-white shadow-lg",
        "flex items-center gap-2 text-sm font-medium",
        "animate-in fade-in slide-in-from-top-2"
      )}
      role="status"
      aria-live="polite"
    >
      <Sparkles className="h-4 w-4" />
      <span>Early Supporter Reward applied!</span>
    </div>
  );
}
