import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processRequestForRouteMatching } from "@/lib/routes/route-matching";

/**
 * API endpoint to manually trigger route matching for a request
 * This can be called when a request is created, or scheduled via cron
 *
 * POST /api/pro/routes/match-request
 * Body: { requestId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: "requestId is required" },
        { status: 400 }
      );
    }

    // Use service role client to access all routes
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey) as any;

    // Process the request for route matching
    await processRequestForRouteMatching(requestId, supabaseAdmin);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Exception in route matching endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
