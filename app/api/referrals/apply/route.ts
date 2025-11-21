import { NextRequest, NextResponse } from "next/server";

import { applyReferralCode } from "@/lib/referrals/referral-system";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => null) as { code?: string } | null;
    const code = body?.code?.trim();

    if (!code) {
      return NextResponse.json(
        { error: "Referral code is required" },
        { status: 400 }
      );
    }

    const result = await applyReferralCode(user.id, code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to apply referral code" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      referrerId: result.referrerId ?? null,
    });
  } catch (error) {
    console.error("[referrals/apply] Failed to apply code:", error);
    return NextResponse.json(
      { error: "Failed to apply referral code" },
      { status: 500 }
    );
  }
}

