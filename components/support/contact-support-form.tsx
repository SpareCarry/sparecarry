"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { useUser } from "../../hooks/useUser";

const supportFormSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  matchId: z.string().optional(),
});

type SupportFormData = z.infer<typeof supportFormSchema>;

interface ContactSupportFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId?: string;
}

export function ContactSupportForm({
  open,
  onOpenChange,
  matchId,
}: ContactSupportFormProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SupportFormData>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      matchId: matchId || undefined,
    },
  });

  const onSubmit = async (data: SupportFormData) => {
    setLoading(true);
    setSuccess(false);
    setTicketNumber(null);

    try {
      const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Send email via API
      const response = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          subject: data.subject,
          message: data.message,
          userEmail: user?.email,
          userId: user?.id,
          matchId: data.matchId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send support request");
      }

      setTicketNumber(ticketId);
      setSuccess(true);
      reset();

      // Close dialog after 3 seconds
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setTicketNumber(null);
      }, 3000);
    } catch (error) {
      console.error("Error submitting support form:", error);
      alert(
        "Failed to submit support request. Please try again or email ryanhbrooks@gmail.com directly."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-teal-600" />
            Contact Support
          </DialogTitle>
          <DialogDescription>
            Fill out the form below and we&apos;ll get back to you as soon as
            possible.
          </DialogDescription>
        </DialogHeader>

        {success && ticketNumber ? (
          <div className="space-y-4 py-8 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
            <div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">
                Support request submitted!
              </h3>
              <p className="mb-4 text-sm text-slate-600">
                Your ticket number is:{" "}
                <span className="font-mono font-semibold text-teal-600">
                  {ticketNumber}
                </span>
              </p>
              <p className="text-xs text-slate-500">
                Please save this ticket number for your records. We&apos;ll
                respond via email.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                {...register("subject")}
                placeholder="Brief description of your issue"
                className="bg-white"
              />
              {errors.subject && (
                <p className="text-sm text-red-600">{errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                {...register("message")}
                placeholder="Please provide details about your issue..."
                rows={6}
                className="resize-none bg-white"
              />
              {errors.message && (
                <p className="text-sm text-red-600">{errors.message.message}</p>
              )}
            </div>

            {matchId && (
              <input type="hidden" {...register("matchId")} value={matchId} />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Request
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
