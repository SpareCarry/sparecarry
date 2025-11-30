"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Trophy, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  count: number;
}

export function ReferralLeaderboard() {
  const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["referral-leaderboard"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/referrals/leaderboard", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!response.ok) {
          console.warn("Error loading leaderboard:", response.status);
          return []; // Return empty array instead of throwing
        }

        return (await response.json()) as LeaderboardEntry[];
      } catch (error) {
        console.warn("Exception loading leaderboard:", error);
        return []; // Return empty array instead of throwing
      }
    },
    retry: false,
    throwOnError: false, // Don't throw errors
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
              className="flex items-center justify-between rounded-md bg-slate-50 p-2"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 text-sm font-medium text-slate-500">
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
        <p className="mt-3 text-center text-xs text-slate-500">
          Bragging rights only • No prizes • Updated in real-time
        </p>
      </CardContent>
    </Card>
  );
}
