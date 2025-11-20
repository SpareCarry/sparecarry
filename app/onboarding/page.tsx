"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Steps } from "../../components/ui/steps";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { createClient } from "../../lib/supabase/client";
import { Phone, CreditCard, Ship, User, Loader2 } from "lucide-react";
import { OnboardingStep1 } from "../../components/onboarding/step-1-phone";
import { OnboardingStep2 } from "../../components/onboarding/step-2-stripe";
import { OnboardingStep3 } from "../../components/onboarding/step-3-sailor";
import { OnboardingStep4 } from "../../components/onboarding/step-4-role";

const onboardingSteps = [
  {
    title: "Phone Verification",
    description: "Verify your phone number",
    icon: Phone,
  },
  {
    title: "Identity Verification",
    description: "Verify with Stripe ($1.50)",
    icon: CreditCard,
  },
  {
    title: "Sailor Info",
    description: "Optional boat verification",
    icon: Ship,
  },
  {
    title: "Choose Role",
    description: "Select your primary role",
    icon: User,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push("/auth/login");
        return;
      }

      setUser(currentUser);
      setLoading(false);

      // Check onboarding progress
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, stripe_identity_verified_at")
        .eq("user_id", currentUser.id)
        .single();

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", currentUser.id)
        .single();

      if (profile?.phone && profile?.stripe_identity_verified_at && userData?.role) {
        router.push("/");
        return;
      }

      // Determine current step
      if (!profile?.phone) {
        setCurrentStep(1);
      } else if (!profile?.stripe_identity_verified_at) {
        setCurrentStep(2);
      } else if (!userData?.role) {
        // Check if sailor info is needed
        const { data: sailorProfile } = await supabase
          .from("profiles")
          .select("boat_name, verified_sailor_at")
          .eq("user_id", currentUser.id)
          .single();

        // If user might be a sailor but hasn't completed step 3
        if (userData?.role === "sailor" && !sailorProfile?.boat_name) {
          setCurrentStep(3);
        } else {
          setCurrentStep(4);
        }
      } else {
        setCurrentStep(4);
      }
    };

    checkUser();
  }, [router, supabase]);

  const handleStepComplete = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-200 via-teal-300 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-teal-300 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 text-center">
            Welcome to CarrySpace
          </h1>
          <p className="text-white/90 text-center">Let&apos;s get you set up</p>
        </div>

        <Card className="mb-8 bg-white/95 backdrop-blur">
          <CardContent className="pt-6">
            <Steps
              currentStep={currentStep}
              steps={onboardingSteps.map((step) => ({
                title: step.title,
                description: step.description,
              }))}
            />
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const Icon = onboardingSteps[currentStep - 1].icon;
                return <Icon className="h-6 w-6 text-teal-600" />;
              })()}
              {onboardingSteps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>{onboardingSteps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && <OnboardingStep1 onComplete={handleStepComplete} />}
            {currentStep === 2 && <OnboardingStep2 onComplete={handleStepComplete} />}
            {currentStep === 3 && <OnboardingStep3 onComplete={handleStepComplete} />}
            {currentStep === 4 && <OnboardingStep4 onComplete={handleStepComplete} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

