/**
 * Feed Detail Screen - Mobile
 * Shows full details of a trip or request with messaging options
 */

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@sparecarry/lib/supabase";
import { useAuth } from "@sparecarry/hooks/useAuth";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { format } from "date-fns";
import * as LinkingModule from "expo-linking";

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

async function fetchUserPhone(userId: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("phone")
    .eq("user_id", userId)
    .single();

  if (error || !data?.phone) {
    return null;
  }

  return data.phone;
}

async function createMatch(
  requesterId: string,
  travelerId: string,
  requestId?: string,
  tripId?: string
): Promise<string | null> {
  const supabase = createClient();

  // Check if match already exists
  const { data: existingMatch } = await supabase
    .from("matches")
    .select("id")
    .or(
      `and(requester_id.eq.${requesterId},traveler_id.eq.${travelerId}),and(requester_id.eq.${travelerId},traveler_id.eq.${requesterId})`
    )
    .eq("request_id", requestId || "")
    .eq("trip_id", tripId || "")
    .single();

  if (existingMatch) {
    return existingMatch.id;
  }

  // Create new match
  const { data, error } = await supabase
    .from("matches")
    .insert({
      requester_id: requesterId,
      traveler_id: travelerId,
      request_id: requestId || null,
      trip_id: tripId || null,
      status: "pending",
      reward_amount: 0, // Will be set later
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating match:", error);
    return null;
  }

  return data.id;
}

function openWhatsApp(phone: string, message: string) {
  // Remove any non-numeric characters except +
  const cleanPhone = phone.replace(/[^\d+]/g, "");

  // Ensure phone starts with country code
  let whatsappPhone = cleanPhone;
  if (!whatsappPhone.startsWith("+")) {
    // Assume US number if no country code
    whatsappPhone = `+1${cleanPhone}`;
  }

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `whatsapp://send?phone=${whatsappPhone}&text=${encodedMessage}`;

  Linking.openURL(whatsappUrl).catch((err) => {
    console.error("Error opening WhatsApp:", err);
    // Fallback to web WhatsApp
    const webUrl = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`;
    Linking.openURL(webUrl).catch((webErr) => {
      console.error("Error opening WhatsApp Web:", webErr);
      Alert.alert(
        "Error",
        "Could not open WhatsApp. Please install WhatsApp or use WhatsApp Web."
      );
    });
  });
}

export default function FeedDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const supabase = createClient();

  const itemId = params.id as string;
  const itemType = (params.type as "trip" | "request") || "request";
  const [loading, setLoading] = useState(false);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [loadingPhone, setLoadingPhone] = useState(false);

  const { data: item, isLoading } = useQuery<FeedItem | null>({
    queryKey: ["feed-item", itemId, itemType],
    queryFn: () => fetchItemDetails(itemId, itemType),
    enabled: !!itemId,
  });

  const { data: profile } = useQuery<{ phone?: string | null } | null>({
    queryKey: ["user-profile-phone", item?.user_id],
    queryFn: async () => {
      if (!item?.user_id) return null;
      const phone = await fetchUserPhone(item.user_id);
      return phone ? { phone } : null;
    },
    enabled: !!item?.user_id && !userPhone,
  });

  useEffect(() => {
    if (profile?.phone) {
      setUserPhone(profile.phone);
    }
  }, [profile]);

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

    setLoadingPhone(true);
    try {
      let phone = userPhone;

      if (!phone) {
        phone = await fetchUserPhone(item.user_id);
        if (phone) {
          setUserPhone(phone);
        }
      }

      if (!phone) {
        Alert.alert(
          "Phone Not Available",
          "This user has not provided a phone number. Please contact them through the app or ask them to add their phone number to their profile."
        );
        setLoadingPhone(false);
        return;
      }

      // Create or get match
      const requesterId = itemType === "request" ? item.user_id : user.id;
      const travelerId = itemType === "trip" ? item.user_id : user.id;
      const requestId = itemType === "request" ? item.id : undefined;
      const tripId = itemType === "trip" ? item.id : undefined;

      const matchId = await createMatch(
        requesterId,
        travelerId,
        requestId,
        tripId
      );

      if (matchId) {
        // Navigate to in-app chat instead of WhatsApp
        router.push(`/messages/${matchId}`);
      } else {
        Alert.alert("Error", "Failed to create match. Please try again.");
      }
    } catch (error: any) {
      console.error("Error in handleMessage:", error);
      Alert.alert("Error", error.message || "Failed to open WhatsApp");
    } finally {
      setLoadingPhone(false);
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
              (loading || loadingPhone) && styles.messageButtonDisabled,
            ]}
            onPress={handleMessage}
            disabled={loading || loadingPhone}
          >
            {loading || loadingPhone ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="chat" size={20} color="#fff" />
                <Text style={styles.messageButtonText}>Message in App</Text>
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
