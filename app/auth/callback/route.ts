import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirect") || "/home";
  
  console.log("Auth callback received:", {
    code: code ? "present" : "missing",
    redirectTo,
    url: requestUrl.toString(),
    origin: requestUrl.origin,
  });

  // Create response object for cookie handling (like middleware does)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            );
            // Update response cookies
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Error exchanging code for session:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      // Redirect to login with error message
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("error", "auth_failed");
      loginUrl.searchParams.set("message", encodeURIComponent(error.message || "Authentication failed"));
      return NextResponse.redirect(loginUrl);
    }
    
    console.log("Successfully exchanged code for session:", data?.user?.email);

    // Successfully authenticated - redirect to intended page with cookies set
    const redirectUrl = new URL(redirectTo, request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    
    // Copy all cookies from the response to the redirect response
    // This ensures session cookies are persisted
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        sameSite: cookie.sameSite as any,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge,
      });
    });
    
    return redirectResponse;
  }

  // No code provided - redirect to login
  return NextResponse.redirect(new URL("/auth/login?error=no_code", request.url));
}

