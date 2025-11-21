import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

type LeaderboardEntry = {
  userId: string;
  displayName: string;
  count: number;
};

export async function GET() {
  try {
    const supabase = createServiceRoleClient();

    const { data: referrals, error } = await supabase
      .from("referrals")
      .select("referrer_id")
      .limit(1000);

    if (error) {
      throw error;
    }

    if (!referrals || referrals.length === 0) {
      return NextResponse.json<LeaderboardEntry[]>([]);
    }

    const counts = new Map<string, number>();
    for (const row of referrals) {
      if (!row.referrer_id) continue;
      counts.set(row.referrer_id, (counts.get(row.referrer_id) ?? 0) + 1);
    }

    const topIds = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    if (topIds.length === 0) {
      return NextResponse.json<LeaderboardEntry[]>([]);
    }

    const [{ data: users }, { data: profiles }] = await Promise.all([
      supabase
        .from("users")
        .select("id, email")
        .in("id", topIds),
      supabase
        .from("profiles")
        .select("user_id, boat_name")
        .in("user_id", topIds),
    ]);

    const profileMap = new Map<string, string>();
    profiles?.forEach((profile) => {
      if (profile?.user_id && profile.boat_name) {
        profileMap.set(profile.user_id, profile.boat_name);
      }
    });

    const leaderboard = (users ?? [])
      .map<LeaderboardEntry>((user) => {
        const fallback =
          user.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "_") || "User";
        const displayName = profileMap.get(user.id) ?? fallback;
        return {
          userId: user.id,
          displayName:
            displayName.length > 25
              ? `${displayName.slice(0, 25)}…`
              : displayName,
          count: counts.get(user.id) ?? 0,
        };
      })
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(leaderboard);
  } catch (error: any) {
    // If the referrals table hasn't been provisioned yet, return an empty list
    if (
      typeof error?.message === "string" &&
      error.message.toLowerCase().includes("referrals")
    ) {
      console.warn("[referrals/leaderboard] referrals table missing:", error);
      return NextResponse.json<LeaderboardEntry[]>([]);
    }

    console.error("[referrals/leaderboard] Failed to load leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to load referral leaderboard" },
      { status: 500 }
    );
  }
}

