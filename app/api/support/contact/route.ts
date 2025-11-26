import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface SupportRequestBody {
  ticketId?: string;
  subject?: string;
  message?: string;
  userEmail?: string | null;
  userId?: string | null;
  matchId?: string | null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = (await request.json().catch(() => ({}))) as SupportRequestBody;
    const { ticketId, subject, message, matchId } = body;

    if (!ticketId || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const payload: Record<string, any> = {
      ticket_id: ticketId,
      subject,
      message,
      match_id: matchId ?? null,
    };

    // Prefer the authenticated user id when available
    if (user) {
      payload.user_id = user.id;
    }

    const { error } = await supabase.from("support_tickets").insert(payload);

    if (error) {
      console.error("Error inserting support ticket:", error);
      return NextResponse.json(
        { error: "Failed to save support request" },
        { status: 500 }
      );
    }

    // In the future we could also fan out to an email provider here.
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in /api/support/contact:", error);
    return NextResponse.json(
      {
        error: "Failed to submit support request",
      },
      { status: 500 }
    );
  }
}


