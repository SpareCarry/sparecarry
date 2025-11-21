"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "../../../components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<ProcessingState />}>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Give webhook time to process
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
              <p className="text-slate-600">Processing your subscription...</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Welcome to SpareCarry Pro!
              </h1>
              <p className="text-slate-600 mb-6">
                Your subscription is now active. You can start enjoying:
              </p>
              <ul className="text-left space-y-2 mb-6 max-w-md mx-auto">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>0% platform fees on all deliveries</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>Priority placement in search results</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>Verified blue check badge</span>
                </li>
              </ul>
              <Button
                onClick={() => router.push("/home")}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Go to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProcessingState() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
            <p className="text-slate-600">Processing your subscription...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

