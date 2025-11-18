"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function ReferralLeaderboard() {
  const supabase = createClient();

  const { data: leaderboard } = useQuery({
    queryKey: ["referral-leaderboard"],
    queryFn: async () => {
      // Get top referrers by total referrals
      const { data: referrals } = await supabase
        .from("referrals")
        .select("referrer_id")
        .limit(100);

      if (!referrals) return [];

      // Count referrals per referrer
      const referralCounts = new Map<string, number>();
      referrals.forEach((r) => {
        const count = referralCounts.get(r.referrer_id) || 0;
        referralCounts.set(r.referrer_id, count + 1);
      });

      // Get user profiles for top referrers
      const topReferrerIds = Array.from(referralCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId]) => userId);

      if (topReferrerIds.length === 0) return [];

      const { data: users } = await supabase
        .from("users")
        .select("id, email, profiles(boat_name)")
        .in("id", topReferrerIds);

      if (!users) return [];

      // Map to leaderboard entries
      return users
        .map((user) => {
          const profile = Array.isArray(user.profiles) ? user.profiles[0] : user.profiles;
          const displayName = profile?.boat_name || 
            user.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "_") || 
            "User";
          
          return {
            userId: user.id,
            displayName: displayName.length > 25 ? displayName.slice(0, 25) + "..." : displayName,
            count: referralCounts.get(user.id) || 0,
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
  });

  if (!leaderboard || leaderboard.length === 0) {
    return null;
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-amber-500" />
          Referral Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.userId}
              className="flex items-center justify-between p-2 rounded-md bg-slate-50"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500 w-6">
                  #{index + 1}
                </span>
                <span className="text-sm font-medium text-slate-900">
                  {entry.displayName}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600">
                  {entry.count} referral{entry.count !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3 text-center">
          Bragging rights only • No prizes • Updated in real-time
        </p>
      </CardContent>
    </Card>
  );
}

