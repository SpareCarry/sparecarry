/**
 * Shipping Estimator Screen - Mobile
 * Compare courier prices with SpareCarry prices
 * Matches web version functionality with automatic calculation and detailed explanations
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LocationInput } from "@sparecarry/ui";
// Import shipping service from root lib using Metro alias
import {
  calculateShippingEstimate,
  type ShippingEstimateInput,
  getAvailableCouriers,
  calculateCourierPrice,
} from "@root-lib/services/shipping";
import { getPlaneRestrictionDetails } from "@root-lib/utils/plane-restrictions";

// Simple subscription check - check users table directly
async function checkSubscriptionStatus(
  userId: string | undefined
): Promise<{ isPremium: boolean }> {
  if (!userId) return { isPremium: false };

  try {
    const { createClient } = await import("@sparecarry/lib/supabase");
    const supabase = createClient();
    const { data } = await supabase
      .from("users")
      .select("subscription_status")
      .eq("id", userId)
      .single();

    const isPremium =
      data?.subscription_status === "active" ||
      data?.subscription_status === "trialing";
    return { isPremium };
  } catch (error) {
    console.warn("Error checking subscription status:", error);
    return { isPremium: false };
  }
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

import { useAuth } from "@sparecarry/hooks/useAuth";
import { useUserPreferences } from "@sparecarry/hooks/useUserPreferences";
import { useQuery } from "@tanstack/react-query";
import {
  formatCurrencyWithConversion,
  CURRENCIES,
} from "@sparecarry/lib/utils/currency";

const CATEGORIES = [
  { value: "", label: "None" },
  { value: "electronics", label: "Electronics" },
  { value: "marine", label: "Marine Equipment" },
  { value: "food", label: "Food & Beverages" },
  { value: "clothing", label: "Clothing & Apparel" },
  { value: "tools", label: "Tools & Hardware" },
  { value: "medical", label: "Medical Supplies" },
  { value: "automotive", label: "Automotive Parts" },
  { value: "sports", label: "Sports & Recreation" },
  { value: "books", label: "Books & Media" },
  { value: "other", label: "Other" },
];

export default function ShippingEstimatorScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Get subscription status for premium pricing
  const { data: subscriptionStatus } = useQuery({
    queryKey: ["subscription-status", user?.id],
    queryFn: () => checkSubscriptionStatus(user?.id),
    enabled: !!user,
    staleTime: 60000,
  });
  const isPremium = subscriptionStatus?.isPremium ?? false;

  // User preferences
  const { preferImperial, preferredCurrency } = useUserPreferences();

  // Location inputs
  const [originLocation, setOriginLocation] = useState("");
  const [originLat, setOriginLat] = useState<number | null>(null);
  const [originLon, setOriginLon] = useState<number | null>(null);
  const [originCountry, setOriginCountry] = useState("");

  const [destinationLocation, setDestinationLocation] = useState("");
  const [destinationLat, setDestinationLat] = useState<number | null>(null);
  const [destinationLon, setDestinationLon] = useState<number | null>(null);
  const [destinationCountry, setDestinationCountry] = useState("");

  // Dimensions and weight
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [declaredValue, setDeclaredValue] = useState("");
  const [selectedCourier, setSelectedCourier] = useState("dhl");

  // Additional fields
  const [restrictedItems, setRestrictedItems] = useState(false);
  const [category, setCategory] = useState("");
  const [fragile, setFragile] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [selectedTransportMethod, setSelectedTransportMethod] = useState<
    "plane" | "boat" | "auto"
  >("auto");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showRestrictionDetails, setShowRestrictionDetails] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Get available couriers
  const availableCouriers = useMemo(() => getAvailableCouriers(), []);

  // Set most expensive courier as default when enough data is available
  useEffect(() => {
    if (
      availableCouriers.length > 0 &&
      originCountry &&
      destinationCountry &&
      length &&
      width &&
      height &&
      weight
    ) {
      const isInternational = originCountry !== destinationCountry;
      const l = parseFloat(length);
      const w = parseFloat(width);
      const h = parseFloat(height);
      const wt = parseFloat(weight);

      if (l > 0 && w > 0 && h > 0 && wt > 0) {
        // Calculate prices for all couriers
        const courierPrices = availableCouriers.map((courier) => {
          const price = calculateCourierPrice(
            courier,
            isInternational,
            l,
            w,
            h,
            wt
          );
          return { courier, price: price || 0 };
        });

        // Find the most expensive courier
        const mostExpensive = courierPrices.reduce((max, current) =>
          current.price > max.price ? current : max
        );

        if (
          mostExpensive.price > 0 &&
          selectedCourier !== mostExpensive.courier
        ) {
          setSelectedCourier(mostExpensive.courier);
        }
      }
    }
  }, [
    availableCouriers,
    originCountry,
    destinationCountry,
    length,
    width,
    height,
    weight,
    selectedCourier,
  ]);

  // Load prefill data from post-request form
  useFocusEffect(
    useCallback(() => {
      const loadPrefillData = async () => {
        try {
          const prefillData = await AsyncStorage.getItem(
            "shippingEstimatorPrefill"
          );
          if (prefillData) {
            const data = JSON.parse(prefillData);
            if (data.from_location) setOriginLocation(data.from_location);
            if (data.to_location) setDestinationLocation(data.to_location);
            if (data.departure_lat) setOriginLat(data.departure_lat);
            if (data.departure_lon) setOriginLon(data.departure_lon);
            if (data.arrival_lat) setDestinationLat(data.arrival_lat);
            if (data.arrival_lon) setDestinationLon(data.arrival_lon);
            if (data.length_cm) setLength(data.length_cm.toString());
            if (data.width_cm) setWidth(data.width_cm.toString());
            if (data.height_cm) setHeight(data.height_cm.toString());
            if (data.weight_kg) setWeight(data.weight_kg.toString());
            if (data.value_usd) setDeclaredValue(data.value_usd.toString());
            if (data.restricted_items !== undefined)
              setRestrictedItems(data.restricted_items);
            if (data.category) setCategory(data.category);

            // Reverse geocode coordinates to get country codes if we have coordinates but no country
            if (
              data.departure_lat &&
              data.departure_lon &&
              !data.origin_country
            ) {
              try {
                const { reverseGeocode } =
                  await import("@sparecarry/lib/services/location");
                const originGeocoded = await reverseGeocode(
                  data.departure_lat,
                  data.departure_lon
                );
                if (originGeocoded?.country) {
                  setOriginCountry(originGeocoded.country.toUpperCase());
                }
              } catch (error) {
                console.warn(
                  "Failed to get origin country from coordinates:",
                  error
                );
              }
            }

            if (
              data.arrival_lat &&
              data.arrival_lon &&
              !data.destination_country
            ) {
              try {
                const { reverseGeocode } =
                  await import("@sparecarry/lib/services/location");
                const destGeocoded = await reverseGeocode(
                  data.arrival_lat,
                  data.arrival_lon
                );
                if (destGeocoded?.country) {
                  setDestinationCountry(destGeocoded.country.toUpperCase());
                }
              } catch (error) {
                console.warn(
                  "Failed to get destination country from coordinates:",
                  error
                );
              }
            }
          }
        } catch (error) {
          console.error("Error loading prefill data:", error);
        }
      };

      loadPrefillData();
    }, [])
  );

  // Get country codes from locations
  const handleOriginSelect = async (place: any) => {
    setOriginLocation(place.name);
    setOriginLat(place.lat);
    setOriginLon(place.lon);
    if (place.country) {
      setOriginCountry(place.country.toUpperCase());
    } else {
      // Try to get country from reverse geocode
      try {
        const { reverseGeocode } =
          await import("@sparecarry/lib/services/location");
        const geocoded = await reverseGeocode(place.lat, place.lon);
        if (geocoded?.country) {
          setOriginCountry(geocoded.country.toUpperCase());
        }
      } catch (error) {
        console.warn("Failed to get origin country:", error);
      }
    }
  };

  const handleDestinationSelect = async (place: any) => {
    setDestinationLocation(place.name);
    setDestinationLat(place.lat);
    setDestinationLon(place.lon);
    if (place.country) {
      setDestinationCountry(place.country.toUpperCase());
    } else {
      // Try to get country from reverse geocode
      try {
        const { reverseGeocode } =
          await import("@sparecarry/lib/services/location");
        const geocoded = await reverseGeocode(place.lat, place.lon);
        if (geocoded?.country) {
          setDestinationCountry(geocoded.country.toUpperCase());
        }
      } catch (error) {
        console.warn("Failed to get destination country:", error);
      }
    }
  };

  // Auto-calculate estimate using useMemo (like web version)
  const estimate = useMemo(() => {
    // Validate countries
    if (!originCountry || originCountry.length !== 2) {
      return null;
    }
    if (!destinationCountry || destinationCountry.length !== 2) {
      return null;
    }

    // Parse numeric values
    const lengthNum = parseFloat(length);
    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    const declaredValueNum = parseFloat(declaredValue) || 0;

    // Validate that required numeric fields are present and > 0
    if (!length || isNaN(lengthNum) || lengthNum <= 0) {
      return null;
    }
    if (!width || isNaN(widthNum) || widthNum <= 0) {
      return null;
    }
    if (!height || isNaN(heightNum) || heightNum <= 0) {
      return null;
    }
    if (!weight || isNaN(weightNum) || weightNum <= 0) {
      return null;
    }

    // Calculate distance if coordinates are available
    let distanceKm: number | undefined;
    if (
      originLat !== null &&
      originLon !== null &&
      destinationLat !== null &&
      destinationLon !== null
    ) {
      distanceKm = calculateDistanceKm(
        originLat,
        originLon,
        destinationLat,
        destinationLon
      );
    }

    const input: ShippingEstimateInput = {
      originCountry: originCountry,
      destinationCountry: destinationCountry,
      length: lengthNum,
      width: widthNum,
      height: heightNum,
      weight: weightNum,
      declaredValue: declaredValueNum,
      selectedCourier: selectedCourier,
      isPremium: isPremium,
      distanceKm: distanceKm,
      restrictedItems: restrictedItems,
      category: category || undefined,
      fragile: fragile,
      deadlineDate: deadlineDate || undefined,
      originLat: originLat || undefined,
      originLon: originLon || undefined,
      destinationLat: destinationLat || undefined,
      destinationLon: destinationLon || undefined,
    };

    const result = calculateShippingEstimate(input);
    return result;
  }, [
    originCountry,
    destinationCountry,
    length,
    width,
    height,
    weight,
    declaredValue,
    selectedCourier,
    isPremium,
    restrictedItems,
    category,
    fragile,
    deadlineDate,
    originLat,
    originLon,
    destinationLat,
    destinationLon,
  ]);

  // Get plane restriction details for display
  const restrictionDetails = useMemo(() => {
    if (!estimate || !length || !width || !height || !weight) return null;

    const lengthNum = parseFloat(length) || 0;
    const widthNum = parseFloat(width) || 0;
    const heightNum = parseFloat(height) || 0;
    const weightNum = parseFloat(weight) || 0;

    return getPlaneRestrictionDetails({
      weight: weightNum,
      length: lengthNum,
      width: widthNum,
      height: heightNum,
      restrictedItems: restrictedItems,
      category: category || undefined,
      originCountry: originCountry,
      destinationCountry: destinationCountry,
    });
  }, [
    estimate,
    length,
    width,
    height,
    weight,
    restrictedItems,
    category,
    originCountry,
    destinationCountry,
  ]);

  // Auto-switch to boat if plane becomes unavailable
  useEffect(() => {
    if (
      (restrictedItems ||
        (estimate && estimate.canTransportByPlane === false)) &&
      selectedTransportMethod === "plane"
    ) {
      setSelectedTransportMethod("boat");
    }
  }, [restrictedItems, estimate, selectedTransportMethod]);

  const handlePostRequest = async () => {
    if (!estimate) {
      Alert.alert(
        "Error",
        "Please fill in all required fields to see an estimate"
      );
      return;
    }

    // Determine which price to prefill based on restrictions
    let prefilledMaxReward: number;
    if (estimate.canTransportByPlane === false) {
      prefilledMaxReward = Math.round(estimate.spareCarryBoatPrice);
    } else {
      // Prefer boat (cheaper), fallback to plane
      prefilledMaxReward =
        estimate.spareCarryBoatPrice > 0
          ? Math.round(estimate.spareCarryBoatPrice)
          : Math.round(estimate.spareCarryPlanePrice);
    }

    // Prepare prefill data with all current form values
    const prefillData = {
      from_location: originLocation || originCountry,
      to_location: destinationLocation || destinationCountry,
      departure_lat: originLat,
      departure_lon: originLon,
      arrival_lat: destinationLat,
      arrival_lon: destinationLon,
      length_cm: parseFloat(length) || 0,
      width_cm: parseFloat(width) || 0,
      height_cm: parseFloat(height) || 0,
      weight_kg: parseFloat(weight) || 0,
      value_usd: declaredValue ? parseFloat(declaredValue) : 0,
      max_reward: prefilledMaxReward,
      restricted_items: restrictedItems,
      category: category || undefined,
    };

    // Store in AsyncStorage for post-request form to read
    try {
      await AsyncStorage.setItem(
        "shippingEstimatorPrefill",
        JSON.stringify(prefillData)
      );
    } catch (error) {
      console.warn("Failed to save prefill data:", error);
    }

    // Navigate to post request
    router.push("/(tabs)/post-request");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Shipping Estimator</Text>
          <Text style={styles.subtitle}>
            Compare courier prices with SpareCarry prices
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <LocationInput
              label="Origin Location *"
              value={originLocation}
              onChange={(address, lat, lon) => {
                setOriginLocation(address);
                setOriginLat(lat);
                setOriginLon(lon);
              }}
              onLocationSelect={handleOriginSelect}
              placeholder="Enter origin location"
              showCommonLocations={false}
            />
            {errors.origin && (
              <Text style={styles.errorText}>{errors.origin}</Text>
            )}
          </View>

          <View style={styles.field}>
            <LocationInput
              label="Destination Location *"
              value={destinationLocation}
              onChange={(address, lat, lon) => {
                setDestinationLocation(address);
                setDestinationLat(lat);
                setDestinationLon(lon);
              }}
              onLocationSelect={handleDestinationSelect}
              placeholder="Enter destination location"
              showCommonLocations={false}
            />
            {errors.destination && (
              <Text style={styles.errorText}>{errors.destination}</Text>
            )}
          </View>

          {availableCouriers.length > 1 && (
            <View style={styles.field}>
              <Text style={styles.label}>Compare With Courier</Text>
              <View style={styles.courierButtons}>
                {availableCouriers.map((courier) => (
                  <TouchableOpacity
                    key={courier}
                    style={[
                      styles.courierButton,
                      selectedCourier === courier && styles.courierButtonActive,
                    ]}
                    onPress={() => setSelectedCourier(courier)}
                  >
                    <Text
                      style={[
                        styles.courierButtonText,
                        selectedCourier === courier &&
                          styles.courierButtonTextActive,
                      ]}
                    >
                      {courier.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Dimensions (cm) *</Text>
            <View style={styles.dimensionsRow}>
              <View style={styles.dimensionField}>
                <TextInput
                  style={[
                    styles.input,
                    styles.dimensionInput,
                    errors.length && styles.inputError,
                  ]}
                  value={length}
                  onChangeText={(text) => {
                    setLength(text);
                    if (errors.length) {
                      const newErrors = { ...errors };
                      delete newErrors.length;
                      setErrors(newErrors);
                    }
                  }}
                  placeholder="Length"
                  keyboardType="numeric"
                />
                {length &&
                  !isNaN(parseFloat(length)) &&
                  parseFloat(length) > 0 && (
                    <Text style={styles.conversionText}>
                      ≈{" "}
                      {preferImperial
                        ? `${parseFloat(length).toFixed(1)} cm`
                        : `${Math.round(parseFloat(length) / 2.54)} in (${Math.floor(parseFloat(length) / 30.48)} ft ${Math.round(((parseFloat(length) / 30.48) % 1) * 12)} in)`}
                    </Text>
                  )}
                {errors.length && (
                  <Text style={styles.errorText}>{errors.length}</Text>
                )}
              </View>
              <View style={styles.dimensionField}>
                <TextInput
                  style={[
                    styles.input,
                    styles.dimensionInput,
                    errors.width && styles.inputError,
                  ]}
                  value={width}
                  onChangeText={(text) => {
                    setWidth(text);
                    if (errors.width) {
                      const newErrors = { ...errors };
                      delete newErrors.width;
                      setErrors(newErrors);
                    }
                  }}
                  placeholder="Width"
                  keyboardType="numeric"
                />
                {width &&
                  !isNaN(parseFloat(width)) &&
                  parseFloat(width) > 0 && (
                    <Text style={styles.conversionText}>
                      ≈{" "}
                      {preferImperial
                        ? `${parseFloat(width).toFixed(1)} cm`
                        : `${Math.round(parseFloat(width) / 2.54)} in`}
                    </Text>
                  )}
                {errors.width && (
                  <Text style={styles.errorText}>{errors.width}</Text>
                )}
              </View>
              <View style={styles.dimensionField}>
                <TextInput
                  style={[
                    styles.input,
                    styles.dimensionInput,
                    errors.height && styles.inputError,
                  ]}
                  value={height}
                  onChangeText={(text) => {
                    setHeight(text);
                    if (errors.height) {
                      const newErrors = { ...errors };
                      delete newErrors.height;
                      setErrors(newErrors);
                    }
                  }}
                  placeholder="Height"
                  keyboardType="numeric"
                />
                {height &&
                  !isNaN(parseFloat(height)) &&
                  parseFloat(height) > 0 && (
                    <Text style={styles.conversionText}>
                      ≈{" "}
                      {preferImperial
                        ? `${parseFloat(height).toFixed(1)} cm`
                        : `${Math.round(parseFloat(height) / 2.54)} in`}
                    </Text>
                  )}
                {errors.height && (
                  <Text style={styles.errorText}>{errors.height}</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Weight (kg) *</Text>
            <TextInput
              style={[styles.input, errors.weight && styles.inputError]}
              value={weight}
              onChangeText={(text) => {
                setWeight(text);
                if (errors.weight) {
                  const newErrors = { ...errors };
                  delete newErrors.weight;
                  setErrors(newErrors);
                }
              }}
              placeholder="0"
              keyboardType="numeric"
            />
            {weight && !isNaN(parseFloat(weight)) && parseFloat(weight) > 0 && (
              <Text style={styles.conversionText}>
                ≈{" "}
                {preferImperial
                  ? `${parseFloat(weight).toFixed(1)} kg`
                  : `${Math.round(parseFloat(weight) * 2.20462)} lbs`}
              </Text>
            )}
            {errors.weight && (
              <Text style={styles.errorText}>{errors.weight}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Declared Value ($)</Text>
            <TextInput
              style={styles.input}
              value={declaredValue}
              onChangeText={setDeclaredValue}
              placeholder="0"
              keyboardType="numeric"
            />
            <Text style={styles.hint}>Optional - for customs calculation</Text>
          </View>

          {/* Transport Method Toggle */}
          <View style={styles.field}>
            <Text style={styles.label}>Preferred Transport Method</Text>
            <View style={styles.transportMethodContainer}>
              <TouchableOpacity
                style={[
                  styles.transportMethodButton,
                  selectedTransportMethod === "plane" &&
                    styles.transportMethodButtonActive,
                  (restrictedItems ||
                    (estimate && estimate.canTransportByPlane === false)) &&
                    styles.transportMethodButtonDisabled,
                ]}
                onPress={() => {
                  if (
                    !restrictedItems &&
                    (!estimate || estimate.canTransportByPlane !== false)
                  ) {
                    setSelectedTransportMethod("plane");
                  }
                }}
                disabled={
                  restrictedItems === true ||
                  estimate?.canTransportByPlane === false ||
                  false
                }
              >
                <MaterialIcons
                  name="flight"
                  size={18}
                  color={
                    restrictedItems ||
                    (estimate && estimate.canTransportByPlane === false)
                      ? "#999"
                      : selectedTransportMethod === "plane"
                        ? "#fff"
                        : "#14b8a6"
                  }
                />
                <Text
                  style={[
                    styles.transportMethodButtonText,
                    selectedTransportMethod === "plane" &&
                      styles.transportMethodButtonTextActive,
                    (restrictedItems ||
                      (estimate && estimate.canTransportByPlane === false)) &&
                      styles.transportMethodButtonTextDisabled,
                  ]}
                >
                  Plane
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.transportMethodButton,
                  selectedTransportMethod === "boat" &&
                    styles.transportMethodButtonActive,
                ]}
                onPress={() => setSelectedTransportMethod("boat")}
              >
                <MaterialIcons
                  name="directions-boat"
                  size={18}
                  color={
                    selectedTransportMethod === "boat" ? "#fff" : "#14b8a6"
                  }
                />
                <Text
                  style={[
                    styles.transportMethodButtonText,
                    selectedTransportMethod === "boat" &&
                      styles.transportMethodButtonTextActive,
                  ]}
                >
                  Boat
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.transportMethodButton,
                  selectedTransportMethod === "auto" &&
                    styles.transportMethodButtonActive,
                ]}
                onPress={() => setSelectedTransportMethod("auto")}
              >
                <MaterialIcons
                  name="auto-awesome"
                  size={18}
                  color={
                    selectedTransportMethod === "auto" ? "#fff" : "#14b8a6"
                  }
                />
                <Text
                  style={[
                    styles.transportMethodButtonText,
                    selectedTransportMethod === "auto" &&
                      styles.transportMethodButtonTextActive,
                  ]}
                >
                  Auto
                </Text>
              </TouchableOpacity>
            </View>
            {restrictedItems ? (
              <Text style={styles.transportMethodHint}>
                Plane transport is not available for restricted items.
              </Text>
            ) : estimate && estimate.canTransportByPlane === false ? (
              <Text style={styles.transportMethodHint}>
                Plane transport is not available.{" "}
                {estimate.planeRestrictionReason ||
                  "Item exceeds plane size/weight limits."}
              </Text>
            ) : (
              <Text style={styles.transportMethodHint}>
                Choose your preferred transport method, or select Auto to let us
                choose the best option.
              </Text>
            )}
          </View>

          {/* Restricted Items */}
          <View style={styles.field}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => {
                const newValue = !restrictedItems;
                setRestrictedItems(newValue);
                if (newValue) {
                  setSelectedTransportMethod("boat"); // Auto-select boat if restricted
                  Alert.alert(
                    "Restricted Items",
                    "Restricted items (lithium batteries, flammable materials, etc.) can only be transported by boat due to airline safety regulations.",
                    [{ text: "OK" }]
                  );
                }
              }}
            >
              <MaterialIcons
                name={restrictedItems ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={restrictedItems ? "#14b8a6" : "#999"}
              />
              <View style={styles.checkboxLabelContainer}>
                <Text style={styles.checkboxLabel}>
                  Contains restricted goods (Boat transport only)
                </Text>
                <Text style={styles.checkboxHint}>
                  Lithium batteries, flammable items, liquids, etc.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={styles.label}>Item Category (Optional)</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Text
                style={category ? styles.inputText : styles.placeholderText}
              >
                {category
                  ? CATEGORIES.find((c) => c.value === category)?.label ||
                    category
                  : "Select category"}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={20} color="#666" />
            </TouchableOpacity>
            <Text style={styles.hint}>
              Helps determine transport restrictions
            </Text>
          </View>

          {/* Fragile Items */}
          <View style={styles.field}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setFragile(!fragile)}
            >
              <MaterialIcons
                name={fragile ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={fragile ? "#14b8a6" : "#999"}
              />
              <View style={styles.checkboxLabelContainer}>
                <Text style={styles.checkboxLabel}>
                  Fragile item (requires extra care)
                </Text>
                <Text style={styles.checkboxHint}>
                  A 15% premium applies to ensure proper handling
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Deadline Date */}
          <View style={styles.field}>
            <Text style={styles.label}>Deadline Date (Optional)</Text>
            <TextInput
              style={styles.input}
              value={deadlineDate}
              onChangeText={setDeadlineDate}
              placeholder="YYYY-MM-DD"
            />
            <Text style={styles.hint}>
              Urgent shipments may have a premium: 5% for &lt;14 days, 15% for
              &lt;7 days, 30% for &lt;3 days
            </Text>
          </View>

          {/* Results - Auto-display when estimate is available */}
          {estimate ? (
            <View style={styles.results}>
              <Text style={styles.resultsTitle}>Price Comparison</Text>

              {/* Courier Price */}
              <View style={styles.priceCard}>
                <View style={styles.priceCardHeader}>
                  <Text style={styles.priceCardTitle}>
                    {selectedCourier.toUpperCase()}
                  </Text>
                </View>
                {(() => {
                  const totalDisplay = formatCurrencyWithConversion(
                    estimate.courierTotal,
                    preferredCurrency,
                    "USD"
                  );
                  return (
                    <>
                      <Text style={styles.priceCardValue}>
                        {totalDisplay.primary}
                      </Text>
                      {totalDisplay.secondary && (
                        <Text style={styles.priceConversionText}>
                          {totalDisplay.secondary}
                        </Text>
                      )}
                    </>
                  );
                })()}
                {estimate.customsCost > 0 && (
                  <View style={styles.priceBreakdown}>
                    {(() => {
                      const shippingDisplay = formatCurrencyWithConversion(
                        estimate.courierPrice,
                        preferredCurrency,
                        "USD"
                      );
                      return (
                        <Text style={styles.priceBreakdownText}>
                          Shipping: {shippingDisplay.primary}
                        </Text>
                      );
                    })()}
                    {estimate.customsBreakdown && (
                      <View style={styles.customsBreakdown}>
                        {(() => {
                          const dutyDisplay = formatCurrencyWithConversion(
                            estimate.customsBreakdown.duty,
                            preferredCurrency,
                            "USD"
                          );
                          return (
                            <Text style={styles.priceBreakdownText}>
                              Duty: {dutyDisplay.primary}
                            </Text>
                          );
                        })()}
                        {estimate.customsBreakdown.tax > 0 &&
                          (() => {
                            const taxDisplay = formatCurrencyWithConversion(
                              estimate.customsBreakdown.tax,
                              preferredCurrency,
                              "USD"
                            );
                            return (
                              <Text style={styles.priceBreakdownText}>
                                {estimate.customsBreakdown.taxName || "Tax"}:{" "}
                                {taxDisplay.primary}
                              </Text>
                            );
                          })()}
                        {(() => {
                          const feeDisplay = formatCurrencyWithConversion(
                            estimate.customsBreakdown.processingFee,
                            preferredCurrency,
                            "USD"
                          );
                          return (
                            <Text style={styles.priceBreakdownText}>
                              Processing Fee: {feeDisplay.primary}
                            </Text>
                          );
                        })()}
                        {(() => {
                          const customsDisplay = formatCurrencyWithConversion(
                            estimate.customsCost,
                            preferredCurrency,
                            "USD"
                          );
                          return (
                            <Text
                              style={[
                                styles.priceBreakdownText,
                                styles.priceBreakdownTotal,
                              ]}
                            >
                              Total Customs: {customsDisplay.primary}
                            </Text>
                          );
                        })()}
                      </View>
                    )}
                    {!estimate.customsBreakdown &&
                      (() => {
                        const customsDisplay = formatCurrencyWithConversion(
                          estimate.customsCost,
                          preferredCurrency,
                          "USD"
                        );
                        return (
                          <Text style={styles.priceBreakdownText}>
                            Customs: {customsDisplay.primary}
                          </Text>
                        );
                      })()}
                  </View>
                )}
                {estimate.distanceKm && (
                  <Text style={styles.distanceText}>
                    Distance: {estimate.distanceKm.toFixed(0)} km
                  </Text>
                )}
              </View>

              {/* SpareCarry Plane - Only show if plane transport is allowed */}
              {estimate.canTransportByPlane !== false &&
                !restrictedItems &&
                restrictionDetails &&
                (() => {
                  const isOversized =
                    !restrictionDetails.fitsCheckedBaggage &&
                    restrictionDetails.fitsOversized;

                  return (
                    <View
                      style={[
                        styles.priceCard,
                        styles.spareCarryCard,
                        isOversized && styles.oversizedCard,
                      ]}
                    >
                      <View style={styles.priceCardHeader}>
                        <View style={styles.spareCarryLabel}>
                          <MaterialIcons
                            name="flight"
                            size={20}
                            color="#14b8a6"
                          />
                          <Text style={styles.priceCardTitle}>
                            SpareCarry Plane
                          </Text>
                        </View>
                        <View style={styles.savingsBadge}>
                          <Text style={styles.savingsBadgeText}>
                            Save {estimate.savingsPercentagePlane}%
                          </Text>
                        </View>
                      </View>
                      {(() => {
                        const planeDisplay = formatCurrencyWithConversion(
                          estimate.spareCarryPlanePrice,
                          preferredCurrency,
                          "USD"
                        );
                        return (
                          <>
                            <Text style={styles.priceCardValue}>
                              {planeDisplay.primary}
                            </Text>
                            {planeDisplay.secondary && (
                              <Text style={styles.priceConversionText}>
                                {planeDisplay.secondary}
                              </Text>
                            )}
                          </>
                        );
                      })()}
                      {isOversized && (
                        <View style={styles.oversizedWarning}>
                          <MaterialIcons
                            name="warning"
                            size={16}
                            color="#f59e0b"
                          />
                          <Text style={styles.oversizedWarningText}>
                            Oversized - airline fees may apply (typically{" "}
                            {
                              formatCurrencyWithConversion(
                                50,
                                preferredCurrency,
                                "USD"
                              ).primary
                            }
                            -
                            {
                              formatCurrencyWithConversion(
                                200,
                                preferredCurrency,
                                "USD"
                              ).primary
                            }
                            )
                          </Text>
                        </View>
                      )}
                      {isPremium && (
                        <Text style={styles.premiumBadge}>
                          Premium discount applied
                        </Text>
                      )}
                      {(() => {
                        const savingsDisplay = formatCurrencyWithConversion(
                          estimate.savingsPlane,
                          preferredCurrency,
                          "USD"
                        );
                        return (
                          <Text style={styles.savingsText}>
                            You save {savingsDisplay.primary}
                          </Text>
                        );
                      })()}
                    </View>
                  );
                })()}

              {/* Plane Restriction Warning with Detailed Breakdown */}
              {estimate.canTransportByPlane === false &&
                estimate.planeRestrictionReason &&
                restrictionDetails && (
                  <View style={styles.restrictionCard}>
                    <View style={styles.restrictionHeader}>
                      <MaterialIcons name="warning" size={20} color="#f59e0b" />
                      <Text style={styles.restrictionTitle}>
                        Plane Transport Not Available
                      </Text>
                    </View>
                    <Text style={styles.restrictionReason}>
                      {estimate.planeRestrictionReason}
                    </Text>

                    <TouchableOpacity
                      style={styles.detailsButton}
                      onPress={() => setShowRestrictionDetails(true)}
                    >
                      <Text style={styles.detailsButtonText}>
                        Why can't I use plane? →
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.restrictionInfoBox}>
                      <MaterialIcons name="info" size={16} color="#14b8a6" />
                      <Text style={styles.restrictionInfoText}>
                        Boat transport is the only available option for this
                        item. See boat pricing below.
                      </Text>
                    </View>
                  </View>
                )}

              {/* SpareCarry Boat - Always show, but highlight if it's the only option */}
              <View
                style={[
                  styles.priceCard,
                  styles.spareCarryBoatCard,
                  (restrictedItems || estimate.canTransportByPlane === false) &&
                    styles.onlyOptionCard,
                ]}
              >
                <View style={styles.priceCardHeader}>
                  <View style={styles.spareCarryLabel}>
                    <MaterialIcons
                      name="directions-boat"
                      size={20}
                      color="#14b8a6"
                    />
                    <Text style={styles.priceCardTitle}>SpareCarry Boat</Text>
                    {(restrictedItems ||
                      estimate.canTransportByPlane === false) && (
                      <View style={styles.onlyOptionBadge}>
                        <Text style={styles.onlyOptionBadgeText}>
                          Only Option
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsBadgeText}>
                      Save {estimate.savingsPercentageBoat}%
                    </Text>
                  </View>
                </View>
                {(() => {
                  const boatDisplay = formatCurrencyWithConversion(
                    estimate.spareCarryBoatPrice,
                    preferredCurrency,
                    "USD"
                  );
                  return (
                    <>
                      <Text style={styles.priceCardValue}>
                        {boatDisplay.primary}
                      </Text>
                      {boatDisplay.secondary && (
                        <Text style={styles.priceConversionText}>
                          {boatDisplay.secondary}
                        </Text>
                      )}
                    </>
                  );
                })()}
                {(restrictedItems ||
                  estimate.canTransportByPlane === false) && (
                  <View style={styles.onlyOptionInfo}>
                    <MaterialIcons
                      name="check-circle"
                      size={16}
                      color="#14b8a6"
                    />
                    <Text style={styles.onlyOptionInfoText}>
                      {restrictedItems
                        ? "Boat transport is required for restricted items."
                        : "Boat transport is the only option for this item size/weight."}
                    </Text>
                  </View>
                )}
                {isPremium && (
                  <Text style={styles.premiumBadge}>
                    Premium discount applied
                  </Text>
                )}
                {(() => {
                  const savingsDisplay = formatCurrencyWithConversion(
                    estimate.savingsBoat,
                    preferredCurrency,
                    "USD"
                  );
                  return (
                    <Text style={styles.savingsText}>
                      You save {savingsDisplay.primary}
                    </Text>
                  );
                })()}
                {estimate.boatDistanceKm && (
                  <Text style={styles.distanceText}>
                    Shipping route distance:{" "}
                    {estimate.boatDistanceKm.toFixed(0)} km
                  </Text>
                )}
              </View>

              {/* Best Savings Summary */}
              {(estimate.savingsBoat > 0 ||
                (estimate.canTransportByPlane && estimate.savingsPlane > 0)) &&
                (() => {
                  const maxSavings = Math.max(
                    estimate.savingsBoat,
                    estimate.canTransportByPlane ? estimate.savingsPlane : 0
                  );
                  const savingsDisplay = formatCurrencyWithConversion(
                    maxSavings,
                    preferredCurrency,
                    "USD"
                  );
                  return (
                    <View style={styles.savingsSummary}>
                      <MaterialIcons name="savings" size={24} color="#14b8a6" />
                      <Text style={styles.savingsSummaryText}>
                        Save up to {savingsDisplay.primary} with SpareCarry!
                      </Text>
                    </View>
                  );
                })()}

              <TouchableOpacity
                style={styles.postRequestButton}
                onPress={handlePostRequest}
              >
                <MaterialIcons name="add-circle" size={20} color="#fff" />
                <Text style={styles.postRequestButtonText}>Post Request</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholderResults}>
              <MaterialIcons name="calculate" size={48} color="#ccc" />
              <Text style={styles.placeholderResultsText}>
                Fill in the form to see price comparison
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryOption,
                    category === cat.value && styles.categoryOptionActive,
                  ]}
                  onPress={() => {
                    setCategory(cat.value);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      category === cat.value && styles.categoryOptionTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                  {category === cat.value && (
                    <MaterialIcons name="check" size={20} color="#14b8a6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Restriction Details Modal */}
      <Modal
        visible={showRestrictionDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRestrictionDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Plane Transport Restrictions
              </Text>
              <TouchableOpacity
                onPress={() => setShowRestrictionDetails(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {restrictionDetails && (
                <>
                  <View style={styles.restrictionSection}>
                    <Text style={styles.restrictionSectionTitle}>
                      Size & Weight Check:
                    </Text>
                    <View style={styles.restrictionCheckRow}>
                      <Text style={styles.restrictionCheckLabel}>
                        Carry-on (≤7kg, ≤55×40×23cm):
                      </Text>
                      <Text
                        style={[
                          styles.restrictionCheckResult,
                          restrictionDetails.fitsCarryOn
                            ? styles.restrictionCheckPass
                            : styles.restrictionCheckFail,
                        ]}
                      >
                        {restrictionDetails.fitsCarryOn
                          ? "✓ Fits"
                          : "✗ Too large/heavy"}
                      </Text>
                    </View>
                    <View style={styles.restrictionCheckRow}>
                      <Text style={styles.restrictionCheckLabel}>
                        Checked baggage (≤32kg, ≤158cm):
                      </Text>
                      <Text
                        style={[
                          styles.restrictionCheckResult,
                          restrictionDetails.fitsCheckedBaggage
                            ? styles.restrictionCheckPass
                            : styles.restrictionCheckFail,
                        ]}
                      >
                        {restrictionDetails.fitsCheckedBaggage
                          ? "✓ Fits"
                          : "✗ Too large/heavy"}
                      </Text>
                    </View>
                    <View style={styles.restrictionCheckRow}>
                      <Text style={styles.restrictionCheckLabel}>
                        Oversized (≤45kg, ≤320cm):
                      </Text>
                      <Text
                        style={[
                          styles.restrictionCheckResult,
                          restrictionDetails.fitsOversized
                            ? styles.restrictionCheckWarning
                            : styles.restrictionCheckFail,
                        ]}
                      >
                        {restrictionDetails.fitsOversized
                          ? "⚠ May require extra fees"
                          : "✗ Exceeds limits"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.restrictionSection}>
                    <Text style={styles.restrictionSectionTitle}>
                      Your Item:
                    </Text>
                    <Text style={styles.restrictionItemSpecs}>
                      Weight: {parseFloat(weight || "0").toFixed(1)}kg |
                      Dimensions: {parseFloat(length || "0").toFixed(0)}×
                      {parseFloat(width || "0").toFixed(0)}×
                      {parseFloat(height || "0").toFixed(0)}cm | Total:{" "}
                      {(
                        parseFloat(length || "0") +
                        parseFloat(width || "0") +
                        parseFloat(height || "0")
                      ).toFixed(0)}
                      cm
                    </Text>
                  </View>

                  {restrictedItems && (
                    <View style={styles.restrictionSection}>
                      <Text style={styles.restrictionSectionTitle}>
                        Restricted Items:
                      </Text>
                      <Text style={styles.restrictionItemSpecs}>
                        Contains restricted goods that cannot be transported by
                        plane.
                      </Text>
                    </View>
                  )}

                  <View style={styles.restrictionSection}>
                    <Text style={styles.restrictionNote}>
                      Boat transport is available for all items, including
                      oversized and restricted goods.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    backgroundColor: "#f9fafb",
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    gap: 20,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputText: {
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    fontSize: 16,
    color: "#999",
  },
  dimensionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  dimensionField: {
    flex: 1,
  },
  dimensionInput: {
    flex: 1,
  },
  conversionText: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
  },
  checkboxLabelContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  checkboxHint: {
    fontSize: 12,
    color: "#666",
  },
  courierButtons: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  courierButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  courierButtonActive: {
    borderColor: "#14b8a6",
    backgroundColor: "#e0f7fa",
  },
  courierButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  courierButtonTextActive: {
    color: "#14b8a6",
  },
  results: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  placeholderResults: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 16,
  },
  placeholderResultsText: {
    fontSize: 14,
    color: "#999",
    marginTop: 12,
  },
  priceCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  spareCarryCard: {
    backgroundColor: "#e0f7fa",
    borderColor: "#14b8a6",
    borderWidth: 2,
  },
  spareCarryBoatCard: {
    backgroundColor: "#e0f2fe",
    borderColor: "#14b8a6",
    borderWidth: 2,
  },
  oversizedCard: {
    borderColor: "#f59e0b",
  },
  priceCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  priceCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  spareCarryLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priceCardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  priceConversionText: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
    fontStyle: "italic",
  },
  savingsBadge: {
    backgroundColor: "#14b8a6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  savingsBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  priceBreakdown: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  priceBreakdownText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  customsBreakdown: {
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: "#e5e7eb",
    marginTop: 4,
  },
  priceBreakdownTotal: {
    fontWeight: "600",
    marginTop: 4,
  },
  distanceText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  oversizedWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: "#fef3c7",
    borderRadius: 4,
  },
  oversizedWarningText: {
    fontSize: 12,
    color: "#92400e",
    fontWeight: "500",
  },
  premiumBadge: {
    fontSize: 12,
    color: "#14b8a6",
    fontWeight: "600",
    marginTop: 4,
  },
  savingsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#14b8a6",
    marginTop: 4,
  },
  restrictionCard: {
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#f59e0b",
  },
  restrictionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  restrictionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400e",
  },
  restrictionReason: {
    fontSize: 12,
    color: "#92400e",
    marginBottom: 8,
  },
  detailsButton: {
    marginTop: 8,
  },
  detailsButtonText: {
    fontSize: 12,
    color: "#92400e",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  restrictionNote: {
    fontSize: 12,
    color: "#92400e",
    fontWeight: "500",
    marginTop: 8,
  },
  restrictionInfoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#e0f7fa",
    borderRadius: 6,
  },
  restrictionInfoText: {
    fontSize: 12,
    color: "#14b8a6",
    fontWeight: "500",
    flex: 1,
  },
  transportMethodContainer: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 4,
  },
  transportMethodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "transparent",
  },
  transportMethodButtonActive: {
    backgroundColor: "#14b8a6",
  },
  transportMethodButtonDisabled: {
    opacity: 0.5,
  },
  transportMethodButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#14b8a6",
  },
  transportMethodButtonTextActive: {
    color: "#fff",
  },
  transportMethodButtonTextDisabled: {
    color: "#999",
  },
  transportMethodHint: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
  },
  onlyOptionCard: {
    borderColor: "#14b8a6",
    borderWidth: 3,
    backgroundColor: "#e0f7fa",
  },
  onlyOptionBadge: {
    marginLeft: 8,
    backgroundColor: "#14b8a6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  onlyOptionBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  onlyOptionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: "#f0fdfa",
    borderRadius: 4,
  },
  onlyOptionInfoText: {
    fontSize: 12,
    color: "#14b8a6",
    fontWeight: "500",
    flex: 1,
  },
  savingsSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f0fdfa",
    borderRadius: 8,
  },
  savingsSummaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#14b8a6",
    flex: 1,
  },
  postRequestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#14b8a6",
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  postRequestButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalScroll: {
    maxHeight: 400,
  },
  categoryOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  categoryOptionActive: {
    backgroundColor: "#e0f7fa",
  },
  categoryOptionText: {
    fontSize: 16,
    color: "#333",
  },
  categoryOptionTextActive: {
    color: "#14b8a6",
    fontWeight: "600",
  },
  restrictionSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  restrictionSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  restrictionCheckRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  restrictionCheckLabel: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  restrictionCheckResult: {
    fontSize: 12,
    fontWeight: "600",
  },
  restrictionCheckPass: {
    color: "#14b8a6",
  },
  restrictionCheckFail: {
    color: "#ef4444",
  },
  restrictionCheckWarning: {
    color: "#f59e0b",
  },
  restrictionItemSpecs: {
    fontSize: 12,
    color: "#666",
  },
});
