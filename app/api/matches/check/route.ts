import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { tripId, requestId } = body;

    // Get trip and request details
    const { data: trip } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single();

    const { data: request } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (!trip || !request) {
      return NextResponse.json({ error: "Trip or request not found" }, { status: 404 });
    }

    // Check route match
    const routeMatch =
      trip.from_location.toLowerCase() === request.from_location.toLowerCase() &&
      trip.to_location.toLowerCase() === request.to_location.toLowerCase();

    // Check date overlap
    let dateOverlap = false;
    if (trip.type === "plane" && trip.departure_date) {
      const tripDate = new Date(trip.departure_date);
      const requestDeadline = new Date(request.deadline_latest);
      dateOverlap = tripDate <= requestDeadline;
    } else if (trip.type === "boat") {
      const tripStart = new Date(trip.eta_window_start);
      const tripEnd = new Date(trip.eta_window_end);
      const requestDeadline = new Date(request.deadline_latest);
      dateOverlap = tripEnd >= new Date(request.deadline_earliest || 0) && tripStart <= requestDeadline;
    }

    // Check capacity fit
    const capacityFit = trip.spare_kg >= request.weight_kg;

    // Check preferred method
    const methodMatch =
      request.preferred_method === "any" ||
      request.preferred_method === trip.type;

    const isMatch = routeMatch && dateOverlap && capacityFit && methodMatch;

    return NextResponse.json({
      isMatch,
      checks: {
        routeMatch,
        dateOverlap,
        capacityFit,
        methodMatch,
      },
    });
  } catch (error: any) {
    console.error("Error checking match:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check match" },
      { status: 500 }
    );
  }
}

