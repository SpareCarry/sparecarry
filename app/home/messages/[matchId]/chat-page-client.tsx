"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../../../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Card, CardContent } from "../../../../components/ui/card";
import {
  Send,
  Loader2,
  DollarSign,
  MapPin,
  Camera,
  CheckCircle2,
  Star,
  AlertTriangle,
  LifeBuoy,
} from "lucide-react";
import { format } from "date-fns";
import { MessageBubble } from "../../../../components/chat/message-bubble";
import { TemplateMessages } from "../../../../components/chat/template-messages";
import { PaymentButton } from "../../../../components/chat/payment-button";
import { DeliveryConfirmation } from "../../../../components/chat/delivery-confirmation";
import { RatingModal } from "../../../../components/chat/rating-modal";
import { ConfirmDeliveryButton } from "../../../../components/chat/confirm-delivery-button";
import { PurchaseLinkButton } from "../../../../components/purchase/purchase-link-button";
import { detectPriceProposal } from "../../../../components/chat/price-proposal-detector";
import { useUser } from "../../../../hooks/useUser";
import { NegotiationButtons } from "../../../../components/chat/negotiation-buttons";
import { NegotiationTemplates } from "../../../../components/chat/negotiation-templates";
import type { Message, MessageInsert, Conversation as ConversationRow } from "@/types/supabase";

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@sparecarry.com";

type ConversationRecord = Pick<ConversationRow, "id">;

type RatingRecord = {
  id: string;
  rating: number;
  comment?: string | null;
};

type DisputeRecord = {
  id: string;
  match_id: string;
  opened_by: string;
  reason: string;
  status: "open" | "resolved" | "rejected";
  resolution_notes?: string | null;
  created_at: string;
};

