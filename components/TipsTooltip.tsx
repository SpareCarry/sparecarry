/**
 * SpareCarry Tips Tooltip Component
 * 
 * Contextual tooltips that show helpful tips throughout the app
 */

"use client";

import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Button } from './ui/button';
import { Info, X } from 'lucide-react';
import { cn } from '../lib/utils';
// Import tips data - Next.js requires dynamic import for JSON
const tipsData = {
  tips: [
    {
      id: "shipping-estimator-1",
      context: "shipping-estimator",
      title: "Package Dimensions",
      content: "Enter accurate dimensions to get the best price estimate. Use centimeters for length, width, and height."
    },
    {
      id: "shipping-estimator-2",
      context: "shipping-estimator",
      title: "Weight Matters",
      content: "Accurate weight helps us calculate shipping costs. Use kilograms for weight."
    },
    {
      id: "posting-1",
      context: "posting",
      title: "Clear Descriptions",
      content: "A clear description helps travelers understand what you're shipping and increases match chances."
    },
    {
      id: "messaging-1",
      context: "messaging",
      title: "Quick Responses",
      content: "Responding quickly to messages increases your chances of successful matches."
    }
  ]
};

export interface Tip {
  id: string;
  context: string;
  title: string;
  content: string;
  category?: 'shipping' | 'posting' | 'messaging' | 'general';
}

export interface TipsTooltipProps {
  tipId: string;
  context?: string;
  className?: string;
  variant?: 'icon' | 'button' | 'inline';
  children?: React.ReactNode;
}

export function TipsTooltip({
  tipId,
  context,
  className,
  variant = 'icon',
  children,
}: TipsTooltipProps) {
  const [tip, setTip] = useState<Tip | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Load tip from JSON data
    const foundTip = tipsData.tips.find(
      t => t.id === tipId && (!context || t.context === context)
    );
    setTip(foundTip || null);

    // Check if tip was dismissed (stored in localStorage)
    if (typeof window !== 'undefined') {
      const dismissedTips = JSON.parse(
        localStorage.getItem('dismissed_tips') || '[]'
      );
      setDismissed(dismissedTips.includes(tipId));
    }
  }, [tipId, context]);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      const dismissedTips = JSON.parse(
        localStorage.getItem('dismissed_tips') || '[]'
      );
      dismissedTips.push(tipId);
      localStorage.setItem('dismissed_tips', JSON.stringify(dismissedTips));
      setDismissed(true);
      setIsOpen(false);
    }
  };

  if (!tip || dismissed) {
    return children ? <>{children}</> : null;
  }

  const triggerContent = (() => {
    switch (variant) {
      case 'button':
        return (
          <Button variant="outline" size="sm" className={className}>
            <Info className="h-4 w-4 mr-1" />
            Tip
          </Button>
        );
      case 'inline':
        return (
          <span className={cn('inline-flex items-center gap-1 text-teal-600 cursor-help', className)}>
            <Info className="h-3 w-3" />
            {children}
          </span>
        );
      case 'icon':
      default:
        return (
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-6 w-6 p-0', className)}
          >
            <Info className="h-4 w-4 text-slate-400 hover:text-teal-600" />
          </Button>
        );
    }
  })();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {triggerContent}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-slate-900">{tip.title}</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-slate-600">{tip.content}</p>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-slate-500">SpareCarry Tip</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={handleDismiss}
            >
              Don&apos;t show again
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

