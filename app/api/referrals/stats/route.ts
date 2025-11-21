import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getReferralStats } from "@/lib/referrals/referral-system";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getReferralStats(user.id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[referrals/stats] Failed to fetch stats:", error);
    return NextResponse.json(
      { error: "Failed to load referral stats" },
      { status: 500 }
    );
  }
}

