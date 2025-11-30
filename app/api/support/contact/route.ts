import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDevMode } from "@/config/devMode";
import { validateRequestBody } from "@/lib/validation/server-validation";
import { escapeUserContent } from "@/lib/validation/server-validation";
import { withApiProtection } from "@/lib/security/api-protection";
import { z } from "zod";

// Validation schema for contact form
const contactSupportSchema = z.object({
  ticketId: z.string().optional(),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject must be less than 200 characters"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(5000, "Message must be less than 5000 characters"),
  userEmail: z.string().email().optional(),
  userId: z.string().uuid().optional(),
  matchId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  return withApiProtection(request, async (req) => {
    try {
      // Validate and sanitize request body
      const { data, error: validationError } = await validateRequestBody(
        req,
        contactSupportSchema
      );

      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const { ticketId, subject, message, userEmail, userId, matchId } = data;

      // Escape user-generated content to prevent XSS
      const safeSubject = escapeUserContent(subject);
      const safeMessage = escapeUserContent(message);

      // Get user info - handle dev mode
      let email: string;
      let userIdValue: string | null = null;

      if (isDevMode()) {
        // In dev mode, use mock user
        email = userEmail || "dev@sparecarry.com";
        userIdValue = userId || "dev-user-id";
      } else {
        // In production, get real user from session
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        email = user.email || userEmail || "unknown@sparecarry.com";
        userIdValue = user.id;
      }

      // In dev mode, just log the message instead of sending email
      if (isDevMode()) {
        console.log("[Support] Dev mode - Support message received:");
        console.log("  Ticket ID:", ticketId);
        console.log("  From:", email);
        console.log("  Subject:", safeSubject);
        console.log("  Message:", safeMessage);
        if (matchId) {
          console.log("  Match ID:", matchId);
        }

        return NextResponse.json({
          success: true,
          ticketId,
          message: "Support message logged (dev mode)",
        });
      }

      // In production, send email via Resend (if configured)
      const resendApiKey = process.env.RESEND_API_KEY;
      const supportEmail =
        process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@sparecarry.com";
      const fromEmail =
        process.env.NOTIFICATIONS_EMAIL_FROM ||
        "SpareCarry <notifications@sparecarry.com>";

      if (resendApiKey) {
        try {
          const { Resend } = await import("resend");
          const resend = new Resend(resendApiKey);

          // Note: emailBody uses safeSubject and safeMessage (already escaped)
          const emailBody = `
Support Ticket: ${ticketId}
From: ${email}${userIdValue ? ` (User ID: ${userIdValue})` : ""}${matchId ? `\nMatch ID: ${matchId}` : ""}

Subject: ${safeSubject}

Message:
${safeMessage}
        `.trim();

          await resend.emails.send({
            from: fromEmail,
            to: supportEmail,
            subject: `[Support] ${safeSubject} - ${ticketId}`,
            text: emailBody,
            reply_to: email,
          });

          // Also send confirmation to user
          await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: `Support Request Received - ${ticketId}`,
            text: `Thank you for contacting SpareCarry support. We've received your message and will get back to you soon.\n\nTicket ID: ${ticketId}\nSubject: ${safeSubject}\n\nYour message:\n${safeMessage}`,
          });
        } catch (emailError: any) {
          console.error("[Support] Error sending email:", emailError);
          // Don't fail the request if email fails - just log it
        }
      } else {
        console.warn(
          "[Support] RESEND_API_KEY not configured. Support message logged but not sent:"
        );
        console.log("  Ticket ID:", ticketId);
        console.log("  From:", email);
        console.log("  Subject:", safeSubject);
        console.log("  Message:", safeMessage);
      }

      // Save to database
      const supabase = await createClient();
      const { data: ticketData, error: dbError } = await supabase
        .from("support_tickets")
        .insert({
          ticket_id: ticketId,
          user_id: userIdValue,
          user_email: email,
          subject: safeSubject,
          initial_message: safeMessage,
          match_id: matchId || null,
          status: "open",
          priority: "medium",
        })
        .select()
        .single();

      if (dbError) {
        console.error("[Support] Error saving ticket to database:", dbError);
        // Don't fail the request if DB save fails - email was already sent
      } else {
        // Save the initial message as the first message
        if (ticketData) {
          await supabase.from("support_ticket_messages").insert({
            ticket_id: ticketData.id,
            user_id: userIdValue,
            message: safeMessage,
            is_from_support: false,
          });
        }
      }

      return NextResponse.json({
        success: true,
        ticketId,
      });
    } catch (error: any) {
      console.error("[API] Error processing support request:", error);
      return NextResponse.json(
        { error: error.message || "Failed to process support request" },
        { status: 500 }
      );
    }
  });
}
