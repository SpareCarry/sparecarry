/**
 * Session Sync API Route
 * Syncs Supabase session tokens to HTTP-only cookies for server-side access
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, refreshToken } = body;

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: "Missing accessToken or refreshToken" },
        { status: 400 }
      );
    }

    // Create Supabase server client to set session cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Set the session using the provided tokens
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      console.error("[sync-session] Error setting session:", error);
      return NextResponse.json(
        { error: "Failed to sync session", details: error.message },
        { status: 500 }
      );
    }

    // Verify session was set correctly
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Session not established after sync" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Session synced successfully" });
  } catch (error: any) {
    console.error("[sync-session] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

