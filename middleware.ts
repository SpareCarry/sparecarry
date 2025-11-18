import createMiddleware from "next-intl/middleware";
import { createClient } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const publicPaths = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/callback",
  "/onboarding",
  "/privacy",
  "/terms",
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle internationalization
  const response = intlMiddleware(request);

  // Check if path requires authentication
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (!isPublicPath && !pathname.startsWith("/api")) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    // Check if user needs onboarding
    if (user && !pathname.startsWith("/onboarding")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_identity_verified_at")
        .eq("user_id", user.id)
        .single();

      if (!profile?.stripe_identity_verified_at) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/(es|fr|en)/:path*",
  ],
};
