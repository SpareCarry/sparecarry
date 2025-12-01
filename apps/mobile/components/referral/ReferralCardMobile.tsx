/**
 * Referral Card Component - Mobile
 * Shows unique referral code and stats, allows sharing
 */

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@sparecarry/hooks/useAuth";
import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { createClient } from "@sparecarry/lib/supabase";

interface ReferralStats {
  referralCode: string | null;
  totalReferrals: number;
  creditsEarned: number;
  creditsAvailable: number;
}

export function ReferralCardMobile() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Get or create referral code
  const { data: referralCodeData, isLoading: codeLoading } = useQuery<{
    referralCode: string;
  } | null>({
    queryKey: ["user-referral-code", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_APP_URL || "http://localhost:3000"}/api/referrals/get-or-create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (response.status === 401) {
          return null;
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to get referral code");
        }

        return (await response.json()) as { referralCode: string };
      } catch (error) {
        console.warn("API error loading referral code, trying direct DB query:", error);
      }

      // Fallback: Direct DB query
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("users")
          .select("referral_code")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.warn("Error fetching referral code from DB:", error);
          return null;
        }

        if (data?.referral_code) {
          return { referralCode: data.referral_code };
        }

        // If no code exists, generate one (simple format)
        const newCode = `REF${user.id.slice(0, 8).toUpperCase()}`;
        const { error: updateError } = await supabase
          .from("users")
          .update({ referral_code: newCode })
          .eq("id", user.id);

        if (updateError) {
          console.warn("Error creating referral code:", updateError);
          return null;
        }

        return { referralCode: newCode };
      } catch (error) {
        console.warn("Error in fallback referral code query:", error);
        return null;
      }
    },
    enabled: !!user,
    retry: 1,
  });

  const referralCode = referralCodeData?.referralCode;

  // Get referral stats
  const { data: stats, isLoading: statsLoading } =
    useQuery<ReferralStats | null>({
      queryKey: ["referral-stats", user?.id],
      queryFn: async () => {
        if (!user) return null;
        try {
          const response = await fetch(
            `${process.env.EXPO_PUBLIC_APP_URL || "http://localhost:3000"}/api/referrals/stats`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          );

          if (response.status === 401) {
            return null;
          }

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || "Failed to load referral stats");
          }

          return (await response.json()) as ReferralStats;
        } catch (error) {
          console.warn("Error loading referral stats:", error);
          return null;
        }
      },
      enabled: !!user && !!referralCode,
      retry: false,
    });

  const handleCopyCode = async () => {
    if (referralCode) {
      await Clipboard.setStringAsync(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      Alert.alert("Copied!", "Referral code copied to clipboard");
    }
  };

  const handleCopyLink = async () => {
    if (referralCode) {
      const shareUrl = `${process.env.EXPO_PUBLIC_APP_URL || "https://sparecarry.com"}/r/${referralCode}`;
      await Clipboard.setStringAsync(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      Alert.alert("Copied!", "Referral link copied to clipboard");
    }
  };

  const handleShare = async () => {
    if (!referralCode) return;

    const shareUrl = `${process.env.EXPO_PUBLIC_APP_URL || "https://sparecarry.com"}/r/${referralCode}`;
    const shareText = `Join SpareCarry and earn 2,000 Karma Points! You both get 2,000 Karma Points when you complete your first paid delivery. Use my code: ${referralCode} → ${shareUrl}`;

    try {
      const result = await Share.share({
        message: shareText,
        url: shareUrl,
        title: "Join SpareCarry",
      });

      if (result.action === Share.sharedAction) {
        Alert.alert("Shared!", "Thanks for sharing SpareCarry!");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to share");
    }
  };

  if (codeLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#14b8a6" />
          <Text style={styles.loadingText}>Loading referral code...</Text>
        </View>
      </View>
    );
  }

  if (!referralCode) {
    return null; // Don't show if no code
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="card-giftcard" size={24} color="#14b8a6" />
        <Text style={styles.title}>Referral Program</Text>
      </View>

      <Text style={styles.description}>
        Share your code and both you and your friend get 2,000 Karma Points
        after their first paid delivery!
      </Text>

      {/* Referral Code */}
      <View style={styles.codeSection}>
        <Text style={styles.codeLabel}>Your Referral Code</Text>
        <View style={styles.codeContainer}>
          <Text style={styles.codeText}>{referralCode}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
            {copied ? (
              <MaterialIcons name="check" size={20} color="#10b981" />
            ) : (
              <MaterialIcons name="content-copy" size={20} color="#14b8a6" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Share Link */}
      <View style={styles.linkSection}>
        <Text style={styles.linkLabel}>Or share this link:</Text>
        <View style={styles.linkContainer}>
          <Text style={styles.linkText} numberOfLines={1}>
            {process.env.EXPO_PUBLIC_APP_URL || "https://sparecarry.com"}/r/
            {referralCode}
          </Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
            {copiedLink ? (
              <MaterialIcons name="check" size={20} color="#10b981" />
            ) : (
              <MaterialIcons name="content-copy" size={20} color="#14b8a6" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Share Button */}
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <MaterialIcons name="share" size={20} color="#fff" />
        <Text style={styles.shareButtonText}>Share Referral Code</Text>
      </TouchableOpacity>

      {/* Stats */}
      {statsLoading ? (
        <View style={styles.statsLoading}>
          <ActivityIndicator size="small" color="#14b8a6" />
        </View>
      ) : stats ? (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalReferrals}</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              ${stats.creditsEarned.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              ${stats.creditsAvailable.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  codeSection: {
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdfa",
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: "#14b8a6",
  },
  codeText: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#14b8a6",
    fontFamily: "monospace",
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
  },
  linkSection: {
    marginBottom: 16,
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    color: "#666",
    fontFamily: "monospace",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#14b8a6",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  statsLoading: {
    alignItems: "center",
    padding: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#14b8a6",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
  },
});
