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
  AlertCircle,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import Image from "next/image";
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
import type {
  Message,
  MessageInsert,
  Conversation as ConversationRow,
} from "@/types/supabase";
import { validateMessageContent } from "../../../../lib/utils/message-content-filter";
import { Alert, AlertDescription } from "../../../../components/ui/alert";
import { useTypingIndicator } from "../../../../lib/hooks/useTypingIndicator";
import { uploadMessageImage } from "../../../../lib/utils/uploadMessageImage";
import { uploadVoiceMessage } from "../../../../lib/utils/uploadVoiceMessage";
import { useVoiceRecorder } from "../../../../lib/hooks/useVoiceRecorder";
import { Image as ImageIcon, X, Mic, Square } from "lucide-react";
import { MessageSearch } from "../../../../components/messaging/MessageSearch";
import { useMessageDraft } from "../../../../lib/hooks/useMessageDraft";
import { cn } from "../../../../lib/utils";

const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@sparecarry.com";

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
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [hasAutoPromptedRating, setHasAutoPromptedRating] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [supportError, setSupportError] = useState<string | null>(null);
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);
  const [messageValidationError, setMessageValidationError] =
    useState<string>("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save drafts
  const { draft, setDraft, clearDraft } = useMessageDraft({
    conversationId: matchId,
    conversationType: "match",
    enabled: !!matchId,
  });
  const message = draft;

  // Use shared hook to prevent duplicate queries
  const { user } = useUser();

  // Get match data first
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
            users(id, full_name, avatar_url, verified_identity, verified_sailor, rating, completed_deliveries)
          ),
          requests(
            *,
            users(id, full_name, avatar_url, verified_identity, verified_sailor, rating, completed_deliveries)
          )
        `
        )
        .eq("id", matchId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!matchId,
    refetchInterval: 2000, // Poll every 2 seconds for new messages
  });

  // Get other user ID for typing indicator (after match is loaded)
  const trip = Array.isArray(match?.trips) ? match?.trips[0] : match?.trips;
  const request = Array.isArray(match?.requests)
    ? match?.requests[0]
    : match?.requests;
  const otherUserId =
    user?.id === request?.user_id ? trip?.user_id : request?.user_id;

  const { isOtherUserTyping, broadcastTyping } = useTypingIndicator({
    conversationId: matchId,
    conversationType: "match",
    currentUserId: user?.id || "",
    otherUserId: otherUserId || "",
    enabled: !!user?.id && !!otherUserId && !!matchId,
  });

  const {
    isRecording,
    recordingDuration,
    formattedDuration,
    error: recordingError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder({
    onRecordingComplete: (blob) => {
      setAudioBlob(blob);
      const url = URL.createObjectURL(blob);
      setAudioPreviewUrl(url);
    },
    onError: (error) => {
      setMessageValidationError(error.message);
    },
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
        .is("deleted_at", null) // Filter out deleted messages
        .order("created_at", { ascending: true });

      return { ...conv, messages: messages || [] };
    },
    enabled: !!matchId,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  const { data: ratingRecord, isFetching: ratingFetching } =
    useQuery<RatingRecord | null>({
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

  const { data: disputeRecord, isFetching: disputeFetching } =
    useQuery<DisputeRecord | null>({
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
    mutationFn: async ({
      content,
      imageUrls = [],
      audioUrl = null,
    }: {
      content: string;
      imageUrls?: string[];
      audioUrl?: string | null;
    }) => {
      if (!conversation) throw new Error("No conversation found");

      // Validate message content before sending (only if there's text)
      if (content.trim()) {
        const validation = validateMessageContent(content);
        if (!validation.isValid) {
          throw new Error(validation.userMessage);
        }
      }

      // Must have either content, images, or audio
      if (!content.trim() && imageUrls.length === 0 && !audioUrl) {
        throw new Error("Message must have text, images, or audio");
      }

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: user!.id,
          content: content.trim() || "",
          image_urls: imageUrls.length > 0 ? imageUrls : null,
          audio_url: audioUrl,
        } as MessageInsert)
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", matchId] });
      clearDraft();
      setMessageValidationError("");

      // Send push notification if message sent
      try {
        if (match) {
          const tripData = Array.isArray(match.trips)
            ? match.trips[0]
            : match.trips;
          const requestData = Array.isArray(match.requests)
            ? match.requests[0]
            : match.requests;
          const isRequesterLocal = requestData?.user_id === user?.id;
          const recipientId = isRequesterLocal
            ? tripData?.user_id
            : requestData?.user_id;

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
      setSupportSuccess(
        "Dispute submitted. Our support team will reach out shortly."
      );
      queryClient.invalidateQueries({ queryKey: ["dispute", matchId] });
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to submit dispute. Please try again.";
      setSupportError(message);
      setSupportSuccess(null);
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      setMessageValidationError("Please select image files only");
      return;
    }

    // Limit to 5 images max
    const newImages = [...selectedImages, ...imageFiles].slice(0, 5);
    setSelectedImages(newImages);

    // Create previews
    const newPreviews = newImages.map((file) => URL.createObjectURL(file));
    setImagePreviews(newPreviews);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // Revoke old preview URL
    URL.revokeObjectURL(imagePreviews[index]);

    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (!message.trim() && selectedImages.length === 0 && !audioBlob) ||
      sending ||
      uploadingImages ||
      uploadingAudio
    )
      return;

    // Validate message content if there's text
    if (message.trim()) {
      const validation = validateMessageContent(message.trim());
      if (!validation.isValid) {
        setMessageValidationError(validation.userMessage);
        return;
      }
    }

    // Stop typing indicator when sending
    broadcastTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setMessageValidationError("");
    setUploadingImages(true);
    setUploadingAudio(true);
    setSending(true);

    try {
      // Upload images first
      let imageUrls: string[] = [];
      if (selectedImages.length > 0 && user?.id) {
        imageUrls = await Promise.all(
          selectedImages.map((file) => uploadMessageImage(file, user.id))
        );
      }

      // Upload audio if present
      let audioUrl: string | null = null;
      if (audioBlob && user?.id) {
        const audioFile = new File([audioBlob], "voice-message.webm", {
          type: "audio/webm",
        });
        audioUrl = await uploadVoiceMessage(audioFile, user.id);
      }

      // Send message with images and/or audio
      await sendMessageMutation.mutateAsync({
        content: message.trim() || "",
        imageUrls,
        audioUrl,
      });

      // Cleanup
      clearDraft(); // Clear draft on successful send
      setSelectedImages([]);
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setImagePreviews([]);
      setAudioBlob(null);
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl(null);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      if (error instanceof Error) {
        if (
          error.message.includes("sensitive information") ||
          error.message.includes("Image") ||
          error.message.includes("Audio")
        ) {
          setMessageValidationError(error.message);
        } else {
          setMessageValidationError(
            "Failed to send message. Please try again."
          );
        }
      }
    } finally {
      setSending(false);
      setUploadingImages(false);
      setUploadingAudio(false);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDraft(newValue); // Auto-save draft

    // Clear validation error when user starts typing
    if (messageValidationError) {
      setMessageValidationError("");
    }

    // Broadcast typing status
    if (newValue.trim().length > 0) {
      broadcastTyping(true);

      // Stop typing indicator after 2 seconds of no typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        broadcastTyping(false);
      }, 2000);
    } else {
      broadcastTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  // Cleanup typing indicator
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      broadcastTyping(false);
    };
  }, [broadcastTyping]);

  const handleTemplateMessage = (template: string) => {
    setDraft(template);
  };

  const handleDisputeSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setSupportError(null);
    setSupportSuccess(null);
    try {
      await openDisputeMutation.mutateAsync(disputeReason);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to submit dispute. Please try again.";
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const tripData = Array.isArray(match.trips) ? match.trips[0] : match.trips;
  const requestData = Array.isArray(match.requests)
    ? match.requests[0]
    : match.requests;
  const isRequester = requestData?.user_id === user?.id;
  const isTraveler = tripData?.user_id === user?.id;
  const canPay =
    isRequester && (match.status === "chatting" || match.status === "pending");
  const canConfirmDelivery = isRequester && match.status === "delivered";
  const showDeliveryForm = isTraveler && match.status === "escrow_paid";
  const showRatingAfterCompletion = match.status === "completed";
  const canOpenDispute = [
    "escrow_paid",
    "delivered",
    "completed",
    "disputed",
  ].includes(match.status);
  const otherUserIdFinal = isRequester
    ? tripData?.user_id
    : requestData?.user_id;

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Header */}
      <div className="space-y-2 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-slate-900">
              {isRequester
                ? `${tripData?.from_location} → ${tripData?.to_location}`
                : `${requestData?.from_location} → ${requestData?.to_location}`}
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
        {conversation && conversation.messages.length > 0 && (
          <MessageSearch
            messages={conversation.messages}
            onMessageSelect={(messageId) => {
              // Scroll to message
              const messageElement = document.querySelector(
                `[data-message-id="${messageId}"]`
              );
              if (messageElement) {
                messageElement.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
                // Highlight briefly
                messageElement.classList.add("ring-2", "ring-teal-500");
                setTimeout(() => {
                  messageElement.classList.remove("ring-2", "ring-teal-500");
                }, 2000);
              }
            }}
          />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {conversation.messages.map((msg: any, idx: number) => {
          const isOwn = msg.sender_id === user?.id;
          const priceProposal = !isOwn
            ? detectPriceProposal(msg.content)
            : null;
          const previousMessage =
            idx > 0 ? conversation.messages[idx - 1] : null;
          const previousPriceProposal = previousMessage
            ? detectPriceProposal(previousMessage.content)
            : null;
          const showNegotiation =
            priceProposal &&
            (!previousPriceProposal ||
              previousPriceProposal.amount !== priceProposal.amount);

          // Group messages by date
          const currentDate = new Date(msg.created_at);
          const prevDate = previousMessage
            ? new Date(previousMessage.created_at)
            : null;
          const showDateSeparator =
            !prevDate || currentDate.toDateString() !== prevDate.toDateString();

          return (
            <div key={msg.id} data-message-id={msg.id}>
              {showDateSeparator && (
                <div className="my-4 flex items-center justify-center">
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    {isToday(currentDate)
                      ? "Today"
                      : isYesterday(currentDate)
                        ? "Yesterday"
                        : format(currentDate, "MMMM d, yyyy")}
                  </div>
                </div>
              )}
              <MessageBubble
                message={{
                  ...msg,
                  image_urls: (msg as any).image_urls || null,
                  audio_url: (msg as any).audio_url || null,
                  edited_at: (msg as any).edited_at || null,
                  deleted_at: (msg as any).deleted_at || null,
                }}
                isOwn={isOwn}
                messageType="match"
                currentUserId={user?.id}
              />
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
                          "[data-payment-button]"
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
            travelerAddress={(() => {
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
            })()}
            matchId={matchId}
          />
        )}

      {/* Payment Button (Requester only) */}
      {canPay && <PaymentButton match={match} />}

      {/* Delivery Confirmation (Traveler) */}
      {showDeliveryForm && (
        <DeliveryConfirmation
          matchId={matchId}
          onComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["match", matchId] });
          }}
        />
      )}

      {/* Delivery Confirmation Button (Requester) */}
      {canConfirmDelivery && <ConfirmDeliveryButton matchId={matchId} />}

      {/* Rating Prompt */}
      {showRatingAfterCompletion && (
        <div className="px-4 py-3">
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Rate this delivery
                </p>
                <p className="text-xs text-slate-500">
                  {ratingRecord
                    ? "Update your feedback anytime."
                    : "Share feedback so others know what to expect."}
                </p>
              </div>
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
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
                          star <= ratingRecord.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  {ratingRecord.comment && (
                    <p className="mt-2 text-sm text-slate-600">
                      &ldquo;{ratingRecord.comment}&rdquo;
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRatingPrompt}
                  disabled={!otherUserIdFinal}
                >
                  Update rating
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">
                  It only takes a few seconds and helps us keep SpareCarry safe.
                </p>
                <Button
                  size="sm"
                  onClick={handleRatingPrompt}
                  disabled={!otherUserIdFinal}
                >
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
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <LifeBuoy className="h-5 w-5 text-teal-600" />
              Need help?
            </div>

            {disputeFetching ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                Checking for disputes...
              </div>
            ) : disputeRecord ? (
              <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  {disputeRecord.status === "open"
                    ? "Dispute under review"
                    : "Dispute update"}
                </div>
                <p>{disputeRecord.reason}</p>
                <p className="text-xs text-amber-800">
                  Filed{" "}
                  {format(
                    new Date(disputeRecord.created_at),
                    "MMM d, yyyy HH:mm"
                  )}
                </p>
              </div>
            ) : canOpenDispute ? (
              <form className="space-y-3" onSubmit={handleDisputeSubmit}>
                <label className="text-sm font-medium text-slate-900">
                  Tell us what&apos;s wrong
                </label>
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
                {supportError && (
                  <p className="text-sm text-red-600">{supportError}</p>
                )}
                {supportSuccess && (
                  <p className="text-sm text-emerald-600">{supportSuccess}</p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="submit"
                    disabled={openDisputeMutation.isPending}
                  >
                    {openDisputeMutation.isPending
                      ? "Sending..."
                      : "Open dispute"}
                  </Button>
                  <p className="text-xs text-slate-500">
                    Escrow stays frozen while the team reviews your ticket.
                  </p>
                </div>
              </form>
            ) : null}

            <p className="text-xs text-slate-500">
              Prefer email?{" "}
              <a
                href={`mailto:${supportEmail}`}
                className="text-teal-600 underline"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Message Input */}
      {(match.status === "chatting" || match.status === "pending") && (
        <form
          onSubmit={handleSend}
          className="border-t border-slate-200 bg-white p-4"
        >
          {messageValidationError && (
            <Alert variant="destructive" className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {messageValidationError}
              </AlertDescription>
            </Alert>
          )}
          {isOtherUserTyping && (
            <div className="mb-2 animate-pulse text-xs italic text-slate-500">
              User is typing...
            </div>
          )}

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="group relative h-20 w-20">
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    width={80}
                    height={80}
                    className="rounded-lg border border-slate-200 object-cover"
                    unoptimized={
                      preview.startsWith("blob:") || preview.startsWith("data:")
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Audio Preview */}
          {audioPreviewUrl && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
              <audio src={audioPreviewUrl} controls className="h-8 flex-1" />
              <button
                type="button"
                onClick={() => {
                  setAudioBlob(null);
                  if (audioPreviewUrl) {
                    URL.revokeObjectURL(audioPreviewUrl);
                    setAudioPreviewUrl(null);
                  }
                }}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Recording Indicator */}
          {isRecording && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2">
              <div className="flex flex-1 items-center gap-2">
                <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
                <span className="text-sm font-medium text-red-700">
                  Recording: {formattedDuration}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={stopRecording}
                className="border-red-300 text-red-600 hover:bg-red-100"
              >
                <Square className="mr-1 h-4 w-4" />
                Stop
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelRecording}
                className="text-slate-600"
              >
                Cancel
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              disabled={sending || uploadingImages}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={
                sending ||
                uploadingImages ||
                uploadingAudio ||
                isRecording ||
                selectedImages.length >= 5
              }
              className="flex-shrink-0"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={
                sending ||
                uploadingImages ||
                uploadingAudio ||
                audioBlob !== null
              }
              className={cn(
                "flex-shrink-0",
                isRecording &&
                  "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
              )}
            >
              {isRecording ? (
                <Square className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Input
              value={message}
              onChange={handleMessageChange}
              placeholder="Type a message..."
              className="flex-1"
              disabled={
                sending || uploadingImages || uploadingAudio || isRecording
              }
            />
            <Button
              type="submit"
              disabled={
                (!message.trim() &&
                  selectedImages.length === 0 &&
                  !audioBlob) ||
                sending ||
                uploadingImages ||
                uploadingAudio ||
                isRecording
              }
              className="bg-teal-600 hover:bg-teal-700"
            >
              {sending || uploadingImages || uploadingAudio ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            All communication stays on SpareCarry for safety and protection.
          </p>
        </form>
      )}

      {/* Rating Modal */}
      {ratingModalOpen && otherUserIdFinal && (
        <RatingModal
          matchId={matchId}
          otherUserId={otherUserIdFinal}
          existingRating={ratingRecord || undefined}
          onClose={() => setRatingModalOpen(false)}
          onSubmitted={() => {
            queryClient.invalidateQueries({
              queryKey: ["rating", matchId, user?.id],
            });
          }}
        />
      )}
    </div>
  );
}
