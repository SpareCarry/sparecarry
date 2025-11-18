import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const supabase = await createClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Check if user needs onboarding
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Check if profile exists and is complete
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone, stripe_identity_verified_at")
      .eq("user_id", user.id)
      .single();

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    // Redirect to onboarding if incomplete
    if (!profile?.phone || !profile?.stripe_identity_verified_at || !userData?.role) {
      return NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL("/", requestUrl.origin));
}

