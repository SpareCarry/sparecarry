"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function VerifiedBadge({
  className,
  size = "md",
  text = "Verified",
}: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "h-4 w-4 text-xs px-1.5 py-0.5",
    md: "h-5 w-5 text-sm px-2 py-1",
    lg: "h-6 w-6 text-base px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 font-medium",
        sizeClasses[size],
        className
      )}
      title="Verified"
    >
      <CheckCircle2 className="h-3 w-3" />
      {text && <span>{text}</span>}
    </span>
  );
}

