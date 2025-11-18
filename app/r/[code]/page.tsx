"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { applyReferralCode } from "@/lib/referrals/referral-system";
import { Button } from "@/components/ui/button";

export default function ReferralLandingPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const supabase = createClient();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function applyCode() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // Redirect to signup with referral code
          router.push(`/auth/signup?ref=${code}`);
          return;
        }

        const result = await applyReferralCode(user.id, code);

        if (result.success) {
          setStatus("success");
          setMessage("Referral code applied! You'll both earn $35 credit after your first delivery.");
          setTimeout(() => {
            router.push("/home");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(result.error || "Failed to apply referral code");
        }
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "An error occurred");
      }
    }

    if (code) {
      applyCode();
    }
  }, [code, router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          {status === "loading" && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
              <p className="text-slate-600">Applying referral code...</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Referral Code Applied!
              </h1>
              <p className="text-slate-600 mb-6">{message}</p>
              <Button
                onClick={() => router.push("/home")}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Go to Home
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{message}</p>
              <Button
                onClick={() => router.push("/home")}
                variant="outline"
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

