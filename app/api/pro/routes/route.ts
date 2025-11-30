import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkProStatus } from "@/lib/pro/check-pro-status";
import { validateRouteDestinations } from "@/lib/routes/route-segments";
import type { RouteDestination } from "@/lib/routes/route-segments";

interface SavedRouteCreate {
  name: string;
  type: "boat" | "plane";
  destinations: RouteDestination[];
  is_active?: boolean;
  notification_preferences?: {
    min_reward?: number;
    max_weight?: number;
    categories?: string[];
    enabled?: boolean;
  };
  airport_preferences?: Record<string, string[]>;
  recurrence_pattern?: "one_time" | "monthly" | "quarterly" | "custom";
  next_occurrence_date?: string;
  flexibility_days?: number;
}

// POST - Create a new saved route
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check Pro status
    const proStatus = await checkProStatus(user.id, supabase);
    if (!proStatus.hasPro) {
      return NextResponse.json(
        { error: "Pro subscription required to save routes" },
        { status: 403 }
      );
    }

    const body: SavedRouteCreate = await request.json();
    const {
      name,
      type,
      destinations,
      is_active = true,
      notification_preferences = {},
      airport_preferences,
      recurrence_pattern = "one_time",
      next_occurrence_date,
      flexibility_days = 3,
    } = body;

    // Validate input
    if (!name || !type || !destinations || destinations.length < 2) {
      return NextResponse.json(
        { error: "Route name, type, and at least 2 destinations are required" },
        { status: 400 }
      );
    }

    // Validate destinations
    const validation = validateRouteDestinations(destinations);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Invalid destinations", details: validation.errors },
        { status: 400 }
      );
    }

    // Insert saved route
    const { data, error } = await supabase
      .from("saved_routes")
      .insert({
        user_id: user.id,
        name,
        type,
        destinations: destinations as any,
        is_active,
        notification_preferences: notification_preferences as any,
        airport_preferences: airport_preferences as any,
        recurrence_pattern,
        next_occurrence_date: next_occurrence_date || null,
        flexibility_days,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating saved route:", error);
      return NextResponse.json(
        { error: "Failed to create saved route", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ route: data }, { status: 201 });
  } catch (error: any) {
    console.error("Exception creating saved route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// GET - List user's saved routes
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check Pro status
    const proStatus = await checkProStatus(user.id, supabase);
    if (!proStatus.hasPro) {
      return NextResponse.json(
        { error: "Pro subscription required to view saved routes" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active_only") === "true";

    let query = supabase
      .from("saved_routes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching saved routes:", error);
      return NextResponse.json(
        { error: "Failed to fetch saved routes", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ routes: data || [] }, { status: 200 });
  } catch (error: any) {
    console.error("Exception fetching saved routes:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
