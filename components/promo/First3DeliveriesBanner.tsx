"use client";

import { Card, CardContent } from "../ui/card";
import { Gift } from "lucide-react";

export function First3DeliveriesBanner() {
  return (
    <Card className="mb-6 border-teal-200 bg-gradient-to-br from-teal-50 to-white">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Gift className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-600" />
          <div className="flex-1">
            <h3 className="mb-1 font-semibold text-teal-900">
              Your first delivery is 100% profit for you
            </h3>
            <p className="text-sm text-teal-800">
              We take $0 platform fee — you keep the full reward
            </p>
            <p className="mt-1 text-xs text-teal-700">
              (Stripe payment processing still applies)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
