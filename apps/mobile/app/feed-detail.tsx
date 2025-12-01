/**
 * Feed Detail Screen - Mobile
 * Shows full details of a trip or request with messaging options
 */

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@sparecarry/lib/supabase";
import { useAuth } from "@sparecarry/hooks/useAuth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { format } from "date-fns";

interface FeedItem {
  id: string;
  type: "trip" | "request";
  from_location: string;
  to_location: string;
  departure_date?: string;
  eta_window_start?: string;
  eta_window_end?: string;
  deadline_earliest?: string;
  deadline_latest?: string;
  reward_amount?: number;
  spare_kg?: number;
  spare_volume_liters?: number;
  max_reward?: number;
  user_id: string;
  created_at: string;
  title?: string;
  description?: string;
  weight_kg?: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  preferred_method?: string;
  restricted_items?: boolean;
  emergency?: boolean;
}

async function fetchItemDetails(
  id: string,
  type: "trip" | "request"
): Promise<FeedItem | null> {
  const supabase = createClient();
  const table = type === "trip" ? "trips" : "requests";

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching item details:", error);
    return null;
  }

  return {
    ...data,
    type,
  } as FeedItem;
}

async function createMatch(
  tripId: string,
  requestId: string
): Promise<string | null> {
  const supabase = createClient();

  // Check if match already exists
  const { data: existingMatch } = await supabase
    .from("matches")
    .select("id")
    .eq("trip_id", tripId)
    .eq("request_id", requestId)
    .maybeSingle();

  if (existingMatch) {
    return existingMatch.id;
  }

  // Get request to get reward amount
  const { data: request } = await supabase
    .from("requests")
    .select("max_reward")
    .eq("id", requestId)
    .maybeSingle();

  // Create new match
  const rewardAmount = request?.max_reward || 1; // Minimum 1 to satisfy CHECK constraint
  
  const { data, error } = await supabase
    .from("matches")
    .insert({
      trip_id: tripId,
      request_id: requestId,
      status: "pending",
      reward_amount: rewardAmount,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating match:", error);
    console.error("Match data attempted:", { trip_id: tripId, request_id: requestId, reward_amount: rewardAmount });
    return null;
  }

  if (!data) {
    console.error("Match created but no data returned");
    return null;
  }

  // Ensure conversation exists (trigger should create it, but ensure it exists)
  const { data: existingConv } = await supabase
    .from("conversations")
    .select("id")
    .eq("match_id", data.id)
    .maybeSingle();

  if (!existingConv) {
    const { error: convError } = await supabase
      .from("conversations")
      .insert({
        match_id: data.id,
      });

    if (convError) {
      console.error("Error creating conversation:", convError);
      // Don't fail - conversation might be created by trigger or may already exist
    }
  }

  return data.id;
}

export default function FeedDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const supabase = createClient();

  const itemId = params.id as string;
  const itemType = (params.type as "trip" | "request") || "request";
  const [loading, setLoading] = useState(false);

  const { data: item, isLoading } = useQuery<FeedItem | null>({
    queryKey: ["feed-item", itemId, itemType],
    queryFn: () => fetchItemDetails(itemId, itemType),
    enabled: !!itemId,
  });


  const isInvolved = user?.id === item?.user_id;

  const handleMessage = async () => {
    if (!user) {
      Alert.alert("Login Required", "Please log in to message this user");
      router.push("/auth/login");
      return;
    }

    if (isInvolved) {
      Alert.alert("Cannot Message", "You cannot message yourself");
      return;
    }

    if (!item) return;

    setLoading(true);
    try {
      // For in-app messaging, we need both a trip and a request to create a match
      // If user doesn't have one, we'll create a placeholder so they can message
      
      let tripId: string | null = null;
      let requestId: string | null = null;

      if (itemType === "request") {
        // User clicked on a request - they want to offer their trip
        requestId = item.id;
        
        // Find user's active trip that matches this request
        const { data: userTrips, error: tripQueryError } = await supabase
          .from("trips")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .eq("from_location", item.from_location)
          .eq("to_location", item.to_location)
          .limit(1)
          .maybeSingle();

        if (userTrips) {
          tripId = userTrips.id;
        } else {
          // Create a placeholder trip so user can message
          // Use the request's preferred method, or default to "plane"
          const tripType = (item as any).preferred_method === "boat" ? "boat" : "plane";
          const { data: newTrip, error: tripError } = await supabase
            .from("trips")
            .insert({
              user_id: user.id,
              type: tripType,
              from_location: item.from_location,
              to_location: item.to_location,
              departure_date: new Date().toISOString().split("T")[0],
              eta_window_start: new Date().toISOString(),
              eta_window_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
              spare_kg: 10, // Placeholder
              spare_volume_liters: 10, // Placeholder
              status: "active",
            })
            .select()
            .single();

          if (tripError || !newTrip) {
            Alert.alert("Error", "Failed to create trip. Please try again.");
            setLoading(false);
            return;
          }
          tripId = newTrip.id;
        }
      } else {
        // User clicked on a trip - they want to create a request
        tripId = item.id;
        
        // Find user's open request that matches this trip
        const { data: userRequests, error: requestQueryError } = await supabase
          .from("requests")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "open")
          .eq("from_location", item.from_location)
          .eq("to_location", item.to_location)
          .limit(1)
          .maybeSingle();

        if (userRequests) {
          requestId = userRequests.id;
        } else {
          // Create a placeholder request so user can message
          const { data: newRequest, error: requestError } = await supabase
            .from("requests")
            .insert({
              user_id: user.id,
              title: "Delivery Request",
              from_location: item.from_location,
              to_location: item.to_location,
              deadline_latest: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days from now
              max_reward: 100, // Placeholder
              weight_kg: 1, // Placeholder
              status: "open",
            })
            .select()
            .single();

          if (requestError || !newRequest) {
            Alert.alert("Error", "Failed to create request. Please try again.");
            setLoading(false);
            return;
          }
          requestId = newRequest.id;
        }
      }

      if (!tripId || !requestId) {
        Alert.alert("Error", "Unable to create match. Missing trip or request.");
        setLoading(false);
        return;
      }

      const matchId = await createMatch(tripId, requestId);

      if (matchId) {
        // Navigate to in-app chat
        router.push(`/messages/${matchId}`);
      } else {
        console.error("Failed to create match - matchId is null");
        Alert.alert("Error", "Failed to create match. Please try again.");
      }
    } catch (error: any) {
      console.error("Error in handleMessage:", error);
      const errorMessage = error?.message || error?.error?.message || "Failed to start conversation";
      console.error("Full error details:", JSON.stringify(error, null, 2));
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Item not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isTrip = item.type === "trip";
  const dateStr = isTrip
    ? item.departure_date
      ? format(new Date(item.departure_date), "MMMM d, yyyy")
      : item.eta_window_start
        ? `${format(new Date(item.eta_window_start), "MMM d")} - ${format(new Date(item.eta_window_end || item.eta_window_start), "MMM d, yyyy")}`
        : "Flexible"
    : item.deadline_latest
      ? format(new Date(item.deadline_latest), "MMMM d, yyyy")
      : "No deadline";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isTrip ? "Trip Details" : "Request Details"}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons
            name={isTrip ? "flight" : "inventory-2"}
            size={32}
            color="#14b8a6"
          />
          <View style={styles.badgeContainer}>
            {item.emergency && (
              <View style={[styles.badge, styles.emergencyBadge]}>
                <MaterialIcons name="flash-on" size={16} color="#fff" />
                <Text style={styles.badgeText}>Emergency</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.title}>
          {isTrip
            ? `${item.from_location} → ${item.to_location}`
            : item.title || "Delivery Request"}
        </Text>

        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color="#666" />
            <Text style={styles.infoText}>
              {item.from_location} → {item.to_location}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons name="calendar-today" size={20} color="#666" />
            <Text style={styles.infoText}>{dateStr}</Text>
          </View>

          {isTrip ? (
            <>
              {item.spare_kg && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="scale" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    {item.spare_kg}kg available
                  </Text>
                </View>
              )}
              {item.spare_volume_liters && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="inventory" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    {item.spare_volume_liters}L available
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              {item.max_reward && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="attach-money" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    Reward: ${item.max_reward}
                  </Text>
                </View>
              )}
              {item.weight_kg && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="scale" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    Weight: {item.weight_kg}kg
                  </Text>
                </View>
              )}
              {item.length_cm && item.width_cm && item.height_cm && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="straighten" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    Dimensions: {item.length_cm} × {item.width_cm} ×{" "}
                    {item.height_cm} cm
                  </Text>
                </View>
              )}
              {item.preferred_method && (
                <View style={styles.infoRow}>
                  <MaterialIcons
                    name={
                      item.preferred_method === "plane"
                        ? "flight"
                        : item.preferred_method === "boat"
                          ? "directions-boat"
                          : "swap-horiz"
                    }
                    size={20}
                    color="#666"
                  />
                  <Text style={styles.infoText}>
                    Preferred: {item.preferred_method}
                  </Text>
                </View>
              )}
              {item.restricted_items && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="warning" size={20} color="#f59e0b" />
                  <Text style={styles.infoText}>
                    Restricted items (boat only)
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {!isInvolved && (
          <TouchableOpacity
            style={[
              styles.messageButton,
              loading && styles.messageButtonDisabled,
            ]}
            onPress={handleMessage}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="chat" size={20} color="#fff" />
                <Text style={styles.messageButtonText}>Message</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isInvolved && (
          <View style={styles.ownItemNote}>
            <MaterialIcons name="info" size={20} color="#14b8a6" />
            <Text style={styles.ownItemNoteText}>
              This is your {isTrip ? "trip" : "request"}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emergencyBadge: {
    backgroundColor: "#ef4444",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 20,
  },
  infoSection: {
    gap: 12,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#25D366",
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  messageButtonDisabled: {
    opacity: 0.6,
  },
  messageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  ownItemNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0fdfa",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  ownItemNoteText: {
    fontSize: 14,
    color: "#14b8a6",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "600",
  },
  backButtonText: {
    color: "#14b8a6",
    fontSize: 16,
    fontWeight: "600",
  },
});
