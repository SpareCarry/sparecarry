/**
 * Trusted by Early Users Badge
 * 
 * Shown only during promo period
 */

"use client";

import React from 'react';
import { Badge } from '../ui/badge';
import { Users } from 'lucide-react';
import { getDaysLeft } from '@/utils/getDaysLeft';

export function TrustedBadge() {
  const daysLeft = getDaysLeft();
  
  // Only show during promo period
  if (daysLeft === 0) {
    return null;
  }

  return (
    <Badge 
      variant="secondary" 
      className="bg-teal-100 text-teal-800 border-teal-200"
    >
      <Users className="h-3 w-3 mr-1" />
      Trusted by early users
    </Badge>
  );
}

