import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDevMode } from "@/config/devMode";

export async function GET(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const { ticketId } = params;

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
      .select("id, user_id")
      .eq("ticket_id", ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Verify user owns this ticket
    if (ticket.user_id !== userIdValue) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all messages for this ticket
    const { data: messages, error: messagesError } = await supabase
      .from("support_ticket_messages")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("[Support] Error fetching messages:", messagesError);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error: any) {
    console.error("[API] Error fetching messages:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
