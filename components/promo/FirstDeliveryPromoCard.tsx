/**
 * First Delivery Free Promo Card
 *
 * Shown after promo period ends for users with no completed deliveries
 */

"use client";

import React from "react";
import { Card, CardContent } from "../ui/card";
import { Gift } from "lucide-react";
import { cn } from "../../lib/utils";

interface FirstDeliveryPromoCardProps {
  className?: string;
}

export function FirstDeliveryPromoCard({
  className,
}: FirstDeliveryPromoCardProps) {
  return (
    <Card
      className={cn(
        "border-teal-200 bg-gradient-to-r from-teal-50 via-blue-50 to-teal-50 shadow-sm",
        className
      )}
      role="banner"
      aria-label="First Delivery Free"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
            <Gift className="h-6 w-6 text-teal-600" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-lg font-bold text-slate-900">
              🎁 Your First Delivery Is Free
            </h3>
            <p className="text-sm text-slate-700">
              We&apos;ll waive your delivery platform fee on your first job.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
