"use client";

export const dynamic = 'force-dynamic';

import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../../lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Loader2, User, Star, CreditCard, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubscriptionCard } from "../../../components/subscription/subscription-card";
import { ReferralCard } from "../../../components/referral/referral-card";
import { ErrorBoundary } from "../../../app/_components/ErrorBoundary";
import { First3DeliveriesBanner } from "../../../components/promo/First3DeliveriesBanner";
import { LifetimeMarketingBanner } from "../../../components/subscription/lifetime-marketing-banner";
import { KarmaDisplay } from "../../../components/karma/karma-display";
import { useUser } from "../../../hooks/useUser";
import { ProfileSettings } from "../../../components/profile/profile-settings";

type ProfileRecord = {
  phone?: string | null;
  bio?: string | null;
};

type UserRecord = {
  subscription_status?: string | null;
};

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  // Use shared hook to prevent duplicate queries
  const { user, isLoading: userLoading, error: userError } = useUser();

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<ProfileRecord | null>({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        
        // If profile doesn't exist, return null (user might not have created profile yet)
        if (error) {
          // PGRST116 = no rows returned (record doesn't exist)
          if (error.code === 'PGRST116' || error.message?.includes('No rows') || error.message?.includes('not found')) {
            console.log("Profile not found for user, this is OK:", user.id);
            return null;
          }
          console.warn("Error fetching profile:", error);
          // Return null instead of throwing to prevent Error Boundary from catching it
          return null;
        }
        return data as ProfileRecord;
      } catch (error: any) {
        console.warn("Exception fetching profile:", error);
        // Return null instead of throwing to prevent Error Boundary from catching it
        return null;
      }
    },
    enabled: !!user,
    retry: false, // Don't retry on error
    throwOnError: false, // Don't throw errors - let React Query handle them
  });

  const { data: userData, error: userDataError } = useQuery<UserRecord | null>({
    queryKey: ["user-data", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        
        // If user record doesn't exist, return null (user might not have record yet)
        if (error) {
          // PGRST116 = no rows returned (record doesn't exist)
          if (error.code === 'PGRST116' || error.message?.includes('No rows') || error.message?.includes('not found')) {
            console.log("User data not found, this is OK:", user.id);
            return null;
          }
          console.warn("Error fetching user data:", error);
          // Return null instead of throwing to prevent Error Boundary from catching it
          return null;
        }
        return data as UserRecord;
      } catch (error: any) {
        console.warn("Exception fetching user data:", error);
        // Return null instead of throwing to prevent Error Boundary from catching it
        return null;
      }
    },
    enabled: !!user,
    retry: false, // Don't retry on error
    throwOnError: false, // Don't throw errors - let React Query handle them
  });

  // Show loading only if actively loading (not stuck)
  if (userLoading && !userError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // Handle case where user is not authenticated
  if (!user && !userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Please log in to view your profile</p>
          <Button onClick={() => router.push("/auth/login")}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Handle query errors gracefully - log them but don't block rendering
  if (profileError || userDataError || userError) {
    console.warn("Profile page query errors:", { profileError, userDataError, userError });
    // Continue rendering - errors are handled gracefully by returning null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
      </div>

      <div className="space-y-6">
        {/* First 3 Deliveries Banner */}
        <ErrorBoundary fallback={null}>
          <First3DeliveriesBanner />
        </ErrorBoundary>

        {/* Unified Subscription Card - combines Pro and Supporter */}
        <ErrorBoundary fallback={
          <Card className="border-teal-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Star className="h-6 w-6 text-teal-600" />
                SpareCarry Pro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Subscription card unavailable</p>
            </CardContent>
          </Card>
        }>
          <LifetimeMarketingBanner />
          <SubscriptionCard />
        </ErrorBoundary>

        {/* Profile Settings */}
        <ErrorBoundary fallback={<div className="text-sm text-slate-500 p-4">Profile settings unavailable</div>}>
          <ProfileSettings />
        </ErrorBoundary>

        {/* Referral Card - wrap in error boundary */}
        <ErrorBoundary fallback={<div className="text-sm text-slate-500 p-4">Referral card unavailable</div>}>
          <ReferralCard />
        </ErrorBoundary>

        {/* Karma Points Display */}
        <ErrorBoundary fallback={<div className="text-sm text-slate-500 p-4">Karma display unavailable</div>}>
          <KarmaDisplay />
        </ErrorBoundary>

        {/* Suggest an Idea Card */}
        <ErrorBoundary fallback={<div className="text-sm text-slate-500 p-4">Idea suggestion unavailable</div>}>
          <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-teal-600" />
                Suggest an Idea
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Got an idea to make SpareCarry better? If your idea is used, you get a lifetime Pro subscription.
              </p>
              <Button
                onClick={() => router.push("/home/suggest-idea")}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Lightbulb className="mr-2 h-4 w-4" />
                Submit Idea
              </Button>
            </CardContent>
          </Card>
        </ErrorBoundary>

        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <p className="text-slate-900">{user?.email}</p>
            </div>
            {profile?.phone && (
              <div>
                <label className="text-sm font-medium text-slate-700">Phone</label>
                <p className="text-slate-900">{profile.phone}</p>
              </div>
            )}
            {profile?.bio && (
              <div>
                <label className="text-sm font-medium text-slate-700">Bio</label>
                <p className="text-slate-900">{profile.bio}</p>
              </div>
            )}
            {userData?.subscription_status === "active" && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">
                    SpareCarry Pro Active
                  </span>
                </div>
                <p className="text-sm text-green-800 mt-1">
                  Your subscription is active. Enjoy 0% platform fees and priority placement!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push("/subscription")}
            >
              <Star className="mr-2 h-4 w-4" />
              Manage Subscription
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/auth/login");
              }}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
