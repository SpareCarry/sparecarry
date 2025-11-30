/**
 * Shipping Cost Estimator Screen
 *
 * Allows users to compare courier prices with SpareCarry prices
 */

"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  Suspense,
} from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Calculator,
  TrendingDown,
  AlertCircle,
  ArrowRight,
  Info,
  Crown,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import {
  calculateShippingEstimate,
  ShippingEstimateInput,
  getAvailableCouriers,
} from "../../lib/services/shipping";
import { getCountryPreset } from "../../src/utils/countryPresets";
import { CountrySelect } from "../../components/CountrySelect";
import { Country, getCountryByIso2 } from "../../src/constants/countries";
import { isValidIso2 } from "../../src/utils/validateCountry";
import { checkSubscriptionStatus } from "../../src/utils/subscriptionUtils";
// Karma points are automatically calculated and applied when delivery is completed
import { useUser } from "../../hooks/useUser";
import { createClient } from "../../lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  trackShippingEstimatorUsed,
  trackEmergencySelected,
} from "../../lib/analytics/tracking";
import { TopRoutes } from "../../components/TopRoutes";
import { TipsTooltip } from "../../components/TipsTooltip";
import { PLATFORM_FEE_PERCENT } from "../../config/platformFees";
import { TrustedBadge } from "../../components/promo/TrustedBadge";
import { SavingsCounter } from "../../components/promo/SavingsCounter";
import { useSearchParams } from "next/navigation";
import { SizeTierSelector } from "../../components/ui/size-tier-selector";
import { getSizeTier } from "../../lib/utils/size-tier";
import { reverseGeocode } from "../../lib/services/location";
import { calculateDistance } from "../../lib/utils/distance-calculator";
import { getDaysLeft } from "../../utils/getDaysLeft";
import {
  checkPlaneRestrictions,
  getPlaneRestrictionDetails,
} from "../../lib/utils/plane-restrictions";
import { Plane, Ship, Sparkles } from "lucide-react";
import { LocationFieldGroup } from "../../components/location/LocationFieldGroup";
import { Place } from "../../lib/services/location";

