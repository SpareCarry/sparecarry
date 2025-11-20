"use client";

import { Anchor } from "lucide-react";
import { cn } from "../../lib/utils";

interface SupporterBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function SupporterBadge({
  className,
  size = "md",
  showText = true,
}: SupporterBadgeProps) {
  const sizeClasses = {
    sm: "h-4 w-4 text-xs px-1.5 py-0.5",
    md: "h-5 w-5 text-sm px-2 py-1",
    lg: "h-6 w-6 text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold shadow-sm",
        sizeClasses[size],
        className
      )}
      title="Supporter - Early backer of SpareCarry"
    >
      <Anchor className={iconSizes[size]} />
      {showText && <span>Supporter</span>}
    </span>
  );
}

