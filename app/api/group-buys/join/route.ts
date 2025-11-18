import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { groupBuyId, requestId } = body;

    // Get group buy
    const { data: groupBuy, error: groupBuyError } = await supabase
      .from("group_buys")
      .select("*")
      .eq("id", groupBuyId)
      .single();

    if (groupBuyError || !groupBuy) {
      return NextResponse.json(
        { error: "Group buy not found" },
        { status: 404 }
      );
    }

    if (groupBuy.status !== "open") {
      return NextResponse.json(
        { error: "Group buy is not open" },
        { status: 400 }
      );
    }

    if (groupBuy.current_participants >= groupBuy.max_participants) {
      return NextResponse.json(
        { error: "Group buy is full" },
        { status: 400 }
      );
    }

    // Check if user already in group buy
    const { data: existingMatch } = await supabase
      .from("matches")
      .select("id")
      .eq("group_buy_id", groupBuyId)
      .eq("request_id", requestId)
      .single();

    if (existingMatch) {
      return NextResponse.json(
        { error: "Already in this group buy" },
        { status: 400 }
      );
    }

    // Update group buy participant count
    const { error: updateError } = await supabase
      .from("group_buys")
      .update({
        current_participants: groupBuy.current_participants + 1,
        status:
          groupBuy.current_participants + 1 >= groupBuy.max_participants
            ? "full"
            : "open",
      })
      .eq("id", groupBuyId);

    if (updateError) throw updateError;

    // Create match with group buy reference
    const { data: request } = await supabase
      .from("requests")
      .select("*, trips!inner(id)")
      .eq("id", requestId)
      .single();

    if (!request) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // Find matching trip for group buy
    const { data: trip } = await supabase
      .from("trips")
      .select("*")
      .eq("id", groupBuy.trip_id)
      .single();

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      );
    }

    // Calculate discounted reward
    const baseReward = request.max_reward;
    const discountedReward =
      baseReward * (1 - (groupBuy.discount_percent || 0) / 100);

    // Create match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        trip_id: groupBuy.trip_id,
        request_id: requestId,
        group_buy_id: groupBuyId,
        reward_amount: discountedReward,
        status: "pending",
      })
      .select()
      .single();

    if (matchError) throw matchError;

    return NextResponse.json({ success: true, match });
  } catch (error: any) {
    console.error("Error joining group buy:", error);
    return NextResponse.json(
      { error: error.message || "Failed to join group buy" },
      { status: 500 }
    );
  }
}