function ShippingEstimatorContent() {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();

  // Form state - using ISO2 codes
  const [originCountryIso2, setOriginCountryIso2] = useState<string>("");
  const [destinationCountryIso2, setDestinationCountryIso2] =
    useState<string>("");
  const [length, setLength] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [declaredValue, setDeclaredValue] = useState<string>("");
  const [selectedCourier, setSelectedCourier] = useState<string>("DHL");
  const [errors, setErrors] = useState<{
    origin?: string;
    destination?: string;
  }>({});
  // Karma points are now automatically applied when delivery is completed
  // Removed wantsKarma state and karma card UI
  const [suggestedReward, setSuggestedReward] = useState<number | null>(null);
  const [sizeTier, setSizeTier] = useState<
    "small" | "medium" | "large" | "extra_large" | null
  >(null);
  const [restrictedItems, setRestrictedItems] = useState<boolean>(false);
  const [category, setCategory] = useState<string>("");
  const [selectedTransportMethod, setSelectedTransportMethod] = useState<
    "plane" | "boat" | "auto"
  >("auto");
  const [fragile, setFragile] = useState<boolean>(false);
  const [deadlineDate, setDeadlineDate] = useState<string>("");
  const FREE_DELIVERIES_LIMIT = 1;
  const promoDaysLeft = getDaysLeft();
  const isPromoActive = promoDaysLeft > 0;

  // Store original location data from post request form (if user came from there)
  const [originalFromLocation, setOriginalFromLocation] = useState<
    string | null
  >(null);
  const [originalToLocation, setOriginalToLocation] = useState<string | null>(
    null
  );
  const [originalFromLat, setOriginalFromLat] = useState<number | null>(null);
  const [originalFromLon, setOriginalFromLon] = useState<number | null>(null);
  const [originalToLat, setOriginalToLat] = useState<number | null>(null);
  const [originalToLon, setOriginalToLon] = useState<number | null>(null);

  // Location places for distance calculation
  const [fromPlace, setFromPlace] = useState<Place | null>(null);
  const [toPlace, setToPlace] = useState<Place | null>(null);
  // Store title, description, and category from post request form
  const [originalTitle, setOriginalTitle] = useState<string | null>(null);
  const [originalDescription, setOriginalDescription] = useState<string | null>(
    null
  );
  const [originalCategory, setOriginalCategory] = useState<string | null>(null);
  const [
    originalCategoryOtherDescription,
    setOriginalCategoryOtherDescription,
  ] = useState<string | null>(null);

  // Use shared hook to prevent duplicate queries
  const { user } = useUser();

  // Check subscription status
  const { data: subscriptionStatus } = useQuery({
    queryKey: ["subscription-status", user?.id],
    queryFn: () => checkSubscriptionStatus(user?.id),
    enabled: !!user,
    staleTime: 60000, // Cache for 1 minute
  });

  const isPremium = subscriptionStatus?.isPremium ?? false;

  // Fetch completed deliveries count to check if user has early supporter benefits
  const { data: userData } = useQuery<{
    completed_deliveries_count?: number | null;
  } | null>({
    queryKey: ["user-deliveries", user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const { data, error } = await supabase
          .from("users")
          .select("completed_deliveries_count")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.warn("Error fetching completed deliveries:", error);
          return null;
        }
        return (data ?? null) as {
          completed_deliveries_count?: number | null;
        } | null;
      } catch (error) {
        console.warn("Exception fetching completed deliveries:", error);
        return null;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const completedDeliveries = userData?.completed_deliveries_count ?? 0;
  const hasEarlySupporterBenefits = completedDeliveries < 1; // First delivery is 100% profit (0% platform fee)

  // Get available options
  const availableCouriers = getAvailableCouriers();

  // Save form data to sessionStorage whenever it changes (for back navigation)
  const prevFormDataRef = useRef<string>("");
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    // Skip saving on initial mount
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    const formData = {
      originCountryIso2,
      destinationCountryIso2,
      length,
      width,
      height,
      weight,
      declaredValue,
      selectedCourier,
      restrictedItems,
      category,
      selectedTransportMethod,
      fragile,
      deadlineDate,
      fromPlaceLat: fromPlace?.lat,
      fromPlaceLon: fromPlace?.lon,
      fromPlaceName: fromPlace?.name,
      fromPlaceCountry: fromPlace?.country,
      toPlaceLat: toPlace?.lat,
      toPlaceLon: toPlace?.lon,
      toPlaceName: toPlace?.name,
      toPlaceCountry: toPlace?.country,
    };

    const formDataString = JSON.stringify(formData);

    // Only save if data has actually changed
    if (formDataString !== prevFormDataRef.current) {
      prevFormDataRef.current = formDataString;

      const hasData = Object.values(formData).some(
        (val) => val !== undefined && val !== null && val !== ""
      );
      if (hasData) {
        try {
          sessionStorage.setItem("shippingEstimatorFormData", formDataString);
        } catch (error) {
          console.warn("Failed to save form data to sessionStorage:", error);
        }
      }
    }
  }, [
    originCountryIso2,
    destinationCountryIso2,
    length,
    width,
    height,
    weight,
    declaredValue,
    selectedCourier,
    restrictedItems,
    category,
    selectedTransportMethod,
    fragile,
    deadlineDate,
    fromPlace,
    toPlace,
    originalFromLat,
    originalFromLon,
    originalToLat,
    originalToLon,
  ]);

  // Pre-fill from query params or sessionStorage
  useEffect(() => {
    const from = searchParams?.get("from");
    const to = searchParams?.get("to");
    const fromLat = searchParams?.get("fromLat");
    const fromLon = searchParams?.get("fromLon");
    const toLat = searchParams?.get("toLat");
    const toLon = searchParams?.get("toLon");
    const departureLat = searchParams?.get("departureLat");
    const departureLon = searchParams?.get("departureLon");
    const arrivalLat = searchParams?.get("arrivalLat");
    const arrivalLon = searchParams?.get("arrivalLon");

    // If there are query params, use them (from post request form)
    if (from || to || searchParams?.get("weight")) {
      // Store original location data if coming from post request form
      if (from) {
        setOriginalFromLocation(from);
      }
      if (to) {
        setOriginalToLocation(to);
      }

      // Store restricted items flag from post request form if available
      const restrictedItemsParam = searchParams?.get("restricted_items");
      if (restrictedItemsParam === "true") {
        setRestrictedItems(true);
        setSelectedTransportMethod("boat"); // Auto-select boat if restricted
      }
      if (fromLat && fromLon) {
        setOriginalFromLat(parseFloat(fromLat));
        setOriginalFromLon(parseFloat(fromLon));
      } else if (departureLat && departureLon) {
        setOriginalFromLat(parseFloat(departureLat));
        setOriginalFromLon(parseFloat(departureLon));
      }
      if (toLat && toLon) {
        setOriginalToLat(parseFloat(toLat));
        setOriginalToLon(parseFloat(toLon));
      } else if (arrivalLat && arrivalLon) {
        setOriginalToLat(parseFloat(arrivalLat));
        setOriginalToLon(parseFloat(arrivalLon));
      }
      const weightParam = searchParams?.get("weight");
      const lengthParam = searchParams?.get("length");
      const widthParam = searchParams?.get("width");
      const heightParam = searchParams?.get("height");
      const declaredValueParam = searchParams?.get("declaredValue");
      const suggestedRewardParam = searchParams?.get("suggestedReward");
      // Get title, description, and category from URL params
      const titleParam = searchParams?.get("title");
      const descriptionParam = searchParams?.get("description");
      const categoryParam = searchParams?.get("category");
      const categoryOtherDescriptionParam = searchParams?.get(
        "categoryOtherDescription"
      );

      // Store category from post request form if available
      if (categoryParam) {
        setOriginalCategory(categoryParam);
        setCategory(categoryParam); // Also set current category
      }

      // Store title, description, and category if provided
      if (titleParam) setOriginalTitle(titleParam);
      if (descriptionParam) setOriginalDescription(descriptionParam);
      if (categoryParam) setOriginalCategory(categoryParam);
      if (categoryOtherDescriptionParam)
        setOriginalCategoryOtherDescription(categoryOtherDescriptionParam);

      if (weightParam) setWeight(weightParam);
      if (lengthParam) setLength(lengthParam);
      if (widthParam) setWidth(widthParam);
      if (heightParam) setHeight(heightParam);
      if (declaredValueParam) {
        const value = parseFloat(declaredValueParam);
        if (!isNaN(value) && value > 0) {
          setDeclaredValue(declaredValueParam);
        }
      }
      if (suggestedRewardParam) {
        const reward = parseFloat(suggestedRewardParam);
        if (!isNaN(reward)) setSuggestedReward(reward);
      }

      // Clean URL after reading params
      if (
        searchParams &&
        (from ||
          to ||
          weightParam ||
          suggestedRewardParam ||
          fromLat ||
          toLat ||
          declaredValueParam)
      ) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }

      // Use coordinates to get country codes via reverse geocoding
      const getCountryFromCoordinates = async (
        lat: string | null,
        lon: string | null
      ) => {
        if (!lat || !lon) return null;
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        if (isNaN(latNum) || isNaN(lonNum)) return null;

        try {
          const place = await reverseGeocode(latNum, lonNum);
          return place?.country || null;
        } catch (error) {
          console.warn("Failed to reverse geocode for country:", error);
          return null;
        }
      };

      // Get origin country from coordinates
      if (fromLat && fromLon) {
        getCountryFromCoordinates(fromLat, fromLon).then((countryCode) => {
          if (countryCode) {
            setOriginCountryIso2(countryCode.toUpperCase());
          }
        });
      } else if (departureLat && departureLon) {
        getCountryFromCoordinates(departureLat, departureLon).then(
          (countryCode) => {
            if (countryCode) {
              setOriginCountryIso2(countryCode.toUpperCase());
            }
          }
        );
      }

      // Get destination country from coordinates
      if (toLat && toLon) {
        getCountryFromCoordinates(toLat, toLon).then((countryCode) => {
          if (countryCode) {
            setDestinationCountryIso2(countryCode.toUpperCase());
          }
        });
      } else if (arrivalLat && arrivalLon) {
        getCountryFromCoordinates(arrivalLat, arrivalLon).then(
          (countryCode) => {
            if (countryCode) {
              setDestinationCountryIso2(countryCode.toUpperCase());
            }
          }
        );
      }
    } else {
      // No query params - try to restore from sessionStorage
      try {
        const savedFormData = sessionStorage.getItem(
          "shippingEstimatorFormData"
        );
        if (savedFormData) {
          const formData = JSON.parse(savedFormData);
          if (formData.originCountryIso2)
            setOriginCountryIso2(formData.originCountryIso2);
          if (formData.destinationCountryIso2)
            setDestinationCountryIso2(formData.destinationCountryIso2);
          if (formData.length) setLength(formData.length);
          if (formData.width) setWidth(formData.width);
          if (formData.height) setHeight(formData.height);
          if (formData.weight) setWeight(formData.weight);
          if (formData.declaredValue) setDeclaredValue(formData.declaredValue);
          if (formData.selectedCourier)
            setSelectedCourier(formData.selectedCourier);
          if (formData.restrictedItems !== undefined)
            setRestrictedItems(formData.restrictedItems);
          if (formData.category) setCategory(formData.category);
          if (formData.selectedTransportMethod)
            setSelectedTransportMethod(formData.selectedTransportMethod);
          if (formData.fragile !== undefined) setFragile(formData.fragile);
          if (formData.deadlineDate) setDeadlineDate(formData.deadlineDate);
          // Restore location places if available
          if (formData.fromPlaceLat && formData.fromPlaceLon) {
            setFromPlace({
              name: formData.fromPlaceName || "",
              lat: formData.fromPlaceLat,
              lon: formData.fromPlaceLon,
              country: formData.fromPlaceCountry || undefined,
            });
          }
          if (formData.toPlaceLat && formData.toPlaceLon) {
            setToPlace({
              name: formData.toPlaceName || "",
              lat: formData.toPlaceLat,
              lon: formData.toPlaceLon,
              country: formData.toPlaceCountry || undefined,
            });
          }
        }
      } catch (error) {
        console.warn("Error restoring form data from sessionStorage:", error);
      }
    }
  }, [searchParams]);

  // Update country codes when location places change
  useEffect(() => {
    if (fromPlace?.country) {
      setOriginCountryIso2(fromPlace.country.toUpperCase());
    }
  }, [fromPlace]);

  useEffect(() => {
    if (toPlace?.country) {
      setDestinationCountryIso2(toPlace.country.toUpperCase());
    }
  }, [toPlace]);

  // Auto-fill when destination country changes
  const handleDestinationChange = useCallback((country: Country) => {
    setDestinationCountryIso2(country.iso2);
    setErrors((prev) => ({ ...prev, destination: undefined }));

    // Auto-fill dimensions from preset if available
    const preset = getCountryPreset(country.iso2);
    if (preset) {
      setLength(preset.length.toString());
      setWidth(preset.width.toString());
      setHeight(preset.height.toString());
      setWeight(preset.weight.toString());
    }
  }, []);

  // Handle origin country change
  const handleOriginChange = useCallback((country: Country) => {
    setOriginCountryIso2(country.iso2);
    setErrors((prev) => ({ ...prev, origin: undefined }));
  }, []);

  // Calculate estimate
  // Removed Early Supporter Reward message - rewards should only be shown when delivery is completed, not during estimates

  const estimate = useMemo(() => {
    // Validate countries
    if (!originCountryIso2 || !isValidIso2(originCountryIso2)) {
      return null;
    }
    if (!destinationCountryIso2 || !isValidIso2(destinationCountryIso2)) {
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
    // Priority: 1) Location places (from form), 2) Original coordinates (from post request form)
    let distanceKm: number | undefined;

    // First try location places from the form
    if (fromPlace?.lat && fromPlace?.lon && toPlace?.lat && toPlace?.lon) {
      const calculatedDistance = calculateDistance(
        { lat: fromPlace.lat, lon: fromPlace.lon },
        { lat: toPlace.lat, lon: toPlace.lon }
      );
      if (calculatedDistance > 0) {
        distanceKm = calculatedDistance;
      }
    }
    // Fallback to original coordinates from post request form
    else if (
      originalFromLat != null &&
      originalFromLon != null &&
      originalToLat != null &&
      originalToLon != null &&
      !isNaN(originalFromLat) &&
      !isNaN(originalFromLon) &&
      !isNaN(originalToLat) &&
      !isNaN(originalToLon)
    ) {
      const calculatedDistance = calculateDistance(
        { lat: originalFromLat, lon: originalFromLon },
        { lat: originalToLat, lon: originalToLon }
      );
      if (calculatedDistance > 0) {
        distanceKm = calculatedDistance;
      }
    }

    const input: ShippingEstimateInput = {
      originCountry: originCountryIso2,
      destinationCountry: destinationCountryIso2,
      length: lengthNum,
      width: widthNum,
      height: heightNum,
      weight: weightNum,
      declaredValue: declaredValueNum,
      selectedCourier,
      isPremium, // Pass subscription status
      distanceKm, // Include distance for distance-based pricing
      restrictedItems, // Include restricted items flag
      category: category || undefined, // Include category if provided
    };

    const result = calculateShippingEstimate({
      ...input,
      fragile: fragile,
      deadlineDate: deadlineDate || undefined,
      originLat: fromPlace?.lat || originalFromLat || undefined,
      originLon: fromPlace?.lon || originalFromLon || undefined,
      destinationLat: toPlace?.lat || originalToLat || undefined,
      destinationLon: toPlace?.lon || originalToLon || undefined,
    });

    // Karma points are now automatically calculated and applied when delivery is completed
    // No need to calculate or display them here

    return result;
  }, [
    originCountryIso2,
    destinationCountryIso2,
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
    fromPlace,
    toPlace,
    originalFromLat,
    originalFromLon,
    originalToLat,
    originalToLon,
  ]);

  // Handle create job
  const handleCreateJob = useCallback(() => {
    // Validate before proceeding
    const validationErrors: { origin?: string; destination?: string } = {};

    if (!originCountryIso2 || !isValidIso2(originCountryIso2)) {
      validationErrors.origin = "Please select a valid origin country.";
    }
    if (!destinationCountryIso2 || !isValidIso2(destinationCountryIso2)) {
      validationErrors.destination =
        "Please select a valid destination country.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!estimate) return;

    // Determine which price to prefill based on selected method or restrictions
    let prefilledMaxReward: number;
    if (estimate.canTransportByPlane === false) {
      // If plane is not available, use boat price
      prefilledMaxReward = Math.round(estimate.spareCarryBoatPrice);
    } else if (
      selectedTransportMethod === "plane" &&
      estimate.spareCarryPlanePrice > 0
    ) {
      prefilledMaxReward = Math.round(estimate.spareCarryPlanePrice);
    } else if (
      selectedTransportMethod === "boat" &&
      estimate.spareCarryBoatPrice > 0
    ) {
      prefilledMaxReward = Math.round(estimate.spareCarryBoatPrice);
    } else {
      // Auto-select: prefer boat (cheaper), otherwise plane
      prefilledMaxReward =
        estimate.spareCarryBoatPrice > 0
          ? Math.round(estimate.spareCarryBoatPrice)
          : Math.round(estimate.spareCarryPlanePrice);
    }

    // Use original location data if available (from post request form), otherwise use country names
    const fromLocationName =
      originalFromLocation ||
      (originCountryIso2
        ? getCountryByIso2(originCountryIso2)?.name || originCountryIso2
        : "");
    const toLocationName =
      originalToLocation ||
      (destinationCountryIso2
        ? getCountryByIso2(destinationCountryIso2)?.name ||
          destinationCountryIso2
        : "");

    const prefillData = {
      from_location: fromLocationName,
      to_location: toLocationName,
      // Include coordinates if available
      departure_lat: originalFromLat || null,
      departure_lon: originalFromLon || null,
      arrival_lat: originalToLat || null,
      arrival_lon: originalToLon || null,
      // Also include country codes for reference
      originCountryIso2,
      destinationCountryIso2,
      length_cm: parseFloat(length) || 0,
      width_cm: parseFloat(width) || 0,
      height_cm: parseFloat(height) || 0,
      weight_kg: parseFloat(weight) || 0,
      value_usd: parseFloat(declaredValue) || 0,
      max_reward: prefilledMaxReward, // Prefill with estimated SpareCarry price
      // Include title, description, and category if they were provided
      title: originalTitle || undefined,
      description: originalDescription || undefined,
      category: originalCategory || category || undefined, // Use current category or original
      category_other_description: originalCategoryOtherDescription || undefined,
      restricted_items: restrictedItems, // Include restricted items flag
      preferred_method:
        estimate.canTransportByPlane === false
          ? "boat"
          : selectedTransportMethod === "auto"
            ? "any"
            : selectedTransportMethod, // Set preferred method based on restrictions
      selectedCourier,
      courierPrice: estimate.courierPrice,
      spareCarryPlanePrice: estimate.spareCarryPlanePrice,
      spareCarryBoatPrice: estimate.spareCarryBoatPrice,
      platformFeePlane: estimate.platformFeePlane,
      platformFeeBoat: estimate.platformFeeBoat,
      stripeFeePlane: estimate.stripeFeePlane,
      stripeFeeBoat: estimate.stripeFeeBoat,
      netRevenuePlane: estimate.netRevenuePlane,
      netRevenueBoat: estimate.netRevenueBoat,
      customsCost: estimate.customsCost, // Include customs cost
      // Karma points are automatically applied when delivery is completed
      size_tier: sizeTier,
    };

    // Track analytics
    trackShippingEstimatorUsed(
      originCountryIso2,
      destinationCountryIso2,
      false
    );

    const targetUrl = `/home/post-request?prefill=${encodeURIComponent(JSON.stringify(prefillData))}`;

    try {
      router.push(targetUrl);
    } catch (error) {
      console.error(
        "[ShippingEstimator] Failed to push route, falling back to window.location",
        error
      );
      if (typeof window !== "undefined") {
        window.location.href = targetUrl;
      }
      return;
    }

    // Ensure hard navigation as fallback (prevents client-side routing issues during tests)
    if (typeof window !== "undefined") {
      window.location.href = targetUrl;
    }
  }, [
    estimate,
    originCountryIso2,
    destinationCountryIso2,
    length,
    width,
    height,
    weight,
    declaredValue,
    selectedCourier,
    router,
    sizeTier,
    originalFromLocation,
    originalToLocation,
    originalFromLat,
    originalFromLon,
    originalToLat,
    originalToLon,
    originalTitle,
    originalDescription,
    originalCategory,
    originalCategoryOtherDescription,
    category,
    restrictedItems,
    selectedTransportMethod,
  ]);

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-6 pb-24 lg:pb-6">
      <div className="mb-6">
        <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold text-slate-900">
          <Calculator className="h-8 w-8 text-teal-600" />
          Shipping Cost Estimator
        </h1>
        <p className="text-slate-600">
          Compare courier prices with SpareCarry delivery options and see your
          savings
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Package Details
              <TipsTooltip
                tipId="shipping-estimator-1"
                context="shipping-estimator"
              />
            </CardTitle>
            <CardDescription>Enter your shipment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Origin & Destination Locations */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <LocationFieldGroup
                label="Origin Location"
                placeholder="Search city, address, or location..."
                value={fromPlace}
                onChange={(place) => {
                  setFromPlace(place);
                  if (place?.country) {
                    setOriginCountryIso2(place.country.toUpperCase());
                    setErrors((prev) => ({ ...prev, origin: undefined }));
                  }
                }}
                showMapPreview={true}
                showCurrentLocation={true}
                showMapPicker={true}
                required
                error={errors.origin}
                inputId="origin_location"
                inputName="origin_location"
              />
              <LocationFieldGroup
                label="Destination Location"
                placeholder="Search city, address, or location..."
                value={toPlace}
                onChange={(place) => {
                  setToPlace(place);
                  if (place?.country) {
                    setDestinationCountryIso2(place.country.toUpperCase());
                    setErrors((prev) => ({ ...prev, destination: undefined }));
                  }
                }}
                showMapPreview={true}
                showCurrentLocation={true}
                showMapPicker={true}
                required
                error={errors.destination}
                inputId="destination_location"
                inputName="destination_location"
              />
            </div>

            {/* Origin & Destination Countries (fallback/override) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <CountrySelect
                id="origin_country"
                label="Origin Country (if location not specified)"
                placeholder="Search country or ISO"
                value={originCountryIso2}
                onChange={(iso2) => {
                  setOriginCountryIso2(iso2);
                  setErrors((prev) => ({ ...prev, origin: undefined }));
                }}
                onSelect={handleOriginChange}
                error={errors.origin}
                showIso2={true}
              />
              <CountrySelect
                id="destination_country"
                label="Destination Country (if location not specified)"
                placeholder="Search country or ISO"
                value={destinationCountryIso2}
                onChange={(iso2) => {
                  setDestinationCountryIso2(iso2);
                  setErrors((prev) => ({ ...prev, destination: undefined }));
                }}
                onSelect={handleDestinationChange}
                error={errors.destination}
                showIso2={true}
              />
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">Length (cm) *</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Width (cm) *</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="15"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm) *</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg) *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  const weightNum = parseFloat(e.target.value);
                  if (!isNaN(weightNum) && weightNum > 0) {
                    setSizeTier(getSizeTier(weightNum));
                  }
                }}
                placeholder="1.0"
              />
            </div>

            {/* Size Tier Selector */}
            <SizeTierSelector
              value={sizeTier || undefined}
              onValueChange={(tier) => setSizeTier(tier)}
              weightKg={parseFloat(weight) || undefined}
            />

            {/* Declared Value */}
            <div className="space-y-2">
              <Label htmlFor="declared_value">Declared Value ($ USD)</Label>
              <Input
                id="declared_value"
                type="number"
                step="0.01"
                value={declaredValue}
                onChange={(e) => setDeclaredValue(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500">
                Optional - for customs calculation
              </p>
            </div>

            {/* Transport Method Toggle */}
            <div className="space-y-2">
              <Label>Preferred Transport Method</Label>
              <div className="flex gap-2 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!restrictedItems) {
                      setSelectedTransportMethod("plane");
                    }
                  }}
                  disabled={
                    restrictedItems || estimate?.canTransportByPlane === false
                  }
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    selectedTransportMethod === "plane" &&
                    !restrictedItems &&
                    estimate?.canTransportByPlane !== false
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                  }`}
                >
                  <Plane className="h-4 w-4" />
                  Plane
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTransportMethod("boat")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    selectedTransportMethod === "boat"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Ship className="h-4 w-4" />
                  Boat
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTransportMethod("auto")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    selectedTransportMethod === "auto"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  Auto
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {restrictedItems
                  ? "Plane transport is not available for restricted items."
                  : "Choose your preferred transport method, or select Auto to let us choose the best option."}
              </p>
            </div>

            {/* Restricted Items */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="restricted_items"
                  checked={restrictedItems}
                  onChange={(e) => {
                    setRestrictedItems(e.target.checked);
                    if (e.target.checked) {
                      setSelectedTransportMethod("boat"); // Auto-select boat if restricted
                    }
                  }}
                  className="mt-1"
                />
                <Label
                  htmlFor="restricted_items"
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2 font-medium">
                    Contains restricted goods
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">
                            Restricted Goods
                          </h4>
                          <p className="text-xs text-slate-600">
                            Items that cannot be transported by plane include:
                          </p>
                          <ul className="list-inside list-disc space-y-1 text-xs text-slate-600">
                            <li>Lithium batteries (over 100Wh)</li>
                            <li>Flammable liquids and gases</li>
                            <li>Explosives and weapons</li>
                            <li>Corrosive materials</li>
                            <li>Toxic or radioactive substances</li>
                          </ul>
                          <p className="mt-2 text-xs text-slate-500">
                            These items can only be transported by boat due to
                            airline safety regulations.
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="text-xs font-normal text-slate-500">
                    Lithium batteries, flammable items, liquids, etc. (Boat
                    transport only)
                  </div>
                </Label>
              </div>
            </div>

            {/* Category (optional, for better restriction checking) */}
            <div className="space-y-2">
              <Label htmlFor="category">Item Category (Optional)</Label>
              <Select
                value={category || "none"}
                onValueChange={(value) =>
                  setCategory(value === "none" ? "" : value)
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="marine">Marine Equipment</SelectItem>
                  <SelectItem value="food">Food & Beverages</SelectItem>
                  <SelectItem value="clothing">Clothing & Apparel</SelectItem>
                  <SelectItem value="tools">Tools & Hardware</SelectItem>
                  <SelectItem value="medical">Medical Supplies</SelectItem>
                  <SelectItem value="automotive">Automotive Parts</SelectItem>
                  <SelectItem value="sports">Sports & Recreation</SelectItem>
                  <SelectItem value="books">Books & Media</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Helps determine transport restrictions
              </p>
            </div>

            {/* Fragile Items */}
            <div className="space-y-2">
              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <input
                  type="checkbox"
                  id="fragile"
                  checked={fragile}
                  onChange={(e) => setFragile(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <Label htmlFor="fragile" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    Fragile item (requires extra care)
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">
                            Fragile Items
                          </h4>
                          <p className="text-xs text-slate-600">
                            Fragile items require extra care and handling. This
                            includes:
                          </p>
                          <ul className="list-inside list-disc space-y-1 text-xs text-slate-600">
                            <li>Glass items</li>
                            <li>Electronics</li>
                            <li>Artwork</li>
                            <li>Ceramics</li>
                            <li>Antiques</li>
                          </ul>
                          <p className="mt-2 text-xs font-medium text-amber-600">
                            A 15% premium applies to ensure proper handling.
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Select if your item requires extra care during transport
                  </p>
                </Label>
              </div>
            </div>

            {/* Deadline Date (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="deadline_date">Deadline Date (Optional)</Label>
              <Input
                type="date"
                id="deadline_date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full"
              />
              <p className="text-xs text-slate-500">
                Urgent shipments may have a premium: 5% for &lt;14 days, 15% for
                &lt;7 days, 30% for &lt;3 days
              </p>
            </div>

            {/* Courier Selection */}
            <div className="space-y-2">
              <Label htmlFor="courier">Compare with Courier</Label>
              <Select
                value={selectedCourier}
                onValueChange={setSelectedCourier}
              >
                <SelectTrigger id="courier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCouriers.map((courier) => (
                    <SelectItem key={courier} value={courier}>
                      {courier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Price Comparison</CardTitle>
            <CardDescription>See how much you can save</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {estimate ? (
              <>
                {isPromoActive && !isPremium && hasEarlySupporterBenefits && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">
                      Early Supporter Reward: You&apos;re paying 0% platform
                      fees on your first delivery.
                    </p>
                    <p className="mt-1 text-xs text-amber-800">
                      Promo ends in {promoDaysLeft}{" "}
                      {promoDaysLeft === 1 ? "day" : "days"}.
                    </p>
                  </div>
                )}
                {/* Courier Price */}
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Courier ({selectedCourier})
                    </div>
                    {estimate.courierPriceConfidence &&
                      estimate.courierPriceConfidence !== "low" && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs ${
                            estimate.courierPriceConfidence === "high"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {estimate.courierPriceConfidence === "high"
                            ? "High confidence"
                            : "Medium confidence"}
                        </span>
                      )}
                    {estimate.marketDataUsed && (
                      <span className="text-xs text-slate-500">
                        Market data used
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    ${estimate.courierTotal.toFixed(2)}
                  </div>
                  {estimate.courierPriceConfidence === "low" && (
                    <p className="mt-1 text-xs text-slate-500">
                      Estimate - actual courier prices may vary
                    </p>
                  )}
                  {estimate.customsCost > 0 && (
                    <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                      <div>Shipping: ${estimate.courierPrice.toFixed(2)}</div>
                      {estimate.customsBreakdown && (
                        <div className="border-l-2 border-slate-300 pl-2">
                          <div>
                            Duty: ${estimate.customsBreakdown.duty.toFixed(2)}
                          </div>
                          {estimate.customsBreakdown.tax > 0 && (
                            <div>
                              {estimate.customsBreakdown.taxName || "Tax"}: $
                              {estimate.customsBreakdown.tax.toFixed(2)}
                            </div>
                          )}
                          <div>
                            Processing Fee: $
                            {estimate.customsBreakdown.processingFee.toFixed(2)}
                          </div>
                          <div className="mt-0.5 font-medium">
                            Total Customs: ${estimate.customsCost.toFixed(2)}
                          </div>
                        </div>
                      )}
                      {!estimate.customsBreakdown && (
                        <div>Customs: ${estimate.customsCost.toFixed(2)}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* SpareCarry Plane - Only show if plane transport is allowed */}
                {estimate.canTransportByPlane !== false &&
                  (() => {
                    const lengthNum = parseFloat(length) || 0;
                    const widthNum = parseFloat(width) || 0;
                    const heightNum = parseFloat(height) || 0;
                    const weightNum = parseFloat(weight) || 0;
                    const restrictionDetails = getPlaneRestrictionDetails({
                      weight: weightNum,
                      length: lengthNum,
                      width: widthNum,
                      height: heightNum,
                      restrictedItems,
                      category: category || undefined,
                      originCountry: originCountryIso2,
                      destinationCountry: destinationCountryIso2,
                    });
                    const isOversized =
                      !restrictionDetails.fitsCheckedBaggage &&
                      restrictionDetails.fitsOversized;

                    return (
                      <div
                        className={`border-2 bg-teal-50 p-4 ${isOversized ? "border-amber-300" : "border-teal-200"} rounded-lg`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-teal-900">
                              SpareCarry Plane
                            </div>
                            {isOversized && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="text-amber-600 hover:text-amber-700">
                                    <AlertCircle className="h-4 w-4" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">
                                      Oversized Item
                                    </h4>
                                    <p className="text-xs text-slate-600">
                                      This item exceeds standard checked baggage
                                      limits but may still be accepted as
                                      oversized/overweight baggage.
                                    </p>
                                    <p className="text-xs font-medium text-amber-600">
                                      ⚠ Additional airline fees may apply
                                      (typically $50-200 depending on airline
                                      and route).
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500">
                                      The price shown is for SpareCarry service
                                      only. Airline fees are separate and will
                                      be handled by the traveler.
                                    </p>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                          <div className="rounded bg-teal-100 px-2 py-1 text-xs text-teal-700">
                            Save {estimate.savingsPercentagePlane}%
                          </div>
                        </div>
                        <div className="mb-1 text-2xl font-bold text-teal-900">
                          ${estimate.spareCarryPlanePrice.toFixed(2)}
                        </div>
                        {isOversized && (
                          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-amber-600">
                            <AlertCircle className="h-3 w-3" />
                            Oversized - airline fees may apply
                          </div>
                        )}
                        {isPremium && (
                          <div className="mb-1 text-xs font-medium text-teal-700">
                            Premium discount applied
                          </div>
                        )}
                        <div className="text-sm font-semibold text-green-600">
                          You save ${estimate.savingsPlane.toFixed(2)}
                        </div>
                        {estimate.distanceKm && (
                          <div className="mt-1 text-xs text-slate-500">
                            Distance: {estimate.distanceKm.toFixed(0)} km
                          </div>
                        )}
                      </div>
                    );
                  })()}

                {/* Plane Restriction Warning with Detailed Breakdown */}
                {estimate.canTransportByPlane === false &&
                  estimate.planeRestrictionReason &&
                  (() => {
                    const lengthNum = parseFloat(length) || 0;
                    const widthNum = parseFloat(width) || 0;
                    const heightNum = parseFloat(height) || 0;
                    const weightNum = parseFloat(weight) || 0;
                    const restrictionDetails = getPlaneRestrictionDetails({
                      weight: weightNum,
                      length: lengthNum,
                      width: widthNum,
                      height: heightNum,
                      restrictedItems,
                      category: category || undefined,
                      originCountry: originCountryIso2,
                      destinationCountry: destinationCountryIso2,
                    });

                    return (
                      <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                          <div className="flex-1">
                            <div className="mb-2 text-sm font-medium text-amber-900">
                              Plane Transport Not Available
                            </div>
                            <div className="mb-3 text-xs text-amber-800">
                              {estimate.planeRestrictionReason}
                            </div>

                            {/* Detailed Breakdown */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="text-xs font-medium text-amber-700 underline hover:text-amber-900">
                                  Why can&apos;t I use plane? →
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-96" align="start">
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold">
                                    Plane Transport Restrictions
                                  </h4>

                                  {/* Size/Weight Breakdown */}
                                  <div className="space-y-2">
                                    <div className="text-xs font-medium text-slate-700">
                                      Size & Weight Check:
                                    </div>
                                    <div className="space-y-1 text-xs">
                                      <div
                                        className={`flex justify-between ${restrictionDetails.fitsCarryOn ? "text-green-600" : "text-slate-600"}`}
                                      >
                                        <span>
                                          Carry-on (≤7kg, ≤55×40×23cm):
                                        </span>
                                        <span>
                                          {restrictionDetails.fitsCarryOn
                                            ? "✓ Fits"
                                            : "✗ Too large/heavy"}
                                        </span>
                                      </div>
                                      <div
                                        className={`flex justify-between ${restrictionDetails.fitsCheckedBaggage ? "text-green-600" : "text-slate-600"}`}
                                      >
                                        <span>
                                          Checked baggage (≤32kg, ≤158cm):
                                        </span>
                                        <span>
                                          {restrictionDetails.fitsCheckedBaggage
                                            ? "✓ Fits"
                                            : "✗ Too large/heavy"}
                                        </span>
                                      </div>
                                      <div
                                        className={`flex justify-between ${restrictionDetails.fitsOversized ? "text-amber-600" : "text-red-600"}`}
                                      >
                                        <span>Oversized (≤45kg, ≤320cm):</span>
                                        <span>
                                          {restrictionDetails.fitsOversized
                                            ? "⚠ May require extra fees"
                                            : "✗ Exceeds limits"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Current Item Specs */}
                                  <div className="space-y-1 border-t pt-2 text-xs">
                                    <div className="font-medium text-slate-700">
                                      Your Item:
                                    </div>
                                    <div className="text-slate-600">
                                      Weight: {weightNum.toFixed(1)}kg |
                                      Dimensions: {lengthNum.toFixed(0)}×
                                      {widthNum.toFixed(0)}×
                                      {heightNum.toFixed(0)}cm | Total:{" "}
                                      {(
                                        lengthNum +
                                        widthNum +
                                        heightNum
                                      ).toFixed(0)}
                                      cm
                                    </div>
                                  </div>

                                  {restrictedItems && (
                                    <div className="border-t pt-2">
                                      <div className="text-xs font-medium text-red-600">
                                        Restricted Items:
                                      </div>
                                      <div className="text-xs text-slate-600">
                                        Contains restricted goods that cannot be
                                        transported by plane.
                                      </div>
                                    </div>
                                  )}

                                  <div className="border-t pt-2">
                                    <p className="text-xs text-slate-500">
                                      Boat transport is available for all items,
                                      including oversized and restricted goods.
                                    </p>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>

                            <div className="mt-2 text-xs font-medium text-amber-700">
                              Boat transport is available below ↓
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {/* SpareCarry Boat */}
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-medium text-blue-900">
                      SpareCarry Boat
                    </div>
                    <div className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                      Save {estimate.savingsPercentageBoat}%
                    </div>
                  </div>
                  <div className="mb-1 text-2xl font-bold text-blue-900">
                    ${estimate.spareCarryBoatPrice.toFixed(2)}
                  </div>
                  {isPremium && (
                    <div className="mb-1 text-xs font-medium text-blue-700">
                      Premium discount applied
                    </div>
                  )}
                  <SavingsCounter
                    savings={estimate.savingsBoat}
                    className="text-sm font-semibold"
                  />
                </div>

                {/* Premium CTA Card - Only show for non-premium users and users who have completed 3+ deliveries */}
                {/* Hide for first 3 deliveries since they already get 0% platform fee (early supporter benefit) */}
                {!isPremium &&
                  !hasEarlySupporterBenefits &&
                  estimate.premiumPlanePrice &&
                  estimate.premiumBoatPrice && (
                    <div className="rounded-lg border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Crown className="h-5 w-5 text-purple-600" />
                          <div className="text-sm font-semibold text-purple-900">
                            Upgrade to SpareCarry Pro for extra savings!
                          </div>
                        </div>
                        <div className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-600">
                          Premium
                        </div>
                      </div>

                      {/* Premium Savings Calculation */}
                      {(() => {
                        const estimatedPremiumSavings = Math.max(
                          estimate.premiumSavingsPercentagePlane || 0,
                          estimate.premiumSavingsPercentageBoat || 0
                        );
                        return estimatedPremiumSavings > 0 ? (
                          <div className="mb-3 inline-block rounded bg-purple-100 px-2 py-1 text-xs text-purple-700">
                            ⭐ Premium saves you up to {estimatedPremiumSavings}
                            % on this delivery.
                          </div>
                        ) : null;
                      })()}

                      {/* Premium Plane Price - Only show if plane transport is allowed */}
                      {estimate.canTransportByPlane !== false &&
                        estimate.premiumPlanePrice && (
                          <div className="mb-3 border-b border-purple-200 pb-3">
                            <div className="mb-1 flex items-center justify-between">
                              <div className="text-xs font-medium text-purple-800">
                                SpareCarry Plane (Premium)
                              </div>
                              {estimate.premiumSavingsPercentagePlane && (
                                <div className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                                  Save {estimate.premiumSavingsPercentagePlane}%
                                </div>
                              )}
                            </div>
                            <div className="mb-1 text-xl font-bold text-purple-900">
                              ${estimate.premiumPlanePrice.toFixed(2)}
                            </div>
                            <div className="mb-1 text-xs font-medium text-purple-700">
                              Premium discount applied
                            </div>
                            {estimate.premiumSavingsPlane && (
                              <div className="text-xs font-semibold text-green-600">
                                You save $
                                {estimate.premiumSavingsPlane.toFixed(2)}
                              </div>
                            )}
                          </div>
                        )}

                      {/* Premium Boat Price */}
                      <div>
                        <div className="mb-1 flex items-center justify-between">
                          <div className="text-xs font-medium text-purple-800">
                            SpareCarry Boat (Premium)
                          </div>
                          {estimate.premiumSavingsPercentageBoat && (
                            <div className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                              Save {estimate.premiumSavingsPercentageBoat}%
                            </div>
                          )}
                        </div>
                        <div className="mb-1 text-xl font-bold text-purple-900">
                          ${estimate.premiumBoatPrice.toFixed(2)}
                        </div>
                        <div className="mb-1 text-xs font-medium text-purple-700">
                          Premium discount applied
                        </div>
                        {estimate.premiumSavingsBoat && (
                          <div className="text-xs font-semibold text-green-600">
                            You save ${estimate.premiumSavingsBoat.toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Premium Savings Note */}
                      {estimate.premiumSavingsPlane &&
                        estimate.premiumSavingsBoat && (
                          <div className="mt-3 border-t border-purple-200 pt-3">
                            <p className="text-xs text-purple-700">
                              Most users save $
                              {Math.min(
                                estimate.premiumSavingsPlane,
                                estimate.premiumSavingsBoat
                              ).toFixed(2)}{" "}
                              when they upgrade!
                            </p>
                          </div>
                        )}
                    </div>
                  )}

                {/* Karma points are now automatically applied when delivery is completed */}

                {/* Suggested Reward Buttons */}
                {suggestedReward !== null && estimate && (
                  <div className="mt-4 space-y-2 rounded-lg border border-teal-200 bg-teal-50 p-4">
                    <p className="mb-2 text-sm font-medium text-teal-900">
                      Suggested reward: ${suggestedReward.toFixed(2)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          // Use original location data if available (from post request form), otherwise use country names
                          const fromLocationName =
                            originalFromLocation ||
                            (originCountryIso2
                              ? getCountryByIso2(originCountryIso2)?.name ||
                                originCountryIso2
                              : "");
                          const toLocationName =
                            originalToLocation ||
                            (destinationCountryIso2
                              ? getCountryByIso2(destinationCountryIso2)
                                  ?.name || destinationCountryIso2
                              : "");

                          const prefillData = {
                            from_location: fromLocationName,
                            to_location: toLocationName,
                            // Include coordinates if available
                            departure_lat: originalFromLat || null,
                            departure_lon: originalFromLon || null,
                            arrival_lat: originalToLat || null,
                            arrival_lon: originalToLon || null,
                            // Also include country codes for reference
                            originCountryIso2,
                            destinationCountryIso2,
                            length_cm: parseFloat(length) || 0,
                            width_cm: parseFloat(width) || 0,
                            height_cm: parseFloat(height) || 0,
                            weight_kg: parseFloat(weight) || 0,
                            value_usd: parseFloat(declaredValue) || 0,
                            max_reward: suggestedReward,
                            selectedCourier,
                            courierPrice: estimate.courierPrice,
                            spareCarryPlanePrice: estimate.spareCarryPlanePrice,
                            spareCarryBoatPrice: estimate.spareCarryBoatPrice,
                            platformFeePlane: estimate.platformFeePlane,
                            platformFeeBoat: estimate.platformFeeBoat,
                            size_tier: sizeTier,
                          };
                          router.push(
                            `/home/post-request?prefill=${encodeURIComponent(JSON.stringify(prefillData))}`
                          );
                        }}
                        className="flex-1 bg-teal-600 hover:bg-teal-700"
                        size="lg"
                      >
                        Use ${suggestedReward.toFixed(0)}
                      </Button>
                      <Button
                        onClick={() => {
                          setSuggestedReward(null);
                          handleCreateJob();
                        }}
                        variant="outline"
                        className="flex-1"
                        size="lg"
                      >
                        I&apos;ll set my own
                      </Button>
                    </div>
                  </div>
                )}

                {/* Create Job Button */}
                {suggestedReward === null && (
                  <Button
                    onClick={handleCreateJob}
                    className="mt-4 w-full bg-teal-600 hover:bg-teal-700"
                    size="lg"
                  >
                    <TrendingDown className="mr-2 h-4 w-4" />
                    Create SpareCarry Job from This Estimate
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-slate-500">
                Fill in the form to see price comparison
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <Card className="mt-6 border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="text-sm text-amber-800">
              <strong>Estimate only.</strong> Actual customs/courier costs may
              vary. Please verify with your local customs authority and courier
              provider. SpareCarry prices are estimates and may vary based on
              route, availability, and other factors.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ShippingEstimatorFallback() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-6 pb-24 lg:pb-6">
      <div className="mb-6">
        <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold text-slate-900">
          <Calculator className="h-8 w-8 text-teal-600" />
          Shipping Cost Estimator
        </h1>
        <p className="text-slate-600">
          Compare courier prices with SpareCarry delivery options and see your
          savings
        </p>
      </div>
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-500">Loading...</div>
      </div>
    </div>
  );
}

export default function ShippingEstimatorPage() {
  return (
    <Suspense fallback={<ShippingEstimatorFallback />}>
      <ShippingEstimatorContent />
    </Suspense>
  );
}
