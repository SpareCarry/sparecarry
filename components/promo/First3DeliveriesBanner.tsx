"use client";

import { Card, CardContent } from "../ui/card";
import { Gift } from "lucide-react";

export function First3DeliveriesBanner() {
  return (
    <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-white mb-6">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Gift className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-teal-900 mb-1">
              Your first 3 deliveries are 100% profit for you
            </h3>
            <p className="text-sm text-teal-800">
              We take $0 platform fee — you keep the full reward
            </p>
            <p className="text-xs text-teal-700 mt-1">
              (Stripe payment processing still applies)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

