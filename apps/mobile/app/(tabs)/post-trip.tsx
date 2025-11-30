/**
 * Post Trip Screen - Mobile
 * Simplified form to create trips
 */

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { createClient } from "@sparecarry/lib/supabase";
import { useAuth } from "@sparecarry/hooks/useAuth";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  LocationInput,
  FormTemplates,
  type TripTemplate,
} from "@sparecarry/ui";

export default function PostTripScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [submitStep, setSubmitStep] = useState<
    "idle" | "validating" | "submitting" | "complete"
  >("idle");
  const [tripType, setTripType] = useState<"plane" | "boat">("plane");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [departureDate, setDepartureDate] = useState(new Date());
  const [arrivalDate, setArrivalDate] = useState(new Date());
  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);
  const [spareKg, setSpareKg] = useState("");
  const [spareVolume, setSpareVolume] = useState("");
  const [maxLength, setMaxLength] = useState("");
  const [maxWidth, setMaxWidth] = useState("");
  const [maxHeight, setMaxHeight] = useState("");
  const [prohibitedItemsConfirmed, setProhibitedItemsConfirmed] =
    useState(false);
  const [canTakeOutboard, setCanTakeOutboard] = useState(false);
  const [canTakeSpar, setCanTakeSpar] = useState(false);
  const [canTakeDinghy, setCanTakeDinghy] = useState(false);
  const [canOversize, setCanOversize] = useState(false);
  const [canTakeHazardous, setCanTakeHazardous] = useState(false);
  const [fromLat, setFromLat] = useState<number | null>(null);
  const [fromLon, setFromLon] = useState<number | null>(null);
  const [toLat, setToLat] = useState<number | null>(null);
  const [toLon, setToLon] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTemplates, setShowTemplates] = useState(false);

  const DRAFT_KEY = "post_trip_draft";

  // Load draft on screen focus
  useFocusEffect(
    useCallback(() => {
      const loadDraft = async () => {
        try {
          const draft = await AsyncStorage.getItem(DRAFT_KEY);
          if (draft) {
            try {
              const draftData = JSON.parse(draft);
              // Only restore if form is empty
              if (!fromLocation && !toLocation) {
                setTripType(draftData.tripType || "plane");
                setFromLocation(draftData.fromLocation || "");
                setToLocation(draftData.toLocation || "");
                setFromLat(draftData.fromLat || null);
                setFromLon(draftData.fromLon || null);
                setToLat(draftData.toLat || null);
                setToLon(draftData.toLon || null);
                setSpareKg(draftData.spareKg || "");
                setSpareVolume(draftData.spareVolume || "");
                setMaxLength(draftData.maxLength || "");
                setMaxWidth(draftData.maxWidth || "");
                setMaxHeight(draftData.maxHeight || "");
                setProhibitedItemsConfirmed(
                  draftData.prohibitedItemsConfirmed || false
                );
                setCanTakeOutboard(draftData.canTakeOutboard || false);
                setCanTakeSpar(draftData.canTakeSpar || false);
                setCanTakeDinghy(draftData.canTakeDinghy || false);
                setCanOversize(draftData.canOversize || false);
                setCanTakeHazardous(draftData.canTakeHazardous || false);
                if (draftData.departureDate) {
                  setDepartureDate(new Date(draftData.departureDate));
                }
                if (draftData.arrivalDate) {
                  setArrivalDate(new Date(draftData.arrivalDate));
                }
              }
            } catch (draftError) {
              console.error("Error loading draft:", draftError);
            }
          }
        } catch (error) {
          console.error("Error loading draft:", error);
        }
      };

      loadDraft();
    }, [fromLocation, toLocation])
  );

  // Auto-save draft every 5 seconds
  useEffect(() => {
    const saveDraft = async () => {
      // Only save if form has some content
      if (fromLocation || toLocation || spareKg || spareVolume) {
        try {
          const draftData = {
            tripType,
            fromLocation,
            toLocation,
            fromLat,
            fromLon,
            toLat,
            toLon,
            spareKg,
            spareVolume,
            maxLength,
            maxWidth,
            maxHeight,
            prohibitedItemsConfirmed,
            canTakeOutboard,
            canTakeSpar,
            canTakeDinghy,
            canOversize,
            canTakeHazardous,
            departureDate: departureDate.toISOString(),
            arrivalDate: arrivalDate.toISOString(),
          };
          await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
        } catch (error) {
          console.error("Error saving draft:", error);
        }
      }
    };

    const timer = setInterval(saveDraft, 5000);
    return () => clearInterval(timer);
  }, [
    tripType,
    fromLocation,
    toLocation,
    fromLat,
    fromLon,
    toLat,
    toLon,
    spareKg,
    spareVolume,
    maxLength,
    maxWidth,
    maxHeight,
    prohibitedItemsConfirmed,
    canTakeOutboard,
    canTakeSpar,
    canTakeDinghy,
    canOversize,
    canTakeHazardous,
    departureDate,
    arrivalDate,
  ]);

  // Validate field on change
  const validateField = (field: string, value: string | number) => {
    const newErrors = { ...errors };

    switch (field) {
      case "fromLocation":
        if (!value || (typeof value === "string" && !value.trim())) {
          newErrors.fromLocation = "From location is required";
        } else {
          delete newErrors.fromLocation;
        }
        break;
      case "toLocation":
        if (!value || (typeof value === "string" && !value.trim())) {
          newErrors.toLocation = "To location is required";
        } else {
          delete newErrors.toLocation;
        }
        break;
      case "spareKg":
        const kg = typeof value === "string" ? parseFloat(value) : value;
        if (kg !== undefined && kg !== null && !isNaN(kg) && kg < 0) {
          newErrors.spareKg = "Spare capacity cannot be negative";
        } else {
          delete newErrors.spareKg;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Error", "Please log in to post a trip");
      return;
    }

    // Validate all required fields with better error messages
    const validationErrors: Record<string, string> = {};

    if (!fromLocation.trim()) {
      validationErrors.fromLocation = "From location is required";
    }
    if (!toLocation.trim()) {
      validationErrors.toLocation = "To location is required";
    }

    if (tripType === "plane") {
      const spareKgValue = spareKg ? parseFloat(spareKg) : 0;
      if (
        !spareKg ||
        isNaN(spareKgValue) ||
        spareKgValue < 0 ||
        spareKgValue > 32
      ) {
        validationErrors.spareKg = `Spare capacity must be between 0 and 32kg for carry-on. You entered: ${spareKg || "empty"}`;
      }
      const maxLengthValue = maxLength ? parseFloat(maxLength) : 0;
      if (!maxLength || isNaN(maxLengthValue) || maxLengthValue <= 0) {
        validationErrors.maxLength = `Max length must be positive. You entered: ${maxLength || "empty"}`;
      }
      const maxWidthValue = maxWidth ? parseFloat(maxWidth) : 0;
      if (!maxWidth || isNaN(maxWidthValue) || maxWidthValue <= 0) {
        validationErrors.maxWidth = `Max width must be positive. You entered: ${maxWidth || "empty"}`;
      }
      const maxHeightValue = maxHeight ? parseFloat(maxHeight) : 0;
      if (!maxHeight || isNaN(maxHeightValue) || maxHeightValue <= 0) {
        validationErrors.maxHeight = `Max height must be positive. You entered: ${maxHeight || "empty"}`;
      }
      if (!prohibitedItemsConfirmed) {
        validationErrors.prohibitedItems =
          "You must confirm that you are not carrying prohibited items for plane transport";
      }
    } else {
      if (spareKg) {
        const spareKgValue = parseFloat(spareKg);
        if (isNaN(spareKgValue) || spareKgValue < 0) {
          validationErrors.spareKg = `Spare capacity must be positive. You entered: ${spareKg}`;
        }
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const errorMessages = Object.values(validationErrors).join("\n");
      Alert.alert("Validation Error", errorMessages, [{ text: "OK" }]);
      return;
    }

    setErrors({});

    setLoading(true);
    setSubmitStep("validating");

    try {
      setSubmitStep("submitting");
      const tripData: any = {
        user_id: user.id,
        type: tripType,
        from_location: fromLocation.trim(),
        to_location: toLocation.trim(),
        departure_lat: fromLat,
        departure_lon: fromLon,
        arrival_lat: toLat,
        arrival_lon: toLon,
        status: "active",
      };

      if (tripType === "plane") {
        tripData.departure_date = departureDate.toISOString();
        tripData.arrival_date = arrivalDate.toISOString();
        tripData.spare_kg = parseFloat(spareKg) || 0;
        tripData.spare_volume_liters = spareVolume
          ? parseFloat(spareVolume)
          : null;
        tripData.max_length_cm = parseFloat(maxLength);
        tripData.max_width_cm = parseFloat(maxWidth);
        tripData.max_height_cm = parseFloat(maxHeight);
        tripData.prohibited_items_confirmed = true;
      } else {
        tripData.eta_window_start = departureDate.toISOString();
        tripData.eta_window_end = arrivalDate.toISOString();
        tripData.spare_kg = spareKg ? parseFloat(spareKg) : null;
        tripData.spare_volume_liters = spareVolume
          ? parseFloat(spareVolume)
          : null;
        tripData.can_take_outboard = canTakeOutboard;
        tripData.can_take_spar = canTakeSpar;
        tripData.can_take_dinghy = canTakeDinghy;
        tripData.can_oversize = canOversize;
        tripData.can_take_hazardous = canTakeHazardous;
      }

      const { data, error } = await supabase
        .from("trips")
        .insert(tripData)
        .select()
        .single();

      if (error) throw error;

      // Clear draft on successful submit
      await AsyncStorage.removeItem(DRAFT_KEY);

      setSubmitStep("complete");

      Alert.alert("Success", "Trip posted successfully!", [
        {
          text: "OK",
          onPress: () => {
            router.replace("/(tabs)");
          },
        },
      ]);
    } catch (error: any) {
      console.error("Error posting trip:", error);
      setSubmitStep("idle");
      Alert.alert("Error", error.message || "Failed to post trip");
    } finally {
      setLoading(false);
      // Reset step after a delay if not completed
      if (submitStep !== "complete") {
        setTimeout(() => setSubmitStep("idle"), 1000);
      }
    }
  };

  const getSubmitButtonText = () => {
    switch (submitStep) {
      case "validating":
        return "Validating...";
      case "submitting":
        return "Submitting trip...";
      case "complete":
        return "Posted!";
      default:
        return "Post Trip";
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Post Trip</Text>
              <Text style={styles.subtitle}>
                Traveling somewhere? Post your trip and earn money carrying
                items.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.templateButton}
              onPress={() => setShowTemplates(true)}
            >
              <MaterialIcons name="content-copy" size={20} color="#14b8a6" />
              <Text style={styles.templateButtonText}>Templates</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FormTemplates
          visible={showTemplates}
          onClose={() => setShowTemplates(false)}
          onSelectTemplate={(template) => {
            const t = template as TripTemplate;
            if (t.values.tripType) setTripType(t.values.tripType);
            if (t.values.spareKg) setSpareKg(t.values.spareKg);
            if (t.values.spareVolume) setSpareVolume(t.values.spareVolume);
            if (t.values.maxLength) setMaxLength(t.values.maxLength);
            if (t.values.maxWidth) setMaxWidth(t.values.maxWidth);
            if (t.values.maxHeight) setMaxHeight(t.values.maxHeight);
          }}
          type="trip"
        />

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Trip Type *</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  tripType === "plane" && styles.typeButtonActive,
                ]}
                onPress={() => setTripType("plane")}
              >
                <MaterialIcons
                  name="flight"
                  size={24}
                  color={tripType === "plane" ? "#fff" : "#14b8a6"}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    tripType === "plane" && styles.typeButtonTextActive,
                  ]}
                >
                  Plane
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  tripType === "boat" && styles.typeButtonActive,
                ]}
                onPress={() => setTripType("boat")}
              >
                <MaterialIcons
                  name="directions-boat"
                  size={24}
                  color={tripType === "boat" ? "#fff" : "#14b8a6"}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    tripType === "boat" && styles.typeButtonTextActive,
                  ]}
                >
                  Boat
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <LocationInput
              label="From Location *"
              value={fromLocation}
              onChange={(address, lat, lon) => {
                setFromLocation(address);
                setFromLat(lat);
                setFromLon(lon);
                validateField("fromLocation", address);
              }}
              onLocationSelect={(place) => {
                const locationName =
                  "name" in place ? place.name : place.address;
                setFromLocation(locationName);
                setFromLat(place.lat);
                setFromLon(place.lon);
                validateField("fromLocation", locationName);
              }}
              placeholder="e.g., Miami, FL"
              showCommonLocations={false}
            />
            {errors.fromLocation && (
              <Text style={styles.errorText}>{errors.fromLocation}</Text>
            )}
          </View>

          <View style={styles.field}>
            <LocationInput
              label="To Location *"
              value={toLocation}
              onChange={(address, lat, lon) => {
                setToLocation(address);
                setToLat(lat);
                setToLon(lon);
                validateField("toLocation", address);
              }}
              onLocationSelect={(place) => {
                const locationName =
                  "name" in place ? place.name : place.address;
                setToLocation(locationName);
                setToLat(place.lat);
                setToLon(place.lon);
                validateField("toLocation", locationName);
              }}
              placeholder="e.g., Nassau, Bahamas"
              showCommonLocations={false}
            />
            {errors.toLocation && (
              <Text style={styles.errorText}>{errors.toLocation}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              {tripType === "plane" ? "Departure Date *" : "ETA Window Start *"}
            </Text>

            {/* Quick Date Select Buttons */}
            <View style={styles.quickDateButtons}>
              <TouchableOpacity
                style={styles.quickDateButton}
                onPress={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setDepartureDate(nextWeek);
                }}
              >
                <Text style={styles.quickDateButtonText}>Next Week</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickDateButton}
                onPress={() => {
                  const nextMonth = new Date();
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  setDepartureDate(nextMonth);
                }}
              >
                <Text style={styles.quickDateButtonText}>Next Month</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickDateButton}
                onPress={() => {
                  const threeMonths = new Date();
                  threeMonths.setMonth(threeMonths.getMonth() + 3);
                  setDepartureDate(threeMonths);
                }}
              >
                <Text style={styles.quickDateButtonText}>+3 Months</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDeparturePicker(true)}
            >
              <MaterialIcons name="calendar-today" size={20} color="#14b8a6" />
              <Text style={styles.dateText}>
                {departureDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showDeparturePicker && (
              <DateTimePicker
                value={departureDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  setShowDeparturePicker(Platform.OS === "ios");
                  if (selectedDate) {
                    setDepartureDate(selectedDate);
                  }
                }}
                minimumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              {tripType === "plane" ? "Arrival Date *" : "ETA Window End *"}
            </Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowArrivalPicker(true)}
            >
              <MaterialIcons name="calendar-today" size={20} color="#14b8a6" />
              <Text style={styles.dateText}>
                {arrivalDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showArrivalPicker && (
              <DateTimePicker
                value={arrivalDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  setShowArrivalPicker(Platform.OS === "ios");
                  if (selectedDate) {
                    setArrivalDate(selectedDate);
                  }
                }}
                minimumDate={departureDate}
              />
            )}
          </View>

          {tripType === "plane" ? (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Spare Capacity (kg) *</Text>
                <TextInput
                  style={styles.input}
                  value={spareKg}
                  onChangeText={setSpareKg}
                  placeholder="0-32"
                  keyboardType="numeric"
                />
                <Text style={styles.hint}>Maximum 32kg for carry-on</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Spare Volume (liters)</Text>
                <TextInput
                  style={styles.input}
                  value={spareVolume}
                  onChangeText={setSpareVolume}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Max Dimensions (cm) *</Text>
                <View style={styles.dimensionsRow}>
                  <TextInput
                    style={[styles.input, styles.dimensionInput]}
                    value={maxLength}
                    onChangeText={setMaxLength}
                    placeholder="Length"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.input, styles.dimensionInput]}
                    value={maxWidth}
                    onChangeText={setMaxWidth}
                    placeholder="Width"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.input, styles.dimensionInput]}
                    value={maxHeight}
                    onChangeText={setMaxHeight}
                    placeholder="Height"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() =>
                    setProhibitedItemsConfirmed(!prohibitedItemsConfirmed)
                  }
                >
                  <MaterialIcons
                    name={
                      prohibitedItemsConfirmed
                        ? "check-box"
                        : "check-box-outline-blank"
                    }
                    size={24}
                    color={prohibitedItemsConfirmed ? "#14b8a6" : "#999"}
                  />
                  <Text style={styles.checkboxLabel}>
                    I confirm I am not carrying prohibited items
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Spare Capacity (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={spareKg}
                  onChangeText={setSpareKg}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Spare Volume (liters)</Text>
                <TextInput
                  style={styles.input}
                  value={spareVolume}
                  onChangeText={setSpareVolume}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Special Capabilities</Text>
                {[
                  {
                    key: "outboard",
                    label: "Can take outboard motors",
                    state: canTakeOutboard,
                    setter: setCanTakeOutboard,
                  },
                  {
                    key: "spar",
                    label: "Can take spars",
                    state: canTakeSpar,
                    setter: setCanTakeSpar,
                  },
                  {
                    key: "dinghy",
                    label: "Can take dinghies",
                    state: canTakeDinghy,
                    setter: setCanTakeDinghy,
                  },
                  {
                    key: "oversize",
                    label: "Can take oversize items",
                    state: canOversize,
                    setter: setCanOversize,
                  },
                  {
                    key: "hazardous",
                    label: "Can take hazardous materials",
                    state: canTakeHazardous,
                    setter: setCanTakeHazardous,
                  },
                ].map(({ key, label, state, setter }) => (
                  <TouchableOpacity
                    key={key}
                    style={styles.checkboxRow}
                    onPress={() => setter(!state)}
                  >
                    <MaterialIcons
                      name={state ? "check-box" : "check-box-outline-blank"}
                      size={24}
                      color={state ? "#14b8a6" : "#999"}
                    />
                    <Text style={styles.checkboxLabel}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <ActivityIndicator
                  color="#fff"
                  size="small"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.submitButtonText}>
                  {getSubmitButtonText()}
                </Text>
              </>
            ) : (
              <>
                <MaterialIcons name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Post Trip</Text>
              </>
            )}
          </TouchableOpacity>
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
    backgroundColor: "#f9fafb",
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerText: {
    flex: 1,
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
  templateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#e0f7fa",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#14b8a6",
  },
  templateButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#14b8a6",
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
  },
  inputError: {
    borderColor: "#ef4444",
    borderWidth: 2,
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
  dimensionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  dimensionInput: {
    flex: 1,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  quickDateButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  quickDateButton: {
    flex: 1,
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#14b8a6",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  quickDateButtonText: {
    fontSize: 11,
    color: "#14b8a6",
    fontWeight: "600",
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#14b8a6",
    borderRadius: 8,
    padding: 16,
  },
  typeButtonActive: {
    backgroundColor: "#14b8a6",
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#14b8a6",
  },
  typeButtonTextActive: {
    color: "#fff",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#14b8a6",
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  locationInput: {
    flex: 1,
  },
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#f0fdfa",
    borderWidth: 1,
    borderColor: "#14b8a6",
    alignItems: "center",
    justifyContent: "center",
  },
});
