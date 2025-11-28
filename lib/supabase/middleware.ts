import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDevMode } from "@/config/devMode";

export async function updateSession(request: NextRequest) {
  // Dev mode: Skip authentication checks
  if (isDevMode()) {
    return NextResponse.next({ request });
  }
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      } as any, // Type assertion for Next.js 14 compatibility
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow public access to marketing pages, auth pages, onboarding, and API routes
  const publicPaths = ["/", "/privacy", "/terms", "/login", "/auth", "/onboarding", "/api"];
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Only redirect to login if not on a public path and user is not authenticated
  // You can customize this logic based on your auth requirements
  if (!user && !isPublicPath) {
    // Optional: redirect to login for protected routes
    // Uncomment if you want to protect all routes except public ones
    // const url = request.nextUrl.clone();
    // url.pathname = "/login";
    // return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to get out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse;
}

