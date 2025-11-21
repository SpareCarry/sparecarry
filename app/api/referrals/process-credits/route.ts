import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { processReferralCredits } from "../../../../lib/referrals/referral-system";

// Called when a match is completed to process referral credits
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, userId } = body;

    await processReferralCredits(userId, matchId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error processing referral credits:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process referral credits" },
      { status: 500 }
    );
  }
}

