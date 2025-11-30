/**
 * Support & Disputes Page - Mobile
 * Contact support and manage disputes
 */

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@sparecarry/lib/supabase";
import { useAuth } from "@sparecarry/hooks/useAuth";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { format } from "date-fns";

interface DisputeRecord {
  id: string;
  match_id: string;
  reason: string;
  status: "open" | "resolved" | "rejected";
  resolution_notes?: string | null;
  created_at: string;
}

interface EligibleMatch {
  id: string;
  status: string;
  reward_amount: number;
  created_at: string;
  route: {
    from: string;
    to: string;
  };
  request_title: string;
  other_party_email: string;
  trip_type: string;
  departure_date?: string;
}

interface SupportTicket {
  id: string;
  ticket_id: string;
  subject: string;
  initial_message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  updated_at: string;
  resolution_notes?: string | null;
}

interface SupportTicketMessage {
  id: string;
  message: string;
  is_from_support: boolean;
  created_at: string;
}

export default function SupportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(
    null
  );
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [ticketFilter, setTicketFilter] = useState<
    "all" | "open" | "in_progress" | "resolved" | "closed"
  >("all");
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [showMatchSelection, setShowMatchSelection] = useState(false);
  const [selectedMatchForDispute, setSelectedMatchForDispute] =
    useState<EligibleMatch | null>(null);

  // Fetch user's support tickets
  const {
    data: tickets,
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useQuery({
    queryKey: ["user-support-tickets", user?.id, ticketFilter],
    queryFn: async () => {
      if (!user?.id) return [];
      const appUrl = process.env.EXPO_PUBLIC_APP_URL || "http://localhost:3000";
      const url =
        ticketFilter === "all"
          ? `${appUrl}/api/support/tickets`
          : `${appUrl}/api/support/tickets?status=${ticketFilter}`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }

      const data = await response.json();
      return data.tickets || [];
    },
    enabled: !!user?.id,
  });

  // Fetch messages for selected ticket
  const { data: ticketMessages, isLoading: messagesLoading } = useQuery<
    SupportTicketMessage[]
  >({
    queryKey: ["ticket-messages", selectedTicket?.ticket_id],
    queryFn: async () => {
      if (!selectedTicket?.ticket_id) return [];
      const appUrl = process.env.EXPO_PUBLIC_APP_URL || "http://localhost:3000";
      const response = await fetch(
        `${appUrl}/api/support/tickets/${selectedTicket.ticket_id}/messages`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      return data.messages || [];
    },
    enabled: !!selectedTicket?.ticket_id,
  });

  // Fetch eligible matches for disputes
  const { data: eligibleMatches, isLoading: matchesLoading } = useQuery<
    EligibleMatch[]
  >({
    queryKey: ["eligible-matches-for-dispute", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const appUrl = process.env.EXPO_PUBLIC_APP_URL || "http://localhost:3000";
      const response = await fetch(
        `${appUrl}/api/matches/eligible-for-dispute`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch matches");
      }

      const data = await response.json();
      return data.matches || [];
    },
    enabled: !!user?.id && showMatchSelection,
  });

  // Fetch user's disputes
  const { data: disputes, isLoading: disputesLoading } = useQuery<
    DisputeRecord[]
  >({
    queryKey: ["user-disputes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("disputes")
        .select("*")
        .or(
          `opened_by.eq.${user.id},match_id.in.(select id from matches where requester_id.eq.${user.id} or traveler_id.eq.${user.id})`
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as DisputeRecord[];
    },
    enabled: !!user?.id,
  });

  // Submit support ticket mutation
  const submitSupportMutation = useMutation({
    mutationFn: async () => {
      if (!subject.trim() || !message.trim()) {
        throw new Error("Please fill in all fields");
      }

      const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const appUrl = process.env.EXPO_PUBLIC_APP_URL || "http://localhost:3000";
      const apiUrl = `${appUrl}/api/support/contact`;

      console.log("[Support] Sending support message to:", apiUrl);
      console.log("[Support] Ticket ID:", ticketId);
      console.log("[Support] Subject:", subject.trim());

      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          subject: subject.trim(),
          message: message.trim(),
          userEmail: user?.email,
          userId: user?.id,
          matchId: selectedMatchId,
        }),
        signal: controller.signal,
      }).catch((fetchError) => {
        clearTimeout(timeoutId);
        console.error("[Support] Network error:", fetchError);
        if (fetchError.name === "AbortError") {
          throw new Error(
            "Request timed out. Is the Next.js server running on port 3000?"
          );
        }
        throw new Error(
          "Network error: Unable to connect to the server. Please check your internet connection and try again."
        );
      });

      clearTimeout(timeoutId);
      console.log("[Support] API response status:", response.status);

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => ({ error: "Failed to send support request" }));
        console.error("[Support] API error:", data);
        throw new Error(data.error || "Failed to send support request");
      }

      const data = await response.json();
      console.log("[Support] Success:", data);
      return ticketId;
    },
    onSuccess: (ticketId) => {
      setSubject("");
      setMessage("");
      setShowSupportForm(false);
      setSubmittedTicketId(ticketId);
      // Refresh tickets list
      refetchTickets();
      // Clear the ticket ID after 10 seconds
      setTimeout(() => setSubmittedTicketId(null), 10000);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to submit support request");
    },
  });

  // Follow-up message mutation
  const followUpMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!selectedTicket) throw new Error("No ticket selected");

      const appUrl = process.env.EXPO_PUBLIC_APP_URL || "http://localhost:3000";
      const response = await fetch(`${appUrl}/api/support/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.ticket_id,
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send follow-up message");
      }

      return response.json();
    },
    onSuccess: () => {
      setFollowUpMessage("");
      setShowFollowUpForm(false);
      queryClient.invalidateQueries({
        queryKey: ["ticket-messages", selectedTicket?.ticket_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-support-tickets", user?.id],
      });
      Alert.alert("Success", "Follow-up message sent!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to send follow-up message");
    },
  });

  // Open dispute mutation
  const openDisputeMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (!reason.trim()) {
        throw new Error("Please describe what went wrong.");
      }

      if (!user) throw new Error("Not authenticated");
      if (!selectedMatchId) throw new Error("No match selected");

      const { error } = await supabase.from("disputes").insert({
        match_id: selectedMatchId,
        opened_by: user.id,
        reason: reason.trim(),
        status: "open",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setDisputeReason("");
      setShowDisputeForm(false);
      setSelectedMatchId(null);
      setSelectedMatchForDispute(null);
      setShowMatchSelection(false);
      queryClient.invalidateQueries({ queryKey: ["user-disputes", user?.id] });
      queryClient.invalidateQueries({
        queryKey: ["eligible-matches-for-dispute", user?.id],
      });
      Alert.alert(
        "Success",
        "Dispute submitted. Our support team will reach out shortly."
      );
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error.message || "Unable to submit dispute. Please try again."
      );
    },
  });

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <MaterialIcons name="person-off" size={48} color="#999" />
          <Text style={styles.errorText}>Please log in to access support</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support & Disputes</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Support Form */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="help-outline" size={24} color="#14b8a6" />
            <Text style={styles.sectionTitle}>Contact Support</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Have a question or need help? Send us a message and we'll get back
            to you.
          </Text>

          {submittedTicketId ? (
            <View style={styles.successCard}>
              <MaterialIcons name="check-circle" size={32} color="#10b981" />
              <Text style={styles.successTitle}>
                Support Request Submitted!
              </Text>
              <Text style={styles.successText}>Your ticket number:</Text>
              <View style={styles.ticketContainer}>
                <Text style={styles.ticketNumber}>{submittedTicketId}</Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={async () => {
                    await Clipboard.setStringAsync(submittedTicketId);
                    Alert.alert("Copied!", "Ticket number copied to clipboard");
                  }}
                >
                  <MaterialIcons
                    name="content-copy"
                    size={20}
                    color="#14b8a6"
                  />
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.successSubtext}>
                {process.env.EXPO_PUBLIC_DEV_MODE === "true"
                  ? "In dev mode, your message was logged to the console. In production, you will receive a confirmation email."
                  : "We've received your message and will respond via email soon."}
              </Text>
            </View>
          ) : showSupportForm ? (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="Subject *"
                placeholderTextColor="#999"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Message *"
                placeholderTextColor="#999"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowSupportForm(false);
                    setSubject("");
                    setMessage("");
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => submitSupportMutation.mutate()}
                  disabled={submitSupportMutation.isPending}
                >
                  {submitSupportMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="send" size={20} color="#fff" />
                      <Text style={styles.submitButtonText}>Send</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowSupportForm(true)}
            >
              <MaterialIcons name="mail-outline" size={20} color="#14b8a6" />
              <Text style={styles.actionButtonText}>Send Support Message</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* My Support Tickets Section */}
        {selectedTicket ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TouchableOpacity
                onPress={() => setSelectedTicket(null)}
                style={styles.backButton}
              >
                <MaterialIcons name="arrow-back" size={20} color="#333" />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Ticket Details</Text>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.ticketDetailCard}>
              <View style={styles.ticketDetailHeader}>
                <View
                  style={[
                    styles.statusBadge,
                    selectedTicket.status === "open" && styles.statusBadgeOpen,
                    selectedTicket.status === "in_progress" &&
                      styles.statusBadgeInProgress,
                    selectedTicket.status === "resolved" &&
                      styles.statusBadgeResolved,
                    selectedTicket.status === "closed" &&
                      styles.statusBadgeClosed,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {selectedTicket.status.replace("_", " ")}
                  </Text>
                </View>
                <Text style={styles.ticketIdText}>
                  {selectedTicket.ticket_id}
                </Text>
              </View>
              <Text style={styles.ticketSubject}>{selectedTicket.subject}</Text>
              <Text style={styles.ticketDate}>
                Created:{" "}
                {format(
                  new Date(selectedTicket.created_at),
                  "MMM d, yyyy h:mm a"
                )}
              </Text>

              {/* Messages */}
              {messagesLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#14b8a6"
                  style={{ marginVertical: 16 }}
                />
              ) : ticketMessages && ticketMessages.length > 0 ? (
                <View style={styles.messagesContainer}>
                  {ticketMessages.map((msg) => (
                    <View
                      key={msg.id}
                      style={[
                        styles.messageBubble,
                        msg.is_from_support
                          ? styles.messageBubbleSupport
                          : styles.messageBubbleUser,
                      ]}
                    >
                      <Text style={styles.messageText}>{msg.message}</Text>
                      <Text style={styles.messageTime}>
                        {format(new Date(msg.created_at), "MMM d, h:mm a")}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.initialMessage}>
                  <Text style={styles.initialMessageText}>
                    {selectedTicket.initial_message}
                  </Text>
                  <Text style={styles.messageTime}>
                    {format(
                      new Date(selectedTicket.created_at),
                      "MMM d, h:mm a"
                    )}
                  </Text>
                </View>
              )}

              {/* Resolution Notes */}
              {selectedTicket.resolution_notes && (
                <View style={styles.resolutionBox}>
                  <Text style={styles.resolutionTitle}>Resolution:</Text>
                  <Text style={styles.resolutionText}>
                    {selectedTicket.resolution_notes}
                  </Text>
                </View>
              )}

              {/* Follow-up Form */}
              {selectedTicket.status !== "closed" &&
                selectedTicket.status !== "resolved" && (
                  <>
                    {showFollowUpForm ? (
                      <View style={styles.followUpForm}>
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={followUpMessage}
                          onChangeText={setFollowUpMessage}
                          placeholder="Add a follow-up message..."
                          placeholderTextColor="#999"
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                        />
                        <View style={styles.formButtons}>
                          <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                              setShowFollowUpForm(false);
                              setFollowUpMessage("");
                            }}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.submitButton}
                            onPress={() =>
                              followUpMutation.mutate(followUpMessage)
                            }
                            disabled={
                              followUpMutation.isPending ||
                              !followUpMessage.trim()
                            }
                          >
                            {followUpMutation.isPending ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <>
                                <MaterialIcons
                                  name="send"
                                  size={20}
                                  color="#fff"
                                />
                                <Text style={styles.submitButtonText}>
                                  Send
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.followUpButton}
                        onPress={() => setShowFollowUpForm(true)}
                      >
                        <MaterialIcons name="reply" size={20} color="#14b8a6" />
                        <Text style={styles.followUpButtonText}>
                          Add Follow-up Message
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
            </View>
          </View>
        ) : !ticketsLoading && tickets && tickets.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="history" size={24} color="#14b8a6" />
              <Text style={styles.sectionTitle}>My Support Tickets</Text>
            </View>
            <Text style={styles.sectionDescription}>
              View and manage your support requests.
            </Text>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
              {(
                ["all", "open", "in_progress", "resolved", "closed"] as const
              ).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterButton,
                    ticketFilter === filter && styles.filterButtonActive,
                  ]}
                  onPress={() => setTicketFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      ticketFilter === filter && styles.filterButtonTextActive,
                    ]}
                  >
                    {filter === "all" ? "All" : filter.replace("_", " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.ticketsList}>
              {tickets.map((ticket: SupportTicket) => (
                <TouchableOpacity
                  key={ticket.id}
                  style={styles.ticketCard}
                  onPress={() => setSelectedTicket(ticket)}
                >
                  <View style={styles.ticketCardHeader}>
                    <View
                      style={[
                        styles.statusBadge,
                        ticket.status === "open" && styles.statusBadgeOpen,
                        ticket.status === "in_progress" &&
                          styles.statusBadgeInProgress,
                        ticket.status === "resolved" &&
                          styles.statusBadgeResolved,
                        ticket.status === "closed" && styles.statusBadgeClosed,
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {ticket.status.replace("_", " ")}
                      </Text>
                    </View>
                    <Text style={styles.ticketCardDate}>
                      {format(new Date(ticket.created_at), "MMM d, yyyy")}
                    </Text>
                  </View>
                  <Text style={styles.ticketCardSubject} numberOfLines={1}>
                    {ticket.subject}
                  </Text>
                  <Text style={styles.ticketCardId}>{ticket.ticket_id}</Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color="#999"
                    style={styles.chevron}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* Disputes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="gavel" size={24} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Your Disputes</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Track and manage disputes for your deliveries.
          </Text>

          {disputesLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#f59e0b" />
            </View>
          ) : disputes && disputes.length > 0 ? (
            <View style={styles.disputesList}>
              {disputes.map((dispute) => (
                <TouchableOpacity
                  key={dispute.id}
                  style={styles.disputeCard}
                  onPress={() => {
                    // Could navigate to dispute detail in the future
                    Alert.alert(
                      "Dispute Details",
                      `Status: ${dispute.status}\n\nReason: ${dispute.reason}${dispute.resolution_notes ? `\n\nResolution: ${dispute.resolution_notes}` : ""}`,
                      [{ text: "OK" }]
                    );
                  }}
                >
                  <View style={styles.disputeHeader}>
                    <View
                      style={[
                        styles.statusBadge,
                        dispute.status === "open" && styles.statusBadgeOpen,
                        dispute.status === "resolved" &&
                          styles.statusBadgeResolved,
                        dispute.status === "rejected" &&
                          styles.statusBadgeRejected,
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {dispute.status}
                      </Text>
                    </View>
                    <Text style={styles.disputeDate}>
                      {format(new Date(dispute.created_at), "MMM d, yyyy")}
                    </Text>
                  </View>
                  <Text style={styles.disputeReason} numberOfLines={2}>
                    {dispute.reason}
                  </Text>
                  {dispute.resolution_notes && (
                    <View style={styles.resolutionNotes}>
                      <Text style={styles.resolutionNotesTitle}>
                        Resolution:
                      </Text>
                      <Text
                        style={styles.resolutionNotesText}
                        numberOfLines={2}
                      >
                        {dispute.resolution_notes}
                      </Text>
                    </View>
                  )}
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color="#999"
                    style={styles.chevron}
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {showMatchSelection ? (
            <View style={{ marginTop: 16 }}>
              <View style={styles.sectionHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setShowMatchSelection(false);
                    setSelectedMatchForDispute(null);
                  }}
                  style={styles.backButton}
                >
                  <MaterialIcons name="arrow-back" size={20} color="#333" />
                </TouchableOpacity>
                <Text style={styles.sectionTitle}>Select Match to Dispute</Text>
                <View style={styles.headerSpacer} />
              </View>
              <Text style={styles.sectionDescription}>
                Select the match you want to dispute. You can only dispute
                matches that are in progress.
              </Text>

              {matchesLoading ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color="#f59e0b" />
                </View>
              ) : eligibleMatches && eligibleMatches.length > 0 ? (
                <View style={styles.matchesList}>
                  {eligibleMatches.map((match) => (
                    <TouchableOpacity
                      key={match.id}
                      style={styles.matchCard}
                      onPress={() => {
                        setSelectedMatchForDispute(match);
                        setSelectedMatchId(match.id);
                        setShowMatchSelection(false);
                        setShowDisputeForm(true);
                      }}
                    >
                      <View style={styles.matchCardHeader}>
                        <View style={styles.matchStatusBadge}>
                          <Text style={styles.matchStatusText}>
                            {match.status.replace("_", " ")}
                          </Text>
                        </View>
                        <Text style={styles.matchDate}>
                          {format(new Date(match.created_at), "MMM d, yyyy")}
                        </Text>
                      </View>
                      <Text style={styles.matchTitle} numberOfLines={1}>
                        {match.request_title}
                      </Text>
                      <View style={styles.matchRoute}>
                        <MaterialIcons
                          name="location-on"
                          size={16}
                          color="#666"
                        />
                        <Text style={styles.matchRouteText}>
                          {match.route.from} → {match.route.to}
                        </Text>
                      </View>
                      <View style={styles.matchDetails}>
                        <Text style={styles.matchReward}>
                          ${Number(match.reward_amount).toFixed(2)}
                        </Text>
                        <Text style={styles.matchOtherParty}>
                          With: {match.other_party_email}
                        </Text>
                      </View>
                      <MaterialIcons
                        name="chevron-right"
                        size={20}
                        color="#999"
                        style={styles.chevron}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <MaterialIcons
                    name="check-circle-outline"
                    size={48}
                    color="#10b981"
                  />
                  <Text style={styles.emptyStateText}>
                    No matches available
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    You don't have any active matches that can be disputed.
                  </Text>
                </View>
              )}
            </View>
          ) : showDisputeForm ? (
            <View style={{ marginTop: 16 }}>
              {selectedMatchForDispute && (
                <View style={styles.selectedMatchCard}>
                  <View style={styles.selectedMatchHeader}>
                    <MaterialIcons
                      name="info-outline"
                      size={20}
                      color="#f59e0b"
                    />
                    <Text style={styles.selectedMatchTitle}>
                      Disputing Match
                    </Text>
                  </View>
                  <Text style={styles.selectedMatchText} numberOfLines={1}>
                    {selectedMatchForDispute.request_title}
                  </Text>
                  <Text style={styles.selectedMatchRoute}>
                    {selectedMatchForDispute.route.from} →{" "}
                    {selectedMatchForDispute.route.to}
                  </Text>
                </View>
              )}
              <View style={styles.form}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={disputeReason}
                  onChangeText={setDisputeReason}
                  placeholder="Describe the issue so we can help... *"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowDisputeForm(false);
                      setDisputeReason("");
                      setSelectedMatchId(null);
                      setSelectedMatchForDispute(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={() => openDisputeMutation.mutate(disputeReason)}
                    disabled={
                      openDisputeMutation.isPending || !disputeReason.trim()
                    }
                  >
                    {openDisputeMutation.isPending ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons name="gavel" size={20} color="#fff" />
                        <Text style={styles.submitButtonText}>
                          Open Dispute
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.disputeButton]}
              onPress={() => setShowMatchSelection(true)}
            >
              <MaterialIcons name="gavel" size={20} color="#f59e0b" />
              <Text style={[styles.actionButtonText, styles.disputeButtonText]}>
                Open New Dispute
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "600",
  },
  loginButton: {
    marginTop: 16,
    backgroundColor: "#14b8a6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f0fdfa",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#14b8a6",
  },
  actionButtonText: {
    color: "#14b8a6",
    fontSize: 16,
    fontWeight: "600",
  },
  disputeButton: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
  },
  disputeButtonText: {
    color: "#f59e0b",
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  textArea: {
    minHeight: 120,
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#14b8a6",
    borderRadius: 8,
    padding: 12,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  disputesList: {
    gap: 12,
    marginBottom: 16,
  },
  disputeCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    position: "relative",
  },
  disputeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeOpen: {
    backgroundColor: "#fef3c7",
  },
  statusBadgeResolved: {
    backgroundColor: "#d1fae5",
  },
  statusBadgeRejected: {
    backgroundColor: "#fee2e2",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  disputeDate: {
    fontSize: 12,
    color: "#666",
  },
  disputeReason: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  resolutionNotes: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  resolutionNotesTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  resolutionNotesText: {
    fontSize: 14,
    color: "#333",
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  contactSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  contactTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  contactEmail: {
    fontSize: 16,
    color: "#14b8a6",
    fontWeight: "600",
  },
  successCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#10b981",
    marginTop: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 12,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  ticketContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d1fae5",
    marginBottom: 12,
  },
  ticketNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#14b8a6",
    fontFamily: "monospace",
    flex: 1,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0fdfa",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#14b8a6",
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#14b8a6",
  },
  successSubtext: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterButtonActive: {
    backgroundColor: "#14b8a6",
    borderColor: "#14b8a6",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    textTransform: "capitalize",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  ticketsList: {
    gap: 12,
  },
  ticketCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    position: "relative",
  },
  ticketCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ticketCardSubject: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  ticketCardId: {
    fontSize: 12,
    color: "#999",
    fontFamily: "monospace",
  },
  ticketCardDate: {
    fontSize: 12,
    color: "#666",
  },
  chevron: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -10,
  },
  ticketDetailCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  ticketDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ticketIdText: {
    fontSize: 14,
    fontFamily: "monospace",
    color: "#14b8a6",
    fontWeight: "600",
  },
  ticketSubject: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  ticketDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 16,
  },
  messagesContainer: {
    gap: 12,
    marginBottom: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 8,
    maxWidth: "85%",
  },
  messageBubbleUser: {
    backgroundColor: "#f0fdfa",
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: "#14b8a6",
  },
  messageBubbleSupport: {
    backgroundColor: "#f9fafb",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  messageText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 10,
    color: "#999",
  },
  initialMessage: {
    backgroundColor: "#f0fdfa",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#14b8a6",
    marginBottom: 16,
  },
  initialMessageText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  resolutionBox: {
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f59e0b",
    marginBottom: 16,
  },
  resolutionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400e",
    marginBottom: 4,
  },
  resolutionText: {
    fontSize: 14,
    color: "#78350f",
  },
  followUpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f0fdfa",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#14b8a6",
    marginTop: 16,
  },
  followUpButtonText: {
    color: "#14b8a6",
    fontSize: 14,
    fontWeight: "600",
  },
  followUpForm: {
    marginTop: 16,
    gap: 12,
  },
  statusBadgeInProgress: {
    backgroundColor: "#dbeafe",
  },
  statusBadgeClosed: {
    backgroundColor: "#e5e7eb",
  },
  matchesList: {
    gap: 12,
    marginTop: 16,
  },
  matchCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    position: "relative",
  },
  matchCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  matchStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
  },
  matchStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e40af",
    textTransform: "capitalize",
  },
  matchDate: {
    fontSize: 12,
    color: "#666",
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  matchRoute: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  matchRouteText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  matchDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  matchReward: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10b981",
  },
  matchOtherParty: {
    fontSize: 12,
    color: "#999",
  },
  selectedMatchCard: {
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  selectedMatchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  selectedMatchTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400e",
  },
  selectedMatchText: {
    fontSize: 14,
    color: "#78350f",
    marginBottom: 4,
  },
  selectedMatchRoute: {
    fontSize: 12,
    color: "#92400e",
  },
});
