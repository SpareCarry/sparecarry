import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDevMode } from "@/config/devMode";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, message } = body;

    // Validate required fields
    if (!ticketId || !message) {
      return NextResponse.json(
        { error: "Ticket ID and message are required" },
        { status: 400 }
      );
    }

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

    // Find the ticket by ticket_id (human-readable ID)
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .select("id, user_id, status")
      .eq("ticket_id", ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Verify user owns this ticket
    if (ticket.user_id !== userIdValue) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Don't allow messages on closed/resolved tickets
    if (ticket.status === "closed" || ticket.status === "resolved") {
      return NextResponse.json(
        { error: "Cannot add messages to closed or resolved tickets" },
        { status: 400 }
      );
    }

    // Add the follow-up message
    const { error: messageError } = await supabase
      .from("support_ticket_messages")
      .insert({
        ticket_id: ticket.id,
        user_id: userIdValue,
        message: message.trim(),
        is_from_support: false,
      });

    if (messageError) {
      console.error("[Support] Error saving follow-up message:", messageError);
      return NextResponse.json(
        { error: "Failed to save message" },
        { status: 500 }
      );
    }

    // Update ticket status to 'open' if it was 'in_progress' (user is responding)
    if (ticket.status === "in_progress") {
      await supabase
        .from("support_tickets")
        .update({ status: "open", updated_at: new Date().toISOString() })
        .eq("id", ticket.id);
    }

    // Send email notification to support team (if configured)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && !isDevMode()) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(resendApiKey);
        const supportEmail =
          process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@sparecarry.com";
        const fromEmail =
          process.env.NOTIFICATIONS_EMAIL_FROM ||
          "SpareCarry <notifications@sparecarry.com>";

        // Get ticket details for email
        const { data: ticketDetails } = await supabase
          .from("support_tickets")
          .select("user_email, subject")
          .eq("id", ticket.id)
          .single();

        if (ticketDetails) {
          await resend.emails.send({
            from: fromEmail,
            to: supportEmail,
            subject: `[Follow-up] ${ticketDetails.subject} - ${ticketId}`,
            text: `New follow-up message on ticket ${ticketId}:\n\n${message.trim()}`,
            reply_to: ticketDetails.user_email,
          });
        }
      } catch (emailError: any) {
        console.error("[Support] Error sending follow-up email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Follow-up message added successfully",
    });
  } catch (error: any) {
    console.error("[API] Error processing follow-up message:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process follow-up message" },
      { status: 500 }
    );
  }
}
