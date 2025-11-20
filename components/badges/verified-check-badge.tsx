"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface VerifiedCheckBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function VerifiedCheckBadge({
  className,
  size = "md",
}: VerifiedCheckBadgeProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <CheckCircle2
      className={cn(
        "text-blue-600 fill-blue-600",
        sizeClasses[size],
        className
      )}
      aria-label="Verified"
    />
  );
}

