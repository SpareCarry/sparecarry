"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "../../../components/ui/card";
import { CheckCircle2, Loader2, Infinity } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { LifetimeThankYouModal } from "../../../components/subscription/lifetime-thank-you-modal";
import { createClient } from "../../../lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "../../../hooks/useUser";

type LifetimeProfile = {
  lifetime_active?: boolean | null;
  lifetime_purchase_at?: string | null;
};

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
  const [showLifetimeModal, setShowLifetimeModal] = useState(false);
  const supabase = createClient();

  // Use shared hook to prevent duplicate queries
  const { user } = useUser();

  const { data: profileData } = useQuery<LifetimeProfile | null>({
    queryKey: ["profile-lifetime-success", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const { data } = await supabase
          .from("profiles")
          .select("lifetime_active, lifetime_purchase_at")
          .eq("user_id", user.id)
          .single();
        return (data ?? null) as LifetimeProfile | null;
      } catch {
        return null;
      }
    },
    enabled: !!user,
    retry: false,
    throwOnError: false,
  });

  useEffect(() => {
    // Give webhook time to process
    setTimeout(() => {
      setLoading(false);
      // Check if user has lifetime (purchased just now)
      if (profileData?.lifetime_active) {
        setShowLifetimeModal(true);
      }
    }, 2000);
  }, [profileData]);

  // Show lifetime-specific success if user has lifetime
  const isLifetime = profileData?.lifetime_active;

  return (
    <>
      <LifetimeThankYouModal
        open={showLifetimeModal}
        onClose={() => {
          setShowLifetimeModal(false);
          router.push("/home");
        }}
      />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className={`${isLifetime ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
                <p className="text-slate-600">Processing your purchase...</p>
              </div>
            ) : isLifetime ? (
              <div className="text-center py-8">
                <Infinity className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Lifetime Access Activated! 🎉
                </h1>
                <p className="text-slate-600 mb-6">
                  You now have lifetime access to all Pro features:
                </p>
                <ul className="text-left space-y-2 mb-6 max-w-md mx-auto">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    <span>0% platform fees on all deliveries</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    <span>Priority placement in search results</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    <span>Verified blue check badge</span>
                  </li>
                </ul>
                <Button
                  onClick={() => router.push("/home")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue
                </Button>
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
    </>
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

