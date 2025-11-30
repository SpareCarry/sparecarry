/**
 * Global error boundary for Expo Router
 * Catches all errors and logs them to terminal
 */

import { useEffect } from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { Stack, useRouter } from "expo-router";
import { mobileLogger } from "../lib/logger";

export default function ErrorBoundary({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error to terminal - make it VERY visible
    console.error("");
    console.error("========================================");
    console.error("❌❌❌ APP ERROR BOUNDARY ❌❌❌");
    console.error("========================================");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    console.error("========================================");
    console.error("");

    // Also log via mobileLogger if available
    try {
      mobileLogger.error("App Error Boundary caught error", {
        error,
        route: "unknown",
      });
    } catch (e) {
      // Logger might not be available
    }
  }, [error]);

  // Truncate error message if too long
  const errorMessage =
    error.message.length > 200
      ? error.message.substring(0, 200) + "..."
      : error.message;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{errorMessage}</Text>

      {/* Show first line of stack trace */}
      {error.stack && (
        <View style={styles.stackBox}>
          <Text style={styles.stackLabel}>Error Details:</Text>
          <Text style={styles.stack} selectable>
            {error.stack.split("\n").slice(0, 5).join("\n")}
          </Text>
          <Text style={styles.stackNote}>
            (Full error logged in Metro terminal)
          </Text>
        </View>
      )}

      <View style={styles.buttons}>
        <Button title="Try Again" onPress={retry} />
        <Button title="Go Home" onPress={() => router.replace("/(tabs)")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#ef4444",
  },
  message: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  stackBox: {
    width: "90%",
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  stackLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#991b1b",
    marginBottom: 8,
  },
  stack: {
    fontSize: 10,
    color: "#7f1d1d",
    fontFamily: "monospace",
    marginBottom: 4,
  },
  stackNote: {
    fontSize: 10,
    color: "#991b1b",
    fontStyle: "italic",
    marginTop: 4,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
  },
});
