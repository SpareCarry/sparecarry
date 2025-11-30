/**
 * Payment Button Component - Mobile
 * Handles payment flow for escrow payments
 */

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@sparecarry/lib/supabase";
import { useAuth } from "@sparecarry/hooks/useAuth";
import { calculatePlatformFee } from "@sparecarry/lib/pricing/platform-fee";
import { Linking } from "react-native";
import {
  calculateMaxKarmaUsage,
  convertKarmaToCredit,
  formatKarmaPoints,
  getKarmaPointsExplanation,
  getKarmaUsageInstructions,
} from "@sparecarry/lib/incentives/karma-conversion";

interface PaymentButtonMobileProps {
  match: any;
  matchId: string;
}

export function PaymentButtonMobile({
  match,
  matchId,
}: PaymentButtonMobileProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const [showDetails, setShowDetails] = useState(false);
  const [insurance, setInsurance] = useState(false);
  const [useCredits, setUseCredits] = useState(false);
  const [creatingIntent, setCreatingIntent] = useState(false);

  const trip = Array.isArray(match.trips) ? match.trips[0] : match.trips;
  const request = Array.isArray(match.requests)
    ? match.requests[0]
    : match.requests;
  const reward = Number(match.reward_amount ?? 0);
  const itemCost = Number(request?.value_usd ?? 0);

  // Get user subscription status
  const { data: userData } = useQuery({
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("users")
        .select(
          "subscription_status, completed_deliveries_count, average_rating, supporter_status, karma_points"
        )
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const hasActiveSubscription =
    userData?.subscription_status === "active" ||
    userData?.subscription_status === "trialing";
  const isSupporter = userData?.supporter_status === "active";
  const userCompletedDeliveries = userData?.completed_deliveries_count || 0;
  const userRating = userData?.average_rating || 5.0;

  // Calculate platform fee
  const platformFeePercent = calculatePlatformFee({
    method: trip?.type || "plane",
    userId: user?.id || "",
    userCompletedDeliveries,
    userRating,
    isSubscriber: hasActiveSubscription,
    isSupporter,
  });

  const platformFee = reward * platformFeePercent;

  // Karma points conversion (only shown at checkout)
  const availableKarma = userData?.karma_points || 0;
  const maxKarmaUsable = calculateMaxKarmaUsage(platformFee, availableKarma);
  const karmaToUse = useCredits ? maxKarmaUsable : 0;
  const creditFromKarma = convertKarmaToCredit(karmaToUse);

  const subtotal = reward + itemCost;
  const totalBeforeKarma = subtotal + platformFee;
  const total = Math.max(0, totalBeforeKarma - creditFromKarma);

  const handlePayment = async () => {
    setCreatingIntent(true);
    try {
      // Get session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert("Error", "Please log in to make a payment");
        return;
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_APP_URL || "http://localhost:3000"}/api/payments/create-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            matchId: match.id,
            useKarmaPoints: useCredits && karmaToUse > 0,
            karmaPointsToUse: useCredits ? karmaToUse : 0,
            insurance: insurance
              ? { premium: 0, coverage_amount: itemCost }
              : null,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create payment");
      }

      const { clientSecret, checkoutUrl } = await response.json();

      // For mobile, open checkout URL in browser
      if (checkoutUrl) {
        const canOpen = await Linking.canOpenURL(checkoutUrl);
        if (canOpen) {
          await Linking.openURL(checkoutUrl);
        } else {
          Alert.alert(
            "Error",
            "Cannot open payment page. Please check your internet connection."
          );
        }
      } else {
        Alert.alert("Error", "Payment URL not available");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      Alert.alert("Error", error.message || "Payment failed");
    } finally {
      setCreatingIntent(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.paymentButton}
        onPress={() => setShowDetails(!showDetails)}
        disabled={creatingIntent}
      >
        <MaterialIcons name="payment" size={20} color="#fff" />
        <Text style={styles.paymentButtonText}>Proceed to Payment</Text>
      </TouchableOpacity>

      {showDetails && (
        <ScrollView style={styles.detailsContainer}>
          <View style={styles.breakdown}>
            <Text style={styles.breakdownTitle}>Payment Breakdown</Text>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Reward</Text>
              <Text style={styles.breakdownValue}>${reward.toFixed(2)}</Text>
            </View>

            {itemCost > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Item Cost</Text>
                <Text style={styles.breakdownValue}>
                  ${itemCost.toFixed(2)}
                </Text>
              </View>
            )}

            {platformFee > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>
                  Platform Fee ({(platformFeePercent * 100).toFixed(1)}%)
                </Text>
                <Text style={styles.breakdownValue}>
                  ${platformFee.toFixed(2)}
                </Text>
              </View>
            )}

            {availableKarma > 0 && (
              <View style={styles.creditsSection}>
                <TouchableOpacity
                  style={styles.creditsToggle}
                  onPress={() => setUseCredits(!useCredits)}
                >
                  <MaterialIcons
                    name={useCredits ? "check-box" : "check-box-outline-blank"}
                    size={20}
                    color="#14b8a6"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.creditsLabel}>
                      Use {formatKarmaPoints(maxKarmaUsable)} Karma Points
                    </Text>
                    {useCredits && (
                      <Text style={styles.creditsSubtext}>
                        ({creditFromKarma.toFixed(2)} credit)
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
                {useCredits && (
                  <Text style={styles.creditsExplanation}>
                    {formatKarmaPoints(karmaToUse)} points = $
                    {creditFromKarma.toFixed(2)} credit
                  </Text>
                )}
                {!useCredits && (
                  <Text style={styles.creditsExplanation}>
                    {getKarmaPointsExplanation()}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              total <= 0 && styles.submitButtonDisabled,
            ]}
            onPress={handlePayment}
            disabled={total <= 0 || creatingIntent}
          >
            {creatingIntent ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="lock" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>
                  Pay ${total.toFixed(2)} Securely
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  detailsContainer: {
    marginTop: 12,
  },
  breakdown: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: "#666",
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  creditsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  creditsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  creditsLabel: {
    fontSize: 14,
    color: "#14b8a6",
    fontWeight: "600",
  },
  creditsSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  creditsExplanation: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    fontStyle: "italic",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: "#e5e7eb",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#14b8a6",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#14b8a6",
    borderRadius: 8,
    padding: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
