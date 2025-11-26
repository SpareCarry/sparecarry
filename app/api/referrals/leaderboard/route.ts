import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  count: number;
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user (optional - leaderboard can be public)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Query referrals grouped by referrer_id with counts
    // Join with profiles to get display names
    const { data: referrals, error: referralsError } = await supabase
      .from("referrals")
      .select("referrer_id, profiles!referrals_referrer_id_fkey(display_name, user_id)")
      .order("created_at", { ascending: false });

    if (referralsError) {
      console.error("Error fetching referrals:", referralsError);
      return NextResponse.json(
        { error: "Failed to fetch leaderboard data" },
        { status: 500 }
      );
    }

    // Group by referrer_id and count
    const referralCounts = new Map<string, { count: number; displayName: string }>();
    
    for (const referral of referrals || []) {
      const referrerId = referral.referrer_id as string;
      // Supabase returns joined relations as arrays; take the first profile if present
      const profiles = referral.profiles as unknown as { display_name?: string; user_id: string }[] | null;
      const profile = profiles?.[0] ?? null;
      const displayName = profile?.display_name || "Anonymous";
      
      if (!referralCounts.has(referrerId)) {
        referralCounts.set(referrerId, { count: 0, displayName });
      }
      
      const entry = referralCounts.get(referrerId)!;
      entry.count += 1;
    }

    // Convert to array and sort by count (descending)
    const leaderboard: LeaderboardEntry[] = Array.from(referralCounts.entries())
      .map(([userId, { count, displayName }]) => ({
        userId,
        displayName,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    return NextResponse.json(leaderboard);
  } catch (error: any) {
    console.error("Error in leaderboard API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

