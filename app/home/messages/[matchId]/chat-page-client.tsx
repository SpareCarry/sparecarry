"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../../../../lib/supabase/client";
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
import { NegotiationButtons } from "../../../../components/chat/negotiation-buttons";
import { NegotiationTemplates } from "../../../../components/chat/negotiation-templates";

export function ChatPageClient() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showRating, setShowRating] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

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
        .single();

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

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversation) throw new Error("No conversation found");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: user!.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  if (!match || !conversation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const trip = match.trips;
  const request = match.requests;
  const isRequester = request.user_id === user?.id;
  const isTraveler = trip.user_id === user?.id;
  const canPay = isRequester && (match.status === "chatting" || match.status === "pending");
  const canConfirmDelivery = isRequester && match.status === "delivered";
  const showDeliveryForm = isTraveler && match.status === "escrow_paid";
  const showRatingAfterCompletion = match.status === "completed";

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
      {(showRating || showRatingAfterCompletion) && (
        <RatingModal
          matchId={matchId}
          otherUserId={isRequester ? trip.user_id : request.user_id}
          onClose={() => setShowRating(false)}
        />
      )}
    </div>
  );
}

