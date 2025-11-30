import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkProStatus } from "@/lib/pro/check-pro-status";
import { validateRouteDestinations } from "@/lib/routes/route-segments";
import type { RouteDestination } from "@/lib/routes/route-segments";

interface SavedRouteUpdate {
  name?: string;
  destinations?: RouteDestination[];
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

// PUT - Update a saved route
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: "Pro subscription required to update saved routes" },
        { status: 403 }
      );
    }

    const routeId = params.id;
    const body: SavedRouteUpdate = await request.json();

    // Verify route belongs to user
    const { data: existingRoute, error: fetchError } = await supabase
      .from("saved_routes")
      .select("user_id")
      .eq("id", routeId)
      .single();

    if (fetchError || !existingRoute) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    if (existingRoute.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate destinations if provided
    if (body.destinations) {
      const validation = validateRouteDestinations(body.destinations);
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Invalid destinations", details: validation.errors },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.destinations !== undefined)
      updateData.destinations = body.destinations;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.notification_preferences !== undefined) {
      updateData.notification_preferences = body.notification_preferences;
    }
    if (body.airport_preferences !== undefined) {
      updateData.airport_preferences = body.airport_preferences;
    }
    if (body.recurrence_pattern !== undefined) {
      updateData.recurrence_pattern = body.recurrence_pattern;
    }
    if (body.next_occurrence_date !== undefined) {
      updateData.next_occurrence_date = body.next_occurrence_date || null;
    }
    if (body.flexibility_days !== undefined) {
      updateData.flexibility_days = body.flexibility_days;
    }

    // Update route
    const { data, error } = await supabase
      .from("saved_routes")
      .update(updateData)
      .eq("id", routeId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating saved route:", error);
      return NextResponse.json(
        { error: "Failed to update saved route", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ route: data }, { status: 200 });
  } catch (error: any) {
    console.error("Exception updating saved route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a saved route
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: "Pro subscription required to delete saved routes" },
        { status: 403 }
      );
    }

    const routeId = params.id;

    // Verify route belongs to user and delete
    const { error } = await supabase
      .from("saved_routes")
      .delete()
      .eq("id", routeId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting saved route:", error);
      return NextResponse.json(
        { error: "Failed to delete saved route", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Exception deleting saved route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
