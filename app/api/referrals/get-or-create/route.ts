import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createReferralCode } from "@/lib/referrals/referral-system";

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user already has a referral code
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("referral_code")
      .eq("id", user.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching user:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 }
      );
    }

    // If user already has a referral code, return it
    if (userData?.referral_code) {
      return NextResponse.json({
        referralCode: userData.referral_code,
      });
    }

    // Create a new referral code
    const referralCode = await createReferralCode(user.id);

    return NextResponse.json({
      referralCode,
    });
  } catch (error: any) {
    console.error("Error in get-or-create referral code:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

