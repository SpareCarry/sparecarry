/**
 * Trust Badges Component
 * 
 * Displays trust badges for users: ID verified, email verified, phone verified,
 * premium member, and reliability score
 */

"use client";

import React from 'react';
import { CheckCircle2, Mail, Phone, Crown, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { getReliabilityLevel, getReliabilityLabel } from '../lib/trust/reliability-score';

export interface TrustBadgesProps {
  id_verified?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  premium_member?: boolean;
  reliability_score?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabels?: boolean;
}

export function TrustBadges({
  id_verified = false,
  email_verified = false,
  phone_verified = false,
  premium_member = false,
  reliability_score,
  size = 'md',
  className,
  showLabels = false,
}: TrustBadgesProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 text-xs',
    md: 'h-5 w-5 text-sm',
    lg: 'h-6 w-6 text-base',
  };

  const badgeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const badges: Array<{
    icon: React.ReactNode;
    label: string;
    color: string;
    show: boolean;
    tooltip: string;
  }> = [];

  // ID Verified
  if (id_verified) {
    badges.push({
      icon: <CheckCircle2 className={sizeClasses[size]} />,
      label: 'ID Verified',
      color: 'bg-green-100 text-green-800',
      show: true,
      tooltip: 'Identity verified',
    });
  }

  // Email Verified
  if (email_verified) {
    badges.push({
      icon: <Mail className={sizeClasses[size]} />,
      label: 'Email Verified',
      color: 'bg-blue-100 text-blue-800',
      show: true,
      tooltip: 'Email verified',
    });
  }

  // Phone Verified
  if (phone_verified) {
    badges.push({
      icon: <Phone className={sizeClasses[size]} />,
      label: 'Phone Verified',
      color: 'bg-purple-100 text-purple-800',
      show: true,
      tooltip: 'Phone verified',
    });
  }

  // Premium Member
  if (premium_member) {
    badges.push({
      icon: <Crown className={sizeClasses[size]} />,
      label: 'Premium',
      color: 'bg-yellow-100 text-yellow-800',
      show: true,
      tooltip: 'Premium member',
    });
  }

  // Reliability Score
  if (reliability_score !== undefined && reliability_score > 0) {
    const level = getReliabilityLevel(reliability_score);
    const label = getReliabilityLabel(reliability_score);
    const colorMap = {
      excellent: 'bg-emerald-100 text-emerald-800',
      good: 'bg-teal-100 text-teal-800',
      fair: 'bg-amber-100 text-amber-800',
      new: 'bg-slate-100 text-slate-800',
    };

    badges.push({
      icon: <TrendingUp className={sizeClasses[size]} />,
      label: `${label} (${Math.round(reliability_score)})`,
      color: colorMap[level],
      show: true,
      tooltip: `Reliability score: ${Math.round(reliability_score)}/100`,
    });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {badges.map((badge, index) => (
        <span
          key={index}
          className={cn(
            'inline-flex items-center gap-1 rounded-full font-medium',
            badge.color,
            badgeClasses[size],
            !showLabels && 'px-1.5 py-0.5'
          )}
          title={badge.tooltip}
        >
          {badge.icon}
          {showLabels && <span>{badge.label}</span>}
        </span>
      ))}
    </div>
  );
}

