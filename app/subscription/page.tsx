"use client";

import { SubscriptionCard } from "../../components/subscription/subscription-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { LifetimeMarketingBanner } from "../../components/subscription/lifetime-marketing-banner";

export default function SubscriptionPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24 lg:pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">SpareCarry Pro</h1>
        <p className="mt-1 text-slate-600">
          Well done for exploring SpareCarry Plus! Your support helps us keep
          global shipping fair and people-powered.
        </p>
      </div>

      <LifetimeMarketingBanner />

      <div className="mx-auto max-w-2xl">
        <SubscriptionCard />
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold">What is SpareCarry Pro?</h3>
              <p className="text-sm text-slate-600">
                SpareCarry Pro is a subscription that gives you 0% platform
                fees, priority placement in search results, and a verified blue
                check badge.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">
                How does priority in feed work?
              </h3>
              <p className="text-sm text-slate-600">
                Your trips and requests appear at the top of search results,
                giving you better visibility and faster matches.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Can I cancel anytime?</h3>
              <p className="text-sm text-slate-600">
                Yes! You can cancel your subscription at any time through the
                subscription management portal. Your benefits will continue
                until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">What happens if I cancel?</h3>
              <p className="text-sm text-slate-600">
                You&apos;ll continue to have Pro benefits until your current
                billing period ends. After that, standard platform fees (15-18%)
                will apply to new deliveries.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
