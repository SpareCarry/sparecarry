/**
 * Payout ETA Component
 *
 * Displays estimated payout time for travelers after delivery confirmation
 */

"use client";

import React from "react";
import { Card, CardContent } from "../ui/card";
import { Clock, DollarSign } from "lucide-react";
import {
  estimatePayoutETA,
  formatPayoutETA,
  getPayoutStatusColor,
} from "../../utils/payoutEstimator";
import { cn } from "../../lib/utils";

export interface PayoutETAProps {
  confirmedAt: Date | string;
  paymentMethod?: "stripe_connect" | "bank_transfer" | "other";
  className?: string;
}

export function PayoutETA({
  confirmedAt,
  paymentMethod,
  className,
}: PayoutETAProps) {
  const confirmedDate =
    typeof confirmedAt === "string" ? new Date(confirmedAt) : confirmedAt;
  const estimate = estimatePayoutETA(confirmedDate, paymentMethod);
  const statusColor = getPayoutStatusColor(estimate);

  return (
    <Card className={cn("border-teal-200 bg-teal-50", className)}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-teal-100 p-2">
            <DollarSign className="h-5 w-5 text-teal-600" />
          </div>
          <div className="flex-1">
            <h4 className="mb-1 flex items-center gap-2 font-semibold text-slate-900">
              <Clock className="h-4 w-4" />
              Payout Estimate
            </h4>
            <p className={cn("mb-1 text-sm font-medium", statusColor)}>
              {formatPayoutETA(estimate)}
            </p>
            <p className="text-xs text-slate-600">{estimate.message}</p>
            <div className="mt-2 text-xs text-slate-500">
              Estimated date: {estimate.estimatedDate.toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
