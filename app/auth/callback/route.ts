import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirect") || "/home";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Error exchanging code for session:", error);
      // Still redirect, but to home instead of the redirect URL
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  // Redirect to the specified page or home
  return NextResponse.redirect(new URL(redirectTo, request.url));
}

