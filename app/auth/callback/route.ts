import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const codeVerifier = requestUrl.searchParams.get("code_verifier");
  const redirectTo = requestUrl.searchParams.get("redirect") || "/home";
  
  console.log("Auth callback received:", {
    code: code ? "present" : "missing",
    codeVerifier: codeVerifier ? "present" : "missing",
    redirectTo,
    url: requestUrl.toString(),
    origin: requestUrl.origin,
    host: requestUrl.host,
    port: requestUrl.port || (requestUrl.protocol === "https:" ? "443" : "80"),
    allParams: Object.fromEntries(requestUrl.searchParams),
  });

  // Create response object for cookie handling (like middleware does)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (code) {
    // IMPORTANT: Read all cookies FIRST to force Next.js to read them
    // This is critical for PKCE flow - the code verifier might be in cookies
    // In Next.js 14+, cookies are lazy-loaded, so we must read them first
    const allCookies = request.cookies.getAll();
    console.log("All cookies:", allCookies.map((c) => c.name));
    
    // Check for code verifier in cookies (Supabase stores it with various names)
    const codeVerifierFromCookie = allCookies.find(
      (cookie) => 
        cookie.name.includes("code-verifier") || 
        cookie.name.includes("pkce") ||
        cookie.name.includes("verifier")
    )?.value;

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

    // Try code verifier from URL first, then from cookies
    const finalCodeVerifier = codeVerifier || codeVerifierFromCookie;

    console.log("Code verifier sources:", {
      fromUrl: !!codeVerifier,
      fromCookie: !!codeVerifierFromCookie,
      final: !!finalCodeVerifier,
      cookieNames: allCookies.map((c) => c.name),
    });

    // Exchange code for session
    let exchangeResult;
    if (finalCodeVerifier) {
      // PKCE flow - exchange with code verifier
      console.log("Using PKCE flow with code verifier");
      exchangeResult = await supabase.auth.exchangeCodeForSession({
        authCode: code,
        codeVerifier: finalCodeVerifier,
      });
    } else {
      // Try regular code exchange (might work if PKCE is disabled)
      console.log("Attempting regular code exchange (no code verifier found)");
      
      try {
        exchangeResult = await supabase.auth.exchangeCodeForSession(code);
      } catch (e: any) {
        // If regular exchange fails with PKCE error, provide helpful message
        if (e?.message?.includes("code verifier") || e?.message?.includes("code_verifier")) {
          console.error("PKCE required but no code verifier found");
          console.error("Available cookies:", allCookies.map((c) => c.name));
          console.error("Error:", e.message);
          throw new Error(
            "Authentication failed: Code verifier missing. " +
            "Please request a new magic link and click it in the same browser session where you requested it."
          );
        }
        throw e;
      }
    }
    
    const { data, error } = exchangeResult;
    
    if (error) {
      console.error("Error exchanging code for session:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      console.error("Code present:", !!code);
      console.error("Code verifier present:", !!codeVerifier);
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

