import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as { tripId: string; requestId: string };
    const { tripId, requestId } = body;

    // Verify user owns the request
    const { data: requestData } = await supabase
      .from("requests")
      .select("user_id, max_reward")
      .eq("id", requestId)
      .single();

    if (!requestData || requestData.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get trip details
    const { data: trip } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single();

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Check if match already exists
    const { data: existingMatch } = await supabase
      .from("matches")
      .select("id")
      .eq("trip_id", tripId)
      .eq("request_id", requestId)
      .single();

    if (existingMatch) {
      return NextResponse.json({ error: "Match already exists" }, { status: 400 });
    }

    // Create match
    const { data: match, error } = await supabase
      .from("matches")
      .insert({
        trip_id: tripId,
        request_id: requestId,
        status: "pending",
        reward_amount: requestData.max_reward,
      })
      .select()
      .single();

    if (error) throw error;

    // Send push notification to trip owner
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "https://sparecarry.com"}/api/notifications/send-match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          userId: trip.user_id,
          tripType: trip.type,
          rewardAmount: requestData.max_reward,
        }),
      });
    } catch (notifError) {
      console.error("Error sending match notification:", notifError);
    }

    return NextResponse.json({ match });
  } catch (error: any) {
    console.error("Error creating match:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create match" },
      { status: 500 }
    );
  }
}

