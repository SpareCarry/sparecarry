"use client";

import { Card, CardContent } from "../ui/card";
import { Shield, Gift, Clock } from "lucide-react";
import { cn } from "../../lib/utils";

interface TrustBannerProps {
  variant: "first-delivery" | "promo-period";
  className?: string;
}

export function TrustBanner({ variant, className }: TrustBannerProps) {
  if (variant === "first-delivery") {
    return (
      <Card className={cn("border-teal-200 bg-gradient-to-r from-teal-50 via-blue-50 to-teal-50 shadow-sm", className)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <Gift className="h-6 w-6 text-teal-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-900 mb-1">
                Your first delivery is 100% free
              </h3>
              <p className="text-sm text-slate-700">
                We waive all platform fees (both sides) on your first completed delivery. 
                No catches, no hidden costs – just a smooth start to your SpareCarry journey.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Promo period banner
  const promoEndDate = new Date("2026-02-18");
  const daysRemaining = Math.max(0, Math.ceil((promoEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const isActive = daysRemaining > 0;

  if (!isActive) {
    return null; // Don't show if promo has ended
  }

  return (
    <Card className={cn("border-blue-200 bg-gradient-to-r from-blue-50 via-teal-50 to-blue-50 shadow-sm", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 mb-1">
              Zero platform fees for everyone until {promoEndDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </h3>
            <p className="text-sm text-slate-700 mb-2">
              We&apos;re bootstrapping with you. Complete your deliveries now and save 15–18% on platform fees. 
              {daysRemaining > 0 && (
                <span className="font-semibold text-blue-700 ml-1">
                  {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left!
                </span>
              )}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Shield className="h-4 w-4" />
              <span>Stripe processing fees (~2.9%) still apply</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

