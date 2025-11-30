"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "../../../components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";
import { Button } from "../../../components/ui/button";

export function ReferralLandingPageClient() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const supabase = createClient();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
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

        const response = await fetch("/api/referrals/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Failed to apply referral code");
        }

        setStatus("success");
        setMessage(
          "Referral code applied! You'll both earn 2,000 Karma Points after your first paid delivery."
        );
        setTimeout(() => {
          router.push("/home");
        }, 3000);
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {status === "loading" && (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-teal-600" />
              <p className="text-slate-600">Applying referral code...</p>
            </div>
          )}

          {status === "success" && (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-600" />
              <h1 className="mb-2 text-2xl font-bold text-slate-900">
                Referral Code Applied!
              </h1>
              <p className="mb-6 text-slate-600">{message}</p>
              <Button
                onClick={() => router.push("/home")}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Go to Home
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="py-8 text-center">
              <p className="mb-4 text-red-600">{message}</p>
              <Button onClick={() => router.push("/home")} variant="outline">
                Go to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
