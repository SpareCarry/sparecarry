import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDevMode } from "@/config/devMode";

export async function GET(request: NextRequest) {
  try {
    // Get user info - handle dev mode
    let userIdValue: string | null = null;

    if (isDevMode()) {
      userIdValue = "dev-user-id";
    } else {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userIdValue = user.id;
    }

    const supabase = await createClient();

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // Filter by status: open, in_progress, resolved, closed

    // Build query
    let query = supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", userIdValue)
      .order("created_at", { ascending: false });

    // Apply status filter if provided
    if (
      status &&
      ["open", "in_progress", "resolved", "closed"].includes(status)
    ) {
      query = query.eq("status", status);
    }

    const { data: tickets, error } = await query;

    if (error) {
      console.error("[Support] Error fetching tickets:", error);
      return NextResponse.json(
        { error: "Failed to fetch tickets" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tickets: tickets || [] });
  } catch (error: any) {
    console.error("[API] Error fetching tickets:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}
