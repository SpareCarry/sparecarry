"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "../../../components/ui/card";
import { CheckCircle2, Anchor } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { SupporterBadge } from "../../../components/badges/supporter-badge";

export default function SupporterSuccessPage() {
  return (
    <Suspense fallback={<SupporterProcessingState />}>
      <SupporterSuccessContent />
    </Suspense>
  );
}

function SupporterSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      // Verify payment and update user status
      fetch("/api/supporter/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then(() => {
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error verifying payment:", error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-teal-50 to-white p-4">
      <Card className="w-full max-w-md border-blue-200 shadow-xl">
        <CardContent className="p-8 text-center">
          {loading ? (
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <p className="text-slate-600">Verifying your payment...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-teal-600">
                  <CheckCircle2 className="h-12 w-12 text-white" />
                </div>
              </div>
              <div>
                <h1 className="mb-2 text-3xl font-bold text-slate-900">
                  Welcome, Supporter!
                </h1>
                <div className="mb-4 flex justify-center">
                  <SupporterBadge size="lg" />
                </div>
                <p className="text-slate-600">
                  Thank you for supporting SpareCarry. Your exclusive benefits
                  are now active!
                </p>
              </div>
              <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
                <p className="font-semibold text-blue-900">Your Benefits:</p>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>✓ 0% platform fees forever</li>
                  <li>✓ Blue anchor badge + Supporter title</li>
                  <li>✓ Priority listing in feed</li>
                  <li>✓ Dark mode toggle (early access)</li>
                  <li>✓ Name in Hall of Fame</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => router.push("/home")}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                >
                  Go to Feed
                </Button>
                <Button
                  onClick={() => router.push("/hall-of-fame")}
                  variant="outline"
                  className="flex-1"
                >
                  View Hall of Fame
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SupporterProcessingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-teal-50 to-white p-4">
      <Card className="w-full max-w-md border-blue-200 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-slate-600">Verifying your payment...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
