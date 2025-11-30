/**
 * Early Supporter Promo Card - Mobile
 * Shows remaining free deliveries with dismiss functionality
 */

import { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@sparecarry/lib/supabase";
import { useAuth } from "@sparecarry/hooks/useAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FREE_DELIVERIES_LIMIT = 1;

const PROMO_COPY = {
  title: "🔥 Early Supporter Reward",
  message: (remaining: number) =>
    `Your first delivery is 100% profit for you — we take $0 platform fee.`,
  countdown: (remaining: number) => {
    if (remaining === 1) {
      return `⏳ ${remaining} free delivery left`;
    }
    return `⏳ ${remaining} free deliveries left`;
  },
  footer: "Stripe payment processing fees still apply.",
  dismiss: "Don't show again",
} as const;

interface EarlySupporterPromoCardMobileProps {
  onDismiss?: () => void;
}

export function EarlySupporterPromoCardMobile({
  onDismiss,
}: EarlySupporterPromoCardMobileProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Fetch user's completed deliveries count
  const { data: userDeliveryData } = useQuery({
    queryKey: ["user-deliveries", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const { data, error } = await supabase
          .from("users")
          .select("completed_deliveries_count")
          .eq("id", user.id)
          .single();

        if (error) {
          console.warn("Error fetching completed deliveries:", error);
          return null;
        }
        return data;
      } catch (error) {
        console.warn("Exception fetching completed deliveries:", error);
        return null;
      }
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
    throwOnError: false,
  });

  // Calculate remaining free deliveries
  const completedDeliveries = userDeliveryData?.completed_deliveries_count ?? 0;
  const remainingFreeDeliveries = Math.max(
    0,
    FREE_DELIVERIES_LIMIT - completedDeliveries
  );

  // Check if dismissed in AsyncStorage
  useEffect(() => {
    const checkDismissed = async () => {
      try {
        const dismissedUntil = await AsyncStorage.getItem(
          "promo_dismissed_until"
        );
        if (dismissedUntil) {
          const dismissedDate = new Date(dismissedUntil);
          if (dismissedDate > new Date()) {
            setIsDismissed(true);
            setIsVisible(false);
            return;
          } else {
            // Expired, remove from AsyncStorage
            await AsyncStorage.removeItem("promo_dismissed_until");
          }
        }
      } catch (error) {
        console.warn("Error checking dismissed status:", error);
      }
    };

    checkDismissed();
  }, []);

  const handleDismiss = async () => {
    try {
      const dismissedUntil = new Date();
      dismissedUntil.setDate(dismissedUntil.getDate() + 30); // 30 days from now

      await AsyncStorage.setItem(
        "promo_dismissed_until",
        dismissedUntil.toISOString()
      );

      setIsDismissed(true);
      setIsVisible(false);
      onDismiss?.();
    } catch (error) {
      console.warn("Error saving dismissal:", error);
      Alert.alert("Error", "Failed to save preference");
    }
  };

  // Don't show if dismissed, no remaining free deliveries, or user not loaded yet
  if (
    isDismissed ||
    !isVisible ||
    remainingFreeDeliveries === 0 ||
    (user && completedDeliveries === undefined)
  ) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialIcons name="auto-awesome" size={24} color="#14b8a6" />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{PROMO_COPY.title}</Text>
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.dismissButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.message}>
          {PROMO_COPY.message(remainingFreeDeliveries)}
        </Text>

        <View style={styles.countdownContainer}>
          <Text style={styles.countdown}>
            {PROMO_COPY.countdown(remainingFreeDeliveries)}
          </Text>
        </View>

        <View style={styles.footer}>
          <MaterialIcons name="shield" size={14} color="#666" />
          <Text style={styles.footerText}>{PROMO_COPY.footer}</Text>
        </View>

        <TouchableOpacity onPress={handleDismiss} style={styles.dismissLink}>
          <Text style={styles.dismissLinkText}>{PROMO_COPY.dismiss}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#f0fdfa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#5eead4",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ccfbf1",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    flex: 1,
  },
  dismissButton: {
    padding: 4,
  },
  message: {
    fontSize: 14,
    color: "#334155",
    marginBottom: 8,
    lineHeight: 20,
  },
  countdownContainer: {
    marginBottom: 8,
  },
  countdown: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f766e",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#64748b",
  },
  dismissLink: {
    marginTop: 8,
  },
  dismissLinkText: {
    fontSize: 12,
    color: "#64748b",
    textDecorationLine: "underline",
  },
});
