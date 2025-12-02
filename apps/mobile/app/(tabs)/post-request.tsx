/**
 * Post Request Screen - Mobile
 * Simplified form to create delivery requests
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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { createClient } from "@sparecarry/lib/supabase";
import { useAuth } from "@sparecarry/hooks/useAuth";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  LocationInput,
  FormTemplates,
  type RequestTemplate,
} from "@sparecarry/ui";
import { getARCapability } from "../../lib/utils/arChecker";
import { ARMeasurementResult } from "../../lib/types/measurement";
import {
  calculateShippingEstimate,
  type ShippingEstimateInput,
} from "@root-lib/services/shipping";
import { useQuery } from "@tanstack/react-query";
import { useUserPreferences } from "@sparecarry/hooks/useUserPreferences";
import { cmToInches, kgToLbs } from "@sparecarry/lib/utils/imperial";
import {
  formatCurrencyWithConversion,
  detectUserCurrency,
  convertCurrency,
  formatCurrency,
  CURRENCIES,
} from "@sparecarry/lib/utils/currency";
import {
  estimateWeightFromFeel,
  detectItemSpecs,
  type WeightFeel,
} from "@root-lib/utils/weight-estimation";

export default function PostRequestScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [submitStep, setSubmitStep] = useState<
    "idle" | "validating" | "uploading" | "submitting" | "complete"
  >("idle");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [deadlineUrgency, setDeadlineUrgency] = useState<"3" | "7" | "14" | "14+">("14+");
  const [deadline, setDeadline] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  });
  const [maxReward, setMaxReward] = useState("");
  const [suggestedRewardRange, setSuggestedRewardRange] = useState<{
    min: number;
    max: number;
    base: number;
  } | null>(null);
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [weightFeel, setWeightFeel] = useState<WeightFeel | null>(null);
  const [lastWeightFeel, setLastWeightFeel] = useState<WeightFeel | null>(null);
  const [weightManuallySet, setWeightManuallySet] = useState(false);
  const [preferredMethod, setPreferredMethod] = useState<
    "plane" | "boat" | "any"
  >("any");
  const [restrictedItems, setRestrictedItems] = useState(false);
  const [prohibitedItemsConfirmed, setProhibitedItemsConfirmed] =
    useState(false);
  const [customsComplianceConfirmed, setCustomsComplianceConfirmed] =
    useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [fromLat, setFromLat] = useState<number | null>(null);
  const [fromLon, setFromLon] = useState<number | null>(null);
  const [toLat, setToLat] = useState<number | null>(null);
  const [toLon, setToLon] = useState<number | null>(null);
  const [isAutoEstimated, setIsAutoEstimated] = useState(false);
  const [originCountry, setOriginCountry] = useState<string>("");
  const [destinationCountry, setDestinationCountry] = useState<string>("");
  const [isAutoCalculatingReward, setIsAutoCalculatingReward] = useState(false);

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTemplates, setShowTemplates] = useState(false);

  // User preferences
  const { preferImperial } = useUserPreferences();
  const preferredCurrency = detectUserCurrency(); // Get user's currency from browser locale

  // Get subscription status for premium pricing
  const { data: subscriptionStatus } = useQuery({
    queryKey: ["subscription-status", user?.id],
    queryFn: async () => {
      if (!user?.id) return { isPremium: false };
      try {
        const { data } = await supabase
          .from("users")
          .select("subscription_status")
          .eq("id", user.id)
          .single();
        const isPremium =
          data?.subscription_status === "active" ||
          data?.subscription_status === "trialing";
        return { isPremium };
      } catch (error) {
        console.warn("Error checking subscription status:", error);
        return { isPremium: false };
      }
    },
    enabled: !!user,
    staleTime: 60000,
  });
  const isPremium = subscriptionStatus?.isPremium ?? false;

  const DRAFT_KEY = "post_request_draft";

  // Auto-calculate max reward when enough fields are filled
  useEffect(() => {
    const calculateReward = async () => {
      // Need: locations with coordinates, dimensions, weight
      // Country codes will be fetched if missing
      if (!fromLocation || !toLocation) {
        console.log("[AutoCalc] Missing locations:", {
          fromLocation,
          toLocation,
        });
        return;
      }
      if (!fromLat || !fromLon || !toLat || !toLon) {
        console.log("[AutoCalc] Missing coordinates:", {
          fromLat,
          fromLon,
          toLat,
          toLon,
        });
        return;
      }
      if (!length || !width || !height || !weight) {
        console.log("[AutoCalc] Missing dimensions/weight:", {
          length,
          width,
          height,
          weight,
        });
        return;
      }

      const l = parseFloat(length);
      const w = parseFloat(width);
      const h = parseFloat(height);
      const wt = parseFloat(weight);

      if (l <= 0 || w <= 0 || h <= 0 || wt <= 0) {
        console.log("[AutoCalc] Invalid dimensions/weight values:", {
          l,
          w,
          h,
          wt,
        });
        return;
      }

      console.log("[AutoCalc] Starting calculation...", {
        fromLocation,
        toLocation,
        fromLat,
        fromLon,
        toLat,
        toLon,
        length: l,
        width: w,
        height: h,
        weight: wt,
        originCountry,
        destinationCountry,
      });

      setIsAutoCalculatingReward(true);

      try {
        // Get country codes if missing
        let finalOriginCountry = originCountry;
        let finalDestinationCountry = destinationCountry;

        if (!finalOriginCountry && fromLat && fromLon) {
          console.log("[AutoCalc] Fetching origin country...");
          try {
            const { reverseGeocode } =
              await import("@sparecarry/lib/services/location");
            const geocoded = await reverseGeocode(fromLat, fromLon);
            if (geocoded?.country) {
              finalOriginCountry = geocoded.country.toUpperCase();
              setOriginCountry(finalOriginCountry);
              console.log("[AutoCalc] Got origin country:", finalOriginCountry);
            }
          } catch (error) {
            console.warn("[AutoCalc] Failed to get origin country:", error);
          }
        }

        if (!finalDestinationCountry && toLat && toLon) {
          console.log("[AutoCalc] Fetching destination country...");
          try {
            const { reverseGeocode } =
              await import("@sparecarry/lib/services/location");
            const geocoded = await reverseGeocode(toLat, toLon);
            if (geocoded?.country) {
              finalDestinationCountry = geocoded.country.toUpperCase();
              setDestinationCountry(finalDestinationCountry);
              console.log(
                "[AutoCalc] Got destination country:",
                finalDestinationCountry
              );
            }
          } catch (error) {
            console.warn(
              "[AutoCalc] Failed to get destination country:",
              error
            );
          }
        }

        // Still need country codes to calculate
        if (!finalOriginCountry || !finalDestinationCountry) {
          console.log("[AutoCalc] Missing country codes:", {
            finalOriginCountry,
            finalDestinationCountry,
          });
          setIsAutoCalculatingReward(false);
          return;
        }

        // Calculate distance
        const R = 6371; // Earth's radius in km
        const dLat = ((toLat! - fromLat!) * Math.PI) / 180;
        const dLon = ((toLon! - fromLon!) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((fromLat! * Math.PI) / 180) *
            Math.cos((toLat! * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = R * c;

        console.log("[AutoCalc] Calculated distance:", distanceKm, "km");

        // Prepare shipping estimate input
        const input: ShippingEstimateInput = {
          originCountry: finalOriginCountry,
          destinationCountry: finalDestinationCountry,
          length: l,
          width: w,
          height: h,
          weight: wt,
          declaredValue: 0,
          selectedCourier: "dhl", // Default, doesn't matter for SpareCarry pricing
          isPremium: isPremium,
          distanceKm: distanceKm,
          originLat: fromLat,
          originLon: fromLon,
          destinationLat: toLat,
          destinationLon: toLon,
        };

        console.log(
          "[AutoCalc] Calling calculateShippingEstimate with:",
          input
        );

        // Calculate estimate
        const result = calculateShippingEstimate(input);

        console.log("[AutoCalc] Result:", result);

        if (result) {
          // Use the cheaper SpareCarry option (boat preferred, fallback to plane)
          let suggestedReward: number;
          if (result.canTransportByPlane === false) {
            suggestedReward = Math.round(result.spareCarryBoatPrice);
          } else {
            suggestedReward =
              result.spareCarryBoatPrice > 0
                ? Math.round(result.spareCarryBoatPrice)
                : Math.round(result.spareCarryPlanePrice);
          }

          console.log("[AutoCalc] Suggested reward:", suggestedReward);

          // Calculate a range (like Airbnb): ±20% for acceptance likelihood
          const suggestedMin = Math.round(suggestedReward * 0.8);
          const suggestedMax = Math.round(suggestedReward * 1.2);
          
          // Store range for display
          setSuggestedRewardRange({
            min: suggestedMin,
            max: suggestedMax,
            base: suggestedReward,
          });

          // Only update if it's a valid amount (at least $50)
          if (suggestedReward >= 50) {
            console.log("[AutoCalc] Updating max reward to:", suggestedReward);
            // Convert to user's currency for input
            const userCurrencyAmount = convertCurrency(suggestedReward, "USD", preferredCurrency);
            setMaxReward(Math.round(userCurrencyAmount).toString());
            validateField("maxReward", Math.round(userCurrencyAmount).toString());
          } else {
            console.log(
              "[AutoCalc] Suggested reward too low:",
              suggestedReward
            );
          }
        } else {
          // If calculateShippingEstimate returns null (e.g., courier rates not available),
          // calculate SpareCarry prices directly
          console.log(
            "[AutoCalc] calculateShippingEstimate returned null, calculating SpareCarry prices directly"
          );

          try {
            const {
              calculateSpareCarryPlaneBasePrice,
              calculateSpareCarryBoatBasePrice,
              detectRouteComplexity,
              calculateUrgencyMultiplier,
            } = await import("@root-lib/services/shipping");
            const { checkPlaneRestrictions } =
              await import("@root-lib/utils/plane-restrictions");
            const { calculatePlatformFee } =
              await import("@root-src/constants/shippingFees");

            // Check plane restrictions
            const restrictionCheck = checkPlaneRestrictions({
              weight: wt,
              length: l,
              width: w,
              height: h,
              restrictedItems: restrictedItems,
              category: undefined,
              originCountry: finalOriginCountry,
              destinationCountry: finalDestinationCountry,
            });
            const canTransportByPlane = restrictionCheck.canTransportByPlane;

            // Detect route complexity
            const routeComplexity = detectRouteComplexity(
              finalOriginCountry,
              finalDestinationCountry,
              fromLat,
              fromLon,
              toLat,
              toLon
            );

            // Calculate urgency multiplier (no deadline in auto-calc)
            const urgencyMultiplier = calculateUrgencyMultiplier(undefined);

            // Calculate SpareCarry base prices
            const planeBasePrice = canTransportByPlane
              ? calculateSpareCarryPlaneBasePrice(
                  wt,
                  distanceKm,
                  l,
                  w,
                  h,
                  0, // declaredValue
                  false, // fragile
                  urgencyMultiplier
                )
              : 0;

            // Adjust distance for boat shipping (boats follow shipping routes)
            let boatDistanceKm = distanceKm;
            if (distanceKm > 0) {
              let routeMultiplier = 1.15; // Default 15% increase
              if (distanceKm > 10000) {
                routeMultiplier = 1.1;
              } else if (distanceKm > 5000) {
                routeMultiplier = 1.2;
              } else if (distanceKm > 2000) {
                routeMultiplier = 1.25;
              } else if (distanceKm < 500) {
                routeMultiplier = 1.3;
              }
              boatDistanceKm = distanceKm * routeMultiplier;
            }

            const boatBasePrice = calculateSpareCarryBoatBasePrice(
              wt,
              boatDistanceKm,
              l,
              w,
              h,
              restrictedItems,
              undefined, // category
              0, // declaredValue
              false, // fragile
              routeComplexity,
              urgencyMultiplier
            );

            // Calculate platform fees (non-premium)
            const platformFeePlane = canTransportByPlane
              ? calculatePlatformFee(planeBasePrice, false)
              : 0;
            const platformFeeBoat = calculatePlatformFee(boatBasePrice, false);

            // Calculate final SpareCarry prices
            const spareCarryPlanePrice = canTransportByPlane
              ? planeBasePrice + platformFeePlane
              : 0;
            const spareCarryBoatPrice = boatBasePrice + platformFeeBoat;

            // Use the cheaper SpareCarry option (boat preferred, fallback to plane)
            let suggestedReward: number;
            if (!canTransportByPlane) {
              suggestedReward = Math.round(spareCarryBoatPrice);
            } else {
              suggestedReward =
                spareCarryBoatPrice > 0
                  ? Math.round(spareCarryBoatPrice)
                  : Math.round(spareCarryPlanePrice);
            }

            console.log(
              "[AutoCalc] Direct calculation - Suggested reward:",
              suggestedReward
            );

            // Calculate a range (like Airbnb): ±20% for acceptance likelihood
            const suggestedMin = Math.round(suggestedReward * 0.8);
            const suggestedMax = Math.round(suggestedReward * 1.2);
            
            // Store range for display
            setSuggestedRewardRange({
              min: suggestedMin,
              max: suggestedMax,
              base: suggestedReward,
            });

            // Only update if it's a valid amount (at least $50)
            if (suggestedReward >= 50) {
              console.log(
                "[AutoCalc] Updating max reward to:",
                suggestedReward
              );
              // Convert to user's currency for input
              const userCurrencyAmount = convertCurrency(suggestedReward, "USD", preferredCurrency);
              setMaxReward(Math.round(userCurrencyAmount).toString());
              validateField("maxReward", Math.round(userCurrencyAmount).toString());
            } else {
              console.log(
                "[AutoCalc] Suggested reward too low:",
                suggestedReward
              );
            }
          } catch (error) {
            console.error(
              "[AutoCalc] Error calculating SpareCarry prices directly:",
              error
            );
          }
        }
      } catch (error) {
        console.error("[AutoCalc] Error:", error);
      } finally {
        setIsAutoCalculatingReward(false);
      }
    };

    // Debounce the calculation (reduced from 800ms to 600ms for better responsiveness)
    const timer = setTimeout(() => {
      calculateReward();
    }, 600);

    return () => clearTimeout(timer);
  }, [
    fromLocation,
    toLocation,
    fromLat,
    fromLon,
    toLat,
    toLon,
    originCountry,
    destinationCountry,
    length,
    width,
    height,
    weight,
    isPremium,
    restrictedItems,
  ]);

  // Auto-update weight when dimensions change (if weight feel is selected)
  useEffect(() => {
    const activeWeightFeel = weightFeel || lastWeightFeel;
    
    if (activeWeightFeel && length && width && height) {
      const l = parseFloat(length) || 0;
      const w = parseFloat(width) || 0;
      const h = parseFloat(height) || 0;
      
      if (l > 0 && w > 0 && h > 0 && !weightManuallySet) {
        const estimated = estimateWeightFromFeel(l, w, h, activeWeightFeel);
        setWeight(Math.round(estimated).toString()); // Round to whole number
        validateField("weight", Math.round(estimated).toString());
      }
    }
  }, [weightFeel, lastWeightFeel, length, width, height, weightManuallySet]);

  // Store weight feel selection
  useEffect(() => {
    if (weightFeel) {
      setLastWeightFeel(weightFeel);
      setWeightManuallySet(false);
    }
  }, [weightFeel]);

  // Track when user manually changes weight
  useEffect(() => {
    if (weight && (weightFeel || lastWeightFeel)) {
      const weightValue = parseFloat(weight) || 0;
      const l = parseFloat(length) || 0;
      const w = parseFloat(width) || 0;
      const h = parseFloat(height) || 0;
      
      if (l > 0 && w > 0 && h > 0) {
        const estimated = estimateWeightFromFeel(l, w, h, weightFeel || lastWeightFeel!);
        if (Math.abs(weightValue - estimated) > 1) {
          setWeightManuallySet(true);
        }
      }
    }
  }, [weight, weightFeel, lastWeightFeel, length, width, height]);

  // Auto-fill item specs (weight, dimensions, category) from title/description - updates in real-time
  useEffect(() => {
    // Always check for specs and update dynamically as user types
    const hasTitleOrDesc = (title && title.trim()) || (description && description.trim());
    
    if (hasTitleOrDesc) {
      const specs = detectItemSpecs(
        title || "",
        description || "",
        undefined // category not available in mobile form yet
      );
      
      if (specs) {
        // Auto-fill weight (always update if detected - user can override by typing)
        if (!weight || specs.source?.includes("estimated")) {
          setWeight(Math.round(specs.weight).toString());
          validateField("weight", Math.round(specs.weight).toString());
        }
        
        // Auto-fill dimensions (always update if detected)
        if (!length || !width || !height || specs.source?.includes("estimated")) {
          setLength(Math.round(specs.dimensions.length).toString());
          setWidth(Math.round(specs.dimensions.width).toString());
          setHeight(Math.round(specs.dimensions.height).toString());
          validateField("length", Math.round(specs.dimensions.length).toString());
          validateField("width", Math.round(specs.dimensions.width).toString());
          validateField("height", Math.round(specs.dimensions.height).toString());
        }
      }
    }
  }, [title, description, weight, length, width, height]);

  // Auto-set to boat if restricted items is checked
  useEffect(() => {
    if (restrictedItems && preferredMethod !== "boat") {
      setPreferredMethod("boat");
    }
  }, [restrictedItems, preferredMethod]);

  // Auto-set to boat if weight/dimensions exceed plane limits
  useEffect(() => {
    const weightKg = parseFloat(weight || "0");
    const lengthCm = parseFloat(length || "0");
    const widthCm = parseFloat(width || "0");
    const heightCm = parseFloat(height || "0");
    
    // Plane limits: typically 23-32kg per bag, 158cm total linear dimensions
    const PLANE_MAX_WEIGHT_KG = 32;
    const PLANE_MAX_LINEAR_CM = 158; // length + width + height
    
    const totalLinear = lengthCm + widthCm + heightCm;
    const exceedsWeight = weightKg > PLANE_MAX_WEIGHT_KG;
    const exceedsDimensions = totalLinear > PLANE_MAX_LINEAR_CM;
    const exceedsPlaneLimits = exceedsWeight || exceedsDimensions;
    
    if (exceedsPlaneLimits && preferredMethod === "plane") {
      setPreferredMethod("boat");
    }
  }, [weight, length, width, height, preferredMethod]);

  // Load Auto-Measure results when returning from camera (using useFocusEffect instead of polling)
  useFocusEffect(
    useCallback(() => {
      const loadPrefillData = async () => {
        try {
          // Load AR measurement results (new format)
          const arResult = await AsyncStorage.getItem("arMeasurementResult");
          if (arResult) {
            try {
              const measurement: ARMeasurementResult = JSON.parse(arResult);
              
              // Convert to cm (AR uses meters, photo uses cm)
              let lengthCm = measurement.L;
              let widthCm = measurement.W;
              let heightCm = measurement.H;
              
              // If confidence is High, it's AR and measurements are in meters
              if (measurement.confidence === "High") {
                lengthCm = measurement.L * 100; // Convert meters to cm
                widthCm = measurement.W * 100;
                heightCm = measurement.H * 100;
              }
              
              setLength(lengthCm.toFixed(1));
              setWidth(widthCm.toFixed(1));
              setHeight(heightCm.toFixed(1));
              setIsAutoEstimated(true);
              
              // Add photo if available
              if (measurement.photoUri) {
                setPhotos((prev) => [...prev, measurement.photoUri]);
              }
              
              await AsyncStorage.removeItem("arMeasurementResult");
            } catch (parseError) {
              console.error("Error parsing AR measurement result:", parseError);
            }
          }
          
          // Also check for legacy auto-measure results
          const result = await AsyncStorage.getItem("autoMeasureResult");
          if (result) {
            const dimensions = JSON.parse(result);
            setLength(dimensions.length_cm?.toString() || "");
            setWidth(dimensions.width_cm?.toString() || "");
            setHeight(dimensions.height_cm?.toString() || "");
            setIsAutoEstimated(true);
            await AsyncStorage.removeItem("autoMeasureResult");
          }

          // Load auto-measure photos (legacy format)
          const storedPhotos = await AsyncStorage.getItem("autoMeasurePhotos");
          if (storedPhotos) {
            try {
              const parsedPhotos = JSON.parse(storedPhotos);
              const photoUris = parsedPhotos.map((p: any) => p.uri || p);
              setPhotos((prev) => [...prev, ...photoUris]);
              await AsyncStorage.removeItem("autoMeasurePhotos");
            } catch (photoError) {
              console.error("Error loading auto-measure photos:", photoError);
            }
          }

          // Load saved form state first (from when user went to shipping estimator)
          const formState = await AsyncStorage.getItem("postRequestFormState");
          if (formState) {
            try {
              const state = JSON.parse(formState);
              // Restore all form fields
              if (state.title) setTitle(state.title);
              if (state.description) setDescription(state.description);
              if (state.fromLocation) {
                setFromLocation(state.fromLocation);
                setFromLat(state.fromLat);
                setFromLon(state.fromLon);
              }
              if (state.toLocation) {
                setToLocation(state.toLocation);
                setToLat(state.toLat);
                setToLon(state.toLon);
              }
              if (state.deadline) setDeadline(new Date(state.deadline));
              if (state.weight) setWeight(state.weight);
              if (state.length) setLength(state.length);
              if (state.width) setWidth(state.width);
              if (state.height) setHeight(state.height);
              if (state.preferredMethod)
                setPreferredMethod(state.preferredMethod);
              if (state.restrictedItems !== undefined)
                setRestrictedItems(state.restrictedItems);
              if (state.prohibitedItemsConfirmed !== undefined)
                setProhibitedItemsConfirmed(state.prohibitedItemsConfirmed);
              if (state.customsComplianceConfirmed !== undefined)
                setCustomsComplianceConfirmed(state.customsComplianceConfirmed);
              if (state.photos && state.photos.length > 0)
                setPhotos(state.photos);
              await AsyncStorage.removeItem("postRequestFormState");
            } catch (stateError) {
              console.error("Error loading form state:", stateError);
            }
          }

          // Load shipping estimator prefill data (from shipping calculator) - this overwrites with updated values
          const prefillData = await AsyncStorage.getItem(
            "shippingEstimatorPrefill"
          );
          if (prefillData) {
            try {
              const data = JSON.parse(prefillData);
              // Update with shipping estimator results (these take priority)
              if (data.from_location) setFromLocation(data.from_location);
              if (data.to_location) setToLocation(data.to_location);
              if (data.departure_lat !== undefined)
                setFromLat(data.departure_lat);
              if (data.departure_lon !== undefined)
                setFromLon(data.departure_lon);
              if (data.arrival_lat !== undefined) setToLat(data.arrival_lat);
              if (data.arrival_lon !== undefined) setToLon(data.arrival_lon);
              if (data.length_cm !== undefined)
                setLength(data.length_cm.toString());
              if (data.width_cm !== undefined)
                setWidth(data.width_cm.toString());
              if (data.height_cm !== undefined)
                setHeight(data.height_cm.toString());
              if (data.weight_kg !== undefined)
                setWeight(data.weight_kg.toString());
              if (data.max_reward !== undefined)
                setMaxReward(data.max_reward.toString());
              await AsyncStorage.removeItem("shippingEstimatorPrefill");
            } catch (prefillError) {
              console.error(
                "Error loading shipping estimator prefill:",
                prefillError
              );
            }
          }
        } catch (error) {
          console.error("Error loading prefill data:", error);
        }
      };

      loadPrefillData();
    }, [])
  );

  // Manual entry only - auto-measure removed due to build issues

  // Validate field on change
  const validateField = (field: string, value: string | number) => {
    const newErrors = { ...errors };

    switch (field) {
      case "title":
        if (!value || (typeof value === "string" && !value.trim())) {
          newErrors.title = "Title is required";
        } else {
          delete newErrors.title;
        }
        break;
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
      case "maxReward":
        const reward = typeof value === "string" ? parseFloat(value) : value;
        if (!reward || isNaN(reward) || reward < 50) {
          newErrors.maxReward = "Minimum reward is $50";
        } else {
          delete newErrors.maxReward;
        }
        break;
      case "weight":
        const weight = typeof value === "string" ? parseFloat(value) : value;
        if (!weight || isNaN(weight) || weight <= 0) {
          newErrors.weight = "Weight must be positive";
        } else {
          delete newErrors.weight;
        }
        break;
      case "length":
      case "width":
      case "height":
        const dim = typeof value === "string" ? parseFloat(value) : value;
        if (!dim || isNaN(dim) || dim <= 0) {
          newErrors[field] =
            `${field.charAt(0).toUpperCase() + field.slice(1)} must be positive`;
        } else {
          delete newErrors[field];
        }
        break;
    }

    setErrors(newErrors);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant camera roll permissions to upload photos"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map((asset) => asset.uri);
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];

    setUploadingPhotos(true);

    try {
      // Upload all photos in parallel for faster uploads
      const uploadPromises = photos.map(async (photoUri) => {
        try {
          // Convert URI to blob
          const response = await fetch(photoUri);
          const blob = await response.blob();

          // Generate unique filename
          const fileExt = photoUri.split(".").pop() || "jpg";
          const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `requests/${fileName}`;

          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from("item-photos")
            .upload(filePath, blob, {
              contentType: `image/${fileExt}`,
            });

          if (uploadError) {
            console.error("Error uploading photo:", uploadError);
            return null;
          }

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("item-photos").getPublicUrl(filePath);

          return publicUrl;
        } catch (error) {
          console.error("Error uploading individual photo:", error);
          return null;
        }
      });

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);

      // Filter out failed uploads
      const uploadedUrls = results.filter((url): url is string => url !== null);

      if (uploadedUrls.length < photos.length) {
        const failedCount = photos.length - uploadedUrls.length;
        Alert.alert(
          "Upload Warning",
          `${failedCount} photo(s) failed to upload. ${uploadedUrls.length} photo(s) uploaded successfully.`
        );
      }

      return uploadedUrls;
    } catch (error) {
      console.error("Error in uploadPhotos:", error);
      throw error;
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Error", "Please log in to post a request");
      return;
    }

    // Validate all required fields with better error messages
    const validationErrors: Record<string, string> = {};

    if (!title.trim()) {
      validationErrors.title = "Title is required";
    }
    if (!fromLocation.trim()) {
      validationErrors.fromLocation = "From location is required";
    }
    if (!toLocation.trim()) {
      validationErrors.toLocation = "To location is required";
    }

    const rewardValue = maxReward ? parseFloat(maxReward) : 0;
    if (!maxReward || isNaN(rewardValue) || rewardValue < 50) {
      validationErrors.maxReward = `Minimum reward is $50. You entered: $${maxReward || "0"}`;
    }

    const weightValue = weight ? parseFloat(weight) : 0;
    if (!weight || isNaN(weightValue) || weightValue <= 0) {
      validationErrors.weight = `Weight must be positive. You entered: ${weight || "empty"} kg`;
    }

    const lengthValue = length ? parseFloat(length) : 0;
    if (!length || isNaN(lengthValue) || lengthValue <= 0) {
      validationErrors.length = `Length must be positive. You entered: ${length || "empty"} cm`;
    }

    const widthValue = width ? parseFloat(width) : 0;
    if (!width || isNaN(widthValue) || widthValue <= 0) {
      validationErrors.width = `Width must be positive. You entered: ${width || "empty"} cm`;
    }

    const heightValue = height ? parseFloat(height) : 0;
    if (!height || isNaN(heightValue) || heightValue <= 0) {
      validationErrors.height = `Height must be positive. You entered: ${height || "empty"} cm`;
    }

    if (preferredMethod === "plane" && !prohibitedItemsConfirmed) {
      validationErrors.prohibitedItems =
        "You must confirm that your shipment does not contain prohibited items for plane transport";
    }
    if (restrictedItems && preferredMethod === "plane") {
      validationErrors.restrictedItems =
        'Restricted items (batteries, fuel, etc.) can only be transported by boat. Please change preferred method to "Boat" or "Any"';
    }
    if (!customsComplianceConfirmed) {
      validationErrors.customsCompliance =
        "You must confirm that you understand your customs compliance responsibilities";
    }

    // Validate photos - at least 3 required
    if (photos.length < 3) {
      validationErrors.photos = `At least 3 photos are required. You have ${photos.length} photo${photos.length !== 1 ? "s" : ""}.`;
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
      // Step 1: Upload photos (required - at least 3)
      if (photos.length < 3) {
        Alert.alert(
          "Photos Required",
          "Please add at least 3 photos of the item before submitting."
        );
        setLoading(false);
        setSubmitStep("idle");
        return;
      }

      setSubmitStep("uploading");
      let photoUrls: string[] = [];
      try {
        photoUrls = await uploadPhotos();
        if (photoUrls.length < 3) {
          Alert.alert(
            "Upload Error",
            `Failed to upload enough photos. ${photoUrls.length} of ${photos.length} photos uploaded. Please try again.`
          );
          setLoading(false);
          setSubmitStep("idle");
          return;
        }
      } catch (photoError: any) {
        console.error("Error uploading photos:", photoError);
        Alert.alert(
          "Upload Error",
          "Failed to upload photos. Please try again.",
          [
            {
              text: "OK",
              onPress: () => {
                setLoading(false);
                setSubmitStep("idle");
              },
            },
          ]
        );
        return;
      }

      // Step 2: Submit request
      setSubmitStep("submitting");
      const { data, error } = await supabase
        .from("requests")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          from_location: fromLocation.trim(),
          to_location: toLocation.trim(),
          departure_lat: fromLat,
          departure_lon: fromLon,
          arrival_lat: toLat,
          arrival_lon: toLon,
          deadline_latest: deadline.toISOString(),
          max_reward: parseFloat(maxReward),
          weight_kg: parseFloat(weight),
          length_cm: parseFloat(length),
          width_cm: parseFloat(width),
          height_cm: parseFloat(height),
          preferred_method: preferredMethod,
          restricted_items: restrictedItems,
          customs_compliance_confirmed: customsComplianceConfirmed,
          status: "open",
          photos: photoUrls.length > 0 ? photoUrls : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Clear draft on successful submit
      await AsyncStorage.removeItem(DRAFT_KEY);

      setSubmitStep("complete");

      Alert.alert("Success", "Request posted successfully!", [
        {
          text: "OK",
          onPress: () => {
            router.replace("/(tabs)");
          },
        },
      ]);
    } catch (error: any) {
      console.error("Error posting request:", error);
      setSubmitStep("idle");
      Alert.alert("Error", error.message || "Failed to post request");
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
      case "uploading":
        return `Uploading ${photos.length} photo${photos.length !== 1 ? "s" : ""}...`;
      case "submitting":
        return "Submitting request...";
      case "complete":
        return "Posted!";
      default:
        return "Post Request";
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
              <Text style={styles.title}>Post Request</Text>
              <Text style={styles.subtitle}>
                Need something delivered? Post a request and let travelers help
                you out.
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
            const t = template as RequestTemplate;
            if (t.values.title) setTitle(t.values.title);
            if (t.values.description) setDescription(t.values.description);
            if (t.values.length) setLength(t.values.length);
            if (t.values.width) setWidth(t.values.width);
            if (t.values.height) setHeight(t.values.height);
            if (t.values.weight) setWeight(t.values.weight);
            if (t.values.preferredMethod)
              setPreferredMethod(t.values.preferredMethod);
            if (t.values.restrictedItems !== undefined)
              setRestrictedItems(t.values.restrictedItems);
            setIsAutoEstimated(false);
          }}
          type="request"
        />

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                validateField("title", text);
              }}
              placeholder="e.g., Boat parts from Miami"
              maxLength={200}
            />
            {errors.title && (
              <Text style={styles.errorText}>{errors.title}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Additional details about your request"
              multiline
              numberOfLines={4}
              maxLength={2000}
            />
          </View>

          <View style={styles.field}>
            <LocationInput
              label="From Location *"
              value={fromLocation}
              onChange={async (address, lat, lon) => {
                setFromLocation(address);
                setFromLat(lat);
                setFromLon(lon);
                validateField("fromLocation", address);

                // Get country code if we have coordinates but no country yet
                if (lat && lon && !originCountry) {
                  try {
                    const { reverseGeocode } =
                      await import("@sparecarry/lib/services/location");
                    const geocoded = await reverseGeocode(lat, lon);
                    if (geocoded?.country) {
                      setOriginCountry(geocoded.country.toUpperCase());
                    }
                  } catch (error) {
                    console.warn(
                      "Failed to get origin country from coordinates:",
                      error
                    );
                  }
                }
              }}
              onLocationSelect={async (place) => {
                const locationName =
                  "name" in place ? place.name : place.address;
                setFromLocation(locationName);
                setFromLat(place.lat);
                setFromLon(place.lon);
                validateField("fromLocation", locationName);

                // Get country code
                if ("country" in place && place.country) {
                  setOriginCountry(place.country.toUpperCase());
                } else if (place.lat && place.lon) {
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
              onChange={async (address, lat, lon) => {
                setToLocation(address);
                setToLat(lat);
                setToLon(lon);
                validateField("toLocation", address);

                // Get country code if we have coordinates but no country yet
                if (lat && lon && !destinationCountry) {
                  try {
                    const { reverseGeocode } =
                      await import("@sparecarry/lib/services/location");
                    const geocoded = await reverseGeocode(lat, lon);
                    if (geocoded?.country) {
                      setDestinationCountry(geocoded.country.toUpperCase());
                    }
                  } catch (error) {
                    console.warn(
                      "Failed to get destination country from coordinates:",
                      error
                    );
                  }
                }
              }}
              onLocationSelect={async (place) => {
                const locationName =
                  "name" in place ? place.name : place.address;
                setToLocation(locationName);
                setToLat(place.lat);
                setToLon(place.lon);
                validateField("toLocation", locationName);

                // Get country code
                if ("country" in place && place.country) {
                  setDestinationCountry(place.country.toUpperCase());
                } else if (place.lat && place.lon) {
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
              }}
              placeholder="e.g., Nassau, Bahamas"
              showCommonLocations={false}
            />
            {errors.toLocation && (
              <Text style={styles.errorText}>{errors.toLocation}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>How soon do you need this? *</Text>
            <View style={styles.urgencyButtons}>
              <TouchableOpacity
                style={[
                  styles.urgencyButton,
                  deadlineUrgency === "3" && styles.urgencyButtonActive,
                ]}
                onPress={() => {
                  setDeadlineUrgency("3");
                  const newDate = new Date();
                  newDate.setDate(newDate.getDate() + 3);
                  setDeadline(newDate);
                }}
              >
                <MaterialIcons
                  name="schedule"
                  size={20}
                  color={deadlineUrgency === "3" ? "#fff" : "#14b8a6"}
                />
                <Text
                  style={[
                    styles.urgencyButtonText,
                    deadlineUrgency === "3" && styles.urgencyButtonTextActive,
                  ]}
                >
                  Under 3 days
                </Text>
                <Text
                  style={[
                    styles.urgencyButtonSubtext,
                    deadlineUrgency === "3" && styles.urgencyButtonSubtextActive,
                  ]}
                >
                  +30% premium
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.urgencyButton,
                  deadlineUrgency === "7" && styles.urgencyButtonActive,
                ]}
                onPress={() => {
                  setDeadlineUrgency("7");
                  const newDate = new Date();
                  newDate.setDate(newDate.getDate() + 7);
                  setDeadline(newDate);
                }}
              >
                <MaterialIcons
                  name="schedule"
                  size={20}
                  color={deadlineUrgency === "7" ? "#fff" : "#14b8a6"}
                />
                <Text
                  style={[
                    styles.urgencyButtonText,
                    deadlineUrgency === "7" && styles.urgencyButtonTextActive,
                  ]}
                >
                  Under 7 days
                </Text>
                <Text
                  style={[
                    styles.urgencyButtonSubtext,
                    deadlineUrgency === "7" && styles.urgencyButtonSubtextActive,
                  ]}
                >
                  +15% premium
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.urgencyButton,
                  deadlineUrgency === "14" && styles.urgencyButtonActive,
                ]}
                onPress={() => {
                  setDeadlineUrgency("14");
                  const newDate = new Date();
                  newDate.setDate(newDate.getDate() + 14);
                  setDeadline(newDate);
                }}
              >
                <MaterialIcons
                  name="schedule"
                  size={20}
                  color={deadlineUrgency === "14" ? "#fff" : "#14b8a6"}
                />
                <Text
                  style={[
                    styles.urgencyButtonText,
                    deadlineUrgency === "14" && styles.urgencyButtonTextActive,
                  ]}
                >
                  Under 14 days
                </Text>
                <Text
                  style={[
                    styles.urgencyButtonSubtext,
                    deadlineUrgency === "14" && styles.urgencyButtonSubtextActive,
                  ]}
                >
                  +5% premium
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.urgencyButton,
                  deadlineUrgency === "14+" && styles.urgencyButtonActive,
                ]}
                onPress={() => {
                  setDeadlineUrgency("14+");
                  const newDate = new Date();
                  newDate.setDate(newDate.getDate() + 30);
                  setDeadline(newDate);
                }}
              >
                <MaterialIcons
                  name="schedule"
                  size={20}
                  color={deadlineUrgency === "14+" ? "#fff" : "#14b8a6"}
                />
                <Text
                  style={[
                    styles.urgencyButtonText,
                    deadlineUrgency === "14+" && styles.urgencyButtonTextActive,
                  ]}
                >
                  14+ days
                </Text>
                <Text
                  style={[
                    styles.urgencyButtonSubtext,
                    deadlineUrgency === "14+" && styles.urgencyButtonSubtextActive,
                  ]}
                >
                  No rush
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>
              Urgency affects pricing. Faster delivery = higher reward needed.
            </Text>
          </View>

          <View style={styles.field}>
            <View style={styles.rewardHeader}>
              <Text style={styles.label}>
                Max Reward ({CURRENCIES[preferredCurrency]?.code || "USD"}) *
              </Text>
              <TouchableOpacity
                style={styles.estimateLink}
                onPress={() => {
                  // Save current form data to AsyncStorage for shipping estimator to prefill
                  const prefillData = {
                    from_location: fromLocation,
                    to_location: toLocation,
                    departure_lat: fromLat,
                    departure_lon: fromLon,
                    arrival_lat: toLat,
                    arrival_lon: toLon,
                    length_cm: length ? parseFloat(length) : undefined,
                    width_cm: width ? parseFloat(width) : undefined,
                    height_cm: height ? parseFloat(height) : undefined,
                    weight_kg: weight ? parseFloat(weight) : undefined,
                    max_reward: maxReward ? parseFloat(maxReward) : undefined,
                    preferred_method: preferredMethod,
                    restricted_items: restrictedItems,
                  };
                  AsyncStorage.setItem(
                    "shippingEstimatorPrefill",
                    JSON.stringify(prefillData)
                  );

                  // Also save current form state for when we return
                  const formState = {
                    title,
                    description,
                    fromLocation,
                    toLocation,
                    fromLat,
                    fromLon,
                    toLat,
                    toLon,
                    deadline: deadline.toISOString(),
                    maxReward,
                    weight,
                    length,
                    width,
                    height,
                    preferredMethod,
                    restrictedItems,
                    prohibitedItemsConfirmed,
                    customsComplianceConfirmed,
                    photos,
                  };
                  AsyncStorage.setItem(
                    "postRequestFormState",
                    JSON.stringify(formState)
                  );

                  router.push("/(tabs)/shipping-estimator");
                }}
              >
                <MaterialIcons name="calculate" size={16} color="#14b8a6" />
                <Text style={styles.estimateLinkText}>Estimate Reward</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.currencyInputContainer}>
              <TextInput
                style={[styles.input, styles.currencyInput, errors.maxReward && styles.inputError]}
                value={maxReward}
                onChangeText={(text) => {
                  setMaxReward(text);
                  validateField("maxReward", text);
                }}
                placeholder="50"
                keyboardType="numeric"
                editable={true}
              />
              <Text style={styles.currencyCode}>
                {CURRENCIES[preferredCurrency]?.code || "USD"}
              </Text>
            </View>
            {maxReward &&
              !isNaN(parseFloat(maxReward)) &&
              parseFloat(maxReward) > 0 &&
              (() => {
                const rewardValue = parseFloat(maxReward);
                // Convert from user's currency to USD for display
                const usdValue = convertCurrency(rewardValue, preferredCurrency, "USD");
                return (
                  <Text style={styles.conversionText}>
                    ≈ {formatCurrency(usdValue, "USD")} USD
                  </Text>
                );
              })()}
            {suggestedRewardRange && !errors.maxReward && (
              <View style={styles.suggestedRangeBox}>
                <Text style={styles.suggestedRangeTitle}>
                  💡 Suggested range (most likely to get accepted):
                </Text>
                <Text style={styles.suggestedRangeText}>
                  {formatCurrency(
                    convertCurrency(suggestedRewardRange.min, "USD", preferredCurrency),
                    preferredCurrency
                  )}{" "}
                  - {formatCurrency(
                    convertCurrency(suggestedRewardRange.max, "USD", preferredCurrency),
                    preferredCurrency
                  )}
                </Text>
                <Text style={styles.suggestedRangeSubtext}>
                  Based on similar requests and shipping costs
                </Text>
              </View>
            )}
            {errors.maxReward ? (
              <Text style={styles.errorText}>{errors.maxReward}</Text>
            ) : (
              <View style={styles.rewardHint}>
                <Text style={styles.hint}>
                  Minimum: {formatCurrency(
                    convertCurrency(50, "USD", preferredCurrency),
                    preferredCurrency
                  )}
                </Text>
                {isAutoCalculatingReward && (
                  <Text style={styles.autoCalculatingText}>Calculating...</Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <View style={styles.dimensionsHeader}>
              <Text style={styles.label}>Dimensions (cm) *</Text>
            </View>

            {/* Quick Dimension Presets */}
            <View style={styles.presetButtons}>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => {
                  setLength("10");
                  setWidth("10");
                  setHeight("10");
                  setIsAutoEstimated(false);
                }}
              >
                <Text style={styles.presetButtonText}>Small (10×10×10)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => {
                  setLength("30");
                  setWidth("20");
                  setHeight("15");
                  setIsAutoEstimated(false);
                }}
              >
                <Text style={styles.presetButtonText}>Medium (30×20×15)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => {
                  setLength("50");
                  setWidth("40");
                  setHeight("30");
                  setIsAutoEstimated(false);
                }}
              >
                <Text style={styles.presetButtonText}>Large (50×40×30)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => {
                  setLength("80");
                  setWidth("60");
                  setHeight("40");
                  setIsAutoEstimated(false);
                }}
              >
                <Text style={styles.presetButtonText}>Extra Large (80×60×40)</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dimensionsRow}>
              <View style={styles.dimensionField}>
                <TextInput
                  style={[styles.input, styles.dimensionInput]}
                  value={length}
                  onChangeText={(text) => {
                    setLength(text);
                    setIsAutoEstimated(false);
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
              </View>
              <View style={styles.dimensionField}>
                <TextInput
                  style={[styles.input, styles.dimensionInput]}
                  value={width}
                  onChangeText={(text) => {
                    setWidth(text);
                    setIsAutoEstimated(false);
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
              </View>
              <View style={styles.dimensionField}>
                <TextInput
                  style={[styles.input, styles.dimensionInput]}
                  value={height}
                  onChangeText={(text) => {
                    setHeight(text);
                    setIsAutoEstimated(false);
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
              </View>
            </View>
            {isAutoEstimated ? (
              <Text style={styles.autoEstimatedLabel}>
                ✓ Auto-estimated (Tap to edit)
              </Text>
            ) : (
              <Text style={styles.hint}>
                Enter dimensions manually or use presets above
              </Text>
            )}
          </View>

          {/* Weight Feel Selector - Prominent placement */}
          <View style={styles.weightFeelContainer}>
            <View style={styles.weightFeelHeader}>
              <Text style={styles.weightFeelTitle}>💡 How heavy does it feel?</Text>
              <MaterialIcons name="info-outline" size={18} color="#14b8a6" />
            </View>
            <Text style={styles.weightFeelHint}>
              Don't know the exact weight? Just tell us how heavy it feels and we'll estimate it from your dimensions!
            </Text>
            <View style={styles.weightFeelButtons}>
              {([
                { value: "very_light" as WeightFeel, label: "🪶 Very Light", desc: "pillow, foam" },
                { value: "light" as WeightFeel, label: "📱 Light", desc: "laptop, electronics" },
                { value: "medium" as WeightFeel, label: "📦 Medium", desc: "backpack, common" },
                { value: "heavy" as WeightFeel, label: "🏋️ Heavy", desc: "toolbox, metal" },
                { value: "very_heavy" as WeightFeel, label: "⚙️ Very Heavy", desc: "car battery" },
              ]).map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.weightFeelButton,
                    (weightFeel || lastWeightFeel) === option.value && styles.weightFeelButtonActive,
                  ]}
                  onPress={() => {
                    setWeightFeel(option.value);
                    setWeightManuallySet(false);
                  }}
                >
                  <Text
                    style={[
                      styles.weightFeelButtonText,
                      (weightFeel || lastWeightFeel) === option.value && styles.weightFeelButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.weightFeelButtonDesc,
                      (weightFeel || lastWeightFeel) === option.value && styles.weightFeelButtonDescActive,
                    ]}
                  >
                    {option.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {(weightFeel || lastWeightFeel) && length && width && height && (
              <View style={styles.weightEstimateDisplay}>
                <Text style={styles.weightEstimateText}>
                  ✨ Weight updates automatically when dimensions change
                </Text>
                {weightManuallySet && (
                  <TouchableOpacity
                    onPress={() => {
                      setWeightManuallySet(false);
                      if (lastWeightFeel) {
                        setWeightFeel(lastWeightFeel);
                      }
                    }}
                    style={styles.reEnableButton}
                  >
                    <Text style={styles.reEnableButtonText}>
                      Re-enable auto-update
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Weight (kg) *</Text>
            <TextInput
              style={[styles.input, errors.weight && styles.inputError]}
              value={weight}
              onChangeText={(text) => {
                setWeight(text);
                setWeightManuallySet(true); // Mark as manually set
                validateField("weight", text);
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
            <Text style={styles.label}>Preferred Method *</Text>
            {(() => {
              // Check if weight/dimensions exceed plane limits
              const weightKg = parseFloat(weight || "0");
              const lengthCm = parseFloat(length || "0");
              const widthCm = parseFloat(width || "0");
              const heightCm = parseFloat(height || "0");
              const PLANE_MAX_WEIGHT_KG = 32;
              const PLANE_MAX_LINEAR_CM = 158;
              const totalLinear = lengthCm + widthCm + heightCm;
              const exceedsWeight = weightKg > PLANE_MAX_WEIGHT_KG;
              const exceedsDimensions = totalLinear > PLANE_MAX_LINEAR_CM;
              const exceedsPlaneLimits = exceedsWeight || exceedsDimensions;
              const mustUseBoat = restrictedItems || exceedsPlaneLimits;
              const effectiveMethod = mustUseBoat ? "boat" : preferredMethod;
              
              return (
                <>
                  <View style={styles.methodRow}>
                    {(["plane", "boat", "any"] as const).map((method) => {
                      const isDisabled = method === "plane" && mustUseBoat;
                      return (
                        <TouchableOpacity
                          key={method}
                          style={[
                            styles.methodButton,
                            effectiveMethod === method && styles.methodButtonActive,
                            isDisabled && styles.methodButtonDisabled,
                          ]}
                          onPress={() => {
                            if (!isDisabled) {
                              setPreferredMethod(method);
                            }
                          }}
                          disabled={isDisabled}
                        >
                          <MaterialIcons
                            name={
                              method === "plane"
                                ? "flight"
                                : method === "boat"
                                  ? "directions-boat"
                                  : "swap-horiz"
                            }
                            size={20}
                            color={
                              isDisabled
                                ? "#ccc"
                                : effectiveMethod === method
                                  ? "#fff"
                                  : "#14b8a6"
                            }
                          />
                          <Text
                            style={[
                              styles.methodButtonText,
                              effectiveMethod === method &&
                                styles.methodButtonTextActive,
                              isDisabled && styles.methodButtonTextDisabled,
                            ]}
                          >
                            {method.charAt(0).toUpperCase() + method.slice(1)}
                            {isDisabled && " (N/A)"}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {mustUseBoat && (
                    <View style={styles.warningBox}>
                      <MaterialIcons
                        name="info"
                        size={20}
                        color="#d97706"
                        style={styles.warningIcon}
                      />
                      <View style={styles.warningContent}>
                        <Text style={styles.warningTitle}>
                          Transport method set to Boat
                        </Text>
                        <Text style={styles.warningText}>
                          {restrictedItems
                            ? "Restricted items (batteries, fuel, etc.) cannot be transported by plane due to airline regulations."
                            : exceedsPlaneLimits
                            ? `Item exceeds plane limits (max ${PLANE_MAX_WEIGHT_KG}kg, ${PLANE_MAX_LINEAR_CM}cm total dimensions). Airlines typically limit checked baggage to ${PLANE_MAX_WEIGHT_KG}kg per bag and ${PLANE_MAX_LINEAR_CM}cm total linear dimensions (length + width + height).`
                            : ""}
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              );
            })()}
          </View>

          <View style={styles.field}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setRestrictedItems(!restrictedItems)}
            >
              <MaterialIcons
                name={restrictedItems ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={restrictedItems ? "#14b8a6" : "#999"}
              />
              <Text style={styles.checkboxLabel}>
                Restricted items (batteries, fuel, etc.) - Boat only
              </Text>
            </TouchableOpacity>
          </View>

          {preferredMethod === "plane" && (
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
                  I confirm my shipment does not contain prohibited items
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.field}>
            <View style={styles.complianceBox}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() =>
                  setCustomsComplianceConfirmed(!customsComplianceConfirmed)
                }
              >
                <MaterialIcons
                  name={
                    customsComplianceConfirmed
                      ? "check-box"
                      : "check-box-outline-blank"
                  }
                  size={24}
                  color={customsComplianceConfirmed ? "#14b8a6" : "#999"}
                />
                <View style={styles.checkboxLabelContainer}>
                  <Text style={styles.checkboxLabel}>
                    I understand I am responsible for customs compliance,
                    accurate value declarations, and all duties/taxes
                  </Text>
                  <MaterialIcons
                    name="info-outline"
                    size={18}
                    color="#d97706"
                    style={styles.infoIcon}
                  />
                </View>
              </TouchableOpacity>
              <View style={styles.complianceWarning}>
                <MaterialIcons
                  name="warning"
                  size={16}
                  color="#d97706"
                  style={styles.warningIcon}
                />
                <Text style={styles.complianceWarningText}>
                  You must accurately declare item values and comply with all
                  customs regulations. You are responsible for all duties,
                  taxes, and fees. SpareCarry provides information only, not
                  legal advice.
                </Text>
              </View>
              {errors.customsCompliance && (
                <Text style={styles.errorText}>
                  {errors.customsCompliance}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.field}>
            <View style={styles.photoHeader}>
              <Text style={styles.label}>Photos *</Text>
              <Text style={styles.photoRequirement}>
                {photos.length}/3 minimum
              </Text>
            </View>
            <Text style={styles.photoHint}>
              Add clear photos of the item (front, side, and one showing size
              for scale). At least 3 photos required.
            </Text>
            <TouchableOpacity
              style={[
                styles.photoButton,
                photos.length >= 6 && styles.photoButtonDisabled,
              ]}
              onPress={pickImage}
              disabled={photos.length >= 6}
            >
              <MaterialIcons
                name="add-photo-alternate"
                size={20}
                color="#14b8a6"
              />
              <Text style={styles.photoButtonText}>
                {photos.length >= 6 ? "Max photos reached (6)" : "Add Photos"}
              </Text>
            </TouchableOpacity>
            {errors.photos && (
              <Text style={styles.errorText}>{errors.photos}</Text>
            )}
            {photos.length > 0 && (
              <View style={styles.photosContainer}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Image
                      source={{ uri: photo }}
                      style={styles.photoPreview}
                    />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => {
                        removePhoto(index);
                        // Clear photo error if we're removing photos
                        if (errors.photos) {
                          const newErrors = { ...errors };
                          delete newErrors.photos;
                          setErrors(newErrors);
                        }
                      }}
                    >
                      <MaterialIcons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            {photos.length > 0 && photos.length < 3 && (
              <View style={styles.photoWarning}>
                <MaterialIcons name="warning" size={16} color="#f59e0b" />
                <Text style={styles.photoWarningText}>
                  {3 - photos.length} more photo
                  {3 - photos.length !== 1 ? "s" : ""} required
                </Text>
              </View>
            )}
            {uploadingPhotos && (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color="#14b8a6" />
                <Text style={styles.uploadingText}>Uploading photos...</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Post Request</Text>
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
    marginLeft: 12,
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
  textArea: {
    height: 100,
    textAlignVertical: "top",
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
  urgencyButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  urgencyButton: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#b2f5ea",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  urgencyButtonActive: {
    backgroundColor: "#14b8a6",
    borderColor: "#0d9488",
  },
  urgencyButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#14b8a6",
    textAlign: "center",
  },
  urgencyButtonTextActive: {
    color: "#fff",
  },
  urgencyButtonSubtext: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "center",
  },
  urgencyButtonSubtextActive: {
    color: "#e0f7fa",
  },
  methodRow: {
    flexDirection: "row",
    gap: 8,
  },
  methodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#14b8a6",
    borderRadius: 8,
    padding: 12,
  },
  methodButtonActive: {
    backgroundColor: "#14b8a6",
  },
  methodButtonDisabled: {
    backgroundColor: "#f5f5f5",
    borderColor: "#ccc",
    opacity: 0.6,
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#14b8a6",
  },
  methodButtonTextActive: {
    color: "#fff",
  },
  methodButtonTextDisabled: {
    color: "#999",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  warningIcon: {
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400e",
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: "#78350f",
    lineHeight: 18,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  photoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  photoRequirement: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  photoHint: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#14b8a6",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 16,
  },
  photoButtonDisabled: {
    opacity: 0.5,
    borderColor: "#999",
  },
  photoButtonText: {
    color: "#14b8a6",
    fontSize: 16,
    fontWeight: "600",
  },
  photoWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: "#fef3c7",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  photoWarningText: {
    fontSize: 12,
    color: "#92400e",
    fontWeight: "500",
  },
  photosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  photoItem: {
    position: "relative",
    width: 100,
    height: 100,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  uploadingText: {
    fontSize: 14,
    color: "#666",
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
  dimensionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  autoMeasureButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f0fdfa",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#14b8a6",
  },
  autoMeasureButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#14b8a6",
  },
  autoEstimatedLabel: {
    fontSize: 12,
    color: "#14b8a6",
    fontWeight: "600",
    marginTop: 4,
    fontStyle: "italic",
  },
  presetButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  presetButton: {
    flex: 1,
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#14b8a6",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  presetButtonText: {
    fontSize: 11,
    color: "#14b8a6",
    fontWeight: "600",
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
  estimateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: "#f0f9ff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#14b8a6",
  },
  estimateButtonText: {
    fontSize: 12,
    color: "#14b8a6",
    fontWeight: "600",
  },
  weightFeelContainer: {
    backgroundColor: "#e0f7fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#14b8a6",
  },
  weightFeelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  weightFeelTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0d9488",
  },
  weightFeelHint: {
    fontSize: 13,
    color: "#0d9488",
    marginBottom: 12,
    lineHeight: 18,
  },
  weightFeelButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  weightFeelButton: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: "#b2f5ea",
    alignItems: "center",
  },
  weightFeelButtonActive: {
    backgroundColor: "#14b8a6",
    borderColor: "#0d9488",
  },
  weightFeelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#14b8a6",
    marginBottom: 4,
  },
  weightFeelButtonTextActive: {
    color: "#fff",
  },
  weightFeelButtonDesc: {
    fontSize: 11,
    color: "#64748b",
  },
  weightFeelButtonDescActive: {
    color: "#e0f7fa",
  },
  weightEstimateDisplay: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#14b8a6",
  },
  weightEstimateText: {
    fontSize: 13,
    color: "#0d9488",
    fontWeight: "500",
  },
  reEnableButton: {
    marginTop: 8,
  },
  reEnableButtonText: {
    fontSize: 12,
    color: "#14b8a6",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  rewardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  estimateLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  estimateLinkText: {
    fontSize: 12,
    color: "#14b8a6",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  rewardHint: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  autoCalculatingText: {
    fontSize: 12,
    color: "#14b8a6",
    fontStyle: "italic",
  },
  currencyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currencyInput: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    minWidth: 40,
  },
  suggestedRangeBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f0fdfa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#14b8a6",
  },
  suggestedRangeTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0d9488",
    marginBottom: 4,
  },
  suggestedRangeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#14b8a6",
    marginBottom: 4,
  },
  suggestedRangeSubtext: {
    fontSize: 11,
    color: "#64748b",
    fontStyle: "italic",
  },
  complianceBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  checkboxLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoIcon: {
    width: 16,
    height: 16,
    tintColor: "#f59e0b",
  },
  complianceWarning: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  complianceWarningText: {
    fontSize: 11,
    color: "#dc2626",
    lineHeight: 16,
  },
});