export function ChatPageClient() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const supabase = createClient() as SupabaseClient;
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [hasAutoPromptedRating, setHasAutoPromptedRating] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [supportError, setSupportError] = useState<string | null>(null);
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);

  // Use shared hook to prevent duplicate queries
  const { user } = useUser();

  const { data: match } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          *,
          trips(
            *,
            profiles!trips_user_id_fkey(
              shipping_name,
              shipping_address_line1,
              shipping_address_line2,
              shipping_city,
              shipping_state,
              shipping_postal_code,
              shipping_country
            )
          ),
          requests(*)
        `
        )
        .eq("id", matchId)
        .single();

      if (error) throw error;
      return data;
    },
    refetchInterval: 2000, // Poll every 2 seconds for new messages
  });

  const { data: conversation } = useQuery({
    queryKey: ["conversation", matchId],
    queryFn: async () => {
      const { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("match_id", matchId)
        .maybeSingle<ConversationRecord>();

      if (!conv) return null;

      const { data: messages } = await supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(*)")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: true });

      return { ...conv, messages: messages || [] };
    },
    enabled: !!matchId,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  const { data: ratingRecord, isFetching: ratingFetching } = useQuery<RatingRecord | null>({
    queryKey: ["rating", matchId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const { data, error } = await supabase
          .from("ratings")
          .select("*")
          .eq("match_id", matchId)
          .eq("rater_id", user.id)
          .maybeSingle<RatingRecord>();

        if (error && error.code !== "PGRST116") throw error;
        return data || null;
      } catch (queryError) {
        console.warn("Unable to load rating", queryError);
        return null;
      }
    },
    enabled: !!user?.id && !!matchId,
  });

  const { data: disputeRecord, isFetching: disputeFetching } = useQuery<DisputeRecord | null>({
    queryKey: ["dispute", matchId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("disputes")
          .select("*")
          .eq("match_id", matchId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<DisputeRecord>();

        if (error && error.code !== "PGRST116") throw error;
        return data || null;
      } catch (queryError) {
        console.warn("Unable to load dispute", queryError);
        return null;
      }
    },
    enabled: !!matchId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversation) throw new Error("No conversation found");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: user!.id,
          content,
        } as MessageInsert)
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", matchId] });
      setMessage("");

      // Send push notification if message sent
      try {
        if (match) {
          const tripData = Array.isArray(match.trips) ? match.trips[0] : match.trips;
          const requestData = Array.isArray(match.requests)
            ? match.requests[0]
            : match.requests;
          const isRequesterLocal = requestData?.user_id === user?.id;
          const recipientId = isRequesterLocal ? tripData?.user_id : requestData?.user_id;
          
          if (recipientId) {
            await fetch("/api/notifications/send-message", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                matchId,
                recipientId,
                senderName: user?.email?.split("@")[0] || "Someone",
                messagePreview: data.content.substring(0, 50),
              }),
            });
          }
        }
      } catch (error) {
        console.error("Error sending message notification:", error);
      }
    },
  });

  const openDisputeMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (!reason.trim()) {
        throw new Error("Please describe what went wrong.");
      }

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) throw new Error("Not authenticated");

      const { error } = await supabase.from("disputes").insert({
        match_id: matchId,
        opened_by: currentUser.id,
        reason: reason.trim(),
        status: "open",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setDisputeReason("");
      setSupportError(null);
      setSupportSuccess("Dispute submitted. Our support team will reach out shortly.");
      queryClient.invalidateQueries({ queryKey: ["dispute", matchId] });
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error ? mutationError.message : "Unable to submit dispute. Please try again.";
      setSupportError(message);
      setSupportSuccess(null);
    },
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      await sendMessageMutation.mutateAsync(message.trim());
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleTemplateMessage = (template: string) => {
    setMessage(template);
  };

  const handleDisputeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSupportError(null);
    setSupportSuccess(null);
    try {
      await openDisputeMutation.mutateAsync(disputeReason);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit dispute. Please try again.";
      setSupportError(message);
    }
  };

  const handleRatingPrompt = () => {
    setRatingModalOpen(true);
    setHasAutoPromptedRating(true);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const shouldPromptRating = match?.status === "completed";

  useEffect(() => {
    if (shouldPromptRating && !ratingRecord && !hasAutoPromptedRating) {
      setRatingModalOpen(true);
      setHasAutoPromptedRating(true);
    }
  }, [shouldPromptRating, ratingRecord, hasAutoPromptedRating]);

  if (!match || !conversation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const trip = Array.isArray(match.trips) ? match.trips[0] : match.trips;
  const request = Array.isArray(match.requests) ? match.requests[0] : match.requests;
  const isRequester = request?.user_id === user?.id;
  const isTraveler = trip?.user_id === user?.id;
  const canPay = isRequester && (match.status === "chatting" || match.status === "pending");
  const canConfirmDelivery = isRequester && match.status === "delivered";
  const showDeliveryForm = isTraveler && match.status === "escrow_paid";
  const showRatingAfterCompletion = match.status === "completed";
  const canOpenDispute = ["escrow_paid", "delivered", "completed", "disputed"].includes(match.status);
  const otherUserId = isRequester ? trip?.user_id : request?.user_id;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-slate-900">
              {isRequester
                ? `${trip.from_location} → ${trip.to_location}`
                : `${request.from_location} → ${request.to_location}`}
            </h1>
            <p className="text-sm text-slate-600">
              {isRequester ? "Traveler" : "Requester"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/home")}
            size="sm"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {conversation.messages.map((msg: any, idx: number) => {
          const isOwn = msg.sender_id === user?.id;
          const priceProposal = !isOwn ? detectPriceProposal(msg.content) : null;
          const previousMessage = idx > 0 ? conversation.messages[idx - 1] : null;
          const previousPriceProposal = previousMessage
            ? detectPriceProposal(previousMessage.content)
            : null;
          const showNegotiation =
            priceProposal &&
            (!previousPriceProposal ||
              previousPriceProposal.amount !== priceProposal.amount);

          return (
            <div key={msg.id}>
              <MessageBubble message={msg} isOwn={isOwn} />
              {/* Show negotiation buttons after price proposal */}
              {showNegotiation && (
                <>
                  <NegotiationButtons
                    proposedAmount={priceProposal.amount}
                    matchId={matchId}
                    currentReward={match.reward_amount}
                    isRequester={isRequester}
                    onAccept={() => {
                      // Scroll to payment button if it exists
                      setTimeout(() => {
                        const paymentButton = document.querySelector(
                          '[data-payment-button]'
                        );
                        paymentButton?.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }}
                  />
                  <NegotiationTemplates
                    matchId={matchId}
                    proposedAmount={priceProposal.amount}
                    currentReward={match.reward_amount}
                    isRequester={isRequester}
                  />
                </>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Template Messages */}
      {match.status === "pending" || match.status === "chatting" ? (
        <TemplateMessages
          onSelect={handleTemplateMessage}
          match={match}
          isRequester={isRequester}
        />
      ) : null}

      {/* Purchase Link (Requester only, when match confirmed and retailer selected) */}
      {isRequester &&
        match.status !== "pending" &&
        match.requests?.purchase_retailer && (
          <PurchaseLinkButton
            retailer={match.requests.purchase_retailer}
            itemTitle={match.requests.title}
            travelerAddress={
              (() => {
                const profile = Array.isArray(match.trips?.profiles)
                  ? match.trips.profiles[0]
                  : match.trips?.profiles;
                return profile?.shipping_address_line1
                  ? {
                      name: profile.shipping_name || "Traveler",
                      address_line1: profile.shipping_address_line1,
                      address_line2: profile.shipping_address_line2 || undefined,
                      city: profile.shipping_city || "",
                      state: profile.shipping_state || "",
                      postal_code: profile.shipping_postal_code || "",
                      country: profile.shipping_country || "USA",
                    }
                  : undefined;
              })()
            }
            matchId={matchId}
          />
        )}

      {/* Payment Button (Requester only) */}
      {canPay && <PaymentButton match={match} />}

      {/* Delivery Confirmation (Traveler) */}
      {showDeliveryForm && (
        <DeliveryConfirmation matchId={matchId} onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["match", matchId] });
        }} />
      )}

      {/* Delivery Confirmation Button (Requester) */}
      {canConfirmDelivery && <ConfirmDeliveryButton matchId={matchId} />}

      {/* Rating Prompt */}
      {showRatingAfterCompletion && (
        <div className="px-4 py-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Rate this delivery</p>
                <p className="text-xs text-slate-500">
                  {ratingRecord ? "Update your feedback anytime." : "Share feedback so others know what to expect."}
                </p>
              </div>
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            </div>

            {ratingFetching ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                Checking for existing rating...
              </div>
            ) : ratingRecord ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= ratingRecord.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  {ratingRecord.comment && (
                    <p className="text-sm text-slate-600 mt-2">&ldquo;{ratingRecord.comment}&rdquo;</p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleRatingPrompt} disabled={!otherUserId}>
                  Update rating
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">
                  It only takes a few seconds and helps us keep SpareCarry safe.
                </p>
                <Button size="sm" onClick={handleRatingPrompt} disabled={!otherUserId}>
                  Leave a rating
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Support & disputes */}
      {(canOpenDispute || disputeRecord) && (
        <div className="px-4 pb-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
              <LifeBuoy className="h-5 w-5 text-teal-600" />
              Need help?
            </div>

            {disputeFetching ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                Checking for disputes...
              </div>
            ) : disputeRecord ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  {disputeRecord.status === "open" ? "Dispute under review" : "Dispute update"}
                </div>
                <p>{disputeRecord.reason}</p>
                <p className="text-xs text-amber-800">
                  Filed {format(new Date(disputeRecord.created_at), "MMM d, yyyy HH:mm")}
                </p>
              </div>
            ) : canOpenDispute ? (
              <form className="space-y-3" onSubmit={handleDisputeSubmit}>
                <label className="text-sm font-medium text-slate-900">Tell us what&apos;s wrong</label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => {
                    setDisputeReason(e.target.value);
                    setSupportError(null);
                    setSupportSuccess(null);
                  }}
                  rows={3}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Describe the issue so we can help..."
                  disabled={openDisputeMutation.isPending}
                />
                {supportError && <p className="text-sm text-red-600">{supportError}</p>}
                {supportSuccess && <p className="text-sm text-emerald-600">{supportSuccess}</p>}
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={openDisputeMutation.isPending}>
                    {openDisputeMutation.isPending ? "Sending..." : "Open dispute"}
                  </Button>
                  <p className="text-xs text-slate-500">
                    Escrow stays frozen while the team reviews your ticket.
                  </p>
                </div>
              </form>
            ) : null}

            <p className="text-xs text-slate-500">
              Prefer email?{" "}
              <a href={`mailto:${supportEmail}`} className="text-teal-600 underline">
                Contact support
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Message Input */}
      {(match.status === "chatting" || match.status === "pending") && (
        <form onSubmit={handleSend} className="bg-white border-t border-slate-200 p-4">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              disabled={sending}
            />
            <Button
              type="submit"
              disabled={!message.trim() || sending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Rating Modal */}
      {ratingModalOpen && otherUserId && (
        <RatingModal
          matchId={matchId}
          otherUserId={otherUserId}
          existingRating={ratingRecord || undefined}
          onClose={() => setRatingModalOpen(false)}
          onSubmitted={() => {
            queryClient.invalidateQueries({ queryKey: ["rating", matchId, user?.id] });
          }}
        />
      )}
    </div>
  );
}

