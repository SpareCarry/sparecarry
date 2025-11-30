"use client";

import { Ship } from "lucide-react";
import { cn } from "../../lib/utils";

interface VerifiedSailorBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function VerifiedSailorBadge({
  className,
  size = "md",
}: VerifiedSailorBadgeProps) {
  const sizeClasses = {
    sm: "h-4 w-4 text-xs px-1.5 py-0.5",
    md: "h-5 w-5 text-sm px-2 py-1",
    lg: "h-6 w-6 text-base px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-blue-100 font-medium text-blue-800",
        sizeClasses[size],
        className
      )}
      title="Verified Sailor"
    >
      <Ship className="h-3 w-3" />
      <span>Verified Sailor</span>
    </span>
  );
}
