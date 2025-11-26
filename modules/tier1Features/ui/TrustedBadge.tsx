/**
 * Trusted Traveller Badge Component
 * 
 * Displays trusted traveller badge on user profile
 */

"use client";

import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface TrustedBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TrustedBadge({ className = '', size = 'md' }: TrustedBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 text-xs px-2 py-1',
    md: 'w-5 h-5 text-sm px-3 py-1.5',
    lg: 'w-6 h-6 text-base px-4 py-2',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 rounded-full font-medium ${sizeClasses[size]} ${className}`}
      title="Trusted Traveller - Completed 3+ successful deliveries"
    >
      <ShieldCheck className="flex-shrink-0" />
      <span>Trusted Traveller</span>
    </div>
  );
}

