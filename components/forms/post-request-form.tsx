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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
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
import { PurchaseOptions } from "../purchase/purchase-options";
import { Tier1Integration } from "./tier1-integration";
import { PhotoUploader } from "../../modules/tier1Features/photos";
import { useSearchParams } from "next/navigation";
import { LocationFieldGroup } from "../location/LocationFieldGroup";
import { Place } from "../../lib/services/location";
import { calculateEmergencyPricing } from '../../src/utils/emergencyPricing';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Info, Calculator, ArrowRight } from 'lucide-react';
import { SizeTierSelector } from "../ui/size-tier-selector";
import { getSizeTier } from "../../lib/utils/size-tier";
import Link from "next/link";
import { WeightDisplay, DimensionsDisplay } from "../imperial/imperial-display";
import { 
  trackPostCreated, 
  trackRestrictedItemsSelected, 
  trackCategorySelected, 
  trackPhotoUploaded,
  trackEmergencySelected,
  trackBuyShipDirectlySelected 
} from '../../lib/analytics/tracking';

const postRequestSchema = z.object({
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
  preferred_method: z.enum(["plane", "boat", "any", "quickest", "best_fit"]).default("any"),
  max_reward: z.number().min(50, "Minimum reward is $50"),
  weight_kg: z.number().positive("Weight must be positive"),
  length_cm: z.number().positive("Length must be positive"),
  width_cm: z.number().positive("Width must be positive"),
  height_cm: z.number().positive("Height must be positive"),
  size_tier: z.enum(["small", "medium", "large", "extra_large"]).optional(),
  value_usd: z.union([z.number().nonnegative(), z.literal(""), z.null()]).optional().transform((val) => val === "" ? undefined : val),
  restricted_items: z.boolean().default(false), // Restricted goods - only boat transport
  emergency: z.boolean().default(false),
  emergency_days: z.number().optional(), // Days until deadline for emergency
  purchase_retailer: z.enum(["west_marine", "svb", "amazon"]).optional(),
  prohibited_items_confirmed: z.boolean().optional(), // For plane requests only
}).refine((data) => {
  // If restricted_items is true, preferred_method cannot be "plane"
  if (data.restricted_items && data.preferred_method === "plane") {
    return false;
  }
  return true;
}, {
  message: "Restricted items can only be transported by boat",
  path: ["preferred_method"],
}).refine((data) => {
  // prohibited_items_confirmed is required if preferred_method is "plane"
  if (data.preferred_method === "plane" && data.prohibited_items_confirmed !== true) {
    return false;
  }
  return true;
}, {
  message: "You must confirm that your shipment does not contain prohibited items",
  path: ["prohibited_items_confirmed"],
});

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
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
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
  const declaredValue = watch("value_usd");
  const length = watch("length_cm");
  const width = watch("width_cm");
  const height = watch("height_cm");
  const boatEtaDays = undefined; // Not used for requests, only trips
  const restrictedItems = watch("restricted_items") || false;
  const emergency = watch("emergency") || false;

  // Calculate suggested reward
  const calculateSuggestedReward = useCallback((
    distKm: number,
    weightKg: number,
    method: string
  ) => {
    let suggested = 0;
    if (method === "plane") {
      suggested = distKm * 0.8 + weightKg * 5;
      suggested = Math.max(suggested, 100); // Minimum $100
    } else if (method === "boat") {
      suggested = distKm * 0.15 + weightKg * 1;
      suggested = Math.max(suggested, 80); // Minimum $80
    } else {
      // "any" - use the cheaper option (boat)
      const boatPrice = Math.max(distKm * 0.15 + weightKg * 1, 80);
      const planePrice = Math.max(distKm * 0.8 + weightKg * 5, 100);
      suggested = Math.min(boatPrice, planePrice);
    }
    setSuggestedReward(Math.round(suggested));
    setValue("max_reward", Math.round(suggested));
  }, [setValue]);

  // Calculate distance between two places using departure and arrival places
  const calculateDistance = useCallback(async () => {
    if (!departurePlace || !arrivalPlace) return;
    
    // Calculate distance using Haversine formula or use a distance service
    // For now, we'll use a simple approximation or skip distance calculation
    // if places don't have coordinates, distance will remain undefined
    if (departurePlace.lat && departurePlace.lon && arrivalPlace.lat && arrivalPlace.lon) {
      // Haversine formula for distance calculation
      const R = 6371; // Earth's radius in km
      const dLat = (arrivalPlace.lat - departurePlace.lat) * Math.PI / 180;
      const dLon = (arrivalPlace.lon - departurePlace.lon) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(departurePlace.lat * Math.PI / 180) * Math.cos(arrivalPlace.lat * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceKm = R * c;
      setDistance(distanceKm);
      calculateSuggestedReward(distanceKm, weight || 0, preferredMethod);
    }
  }, [departurePlace, arrivalPlace, weight, preferredMethod, calculateSuggestedReward]);


  // Memoize suggested reward calculation to prevent unnecessary recalculations
  const suggestedRewardMemo = useMemo(() => {
    if (distance && weight) {
      let suggested = 0;
      if (preferredMethod === "plane") {
        suggested = distance * 0.8 + weight * 5;
        suggested = Math.max(suggested, 100);
      } else if (preferredMethod === "boat") {
        suggested = distance * 0.15 + weight * 1;
        suggested = Math.max(suggested, 80);
      } else {
        const boatPrice = Math.max(distance * 0.15 + weight * 1, 80);
        const planePrice = Math.max(distance * 0.8 + weight * 5, 100);
        suggested = Math.min(boatPrice, planePrice);
      }
      return Math.round(suggested);
    }
    return 0;
  }, [distance, weight, preferredMethod]);

  // Update suggested reward when memoized value changes
  useEffect(() => {
    if (suggestedRewardMemo > 0) {
      setSuggestedReward(suggestedRewardMemo);
      setValue("max_reward", suggestedRewardMemo);
    }
  }, [suggestedRewardMemo, setValue]);

  // Load prefill data from query params (from shipping estimator)
  // Moved after useForm hook to ensure setValue is available
  useEffect(() => {
    const prefillParam = searchParams?.get('prefill');
    if (prefillParam) {
      try {
        const prefillData = JSON.parse(decodeURIComponent(prefillParam));
        if (prefillData) {
          // Pre-fill form fields
          if (prefillData.from_location) setValue('from_location', prefillData.from_location);
          if (prefillData.to_location) setValue('to_location', prefillData.to_location);
          if (prefillData.length_cm) setValue('length_cm', prefillData.length_cm);
          if (prefillData.width_cm) setValue('width_cm', prefillData.width_cm);
          if (prefillData.height_cm) setValue('height_cm', prefillData.height_cm);
          if (prefillData.weight_kg) setValue('weight_kg', prefillData.weight_kg);
          if (prefillData.value_usd) setValue('value_usd', prefillData.value_usd);
          if (prefillData.max_reward) setValue('max_reward', prefillData.max_reward);
          
          // Store karma points and platform fees for later use (when delivery completes)
          // These are stored in component state but not in form schema
          if (prefillData.karmaPoints) {
            // Store in sessionStorage or component state for later retrieval
            sessionStorage.setItem('estimatedKarmaPoints', prefillData.karmaPoints.toString());
          }
          if (prefillData.platformFeePlane || prefillData.platformFeeBoat) {
            sessionStorage.setItem('estimatedPlatformFee', 
              JSON.stringify({
                plane: prefillData.platformFeePlane || 0,
                boat: prefillData.platformFeeBoat || 0,
              })
            );
          }
          
          // Set places for location inputs
          if (prefillData.from_location) {
            setFromPlace({ description: prefillData.from_location, place_id: '' });
          }
          if (prefillData.to_location) {
            setToPlace({ description: prefillData.to_location, place_id: '' });
          }
        }
      } catch (error) {
        console.warn('Error parsing prefill data:', error);
      }
    }
  }, [searchParams, setValue]);

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
      trackPostCreated('request', photoUrls.length > 0, data.restricted_items || false);
      if (data.category) {
        trackCategorySelected(data.category, data.category === 'other');
      }
      if (photoUrls.length > 0) {
        trackPhotoUploaded(photoUrls.length, 'request');
      }
      if (data.restricted_items) {
        trackRestrictedItemsSelected('request', data.restricted_items ? 'boat' : (data.preferred_method || 'boat'));
      }
      if (isEmergency && emergencyBonusPercentage !== null && emergencyExtraAmount !== null) {
        trackEmergencySelected(data.max_reward, emergencyBonusPercentage, emergencyExtraAmount);
      }
      if (data.purchase_retailer) {
        trackBuyShipDirectlySelected(data.purchase_retailer);
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
          value_usd: data.value_usd && data.value_usd > 0 ? data.value_usd : null,
          preferred_method: data.restricted_items ? "boat" : data.preferred_method, // Force boat if restricted
          size_tier: data.size_tier || getSizeTier(data.weight_kg),
          emergency: isEmergency,
          item_category: data.category || null,
          category_other_description: data.category === "other" ? data.category_other_description || null : null,
          restricted_items: data.restricted_items || false,
          prohibited_items_confirmed: data.preferred_method === "plane" ? (data.prohibited_items_confirmed || false) : null,
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
        onPhotosChange={(newPhotos) => setPhotos(newPhotos.filter((p): p is File => p instanceof File))}
        minPhotos={3}
        maxPhotos={6}
        disabled={loading}
      />

      {/* Dimensions & Weight */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="length_cm">Length (cm) *</Label>
          <Input
            id="length_cm"
            type="number"
            step="0.1"
            {...register("length_cm", { valueAsNumber: true })}
            className="bg-white"
          />
          {watch("length_cm") && (
            <p className="text-xs text-slate-500">
              ≈ {Math.round((watch("length_cm") || 0) / 2.54)} in ({Math.round((watch("length_cm") || 0) / 30.48)} ft {Math.round(((watch("length_cm") || 0) % 30.48) / 2.54)} in)
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
            {...register("width_cm", { valueAsNumber: true })}
            className="bg-white"
          />
          {watch("width_cm") && (
            <p className="text-xs text-slate-500">
              ≈ {Math.round((watch("width_cm") || 0) / 2.54)} in
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
            {...register("height_cm", { valueAsNumber: true })}
            className="bg-white"
          />
          {watch("height_cm") && (
            <p className="text-xs text-slate-500">
              ≈ {Math.round((watch("height_cm") || 0) / 2.54)} in
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
          {watch("weight_kg") && (
            <p className="text-xs text-slate-500">
              <WeightDisplay weightKg={watch("weight_kg") || 0} />
            </p>
          )}
          {errors.weight_kg && (
            <p className="text-sm text-red-600">{errors.weight_kg.message}</p>
          )}
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
            setValueAs: (v: string) => v === "" ? undefined : parseFloat(v)
          })}
          placeholder="Optional"
          className="bg-white"
        />
        <p className="text-xs text-slate-500">Optional - used for insurance purposes</p>
      </div>

      {/* From/To Locations - Enhanced with Location System */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              setFromPlace({ description: place.name, place_id: place.id || "" });
              // Calculate distance when both places are set
              if (arrivalPlace) {
                setTimeout(() => calculateDistance(), 100);
              }
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
              // Calculate distance when both places are set
              if (departurePlace) {
                setTimeout(() => calculateDistance(), 100);
              }
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <p className="text-sm text-red-600">{errors.deadline_latest.message}</p>
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
              setValue("preferred_method", value as "plane" | "boat" | "any" | "quickest" | "best_fit");
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
                {restrictedItems && <span className="text-xs text-red-600 ml-2">(Not available for restricted items)</span>}
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
            Restricted items can only be transported by boat. Transport method is set to &quot;Boat only&quot;.
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
              className="bg-white mt-1"
            />
          </div>
        )}
      </div>


      {/* Restricted Items Checkbox */}
      <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
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
          className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600 mt-0.5"
        />
        <div className="flex-1">
          <Label htmlFor="restricted_items" className="cursor-pointer font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            This item contains restricted goods (lithium batteries, liquids, flammable items, etc.) → Only transport by boat
          </Label>
          <div className="flex items-start gap-2 mt-1">
            <p className="text-xs text-slate-600 flex-1">
              Restricted items cannot be transported by plane due to airline regulations. Selecting this option will automatically set transport method to boat only.
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="text-slate-400 hover:text-slate-600">
                  <Info className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <p className="text-sm">Restricted items include lithium batteries, liquids over 100ml, flammable materials, and other items prohibited by airlines. These can only be transported by boat.</p>
              </PopoverContent>
            </Popover>
          </div>
          {restrictedItems && preferredMethod === "plane" && (
            <div className="mt-2 p-2 bg-white border border-red-300 rounded-md">
              <p className="text-xs text-red-800">
                <strong>Note:</strong> Transport method has been changed to &quot;Boat only&quot; because restricted items cannot be transported by plane.
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
        travelMethod={preferredMethod === "boat" || preferredMethod === "any" ? "boat" : "plane"}
        fromLocation={departurePlace ? { name: departurePlace.name, latitude: departurePlace.lat, longitude: departurePlace.lon } : undefined}
        toLocation={arrivalPlace ? { name: arrivalPlace.name, latitude: arrivalPlace.lat, longitude: arrivalPlace.lon } : undefined}
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
          <div className="flex items-center gap-2">
            {suggestedReward > 0 && (
              <p className="text-xs text-slate-500">
                Suggested: ${suggestedReward.toLocaleString()} (based on distance and weight)
              </p>
            )}
            {departurePlace && arrivalPlace && (
              <Link
                href={`/shipping-estimator?from=${encodeURIComponent(departurePlace.name)}&to=${encodeURIComponent(arrivalPlace.name)}&weight=${watch("weight_kg") || 0}&length=${watch("length_cm") || 0}&width=${watch("width_cm") || 0}&height=${watch("height_cm") || 0}`}
                className="text-xs text-teal-600 hover:text-teal-700 underline flex items-center gap-1"
              >
                <Calculator className="h-3 w-3" />
                Get suggested price
              </Link>
            )}
          </div>
          <input
            id="max_reward"
            type="range"
            min="50"
            max="10000"
            step="10"
            {...register("max_reward", { valueAsNumber: true })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>$50</span>
            <span>$10,000</span>
          </div>
        </div>
      </div>

      {/* Purchase Options */}
      <PurchaseOptions
        itemTitle={watch("title") || ""}
        itemDescription={watch("description")}
        selectedRetailer={watch("purchase_retailer") || null}
        onSelectRetailer={(retailer) => {
          setValue("purchase_retailer", retailer || undefined);
        }}
      />

      {/* Emergency Option */}
      <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <input
          id="emergency"
          type="checkbox"
          {...register("emergency")}
          className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600 mt-0.5"
        />
        <div className="flex-1">
          <Label htmlFor="emergency" className="cursor-pointer font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            Emergency – need in &lt;10 days
          </Label>
          <div className="flex items-start gap-2 mt-1">
            <p className="text-xs text-slate-600 flex-1">
              This extra reward helps prioritize your post. Only verified flyers within the relevant route/region will be notified.
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="text-slate-400 hover:text-slate-600">
                  <Info className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <p className="text-sm">Emergency requests get a tiered percentage bonus added to your base reward, with a maximum cap of $15 extra. Push notifications are sent only to verified flyers who match your route.</p>
              </PopoverContent>
            </Popover>
          </div>
          {emergency && maxReward && (
            <div className="mt-2 p-2 bg-white border border-amber-300 rounded-md">
              {(() => {
                const pricing = calculateEmergencyPricing(maxReward);
                return (
                  <p className="text-xs text-amber-800">
                    <strong>Emergency Mode Active:</strong> Emergency: +{pricing.bonusPercentage}% → ${pricing.extraAmount.toFixed(2)} extra (total ${pricing.finalReward.toFixed(2)})
                  </p>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Prohibited Items Confirmation - Only for plane requests */}
      {preferredMethod === "plane" && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
          <div className="flex items-start gap-2">
            <input
              id="prohibited_items_confirmed"
              type="checkbox"
              {...register("prohibited_items_confirmed")}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600 mt-0.5"
            />
            <Label htmlFor="prohibited_items_confirmed" className="cursor-pointer flex-1">
              <span className="font-medium text-amber-900">
                I confirm this shipment does not contain prohibited items for this country/route.
              </span>
            </Label>
          </div>
          <div className="flex items-start gap-2 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p>
              Please check your items against airline and customs regulations. SpareCarry is not responsible for prohibited items.
            </p>
          </div>
          {errors.prohibited_items_confirmed && (
            <p className="text-sm text-red-600">{errors.prohibited_items_confirmed.message}</p>
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

