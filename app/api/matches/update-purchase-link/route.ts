import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePurchaseLink } from "@/lib/affiliate/affiliate-links";

// Updates the purchase link in a request when match is confirmed
// with the traveler's shipping address

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
    const { matchId } = body;

    // Get match with request and traveler details
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select(
        `
        *,
        requests(id, title, purchase_retailer),
        trips(
          profiles(
            shipping_name,
            shipping_address_line1,
            shipping_address_line2,
            shipping_city,
            shipping_state,
            shipping_postal_code,
            shipping_country
          )
        )
      `
      )
      .eq("id", matchId)
      .single();

    if (matchError) throw matchError;

    if (!match.requests?.purchase_retailer) {
      return NextResponse.json({
        success: true,
        message: "No purchase retailer selected",
      });
    }

    const profile = Array.isArray(match.trips?.profiles)
      ? match.trips.profiles[0]
      : match.trips?.profiles;

    if (!profile) {
      return NextResponse.json(
        { error: "Traveler profile not found" },
        { status: 404 }
      );
    }

    // Generate purchase link with traveler's address
    const purchaseLink = generatePurchaseLink(
      match.requests.purchase_retailer,
      match.requests.title,
      profile.shipping_address_line1
        ? {
            name: profile.shipping_name || "Traveler",
            address_line1: profile.shipping_address_line1,
            address_line2: profile.shipping_address_line2 || undefined,
            city: profile.shipping_city || "",
            state: profile.shipping_state || "",
            postal_code: profile.shipping_postal_code || "",
            country: profile.shipping_country || "USA",
          }
        : undefined
    );

    // Update request with purchase link
    const { error: updateError } = await supabase
      .from("requests")
      .update({ purchase_link: purchaseLink })
      .eq("id", match.requests.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      purchaseLink,
    });
  } catch (error: any) {
    console.error("Error updating purchase link:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update purchase link" },
      { status: 500 }
    );
  }
}

