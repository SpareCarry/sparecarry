/**
 * Animated Savings Counter
 *
 * Gently animated counter for savings (low-motion friendly)
 */

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TrendingDown } from "lucide-react";
import { cn } from "../../lib/utils";

interface SavingsCounterProps {
  savings: number;
  className?: string;
  animate?: boolean;
}

export function SavingsCounter({
  savings,
  className,
  animate = true,
}: SavingsCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (!animate || prefersReducedMotion) {
      setDisplayValue(savings);
      return;
    }

    // Animate from 0 to savings value
    const duration = 1000; // 1 second
    const steps = 30;
    const increment = savings / steps;
    let current = 0;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current = Math.min(savings, increment * step);
      setDisplayValue(current);

      if (step >= steps) {
        clearInterval(interval);
        setDisplayValue(savings);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [savings, animate, prefersReducedMotion]);

  return (
    <div
      className={cn(
        "flex items-center gap-1 font-semibold text-green-600",
        className
      )}
    >
      <TrendingDown
        className={cn(
          "h-4 w-4",
          !prefersReducedMotion && animate && "animate-pulse"
        )}
      />
      <span>${displayValue.toFixed(2)} saved</span>
    </div>
  );
}
