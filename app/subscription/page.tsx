"use client";

import { SubscriptionCard } from "@/components/subscription/subscription-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriptionPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">SpareCarry Pro</h1>
        <p className="text-slate-600 mt-1">
          Unlock premium features and save on every delivery
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <SubscriptionCard />
      </div>

      <div className="mt-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What is SpareCarry Pro?</h3>
              <p className="text-sm text-slate-600">
                SpareCarry Pro is a subscription that gives you 0% platform fees,
                priority placement in search results, and a verified blue check badge.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How does priority in feed work?</h3>
              <p className="text-sm text-slate-600">
                Your trips and requests appear at the top of search results, giving
                you better visibility and faster matches.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-sm text-slate-600">
                Yes! You can cancel your subscription at any time through the
                subscription management portal. Your benefits will continue until
                the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens if I cancel?</h3>
              <p className="text-sm text-slate-600">
                You'll continue to have Pro benefits until your current billing
                period ends. After that, standard platform fees (15-18%) will apply
                to new deliveries.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

