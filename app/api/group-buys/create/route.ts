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
    const {
      tripId,
      fromLocation,
      toLocation,
      maxParticipants,
      discountPercent,
    } = body;

    const { data: groupBuy, error } = await supabase
      .from("group_buys")
      .insert({
        trip_id: tripId,
        from_location: fromLocation,
        to_location: toLocation,
        organizer_id: user.id,
        max_participants: maxParticipants || 10,
        current_participants: 1,
        discount_percent: discountPercent || 0,
        status: "open",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, groupBuy });
  } catch (error: any) {
    console.error("Error creating group buy:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create group buy" },
      { status: 500 }
    );
  }
}

