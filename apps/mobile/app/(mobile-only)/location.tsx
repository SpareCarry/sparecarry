/**
 * Location Screen - Mobile Only
 * Shows current location using GPS
 */

import { View, Text, StyleSheet } from "react-native";
import { useLocation } from "@sparecarry/hooks";

export default function LocationScreen() {
  const { location, loading, error, refetch } = useLocation({
    enabled: true,
    watch: true,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location</Text>
      {loading && <Text>Loading location...</Text>}
      {error && <Text style={styles.error}>Error: {error.message}</Text>}
      {location && (
        <View style={styles.locationInfo}>
          <Text style={styles.label}>Latitude:</Text>
          <Text style={styles.value}>{location.latitude.toFixed(6)}</Text>
          <Text style={styles.label}>Longitude:</Text>
          <Text style={styles.value}>{location.longitude.toFixed(6)}</Text>
          {location.accuracy && (
            <>
              <Text style={styles.label}>Accuracy:</Text>
              <Text style={styles.value}>{location.accuracy.toFixed(0)}m</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  error: {
    color: "#ef4444",
    marginTop: 10,
  },
  locationInfo: {
    marginTop: 20,
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#14b8a6",
  },
});
