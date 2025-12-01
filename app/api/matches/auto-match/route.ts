import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDevMode } from "@/config/devMode";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id } = body;

    if (!type || !id) {
      return NextResponse.json(
        { error: "type and id are required" },
        { status: 400 }
      );
    }

    if (type !== "trip" && type !== "request") {
      return NextResponse.json(
        { error: "type must be 'trip' or 'request'" },
        { status: 400 }
      );
    }

    // Get user - handle dev mode
    let user: { id: string } | null = null;

    if (isDevMode()) {
      user = { id: "dev-user-id" };
    } else {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      user = { id: authUser.id };
    }

    const supabase = await createClient();

    if (type === "trip") {
      // Find matching requests for this trip
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .select("*")
        .eq("id", id)
        .single();

      if (tripError || !trip) {
        return NextResponse.json(
          { error: "Trip not found" },
          { status: 404 }
        );
      }

      // Find matching requests
      const { data: requests, error: requestsError } = await supabase
        .from("requests")
        .select("*")
        .eq("status", "open")
        .or(
          `preferred_method.eq.${trip.type},preferred_method.eq.any`
        )
        .lte("weight_kg", trip.spare_kg)
        .eq("from_location", trip.from_location)
        .eq("to_location", trip.to_location);

      if (requestsError) {
        console.error("Error fetching requests:", requestsError);
        return NextResponse.json(
          { error: "Failed to fetch matching requests" },
          { status: 500 }
        );
      }

      // Create matches for each compatible request
      const matches = [];
      for (const req of requests || []) {
        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from("matches")
          .select("id")
          .eq("trip_id", id)
          .eq("request_id", req.id)
          .single();

        if (existingMatch) {
          continue; // Match already exists
        }

        // Create new match
        const { data: newMatch, error: matchError } = await supabase
          .from("matches")
          .insert({
            trip_id: id,
            request_id: req.id,
            status: "pending",
            reward_amount: req.max_reward,
          })
          .select()
          .single();

        if (matchError) {
          console.error("Error creating match:", matchError);
          continue;
        }

        matches.push(newMatch);
      }

      return NextResponse.json({
        success: true,
        matchesCreated: matches.length,
        matches,
      });
    } else {
      // type === "request"
      // Find matching trips for this request
      const { data: request, error: requestError } = await supabase
        .from("requests")
        .select("*")
        .eq("id", id)
        .single();

      if (requestError || !request) {
        return NextResponse.json(
          { error: "Request not found" },
          { status: 404 }
        );
      }

      // Find matching trips
      const { data: trips, error: tripsError } = await supabase
        .from("trips")
        .select("*")
        .eq("status", "active")
        .or(
          `type.eq.${request.preferred_method},type.eq.any`
        )
        .gte("spare_kg", request.weight_kg)
        .eq("from_location", request.from_location)
        .eq("to_location", request.to_location);

      if (tripsError) {
        console.error("Error fetching trips:", tripsError);
        return NextResponse.json(
          { error: "Failed to fetch matching trips" },
          { status: 500 }
        );
      }

      // Create matches for each compatible trip
      const matches = [];
      for (const trip of trips || []) {
        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from("matches")
          .select("id")
          .eq("trip_id", trip.id)
          .eq("request_id", id)
          .single();

        if (existingMatch) {
          continue; // Match already exists
        }

        // Create new match
        const { data: newMatch, error: matchError } = await supabase
          .from("matches")
          .insert({
            trip_id: trip.id,
            request_id: id,
            status: "pending",
            reward_amount: request.max_reward,
          })
          .select()
          .single();

        if (matchError) {
          console.error("Error creating match:", matchError);
          continue;
        }

        matches.push(newMatch);
      }

      return NextResponse.json({
        success: true,
        matchesCreated: matches.length,
        matches,
      });
    }
  } catch (error) {
    console.error("Error in auto-match:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create matches",
      },
      { status: 500 }
    );
  }
}

