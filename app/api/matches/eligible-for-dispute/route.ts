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

    // First, get all matches where user is involved (as requester or traveler)
    // We need to query trips and requests separately, then get their matches
    const [tripsResult, requestsResult] = await Promise.all([
      supabase.from("trips").select("id").eq("user_id", userIdValue),
      supabase.from("requests").select("id").eq("user_id", userIdValue),
    ]);

    const tripIds = (tripsResult.data || []).map((t) => t.id);
    const requestIds = (requestsResult.data || []).map((r) => r.id);

    if (tripIds.length === 0 && requestIds.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Build query for matches
    let matchesQuery = supabase
      .from("matches")
      .select(
        `
        id,
        status,
        reward_amount,
        created_at,
        trip_id,
        request_id,
        trips!matches_trip_id_fkey(
          id,
          from_location,
          to_location,
          type,
          departure_date,
          user_id,
          users!trips_user_id_fkey(
            id,
            email
          )
        ),
        requests!matches_request_id_fkey(
          id,
          title,
          from_location,
          to_location,
          user_id,
          users!requests_user_id_fkey(
            id,
            email
          )
        )
      `
      )
      .in("status", ["chatting", "escrow_paid", "delivered"]);

    // Filter by trip_id or request_id
    if (tripIds.length > 0 && requestIds.length > 0) {
      matchesQuery = matchesQuery.or(
        `trip_id.in.(${tripIds.join(",")}),request_id.in.(${requestIds.join(",")})`
      );
    } else if (tripIds.length > 0) {
      matchesQuery = matchesQuery.in("trip_id", tripIds);
    } else if (requestIds.length > 0) {
      matchesQuery = matchesQuery.in("request_id", requestIds);
    }

    const { data: matches, error } = await matchesQuery.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("[API] Error fetching matches:", error);
      return NextResponse.json(
        { error: "Failed to fetch matches" },
        { status: 500 }
      );
    }

    // Check for existing disputes
    const matchIds = (matches || []).map((m: any) => m.id);
    let existingDisputes: any[] = [];

    if (matchIds.length > 0) {
      const { data: disputes } = await supabase
        .from("disputes")
        .select("match_id, status")
        .in("match_id", matchIds)
        .eq("status", "open");

      existingDisputes = disputes || [];
    }

    const disputedMatchIds = new Set(existingDisputes.map((d) => d.match_id));

    // Filter out matches that already have an open dispute
    const eligibleMatches = (matches || []).filter((match: any) => {
      return !disputedMatchIds.has(match.id);
    });

    // Format matches for display
    const formattedMatches = eligibleMatches.map((match: any) => {
      // Handle trips and requests as arrays (from Supabase foreign key relationships)
      const trip = Array.isArray(match.trips) ? match.trips[0] : match.trips;
      const request = Array.isArray(match.requests)
        ? match.requests[0]
        : match.requests;

      // Handle users as arrays
      const tripUsers = Array.isArray(trip?.users)
        ? trip?.users[0]
        : trip?.users;
      const requestUsers = Array.isArray(request?.users)
        ? request?.users[0]
        : request?.users;

      const isRequester = requestUsers?.id === userIdValue;
      const otherParty = isRequester ? tripUsers : requestUsers;

      return {
        id: match.id,
        status: match.status,
        reward_amount: match.reward_amount,
        created_at: match.created_at,
        route: {
          from: trip?.from_location || request?.from_location || "Unknown",
          to: trip?.to_location || request?.to_location || "Unknown",
        },
        request_title: request?.title || "Untitled Request",
        other_party_email: otherParty?.email || "Unknown",
        trip_type: trip?.type || "unknown",
        departure_date: trip?.departure_date,
      };
    });

    return NextResponse.json({ matches: formattedMatches });
  } catch (error: any) {
    console.error("[API] Error processing request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
