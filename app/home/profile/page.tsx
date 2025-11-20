"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../../lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Loader2, User, Star, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubscriptionCard } from "../../../components/subscription/subscription-card";
import { SupporterCard } from "../../../components/supporter/supporter-card";
import { ReferralCard } from "../../../components/referral/referral-card";

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: userData } = useQuery({
    queryKey: ["user-data", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (userLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
      </div>

      <div className="space-y-6">
        {/* Supporter Card */}
        <SupporterCard />

        {/* Referral Card */}
        <ReferralCard />

        {/* Subscription Card */}
        <SubscriptionCard />

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
