/**
 * Chat Screen - Mobile
 * In-app messaging system (like Airbnb) to keep deals on-platform
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@sparecarry/lib/supabase";
import { useAuth } from "@sparecarry/hooks/useAuth";
import { MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { SafeAreaView } from "react-native-safe-area-context";
import { RealtimeManager } from "@sparecarry/lib/realtime";
import { PaymentButtonMobile } from "../../components/chat/PaymentButtonMobile";
import { DeliveryConfirmationMobile } from "../../components/chat/DeliveryConfirmationMobile";
import { ConfirmDeliveryButtonMobile } from "../../components/chat/ConfirmDeliveryButtonMobile";
import { RatingSectionMobile } from "../../components/chat/RatingSectionMobile";
import { TemplateMessagesMobile } from "../../components/chat/TemplateMessagesMobile";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: {
    avatar_url?: string;
  };
}

interface Match {
  id: string;
  status: string;
  reward_amount: number;
  requester_id: string;
  traveler_id: string;
  trips?: any;
  requests?: any;
}

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const { user } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  // Initialize RealtimeManager
  useEffect(() => {
    RealtimeManager.setSupabaseClient(supabase);
  }, [supabase]);

  // Fetch match details
  const { data: match } = useQuery<Match>({
    queryKey: ["match", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*, trips(*), requests(*)")
        .eq("id", matchId)
        .single();

      if (error) throw error;
      return data as Match;
    },
    enabled: !!matchId,
    refetchInterval: 2000,
  });

  const otherUserId =
    match && user
      ? match.traveler_id === user.id
        ? match.requester_id
        : match.traveler_id
      : null;

  // Fetch conversation and messages
  const { data: conversation } = useQuery<{
    id: string;
    messages: Message[];
  } | null>({
    queryKey: ["conversation", matchId],
    queryFn: async () => {
      const { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("match_id", matchId)
        .maybeSingle();

      if (!conv) return null;

      const { data: messages } = await supabase
        .from("messages")
        .select("*, sender:profiles!messages_sender_id_fkey(*)")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: true });

      return { ...conv, messages: messages || [] };
    },
    enabled: !!matchId,
    refetchInterval: 2000,
  });

  // Real-time message subscription
  useEffect(() => {
    if (!conversation?.id || !matchId) return;

    const handleRealtime = () => {
      queryClient.invalidateQueries({ queryKey: ["conversation", matchId] });
    };

    const channelName = RealtimeManager.listen(
      {
        table: "messages",
        event: "INSERT",
        filter: `conversation_id=eq.${conversation.id}`,
      },
      handleRealtime,
      `messages:${conversation.id}`
    );

    return () => {
      RealtimeManager.remove(channelName, handleRealtime);
    };
  }, [conversation?.id, matchId, queryClient]);

  // Send message mutation
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
      return data as Message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation", matchId] });
      setMessage("");
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
  });

  // Open dispute mutation
  const openDisputeMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (!reason.trim()) {
        throw new Error("Please describe what went wrong.");
      }

      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("disputes").insert({
        match_id: matchId,
        opened_by: user.id,
        reason: reason.trim(),
        status: "open",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setDisputeReason("");
      setShowDisputeForm(false);
      Alert.alert(
        "Success",
        "Dispute submitted. Our support team will reach out shortly."
      );
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error.message || "Unable to submit dispute. Please try again."
      );
    },
  });

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      await sendMessageMutation.mutateAsync(message.trim());
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDisputeSubmit = () => {
    if (!disputeReason.trim()) {
      Alert.alert("Error", "Please describe what went wrong.");
      return;
    }
    openDisputeMutation.mutate(disputeReason);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (conversation?.messages) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversation?.messages]);

  if (!match || !conversation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#14b8a6" />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const trip = Array.isArray(match.trips) ? match.trips[0] : match.trips;
  const request = Array.isArray(match.requests)
    ? match.requests[0]
    : match.requests;
  const isRequester = request?.user_id === user?.id;
  const canPay =
    isRequester && (match.status === "chatting" || match.status === "pending");
  const canOpenDispute = [
    "escrow_paid",
    "delivered",
    "completed",
    "disputed",
  ].includes(match.status);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {isRequester
                ? `${trip?.from_location} → ${trip?.to_location}`
                : `${request?.from_location} → ${request?.to_location}`}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isRequester ? "Traveler" : "Requester"}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {conversation.messages.map((msg: Message) => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  isOwn && styles.messageWrapperOwn,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isOwn ? styles.messageTextOwn : styles.messageTextOther,
                    ]}
                  >
                    {msg.content}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      isOwn ? styles.messageTimeOwn : styles.messageTimeOther,
                    ]}
                  >
                    {format(new Date(msg.created_at), "HH:mm")}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Payment Button (Requester only) */}
        {canPay && <PaymentButtonMobile match={match} matchId={matchId} />}

        {/* Delivery Confirmation (Traveler) */}
        {!isRequester && match.status === "escrow_paid" && (
          <DeliveryConfirmationMobile matchId={matchId} />
        )}

        {/* Confirm Delivery Button (Requester) */}
        {isRequester && match.status === "delivered" && (
          <ConfirmDeliveryButtonMobile matchId={matchId} />
        )}

        {/* Rating Section */}
        {match.status === "completed" && otherUserId && (
          <RatingSectionMobile matchId={matchId} otherUserId={otherUserId} />
        )}

        {/* Template Messages */}
        {(match.status === "pending" || match.status === "chatting") && (
          <TemplateMessagesMobile
            match={match}
            isRequester={isRequester}
            onSelect={(text) => setMessage(text)}
          />
        )}

        {/* Dispute Section */}
        {canOpenDispute && (
          <View style={styles.actionSection}>
            {showDisputeForm ? (
              <View style={styles.disputeForm}>
                <Text style={styles.disputeFormTitle}>Open Dispute</Text>
                <TextInput
                  style={styles.disputeInput}
                  value={disputeReason}
                  onChangeText={setDisputeReason}
                  placeholder="Describe the issue so we can help..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <View style={styles.disputeButtons}>
                  <TouchableOpacity
                    style={styles.disputeButtonCancel}
                    onPress={() => {
                      setShowDisputeForm(false);
                      setDisputeReason("");
                    }}
                  >
                    <Text style={styles.disputeButtonCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.disputeButtonSubmit}
                    onPress={handleDisputeSubmit}
                    disabled={openDisputeMutation.isPending}
                  >
                    {openDisputeMutation.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.disputeButtonSubmitText}>Submit</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.disputeButton}
                onPress={() => setShowDisputeForm(true)}
              >
                <MaterialIcons name="help-outline" size={20} color="#14b8a6" />
                <Text style={styles.disputeButtonText}>
                  Need help? Open dispute
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Message Input */}
        {(match.status === "chatting" || match.status === "pending") && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!message.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!message.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <MaterialIcons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageWrapper: {
    marginBottom: 12,
    maxWidth: "80%",
  },
  messageWrapperOwn: {
    alignSelf: "flex-end",
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
  },
  messageBubbleOwn: {
    backgroundColor: "#14b8a6",
  },
  messageBubbleOther: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: "#fff",
  },
  messageTextOther: {
    color: "#333",
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  messageTimeOwn: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  messageTimeOther: {
    color: "#666",
  },
  actionSection: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  paymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#14b8a6",
    borderRadius: 8,
    padding: 16,
  },
  paymentButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disputeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f0fdfa",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#14b8a6",
  },
  disputeButtonText: {
    color: "#14b8a6",
    fontSize: 14,
    fontWeight: "600",
  },
  disputeForm: {
    gap: 12,
  },
  disputeFormTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  disputeInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
    minHeight: 100,
  },
  disputeButtons: {
    flexDirection: "row",
    gap: 12,
  },
  disputeButtonCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  disputeButtonCancelText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  disputeButtonSubmit: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#14b8a6",
    alignItems: "center",
  },
  disputeButtonSubmitText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    padding: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#333",
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#14b8a6",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
