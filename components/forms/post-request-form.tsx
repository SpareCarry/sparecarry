"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Upload,
  X,
  Plane,
  Ship,
  DollarSign,
  AlertCircle,
  MapPin,
  Clock,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { Tier1Integration } from "./tier1-integration";
import { PhotoUploader } from "../../modules/tier1Features/photos";
import { useSearchParams } from "next/navigation";
import { LocationFieldGroup } from "../location/LocationFieldGroup";
import { Place } from "../../lib/services/location";
import { calculateEmergencyPricing } from "../../src/utils/emergencyPricing";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Info, Calculator, ArrowRight } from "lucide-react";
import { SizeTierSelector } from "../ui/size-tier-selector";
import { getSizeTier } from "../../lib/utils/size-tier";
import Link from "next/link";
import { WeightDisplay, DimensionsDisplay } from "../imperial/imperial-display";
import { AutoMeasureButton } from "./AutoMeasureButton";
import {
  trackPostCreated,
  trackRestrictedItemsSelected,
  trackCategorySelected,
  trackPhotoUploaded,
  trackEmergencySelected,
} from "../../lib/analytics/tracking";
import {
  calculateShippingEstimate,
  ShippingEstimateInput,
} from "../../lib/services/shipping";
import { calculateDistance } from "../../lib/utils/distance-calculator";
import { reverseGeocode } from "../../lib/services/location";
import { checkSubscriptionStatus } from "../../src/utils/subscriptionUtils";
import { useUser } from "../../hooks/useUser";
import { useQuery } from "@tanstack/react-query";
import {
  detectWeightFromText,
  estimateWeightFromFeel,
  validateWeightDimensions,
  getCategoryWeightRange,
  getReferenceItems,
  type WeightFeel,
  type WeightEstimate,
  type ReferenceItem,
} from "../../lib/utils/weight-estimation";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { PurchaseOptions } from "../purchase/purchase-options";

const postRequestSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(2000).optional(),
    category: z.string().optional(), // Manual category selection
    category_other_description: z.string().max(500).optional(), // Free-text when category is "Other"
    from_location: z.string().min(1, "From location is required"),
    to_location: z.string().min(1, "To location is required"),
    departure_lat: z.number().nullable().optional(),
    departure_lon: z.number().nullable().optional(),
    departure_category: z.string().nullable().optional(),
    arrival_lat: z.number().nullable().optional(),
    arrival_lon: z.number().nullable().optional(),
    arrival_category: z.string().nullable().optional(),
    deadline_earliest: z.string().optional(),
    deadline_latest: z.string().min(1, "Deadline is required"),
    preferred_method: z
      .enum(["plane", "boat", "any", "quickest", "best_fit"])
      .default("any"),
    max_reward: z.number().min(50, "Minimum reward is $50"),
    weight_kg: z.number().positive("Weight must be positive"),
    length_cm: z.number().positive("Length must be positive"),
    width_cm: z.number().positive("Width must be positive"),
    height_cm: z.number().positive("Height must be positive"),
    size_tier: z.enum(["small", "medium", "large", "extra_large"]).optional(),
    value_usd: z
      .union([z.number().nonnegative(), z.literal(""), z.null()])
      .optional()
      .transform((val) => (val === "" ? undefined : val)),
    restricted_items: z.boolean().default(false), // Restricted goods - only boat transport
    emergency: z.boolean().default(false),
    emergency_days: z.number().optional(), // Days until deadline for emergency
    purchase_retailer: z.enum(["west_marine", "svb", "amazon"]).optional(),
    prohibited_items_confirmed: z.boolean().optional(), // For plane requests only
  })
  .refine(
    (data) => {
      // If restricted_items is true, preferred_method cannot be "plane"
      if (data.restricted_items && data.preferred_method === "plane") {
        return false;
      }
      return true;
    },
    {
      message: "Restricted items can only be transported by boat",
      path: ["preferred_method"],
    }
  )
  .refine(
    (data) => {
      // prohibited_items_confirmed is required if preferred_method is "plane"
      if (
        data.preferred_method === "plane" &&
        data.prohibited_items_confirmed !== true
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "You must confirm that your shipment does not contain prohibited items",
      path: ["prohibited_items_confirmed"],
    }
  );

type PostRequestFormData = z.infer<typeof postRequestSchema>;

interface PlaceResult {
  description: string;
  place_id: string;
}

export function PostRequestForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const supabase = createClient() as SupabaseClient;
  const [photos, setPhotos] = useState<File[]>([]);
  const [fromPlace, setFromPlace] = useState<PlaceResult | null>(null);
  const [toPlace, setToPlace] = useState<PlaceResult | null>(null);
  const [departurePlace, setDeparturePlace] = useState<Place | null>(null);
  const [arrivalPlace, setArrivalPlace] = useState<Place | null>(null);
  const [fromPredictions, setFromPredictions] = useState<PlaceResult[]>([]);
  const [toPredictions, setToPredictions] = useState<PlaceResult[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [suggestedReward, setSuggestedReward] = useState<number>(0);
  const [suggestedPriceRange, setSuggestedPriceRange] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [priceConfidence, setPriceConfidence] = useState<
    "high" | "medium" | "low"
  >("low");
  const [priceReasoning, setPriceReasoning] = useState<string>("");
  const [priceDataPoints, setPriceDataPoints] = useState<number>(0);
  const [loadingSuggestedPrice, setLoadingSuggestedPrice] = useState(false);
  const [shippingEstimate, setShippingEstimate] = useState<ReturnType<
    typeof calculateShippingEstimate
  > | null>(null);
  const [originCountryIso2, setOriginCountryIso2] = useState<string>("");
  const [destinationCountryIso2, setDestinationCountryIso2] =
    useState<string>("");
  const [loading, setLoading] = useState(false);

  // Get user and subscription status
  const { user } = useUser();
  const { data: subscriptionStatus } = useQuery({
    queryKey: ["subscription-status", user?.id],
    queryFn: () => checkSubscriptionStatus(user?.id),
    enabled: !!user,
    staleTime: 60000,
  });
  const isPremium = subscriptionStatus?.isPremium ?? false;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
  } = useForm<PostRequestFormData>({
    mode: "onChange",
    resolver: zodResolver(postRequestSchema),
    defaultValues: {
      preferred_method: "any",
      emergency: false,
      purchase_retailer: undefined,
    },
  });

  const weight = watch("weight_kg");
  const preferredMethod = watch("preferred_method");
  const maxReward = watch("max_reward");
  const title = watch("title");
  const description = watch("description");
  const category = watch("category");
  const categoryOtherDescription = watch("category_other_description");
  const purchaseRetailer = watch("purchase_retailer");
  const declaredValue = watch("value_usd");
  const length = watch("length_cm");
  const width = watch("width_cm");
  const height = watch("height_cm");
  const [isAutoEstimated, setIsAutoEstimated] = useState(false);
  const fromLocation = watch("from_location");
  const toLocation = watch("to_location");
  const deadlineEarliest = watch("deadline_earliest");
  const deadlineLatest = watch("deadline_latest");
  const boatEtaDays = undefined; // Not used for requests, only trips
  const restrictedItems = watch("restricted_items") || false;
  const emergency = watch("emergency") || false;

  // Weight estimation state
  const [detectedWeight, setDetectedWeight] = useState<WeightEstimate | null>(
    null
  );
  const [weightFeel, setWeightFeel] = useState<WeightFeel | null>(null);
  const [weightValidation, setWeightValidation] = useState<{
    isValid: boolean;
    warning?: string;
  } | null>(null);
  const [showReferenceItems, setShowReferenceItems] = useState(false);

  // Get country codes from places
  useEffect(() => {
    const getCountryFromPlace = async (
      place: Place | null,
      setter: (code: string) => void
    ) => {
      if (!place || !place.lat || !place.lon) return;

      try {
        const geocoded = await reverseGeocode(place.lat, place.lon);
        if (geocoded?.country) {
          setter(geocoded.country.toUpperCase());
        }
      } catch (error) {
        console.warn("Failed to get country from place:", error);
      }
    };

    getCountryFromPlace(departurePlace, setOriginCountryIso2);
    getCountryFromPlace(arrivalPlace, setDestinationCountryIso2);
  }, [departurePlace, arrivalPlace]);

  // Calculate distance between two places
  useEffect(() => {
    if (
      departurePlace &&
      arrivalPlace &&
      departurePlace.lat != null &&
      departurePlace.lon != null &&
      arrivalPlace.lat != null &&
      arrivalPlace.lon != null
    ) {
      const distanceKm = calculateDistance(
        { lat: departurePlace.lat, lon: departurePlace.lon },
        { lat: arrivalPlace.lat, lon: arrivalPlace.lon }
      );
      setDistance(distanceKm > 0 ? distanceKm : null);
    } else {
      setDistance(null);
    }
  }, [departurePlace, arrivalPlace]);

  // Calculate shipping estimate using the same service as shipping estimator
  const shippingEstimateMemo = useMemo(() => {
    if (
      !originCountryIso2 ||
      !destinationCountryIso2 ||
      !weight ||
      !length ||
      !width ||
      !height
    ) {
      return null;
    }

    const lengthNum = parseFloat(length.toString());
    const widthNum = parseFloat(width.toString());
    const heightNum = parseFloat(height.toString());
    const weightNum = parseFloat(weight.toString());
    const declaredValueNum = parseFloat(declaredValue?.toString() || "0") || 0;

    if (
      isNaN(lengthNum) ||
      isNaN(widthNum) ||
      isNaN(heightNum) ||
      isNaN(weightNum) ||
      lengthNum <= 0 ||
      widthNum <= 0 ||
      heightNum <= 0 ||
      weightNum <= 0
    ) {
      return null;
    }

    const input: ShippingEstimateInput = {
      originCountry: originCountryIso2,
      destinationCountry: destinationCountryIso2,
      length: lengthNum,
      width: widthNum,
      height: heightNum,
      weight: weightNum,
      declaredValue: declaredValueNum,
      selectedCourier: "DHL", // Default courier
      isPremium,
      distanceKm: distance || undefined,
      restrictedItems: restrictedItems || undefined,
      category: category || undefined,
    };

    return calculateShippingEstimate(input);
  }, [
    originCountryIso2,
    destinationCountryIso2,
    length,
    width,
    height,
    weight,
    declaredValue,
    isPremium,
    distance,
    restrictedItems,
    category,
  ]);

  // Detect weight from text/category
  useEffect(() => {
    if (!weight && (title || description || category)) {
      const detected = detectWeightFromText(
        title || "",
        description || "",
        category
      );
      if (detected) {
        setDetectedWeight(detected);
      } else {
        setDetectedWeight(null);
      }
    } else if (weight) {
      // Clear detection if user has entered weight
      setDetectedWeight(null);
    }
  }, [title, description, category, weight]);

  // Estimate weight from feel + dimensions
  useEffect(() => {
    if (weightFeel && length && width && height && !weight) {
      const estimated = estimateWeightFromFeel(
        parseFloat(length.toString()) || 0,
        parseFloat(width.toString()) || 0,
        parseFloat(height.toString()) || 0,
        weightFeel
      );
      // Store in a way that we can show it in UI
      // We'll handle this in the UI component
    }
  }, [weightFeel, length, width, height, weight]);

  // Validate weight against dimensions
  useEffect(() => {
    if (weight && length && width && height) {
      const validation = validateWeightDimensions(
        parseFloat(weight.toString()) || 0,
        parseFloat(length.toString()) || 0,
        parseFloat(width.toString()) || 0,
        parseFloat(height.toString()) || 0
      );
      setWeightValidation(validation);
    } else {
      setWeightValidation(null);
    }
  }, [weight, length, width, height]);

  // Update suggested reward based on shipping estimate (quick sync version)
  useEffect(() => {
    if (shippingEstimateMemo) {
      setShippingEstimate(shippingEstimateMemo);

      // Determine which price to suggest based on preferred method and restrictions
      let suggested = 0;
      if (
        preferredMethod === "plane" &&
        shippingEstimateMemo.canTransportByPlane &&
        shippingEstimateMemo.spareCarryPlanePrice > 0
      ) {
        suggested = shippingEstimateMemo.spareCarryPlanePrice;
      } else if (
        preferredMethod === "boat" &&
        shippingEstimateMemo.spareCarryBoatPrice > 0
      ) {
        suggested = shippingEstimateMemo.spareCarryBoatPrice;
      } else if (preferredMethod === "any") {
        // Use the cheaper option, or boat if plane is not available
        if (
          shippingEstimateMemo.canTransportByPlane &&
          shippingEstimateMemo.spareCarryPlanePrice > 0
        ) {
          suggested =
            shippingEstimateMemo.spareCarryBoatPrice > 0
              ? Math.min(
                  shippingEstimateMemo.spareCarryPlanePrice,
                  shippingEstimateMemo.spareCarryBoatPrice
                )
              : shippingEstimateMemo.spareCarryPlanePrice;
        } else {
          suggested = shippingEstimateMemo.spareCarryBoatPrice;
        }
      } else {
        // Fallback to boat if plane is not available
        suggested = shippingEstimateMemo.spareCarryBoatPrice;
      }

      if (suggested > 0) {
        setSuggestedReward(Math.round(suggested));
        setValue("max_reward", Math.round(suggested));
      }
    }
  }, [shippingEstimateMemo, preferredMethod, setValue]);

  // Enhanced suggested price with market data (async)
  useEffect(() => {
    // Only fetch if we have all required data
    if (
      !fromLocation ||
      !toLocation ||
      !weight ||
      !length ||
      !width ||
      !height ||
      loadingSuggestedPrice
    ) {
      return;
    }

    const fetchSmartSuggestedPrice = async () => {
      setLoadingSuggestedPrice(true);
      try {
        const { calculateSuggestedPrice } =
          await import("../../lib/pricing/suggested-price");

        const result = await calculateSuggestedPrice({
          fromLocation,
          toLocation,
          weightKg: parseFloat(weight.toString()) || 0,
          lengthCm: parseFloat(length.toString()) || undefined,
          widthCm: parseFloat(width.toString()) || undefined,
          heightCm: parseFloat(height.toString()) || undefined,
          category: category || undefined,
          preferredMethod: preferredMethod as "plane" | "boat" | "any",
          restrictedItems: restrictedItems || false,
          fragile: false, // Add fragile field if available
          declaredValue: declaredValue
            ? parseFloat(declaredValue.toString())
            : undefined,
          distanceKm: distance ?? undefined,
          courierPrice: shippingEstimateMemo?.courierPrice,
          courierTotal: shippingEstimateMemo?.courierTotal,
          useMarketData: true,
        });

        if (result) {
          setSuggestedReward(Math.round(result.suggestedPrice));
          setSuggestedPriceRange(result.priceRange);
          setPriceConfidence(result.confidence);
          setPriceReasoning(result.reasoning);
          setPriceDataPoints(result.dataPoints);
          setValue("max_reward", Math.round(result.suggestedPrice));
        }
      } catch (error) {
        console.warn(
          "[post-request-form] Error fetching smart suggested price:",
          error
        );
        // Fallback to basic suggested price (already set above)
      } finally {
        setLoadingSuggestedPrice(false);
      }
    };

    // Debounce to avoid too many calls
    const timeoutId = setTimeout(fetchSmartSuggestedPrice, 500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fromLocation,
    toLocation,
    weight,
    length,
    width,
    height,
    category,
    preferredMethod,
    restrictedItems,
    declaredValue,
    distance,
    shippingEstimateMemo?.courierPrice,
    shippingEstimateMemo?.courierTotal,
    setValue,
    // loadingSuggestedPrice is only set, not read, so it doesn't need to be in deps
  ]);

  // Save form data to sessionStorage whenever it changes (for back navigation)
  // Use a ref to track previous values and prevent unnecessary saves/infinite loops
  const prevFormDataRef = useRef<string>("");
  const isInitialMountRef = useRef(true);
  const prefillAppliedRef = useRef<string | null>(null);
  const sessionStorageRestoredRef = useRef(false);

  useEffect(() => {
    // Skip saving on initial mount to prevent overwriting prefill data
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    const formData = {
      title,
      description,
      category,
      category_other_description: categoryOtherDescription,
      from_location: fromLocation,
      to_location: toLocation,
      length_cm: length,
      width_cm: width,
      height_cm: height,
      weight_kg: weight,
      value_usd: declaredValue,
      max_reward: maxReward,
      preferred_method: preferredMethod,
      restricted_items: restrictedItems,
      emergency,
      deadline_earliest: deadlineEarliest,
      deadline_latest: deadlineLatest,
    };

    // Serialize form data to compare with previous
    const formDataString = JSON.stringify(formData);

    // Only save if data has actually changed (prevents infinite loops)
    if (formDataString !== prevFormDataRef.current) {
      prevFormDataRef.current = formDataString;

      // Only save if at least one field has a value
      const hasData = Object.values(formData).some(
        (val) => val !== undefined && val !== null && val !== ""
      );
      if (hasData) {
        try {
          sessionStorage.setItem("postRequestFormData", formDataString);
          // Also save location places
          if (departurePlace) {
            sessionStorage.setItem(
              "postRequestDeparturePlace",
              JSON.stringify(departurePlace)
            );
          }
          if (arrivalPlace) {
            sessionStorage.setItem(
              "postRequestArrivalPlace",
              JSON.stringify(arrivalPlace)
            );
          }
        } catch (error) {
          // Silently fail if sessionStorage is not available (e.g., in private browsing)
          console.warn("Failed to save form data to sessionStorage:", error);
        }
      }
    }
  }, [
    title,
    description,
    category,
    categoryOtherDescription,
    fromLocation,
    toLocation,
    length,
    width,
    height,
    weight,
    declaredValue,
    maxReward,
    preferredMethod,
    restrictedItems,
    emergency,
    deadlineEarliest,
    deadlineLatest,
    departurePlace,
    arrivalPlace,
  ]);

  // Load prefill data from query params (from shipping estimator) or sessionStorage (for back navigation)
  // Moved after useForm hook to ensure setValue is available
  useEffect(() => {
    const prefillParam = searchParams?.get("prefill");

    // If we've already applied this exact prefill param, don't run again
    if (prefillParam && prefillAppliedRef.current === prefillParam) {
      return;
    }

    if (prefillParam) {
      try {
        const prefillData = JSON.parse(decodeURIComponent(prefillParam));
        if (prefillData) {
          // Mark this prefill param as applied
          prefillAppliedRef.current = prefillParam;

          // Pre-fill form fields
          if (prefillData.title) setValue("title", prefillData.title);
          if (prefillData.description)
            setValue("description", prefillData.description);
          if (prefillData.category) setValue("category", prefillData.category);
          if (prefillData.category_other_description)
            setValue(
              "category_other_description",
              prefillData.category_other_description
            );
          if (prefillData.from_location)
            setValue("from_location", prefillData.from_location);
          if (prefillData.to_location)
            setValue("to_location", prefillData.to_location);
          if (prefillData.length_cm)
            setValue("length_cm", prefillData.length_cm);
          if (prefillData.width_cm) setValue("width_cm", prefillData.width_cm);
          if (prefillData.height_cm)
            setValue("height_cm", prefillData.height_cm);
          if (prefillData.weight_kg)
            setValue("weight_kg", prefillData.weight_kg);
          if (prefillData.value_usd)
            setValue("value_usd", prefillData.value_usd);
          if (prefillData.max_reward)
            setValue("max_reward", prefillData.max_reward);
          if (prefillData.preferred_method)
            setValue("preferred_method", prefillData.preferred_method);
          if (prefillData.restricted_items !== undefined)
            setValue("restricted_items", prefillData.restricted_items);

          // Set coordinates if available
          if (prefillData.departure_lat && prefillData.departure_lon) {
            setValue("departure_lat", prefillData.departure_lat);
            setValue("departure_lon", prefillData.departure_lon);
          }
          if (prefillData.arrival_lat && prefillData.arrival_lon) {
            setValue("arrival_lat", prefillData.arrival_lat);
            setValue("arrival_lon", prefillData.arrival_lon);
          }

          // Store karma points and platform fees for later use (when delivery completes)
          // These are stored in component state but not in form schema
          if (prefillData.karmaPoints) {
            // Store in sessionStorage or component state for later retrieval
            sessionStorage.setItem(
              "estimatedKarmaPoints",
              prefillData.karmaPoints.toString()
            );
          }
          if (prefillData.platformFeePlane || prefillData.platformFeeBoat) {
            sessionStorage.setItem(
              "estimatedPlatformFee",
              JSON.stringify({
                plane: prefillData.platformFeePlane || 0,
                boat: prefillData.platformFeeBoat || 0,
              })
            );
          }

          // Set places for location inputs with coordinates if available
          if (prefillData.from_location) {
            const fromPlace = {
              name: prefillData.from_location,
              lat: prefillData.departure_lat || 0,
              lon: prefillData.departure_lon || 0,
            };
            setDeparturePlace(fromPlace);
          }
          if (prefillData.to_location) {
            const toPlace = {
              name: prefillData.to_location,
              lat: prefillData.arrival_lat || 0,
              lon: prefillData.arrival_lon || 0,
            };
            setArrivalPlace(toPlace);
          }
        }
      } catch (error) {
        console.warn("Error parsing prefill data:", error);
      }
    } else {
      // Reset prefill flag when prefill param is removed
      prefillAppliedRef.current = null;

      // If no prefill param, try to restore from sessionStorage (for back navigation)
      // Only restore once on initial mount if form is empty
      if (!sessionStorageRestoredRef.current) {
        try {
          const savedFormData = sessionStorage.getItem("postRequestFormData");
          if (savedFormData) {
            const formData = JSON.parse(savedFormData);
            // Only restore if form is empty (to avoid overwriting user input)
            // Use getValues() to check current form state without triggering re-renders
            const currentTitle = getValues("title");
            const currentDescription = getValues("description");
            const currentCategory = getValues("category");

            if (
              !currentTitle &&
              !currentDescription &&
              !currentCategory &&
              formData.title
            ) {
              sessionStorageRestoredRef.current = true;

              if (formData.title) setValue("title", formData.title);
              if (formData.description)
                setValue("description", formData.description);
              if (formData.category) setValue("category", formData.category);
              if (formData.category_other_description)
                setValue(
                  "category_other_description",
                  formData.category_other_description
                );
              if (formData.from_location)
                setValue("from_location", formData.from_location);
              if (formData.to_location)
                setValue("to_location", formData.to_location);
              if (formData.length_cm) setValue("length_cm", formData.length_cm);
              if (formData.width_cm) setValue("width_cm", formData.width_cm);
              if (formData.height_cm) setValue("height_cm", formData.height_cm);
              if (formData.weight_kg) setValue("weight_kg", formData.weight_kg);
              if (formData.value_usd) setValue("value_usd", formData.value_usd);
              if (formData.max_reward)
                setValue("max_reward", formData.max_reward);
              if (formData.preferred_method)
                setValue("preferred_method", formData.preferred_method);
              if (formData.restricted_items !== undefined)
                setValue("restricted_items", formData.restricted_items);
              if (formData.emergency !== undefined)
                setValue("emergency", formData.emergency);
              if (formData.deadline_earliest)
                setValue("deadline_earliest", formData.deadline_earliest);
              if (formData.deadline_latest)
                setValue("deadline_latest", formData.deadline_latest);

              // Restore location places from sessionStorage
              const savedDeparturePlace = sessionStorage.getItem(
                "postRequestDeparturePlace"
              );
              if (savedDeparturePlace) {
                try {
                  const place = JSON.parse(savedDeparturePlace);
                  setDeparturePlace(place);
                } catch (e) {
                  console.warn("Error parsing saved departure place:", e);
                }
              }

              const savedArrivalPlace = sessionStorage.getItem(
                "postRequestArrivalPlace"
              );
              if (savedArrivalPlace) {
                try {
                  const place = JSON.parse(savedArrivalPlace);
                  setArrivalPlace(place);
                } catch (e) {
                  console.warn("Error parsing saved arrival place:", e);
                }
              }
            }
          }
        } catch (error) {
          console.warn("Error restoring form data from sessionStorage:", error);
        }
      }
    }
  }, [searchParams, setValue, getValues, setDeparturePlace, setArrivalPlace]);

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = files.slice(0, 6 - photos.length);
    setPhotos([...photos, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  // Upload photos to Supabase Storage
  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const uploadedUrls: string[] = [];

    for (const photo of photos) {
      const fileExt = photo.name.split(".").pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `requests/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("item-photos")
        .upload(filePath, photo);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("item-photos").getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const onSubmit = async (data: PostRequestFormData) => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Upload photos
      const photoUrls = await uploadPhotos();

      // Create request
      const dimensionsJson = JSON.stringify({
        length_cm: data.length_cm,
        width_cm: data.width_cm,
        height_cm: data.height_cm,
      });

      // Calculate emergency pricing if applicable
      const deadlineDate = new Date(data.deadline_latest);
      const daysUntilDeadline = Math.ceil(
        (deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      let finalReward = data.max_reward;
      let emergencyBonusPercentage: number | null = null;
      let emergencyExtraAmount: number | null = null;
      const isEmergency = data.emergency && daysUntilDeadline < 10;

      // Track analytics (after all variables are calculated)
      trackPostCreated(
        "request",
        photoUrls.length > 0,
        data.restricted_items || false
      );
      if (data.category) {
        trackCategorySelected(data.category, data.category === "other");
      }
      if (photoUrls.length > 0) {
        trackPhotoUploaded(photoUrls.length, "request");
      }
      if (data.restricted_items) {
        trackRestrictedItemsSelected(
          "request",
          data.restricted_items ? "boat" : data.preferred_method || "boat"
        );
      }
      if (
        isEmergency &&
        emergencyBonusPercentage !== null &&
        emergencyExtraAmount !== null
      ) {
        trackEmergencySelected(
          data.max_reward,
          emergencyBonusPercentage,
          emergencyExtraAmount
        );
      }
      if (data.purchase_retailer) {
      }

      if (isEmergency) {
        const emergencyPricing = calculateEmergencyPricing(data.max_reward);
        finalReward = emergencyPricing.finalReward;
        emergencyBonusPercentage = emergencyPricing.bonusPercentage;
        emergencyExtraAmount = emergencyPricing.extraAmount;
      }

      // Validate restricted items cannot use plane transport
      if (data.restricted_items && data.preferred_method === "plane") {
        throw new Error("Restricted items can only be transported by boat");
      }

      const { data: request, error } = await supabase
        .from("requests")
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description || null,
          from_location: data.from_location,
          to_location: data.to_location,
          departure_lat: data.departure_lat || null,
          departure_lon: data.departure_lon || null,
          departure_category: data.departure_category || null,
          arrival_lat: data.arrival_lat || null,
          arrival_lon: data.arrival_lon || null,
          arrival_category: data.arrival_category || null,
          deadline_earliest: data.deadline_earliest || null,
          deadline_latest: data.deadline_latest,
          max_reward: finalReward,
          item_photos: photoUrls,
          dimensions_cm: dimensionsJson,
          weight_kg: data.weight_kg,
          value_usd:
            data.value_usd && data.value_usd > 0 ? data.value_usd : null,
          preferred_method: data.restricted_items
            ? "boat"
            : data.preferred_method, // Force boat if restricted
          size_tier: data.size_tier || getSizeTier(data.weight_kg),
          emergency: isEmergency,
          item_category: data.category || null,
          category_other_description:
            data.category === "other"
              ? data.category_other_description || null
              : null,
          restricted_items: data.restricted_items || false,
          prohibited_items_confirmed:
            data.preferred_method === "plane"
              ? data.prohibited_items_confirmed || false
              : null,
          emergency_bonus_percentage: emergencyBonusPercentage,
          emergency_extra_amount: emergencyExtraAmount,
          purchase_retailer: data.purchase_retailer || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Call notify-route-matches edge function to send push notifications
      try {
        await fetch("/api/notifications/notify-route-matches", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            request_id: request.id,
            from_location: data.from_location,
            to_location: data.to_location,
            departure_lat: data.departure_lat,
            departure_lon: data.departure_lon,
            arrival_lat: data.arrival_lat,
            arrival_lon: data.arrival_lon,
          }),
        }).catch((err) => {
          // Log but don't fail the request creation if notification fails
          console.warn("Failed to send route match notifications:", err);
        });
      } catch (err) {
        // Log but don't fail the request creation if notification fails
        console.warn("Error calling notify-route-matches:", err);
      }

      // If emergency, send push notifications to verified flyers
      if (isEmergency) {
        await fetch("/api/notifications/emergency-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: request.id,
            fromLocation: data.from_location,
            toLocation: data.to_location,
            reward: finalReward,
            deadline: data.deadline_latest,
          }),
        });
      }

      // Trigger auto-matching
      await fetch("/api/matches/auto-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "request", id: request.id }),
      });

      // Invalidate feed query to refresh
      queryClient.invalidateQueries({ queryKey: ["feed"] });

      // Redirect to browse page
      router.push("/home");
    } catch (error) {
      console.error("Error creating request:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create request";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Item Title *</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="e.g., Marine Battery 200Ah"
          className="bg-white"
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          {...register("description")}
          rows={4}
          className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Describe your item..."
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Photos - Enhanced Tier-1 Photo Uploader */}
      <PhotoUploader
        photos={photos}
        onPhotosChange={(newPhotos) =>
          setPhotos(newPhotos.filter((p): p is File => p instanceof File))
        }
        minPhotos={3}
        maxPhotos={6}
        disabled={loading}
      />

      {/* Dimensions & Weight */}
      <div className="space-y-4">
        {/* Auto-Measure Button */}
        <AutoMeasureButton
          onMeasurementComplete={(dimensions, photoFiles) => {
            setValue("length_cm", dimensions.length_cm);
            setValue("width_cm", dimensions.width_cm);
            setValue("height_cm", dimensions.height_cm);
            setIsAutoEstimated(true);

            // Add photos to photos array if available
            if (
              photoFiles &&
              photoFiles.length > 0 &&
              photos.length + photoFiles.length <= 6
            ) {
              const newPhotos = photoFiles.map((photo, index) => {
                const photoType =
                  ["main", "side", "reference"][index] || "auto-measure";
                return new File(
                  [photo],
                  `auto-measure-${photoType}-${Date.now()}.jpg`,
                  {
                    type: photo.type || "image/jpeg",
                    lastModified: Date.now(),
                  }
                );
              });
              setPhotos([...photos, ...newPhotos]);
            } else {
              // Try to get photos from sessionStorage (fallback for mobile)
              try {
                const photosData = sessionStorage.getItem("autoMeasurePhotos");
                if (photosData) {
                  const storedPhotos = JSON.parse(photosData);
                  // Photos are stored as URIs - would need to fetch and convert to Files
                  // For now, this is handled by the mobile app's photo system
                }
              } catch (e) {
                console.warn("Error loading auto-measure photos:", e);
              }
            }
          }}
        />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="length_cm">Length (cm) *</Label>
            <Input
              id="length_cm"
              type="number"
              step="0.1"
              {...register("length_cm", {
                valueAsNumber: true,
                onChange: (e) => {
                  setIsAutoEstimated(false);
                },
              })}
              className={`bg-white ${isAutoEstimated ? "border-teal-500" : ""}`}
            />
            {Number.isFinite(length) && length! > 0 && (
              <p className="text-xs text-slate-500">
                ≈ {Math.round(length! / 2.54)} in ({Math.floor(length! / 30.48)}{" "}
                ft {Math.round(((length! / 30.48) % 1) * 12)} in)
              </p>
            )}
            {errors.length_cm && (
              <p className="text-sm text-red-600">{errors.length_cm.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="width_cm">Width (cm) *</Label>
            <Input
              id="width_cm"
              type="number"
              step="0.1"
              {...register("width_cm", {
                valueAsNumber: true,
                onChange: () => {
                  setIsAutoEstimated(false);
                },
              })}
              className={`bg-white ${isAutoEstimated ? "border-teal-500" : ""}`}
            />
            {Number.isFinite(width) && width! > 0 && (
              <p className="text-xs text-slate-500">
                ≈ {Math.round(width! / 2.54)} in
              </p>
            )}
            {errors.width_cm && (
              <p className="text-sm text-red-600">{errors.width_cm.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="height_cm">Height (cm) *</Label>
            <Input
              id="height_cm"
              type="number"
              step="0.1"
              {...register("height_cm", {
                valueAsNumber: true,
                onChange: () => {
                  setIsAutoEstimated(false);
                },
              })}
              className={`bg-white ${isAutoEstimated ? "border-teal-500" : ""}`}
            />
            {Number.isFinite(height) && height! > 0 && (
              <p className="text-xs text-slate-500">
                ≈ {Math.round(height! / 2.54)} in
              </p>
            )}
            {errors.height_cm && (
              <p className="text-sm text-red-600">{errors.height_cm.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight_kg">Weight (kg) *</Label>
            <Input
              id="weight_kg"
              type="number"
              step="0.1"
              {...register("weight_kg", { valueAsNumber: true })}
              className="bg-white"
            />
            {Number.isFinite(weight) && weight! > 0 && (
              <p className="text-xs text-slate-500">
                ≈ {Math.round(weight! * 2.20462)} lbs
              </p>
            )}
            {errors.weight_kg && (
              <p className="text-sm text-red-600">{errors.weight_kg.message}</p>
            )}

            {/* Weight Feel Selector */}
            {!weight && (
              <div className="mt-2 space-y-2">
                <Label htmlFor="weight_feel" className="text-sm text-slate-600">
                  How heavy does it feel? (optional)
                </Label>
                <Select
                  value={weightFeel || ""}
                  onValueChange={(value) => setWeightFeel(value as WeightFeel)}
                >
                  <SelectTrigger id="weight_feel" className="bg-white">
                    <SelectValue placeholder="Select weight feel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very_light">
                      🪶 Very Light (like a pillow)
                    </SelectItem>
                    <SelectItem value="light">
                      📱 Light (like a laptop)
                    </SelectItem>
                    <SelectItem value="medium">
                      📦 Medium (like a full backpack)
                    </SelectItem>
                    <SelectItem value="heavy">
                      🏋️ Heavy (like a toolbox)
                    </SelectItem>
                    <SelectItem value="very_heavy">
                      ⚙️ Very Heavy (like a car battery)
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Show estimate from feel + dimensions */}
                {weightFeel && length && width && height && (
                  <div className="rounded-md border border-teal-200 bg-teal-50 p-2">
                    <p className="text-sm text-teal-800">
                      💡 Estimated: ~
                      {estimateWeightFromFeel(
                        parseFloat(length.toString()) || 0,
                        parseFloat(width.toString()) || 0,
                        parseFloat(height.toString()) || 0,
                        weightFeel
                      )}
                      kg
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        const estimated = estimateWeightFromFeel(
                          parseFloat(length.toString()) || 0,
                          parseFloat(width.toString()) || 0,
                          parseFloat(height.toString()) || 0,
                          weightFeel
                        );
                        setValue("weight_kg", estimated);
                        setWeightFeel(null);
                      }}
                    >
                      Use this
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Auto-detection suggestion */}
            {detectedWeight && !weight && (
              <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-800">
                      💡 Detected: ~{detectedWeight.weight}kg (
                      {detectedWeight.source})
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setValue("weight_kg", detectedWeight.weight);
                        setDetectedWeight(null);
                      }}
                    >
                      Use {detectedWeight.weight}kg
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Category hint */}
            {category &&
              !weight &&
              (() => {
                const range = getCategoryWeightRange(category);
                if (range) {
                  return (
                    <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                      <p className="text-xs text-slate-600">
                        💡 Typical weight for {category}: {range.min}-
                        {range.max}kg
                        {range.typical && ` (most are ~${range.typical}kg)`}
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

            {/* Validation warning */}
            {weightValidation &&
              !weightValidation.isValid &&
              weightValidation.warning && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {weightValidation.warning}
                  </AlertDescription>
                </Alert>
              )}

            {/* Reference items */}
            {!weight && (
              <div className="mt-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-500"
                        onClick={() =>
                          setShowReferenceItems(!showReferenceItems)
                        }
                      >
                        <Info className="mr-1 h-3 w-3" />
                        Compare to similar items
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        See examples of similar items with known weights
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {showReferenceItems && (
                  <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold text-slate-700">
                      Similar items:
                    </p>
                    <div className="max-h-40 space-y-1 overflow-y-auto">
                      {getReferenceItems(category || undefined)
                        .slice(0, 5)
                        .map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-xs text-slate-600"
                          >
                            <span>{item.name}</span>
                            <span className="font-medium">{item.weight}kg</span>
                          </div>
                        ))}
                      {getReferenceItems(category || undefined).length ===
                        0 && (
                        <p className="text-xs text-slate-500">
                          No reference items for this category
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Size Tier Selector */}
      <SizeTierSelector
        value={watch("size_tier") || undefined}
        onValueChange={(tier) => setValue("size_tier", tier)}
        weightKg={watch("weight_kg")}
      />

      {/* Value */}
      <div className="space-y-2">
        <Label htmlFor="value_usd">Declared Value ($)</Label>
        <Input
          id="value_usd"
          type="number"
          step="0.01"
          {...register("value_usd", {
            valueAsNumber: true,
            setValueAs: (v: string) => (v === "" ? undefined : parseFloat(v)),
          })}
          placeholder="Optional"
          className="bg-white"
        />
        <p className="text-xs text-slate-500">
          Optional - used for insurance purposes
        </p>
      </div>

      {/* From/To Locations - Enhanced with Location System */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <LocationFieldGroup
          label="Departure Location"
          inputId="from_location"
          inputName="from_location"
          placeholder="Departing from..."
          value={departurePlace}
          onChange={(place) => {
            setDeparturePlace(place);
            if (place) {
              setValue("from_location", place.name);
              setValue("departure_lat", place.lat);
              setValue("departure_lon", place.lon);
              setValue("departure_category", place.category || null);
              setFromPlace({
                description: place.name,
                place_id: place.id || "",
              });
              // Distance will be calculated automatically by useEffect when both places are set
            }
          }}
          showOnlyMarinas={false}
          allowFallbackToAny={true}
          showMapPreview={true}
          showCurrentLocation={true}
          showMapPicker={true}
          required
          error={errors.from_location?.message}
        />

        <LocationFieldGroup
          label="Arrival Location"
          inputId="to_location"
          inputName="to_location"
          placeholder="Going to..."
          value={arrivalPlace}
          onChange={(place) => {
            setArrivalPlace(place);
            if (place) {
              setValue("to_location", place.name);
              setValue("arrival_lat", place.lat);
              setValue("arrival_lon", place.lon);
              setValue("arrival_category", place.category || null);
              // Distance will be calculated automatically by useEffect when both places are set
            }
          }}
          showOnlyMarinas={false}
          allowFallbackToAny={true}
          showMapPreview={true}
          showCurrentLocation={true}
          showMapPicker={true}
          required
          error={errors.to_location?.message}
        />
      </div>

      {/* Deadline */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="deadline_earliest">Earliest Date</Label>
          <Input
            id="deadline_earliest"
            type="date"
            {...register("deadline_earliest")}
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline_latest">Latest Date *</Label>
          <Input
            id="deadline_latest"
            type="date"
            {...register("deadline_latest")}
            min={format(new Date(), "yyyy-MM-dd")}
            className="bg-white"
          />
          {errors.deadline_latest && (
            <p className="text-sm text-red-600">
              {errors.deadline_latest.message}
            </p>
          )}
        </div>
      </div>

      {/* Preferred Method */}
      <div className="space-y-2">
        <Label htmlFor="preferred_method">Preferred Method *</Label>
        <Select
          value={restrictedItems ? "boat" : preferredMethod}
          onValueChange={(value) => {
            if (!restrictedItems) {
              setValue(
                "preferred_method",
                value as "plane" | "boat" | "any" | "quickest" | "best_fit"
              );
            }
          }}
          disabled={restrictedItems}
        >
          <SelectTrigger id="preferred_method" className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="plane" disabled={restrictedItems}>
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Plane only
                {restrictedItems && (
                  <span className="ml-2 text-xs text-red-600">
                    (Not available for restricted items)
                  </span>
                )}
              </div>
            </SelectItem>
            <SelectItem value="boat">
              <div className="flex items-center gap-2">
                <Ship className="h-4 w-4" />
                Boat only
              </div>
            </SelectItem>
            <SelectItem value="quickest" disabled={restrictedItems}>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Quickest
              </div>
            </SelectItem>
            <SelectItem value="best_fit" disabled={restrictedItems}>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Best fit
              </div>
            </SelectItem>
            <SelectItem value="any" disabled={restrictedItems}>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Any (cheapest)
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {restrictedItems && (
          <p className="text-xs text-red-600">
            Restricted items can only be transported by boat. Transport method
            is set to &quot;Boat only&quot;.
          </p>
        )}
      </div>

      {/* Category Field - Manual Dropdown */}
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={category || ""}
          onValueChange={(value) => {
            setValue("category", value);
            if (value !== "other") {
              setValue("category_other_description", undefined);
            }
          }}
        >
          <SelectTrigger id="category" className="bg-white">
            <SelectValue placeholder="Select a category (optional)" />
          </SelectTrigger>
          <SelectContent>
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
        {category === "other" && (
          <div className="mt-2">
            <Label htmlFor="category_other_description" className="text-sm">
              Please describe the category
            </Label>
            <Input
              id="category_other_description"
              type="text"
              placeholder="e.g., Custom parts, Specialty items..."
              {...register("category_other_description")}
              className="mt-1 bg-white"
            />
          </div>
        )}
      </div>

      {/* Buy & Ship Directly */}
      <PurchaseOptions
        itemTitle={title || "Your item"}
        itemDescription={description || undefined}
        selectedRetailer={
          (purchaseRetailer as "west_marine" | "svb" | "amazon" | undefined) ||
          null
        }
        onSelectRetailer={(retailer) => setValue("purchase_retailer", retailer)}
      />

      {/* Restricted Items Checkbox */}
      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
        <input
          id="restricted_items"
          type="checkbox"
          {...register("restricted_items", {
            onChange: (e) => {
              if (e.target.checked && preferredMethod === "plane") {
                setValue("preferred_method", "boat");
              }
            },
          })}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
        />
        <div className="flex-1">
          <Label
            htmlFor="restricted_items"
            className="flex cursor-pointer items-center gap-2 font-medium"
          >
            <AlertCircle className="h-4 w-4 text-red-600" />
            This item contains restricted goods (lithium batteries, liquids,
            flammable items, etc.) → Only transport by boat
          </Label>
          <div className="mt-1 flex items-start gap-2">
            <p className="flex-1 text-xs text-slate-600">
              Restricted items cannot be transported by plane due to airline
              regulations. Selecting this option will automatically set
              transport method to boat only.
            </p>
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
                <p className="text-sm">
                  Restricted items include lithium batteries, liquids over
                  100ml, flammable materials, and other items prohibited by
                  airlines. These can only be transported by boat.
                </p>
              </PopoverContent>
            </Popover>
          </div>
          {restrictedItems && preferredMethod === "plane" && (
            <div className="mt-2 rounded-md border border-red-300 bg-white p-2">
              <p className="text-xs text-red-800">
                <strong>Note:</strong> Transport method has been changed to
                &quot;Boat only&quot; because restricted items cannot be
                transported by plane.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tier-1 Features Integration */}
      <Tier1Integration
        title={title}
        description={description}
        category={category}
        onCategoryChange={(cat) => setValue("category", cat)}
        declaredValue={declaredValue ?? undefined}
        weight={weight}
        dimensions={{
          length,
          width,
          height,
        }}
        photos={photos}
        hasBatteries={false}
        hasLiquids={false}
        liquidVolume={undefined}
        restrictedItems={restrictedItems}
        travelMethod={
          preferredMethod === "boat" || preferredMethod === "any"
            ? "boat"
            : "plane"
        }
        fromLocation={
          departurePlace
            ? {
                name: departurePlace.name,
                latitude: departurePlace.lat,
                longitude: departurePlace.lon,
              }
            : undefined
        }
        toLocation={
          arrivalPlace
            ? {
                name: arrivalPlace.name,
                latitude: arrivalPlace.lat,
                longitude: arrivalPlace.lon,
              }
            : undefined
        }
      />

      {/* Max Reward */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="max_reward">Max You&apos;re Willing to Pay *</Label>
            <span className="text-sm font-semibold text-teal-600">
              ${maxReward?.toLocaleString() || 0}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {suggestedReward > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  {loadingSuggestedPrice ? (
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Calculating...
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-slate-500">
                        {suggestedPriceRange ? (
                          <>
                            Suggested: $
                            {suggestedPriceRange.min.toLocaleString()}-$
                            {suggestedPriceRange.max.toLocaleString()}
                            <span className="ml-1">
                              (median: ${suggestedReward.toLocaleString()})
                            </span>
                          </>
                        ) : (
                          <>Suggested: ${suggestedReward.toLocaleString()}</>
                        )}
                      </p>
                      {priceConfidence !== "low" && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs ${
                            priceConfidence === "high"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {priceConfidence === "high"
                            ? "High confidence"
                            : "Medium confidence"}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {shippingEstimate && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
                      >
                        <Info className="h-3 w-3" />
                        How calculated?
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="start">
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold">
                          Price Breakdown
                        </h4>
                        {priceReasoning && priceDataPoints > 0 && (
                          <div className="rounded bg-slate-50 p-2 text-xs text-slate-600">
                            <p className="mb-1 font-medium">Market Analysis:</p>
                            <p>{priceReasoning}</p>
                            {priceDataPoints > 0 && (
                              <p className="mt-1 text-slate-500">
                                Based on {priceDataPoints} similar{" "}
                                {priceDataPoints === 1 ? "request" : "requests"}
                              </p>
                            )}
                          </div>
                        )}
                        <h5 className="text-xs font-medium text-slate-700">
                          Cost Breakdown
                        </h5>
                        {preferredMethod === "plane" &&
                        shippingEstimate.canTransportByPlane &&
                        shippingEstimate.spareCarryPlanePrice > 0 ? (
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-600">
                                Plane Transport:
                              </span>
                              <span className="font-medium">
                                $
                                {shippingEstimate.spareCarryPlanePrice.toFixed(
                                  2
                                )}
                              </span>
                            </div>
                            {distance && (
                              <div className="pl-2 text-slate-500">
                                • Distance: {distance.toFixed(0)} km
                              </div>
                            )}
                            <div className="pl-2 text-slate-500">
                              • Weight: {weight} kg
                            </div>
                            {shippingEstimate.distanceKm && (
                              <div className="pl-2 text-slate-500">
                                • Distance-based pricing applied
                              </div>
                            )}
                            {shippingEstimate.platformFeePlane > 0 && (
                              <div className="flex justify-between border-t pt-2">
                                <span className="text-slate-600">
                                  Platform Fee:
                                </span>
                                <span className="font-medium">
                                  $
                                  {shippingEstimate.platformFeePlane.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : preferredMethod === "boat" &&
                          shippingEstimate.spareCarryBoatPrice > 0 ? (
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-600">
                                Boat Transport:
                              </span>
                              <span className="font-medium">
                                $
                                {shippingEstimate.spareCarryBoatPrice.toFixed(
                                  2
                                )}
                              </span>
                            </div>
                            {distance && (
                              <div className="pl-2 text-slate-500">
                                • Distance: {distance.toFixed(0)} km
                              </div>
                            )}
                            <div className="pl-2 text-slate-500">
                              • Weight: {weight} kg
                            </div>
                            {shippingEstimate.distanceKm && (
                              <div className="pl-2 text-slate-500">
                                • Distance-based pricing applied
                              </div>
                            )}
                            {shippingEstimate.platformFeeBoat > 0 && (
                              <div className="flex justify-between border-t pt-2">
                                <span className="text-slate-600">
                                  Platform Fee:
                                </span>
                                <span className="font-medium">
                                  ${shippingEstimate.platformFeeBoat.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : shippingEstimate.spareCarryBoatPrice > 0 ? (
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-600">
                                Boat Transport:
                              </span>
                              <span className="font-medium">
                                $
                                {shippingEstimate.spareCarryBoatPrice.toFixed(
                                  2
                                )}
                              </span>
                            </div>
                            {shippingEstimate.canTransportByPlane === false && (
                              <div className="pl-2 text-xs text-amber-600">
                                • Plane not available:{" "}
                                {shippingEstimate.planeRestrictionReason ||
                                  "Restrictions apply"}
                              </div>
                            )}
                            {distance && (
                              <div className="pl-2 text-slate-500">
                                • Distance: {distance.toFixed(0)} km
                              </div>
                            )}
                            <div className="pl-2 text-slate-500">
                              • Weight: {weight} kg
                            </div>
                          </div>
                        ) : null}
                        {shippingEstimate.courierPrice > 0 && (
                          <div className="border-t pt-2 text-xs">
                            <div className="space-y-0.5 text-slate-500">
                              <div>
                                Courier alternative: $
                                {shippingEstimate.courierTotal.toFixed(2)}
                              </div>
                              {shippingEstimate.customsBreakdown &&
                                shippingEstimate.customsCost > 0 && (
                                  <div className="border-l-2 border-slate-300 pl-2 text-xs">
                                    <div>
                                      Shipping: $
                                      {shippingEstimate.courierPrice.toFixed(2)}
                                    </div>
                                    <div>
                                      Duty: $
                                      {shippingEstimate.customsBreakdown.duty.toFixed(
                                        2
                                      )}
                                    </div>
                                    {shippingEstimate.customsBreakdown.tax >
                                      0 && (
                                      <div>
                                        {shippingEstimate.customsBreakdown
                                          .taxName || "Tax"}
                                        : $
                                        {shippingEstimate.customsBreakdown.tax.toFixed(
                                          2
                                        )}
                                      </div>
                                    )}
                                    <div>
                                      Processing: $
                                      {shippingEstimate.customsBreakdown.processingFee.toFixed(
                                        2
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                            {shippingEstimate.savingsBoat > 0 && (
                              <div className="mt-1 font-medium text-teal-600">
                                Save ${shippingEstimate.savingsBoat.toFixed(2)}{" "}
                                (
                                {shippingEstimate.savingsPercentageBoat.toFixed(
                                  0
                                )}
                                %)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}
            <Link
              href={(() => {
                const params = new URLSearchParams();
                if (departurePlace) {
                  params.append("from", departurePlace.name);
                  params.append("fromLat", departurePlace.lat.toString());
                  params.append("fromLon", departurePlace.lon.toString());
                }
                if (arrivalPlace) {
                  params.append("to", arrivalPlace.name);
                  params.append("toLat", arrivalPlace.lat.toString());
                  params.append("toLon", arrivalPlace.lon.toString());
                }
                params.append("weight", (weight || 0).toString());
                params.append("length", (length || 0).toString());
                params.append("width", (width || 0).toString());
                params.append("height", (height || 0).toString());
                params.append("declaredValue", (declaredValue || 0).toString());
                // Include title, description, and category to preserve them
                if (title) params.append("title", title);
                if (description) params.append("description", description);
                if (category) params.append("category", category);
                if (categoryOtherDescription)
                  params.append(
                    "categoryOtherDescription",
                    categoryOtherDescription
                  );
                // Include restricted items flag
                if (restrictedItems) params.append("restricted_items", "true");
                params.append("returnTo", "post-request");
                return `/shipping-estimator?${params.toString()}`;
              })()}
              className="flex items-center gap-1 text-xs text-teal-600 underline hover:text-teal-700"
            >
              <Calculator className="h-3 w-3" />
              Use shipping estimator to suggest price
            </Link>
          </div>
          <input
            id="max_reward"
            type="range"
            min="50"
            max="1000"
            step="10"
            {...register("max_reward", { valueAsNumber: true })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>$50</span>
            <span>$1,000</span>
          </div>
        </div>
      </div>

      {/* Emergency Option */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <input
          id="emergency"
          type="checkbox"
          {...register("emergency")}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
        />
        <div className="flex-1">
          <Label
            htmlFor="emergency"
            className="flex cursor-pointer items-center gap-2 font-medium"
          >
            <AlertCircle className="h-4 w-4 text-amber-600" />
            Emergency – need in &lt;10 days
          </Label>
          <div className="mt-1 flex items-start gap-2">
            <p className="flex-1 text-xs text-slate-600">
              This extra reward helps prioritize your post. Only verified flyers
              within the relevant route/region will be notified.
            </p>
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
                <p className="text-sm">
                  Emergency requests get a tiered percentage bonus added to your
                  base reward, with a maximum cap of $15 extra. Push
                  notifications are sent only to verified flyers who match your
                  route.
                </p>
              </PopoverContent>
            </Popover>
          </div>
          {emergency && maxReward && (
            <div className="mt-2 rounded-md border border-amber-300 bg-white p-2">
              {(() => {
                const pricing = calculateEmergencyPricing(maxReward);
                return (
                  <p className="text-xs text-amber-800">
                    <strong>Emergency Mode Active:</strong> Emergency: +
                    {pricing.bonusPercentage}% → $
                    {pricing.extraAmount.toFixed(2)} extra (total $
                    {pricing.finalReward.toFixed(2)})
                  </p>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Prohibited Items Confirmation - Only for plane requests */}
      {preferredMethod === "plane" && (
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <input
              id="prohibited_items_confirmed"
              type="checkbox"
              {...register("prohibited_items_confirmed")}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
            />
            <Label
              htmlFor="prohibited_items_confirmed"
              className="flex-1 cursor-pointer"
            >
              <span className="font-medium text-amber-900">
                I confirm this shipment does not contain prohibited items for
                this country/route.
              </span>
            </Label>
          </div>
          <div className="flex items-start gap-2 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <p>
              Please check your items against airline and customs regulations.
              SpareCarry is not responsible for prohibited items.
            </p>
          </div>
          {errors.prohibited_items_confirmed && (
            <p className="text-sm text-red-600">
              {errors.prohibited_items_confirmed.message}
            </p>
          )}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-teal-600 hover:bg-teal-700"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Request...
          </>
        ) : (
          "Post Request"
        )}
      </Button>
    </form>
  );
}
