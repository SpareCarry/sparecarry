"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Steps } from "../../components/ui/steps";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { createClient } from "../../lib/supabase/client";
import { Phone, CreditCard, Ship, User, Loader2 } from "lucide-react";
import { OnboardingStep1 } from "../../components/onboarding/step-1-phone";
import { OnboardingStep2 } from "../../components/onboarding/step-2-stripe";
import { OnboardingStep3 } from "../../components/onboarding/step-3-sailor";
import { OnboardingStep4 } from "../../components/onboarding/step-4-role";
import { LifetimeOfferScreen } from "../../components/onboarding/lifetime-offer-screen";
import { isTestMode, getTestUser } from "../../lib/test/testAuthBypass";

type ProfileMeta = {
  phone?: string | null;
  stripe_identity_verified_at?: string | null;
};

type UserMeta = {
  role?: string | null;
  lifetime_pro?: boolean | null;
};

type SailorProfileMeta = {
  boat_name?: string | null;
  verified_sailor_at?: string | null;
};

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
    title: "Tell Us About Your Boat",
    description: "Add your boat details for verified sailor status",
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
  const [showLifetimeOffer, setShowLifetimeOffer] = useState(false);
  const [hasLifetime, setHasLifetime] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      // TEST MODE: Check for test user in window (set by Playwright)
      let currentUser = null;
      if (isTestMode()) {
        currentUser = getTestUser();
        console.log(
          "[TEST_MODE] ✓✓✓ Onboarding page using test user:",
          currentUser?.email
        );
      } else {
        const {
          data: { user: realUser },
        } = await supabase.auth.getUser();
        currentUser = realUser;
      }

      if (!currentUser) {
        router.push("/auth/login");
        return;
      }

      setUser(currentUser);
      setLoading(false);

      // Check onboarding progress
      const { data: profileData } = await supabase
        .from("profiles")
        .select("phone, stripe_identity_verified_at")
        .eq("user_id", currentUser.id)
        .single();
      const profile = (profileData ?? null) as ProfileMeta | null;

      const { data: userDataRaw } = await supabase
        .from("users")
        .select("role, lifetime_pro")
        .eq("id", currentUser.id)
        .single();
      const userData = (userDataRaw ?? null) as UserMeta | null;

      // Check if user has lifetime access
      const hasLifetimeAccess = userData?.lifetime_pro === true;
      if (hasLifetimeAccess) {
        setHasLifetime(true);
      }

      // If onboarding is complete, check if we should show lifetime offer
      if (
        profile?.phone &&
        profile?.stripe_identity_verified_at &&
        userData?.role
      ) {
        // Only show lifetime offer if:
        // 1. User doesn't have lifetime
        // 2. User just completed onboarding (check if user was created recently)
        const userCreatedAt = new Date(currentUser.created_at);
        const isNewUser = Date.now() - userCreatedAt.getTime() < 5 * 60 * 1000; // Within 5 minutes

        if (!hasLifetimeAccess && isNewUser) {
          setShowLifetimeOffer(true);
        } else {
          router.push("/");
        }
        return;
      }

      // Determine current step
      if (!profile?.phone) {
        setCurrentStep(1);
      } else if (!profile?.stripe_identity_verified_at) {
        setCurrentStep(2);
      } else if (!userData?.role) {
        // Check if sailor info is needed
        const { data: sailorProfileData } = await supabase
          .from("profiles")
          .select("boat_name, verified_sailor_at")
          .eq("user_id", currentUser.id)
          .single();
        const sailorProfile = (sailorProfileData ??
          null) as SailorProfileMeta | null;

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
  }, [router, supabase, hasLifetime]);

  const handleStepComplete = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Step 4 completed - check if we should show lifetime offer
      // Check user data again to see if they have lifetime
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (currentUser) {
          const { data: userDataRaw } = await supabase
            .from("users")
            .select("lifetime_pro")
            .eq("id", currentUser.id)
            .single();
          const userData = (userDataRaw ?? null) as UserMeta | null;

          const userCreatedAt = new Date(currentUser.created_at);
          const isNewUser =
            Date.now() - userCreatedAt.getTime() < 5 * 60 * 1000; // Within 5 minutes

          // Only show lifetime offer if user is new and doesn't have lifetime
          if (!userData?.lifetime_pro && isNewUser) {
            setShowLifetimeOffer(true);
          } else {
            router.push("/");
          }
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking lifetime status:", error);
        router.push("/");
      }
    }
  };

  const handleLifetimeSkip = () => {
    setShowLifetimeOffer(false);
    router.push("/");
  };

  const handleLifetimeComplete = () => {
    // User purchased lifetime - webhook will handle the update
    // For now, just redirect (webhook will set lifetime_pro)
    setShowLifetimeOffer(false);
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-200 via-teal-300 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // Show lifetime offer screen if applicable
  if (showLifetimeOffer) {
    return (
      <LifetimeOfferScreen
        onSkip={handleLifetimeSkip}
        onComplete={handleLifetimeComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-teal-300 to-slate-900 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-center text-4xl font-bold text-white">
            Welcome to CarrySpace
          </h1>
          <p className="text-center text-white/90">Let&apos;s get you set up</p>
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
            <CardDescription>
              {onboardingSteps[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <OnboardingStep1 onComplete={handleStepComplete} />
            )}
            {currentStep === 2 && (
              <OnboardingStep2 onComplete={handleStepComplete} />
            )}
            {currentStep === 3 && (
              <OnboardingStep3 onComplete={handleStepComplete} />
            )}
            {currentStep === 4 && (
              <OnboardingStep4 onComplete={handleStepComplete} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
