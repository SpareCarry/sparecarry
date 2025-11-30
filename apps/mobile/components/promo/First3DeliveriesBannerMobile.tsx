/**
 * First Delivery Banner - Mobile
 * Shows that the first delivery is free (0% platform fee)
 */

import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export function First3DeliveriesBannerMobile() {
  return (
    <View style={styles.container}>
      <MaterialIcons name="card-giftcard" size={24} color="#14b8a6" />
      <View style={styles.content}>
        <Text style={styles.title}>
          Your first delivery is 100% profit for you
        </Text>
        <Text style={styles.description}>
          We take $0 platform fee — you keep the full reward
        </Text>
        <Text style={styles.note}>
          (Stripe payment processing still applies)
        </Text>
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
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#134e4a",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#0f766e",
    marginBottom: 4,
  },
  note: {
    fontSize: 12,
    color: "#0d9488",
    fontStyle: "italic",
  },
});
