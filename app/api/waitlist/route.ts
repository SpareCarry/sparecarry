import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userType, tripFrom, tripTo, approximateDates, spareCapacity } = body;

    // Validate email
    if (!email || !userType) {
      return NextResponse.json(
        { error: "Email and user type are required" },
        { status: 400 }
      );
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from("waitlist")
      .insert({
        email,
        user_type: userType,
        trip_from: tripFrom || null,
        trip_to: tripTo || null,
        approximate_dates: approximateDates || null,
        spare_capacity: spareCapacity || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save to waitlist" },
        { status: 500 }
      );
    }

    // Get position in waitlist (count of entries before this one)
    const { count } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true })
      .lt("created_at", data.created_at);

    const position = (count || 0) + 1;

    // Send welcome email
    try {
      await resend.emails.send({
        from: "SpareCarry <onboarding@sparecarry.com>",
        to: email,
        subject: "Welcome to SpareCarry ⚓✈",
        html: `
          <h1>Welcome to SpareCarry ⚓✈</h1>
          <p>Thanks for joining our waitlist. You're #${position} on the list.</p>
          <p>We'll notify you as soon as we launch!</p>
          <p><a href="https://sparecarry.com" style="color: #14b8a6; text-decoration: none;">Visit sparecarry.com</a></p>
        `,
      });
    } catch (emailError) {
      console.error("Resend error:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true, position });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

