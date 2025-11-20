import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { Resend } from "resend";

// Lazy initialization to avoid errors during static export build
function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(apiKey);
}

import { waitlistRequestSchema } from "../../../lib/zod/api-schemas";
import type { WaitlistRequest, WaitlistResponse } from "../../../types/api";
import type { WaitlistEntry } from "../../../types/supabase";

const supabase = createClient();

export async function POST(request: NextRequest): Promise<NextResponse<WaitlistResponse>> {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const parsedBody = waitlistRequestSchema.parse(body);
    const { email, userType, tripFrom, tripTo, approximateDates, spareCapacity } = parsedBody;

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
      .single<WaitlistEntry>();

    if (error) {
      safeLog('error', 'Waitlist: Supabase error', {});
      return errorResponse(error, 500);
    }

    // Get position in waitlist (count of entries before this one)
    const { count } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true })
      .lt("created_at", data.created_at);

    const position = (count || 0) + 1;

    // Send welcome email
    try {
      await getResend().emails.send({
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
      safeLog('warn', 'Waitlist: Email send failed', {});
      // Don't fail the request if email fails
    }

    return successResponse({ success: true, position });
  } catch (error) {
    safeLog('error', 'Waitlist: Unexpected error', {});
    return errorResponse(error, 500);
  }
}

