import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// This runs when a new trip or request is created
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { type, id } = body; // type: "trip" | "request", id: trip_id or request_id

    if (type === "trip") {
      // Find matching requests
      const { data: trip } = await supabase
        .from("trips")
        .select("*")
        .eq("id", id)
        .single();

      if (!trip) {
        return NextResponse.json({ error: "Trip not found" }, { status: 404 });
      }

      // Find matching requests
      const { data: requests } = await supabase
        .from("requests")
        .select("*")
        .eq("status", "open")
        .eq("from_location", trip.from_location)
        .eq("to_location", trip.to_location)
        .gte("deadline_latest", trip.eta_window_start)
        .lte("deadline_earliest", trip.eta_window_end)
        .lte("weight_kg", trip.spare_kg)
        .or(
          `preferred_method.eq.${trip.type},preferred_method.eq.any`
        );

      // Create matches for each matching request
      for (const req of requests || []) {
        // Check if match already exists
        const { data: existing } = await supabase
          .from("matches")
          .select("id")
          .eq("trip_id", id)
          .eq("request_id", req.id)
          .single();

        if (!existing) {
          await supabase.from("matches").insert({
            trip_id: id,
            request_id: req.id,
            status: "pending",
            reward_amount: req.max_reward,
          });

          // TODO: Send notification and email
        }
      }
    } else if (type === "request") {
      // Find matching trips
      const { data: request } = await supabase
        .from("requests")
        .select("*")
        .eq("id", id)
        .single();

      if (!request) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 });
      }

      // Find matching trips
      const { data: trips } = await supabase
        .from("trips")
        .select("*")
        .eq("status", "active")
        .eq("from_location", request.from_location)
        .eq("to_location", request.to_location)
        .gte("eta_window_start", request.deadline_earliest || "1970-01-01")
        .lte("eta_window_end", request.deadline_latest)
        .gte("spare_kg", request.weight_kg)
        .or(
          `type.eq.${request.preferred_method},preferred_method.eq.any`
        );

      // Create matches for each matching trip
      for (const trip of trips || []) {
        // Check if match already exists
        const { data: existing } = await supabase
          .from("matches")
          .select("id")
          .eq("trip_id", trip.id)
          .eq("request_id", id)
          .single();

        if (!existing) {
          await supabase.from("matches").insert({
            trip_id: trip.id,
            request_id: id,
            status: "pending",
            reward_amount: request.max_reward,
          });

          // TODO: Send notification and email
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error auto-matching:", error);
    return NextResponse.json(
      { error: error.message || "Failed to auto-match" },
      { status: 500 }
    );
  }
}

