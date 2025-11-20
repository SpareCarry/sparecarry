"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
} from "lucide-react";
import { format } from "date-fns";
import { useLoadScript } from "@react-google-maps/api";
import { PurchaseOptions } from "../purchase/purchase-options";

const postRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  from_location: z.string().min(1, "From location is required"),
  to_location: z.string().min(1, "To location is required"),
  deadline_earliest: z.string().optional(),
  deadline_latest: z.string().min(1, "Deadline is required"),
  preferred_method: z.enum(["plane", "boat", "any"]).default("any"),
  max_reward: z.number().min(50, "Minimum reward is $50"),
  weight_kg: z.number().positive("Weight must be positive"),
  length_cm: z.number().positive("Length must be positive"),
  width_cm: z.number().positive("Width must be positive"),
  height_cm: z.number().positive("Height must be positive"),
  value_usd: z.number().nonnegative().optional(),
  emergency: z.boolean().default(false),
  emergency_days: z.number().optional(), // Days until deadline for emergency
  purchase_retailer: z.enum(["west_marine", "svb", "amazon"]).optional(),
});

type PostRequestFormData = z.infer<typeof postRequestSchema>;

interface PlaceResult {
  description: string;
  place_id: string;
}

export function PostRequestForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [photos, setPhotos] = useState<File[]>([]);
  const [fromPlace, setFromPlace] = useState<PlaceResult | null>(null);
  const [toPlace, setToPlace] = useState<PlaceResult | null>(null);
  const [fromPredictions, setFromPredictions] = useState<PlaceResult[]>([]);
  const [toPredictions, setToPredictions] = useState<PlaceResult[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [suggestedReward, setSuggestedReward] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const fromAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const toAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

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

  // Calculate distance between two places
  const calculateDistance = useCallback(async () => {
    if (!fromPlace || !toPlace || !isLoaded || typeof window === "undefined" || !window.google) return;

    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [fromPlace.description],
        destinations: [toPlace.description],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
      },
      (response: any, status: any) => {
        if (status === "OK" && response?.rows[0]?.elements[0]) {
          const distanceKm = response.rows[0].elements[0].distance.value / 1000;
          setDistance(distanceKm);
          calculateSuggestedReward(distanceKm, weight || 0, preferredMethod);
        }
      }
    );
  }, [fromPlace, toPlace, isLoaded, weight, preferredMethod, calculateSuggestedReward]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!isLoaded || !fromInputRef.current || !toInputRef.current) return;

    if (typeof window !== "undefined" && window.google) {
      fromAutocompleteRef.current = new window.google.maps.places.Autocomplete(
        fromInputRef.current,
        {
          types: ["(cities)"],
          fields: ["formatted_address", "geometry", "place_id"],
        }
      );

      toAutocompleteRef.current = new window.google.maps.places.Autocomplete(
        toInputRef.current,
        {
          types: ["(cities)"],
          fields: ["formatted_address", "geometry", "place_id"],
        }
      );

      fromAutocompleteRef.current.addListener("place_changed", () => {
        const place = fromAutocompleteRef.current?.getPlace();
        if (place?.formatted_address) {
          setFromPlace({
            description: place.formatted_address,
            place_id: place.place_id || "",
          });
          setValue("from_location", place.formatted_address);
          setTimeout(() => calculateDistance(), 100);
        }
      });

      toAutocompleteRef.current.addListener("place_changed", () => {
        const place = toAutocompleteRef.current?.getPlace();
        if (place?.formatted_address) {
          setToPlace({
            description: place.formatted_address,
            place_id: place.place_id || "",
          });
          setValue("to_location", place.formatted_address);
          setTimeout(() => calculateDistance(), 100);
        }
      });
    }

    return () => {
      if (fromAutocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(fromAutocompleteRef.current);
      }
      if (toAutocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(toAutocompleteRef.current);
      }
    };
  }, [isLoaded, setValue, calculateDistance]);

  // Recalculate when weight or method changes
  useEffect(() => {
    if (distance && weight) {
      calculateSuggestedReward(distance, weight, preferredMethod);
    }
  }, [weight, preferredMethod, distance, calculateSuggestedReward]);

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

      // Adjust reward for emergency
      const deadlineDate = new Date(data.deadline_latest);
      const daysUntilDeadline = Math.ceil(
        (deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      
      let finalReward = data.max_reward;
      const isEmergency = data.emergency && daysUntilDeadline < 10;
      
      if (isEmergency) {
        finalReward = Math.round(data.max_reward * 2.5); // 2.5x multiplier for emergency
      }

      const { data: request, error } = await supabase
        .from("requests")
        .insert({
          user_id: user.id,
          title: data.title,
          description: data.description || null,
          from_location: data.from_location,
          to_location: data.to_location,
          deadline_earliest: data.deadline_earliest || null,
          deadline_latest: data.deadline_latest,
          max_reward: finalReward,
          item_photos: photoUrls,
          dimensions_cm: dimensionsJson,
          weight_kg: data.weight_kg,
          value_usd: data.value_usd || null,
          preferred_method: data.preferred_method,
          emergency: isEmergency,
          purchase_retailer: data.purchase_retailer || null,
        })
        .select()
        .single();

      if (error) throw error;

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
      alert(error.message || "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

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

      {/* Photos */}
      <div className="space-y-2">
        <Label>Photos (up to 6)</Label>
        <div className="grid grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(photo)}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover rounded-md border"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {photos.length < 6 && (
            <label className="aspect-square border-2 border-dashed border-slate-300 rounded-md flex items-center justify-center cursor-pointer hover:border-teal-600 transition-colors">
              <Upload className="h-6 w-6 text-slate-400" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                multiple
              />
            </label>
          )}
        </div>
      </div>

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
          {errors.weight_kg && (
            <p className="text-sm text-red-600">{errors.weight_kg.message}</p>
          )}
        </div>
      </div>

      {/* Value */}
      <div className="space-y-2">
        <Label htmlFor="value_usd">Declared Value ($)</Label>
        <Input
          id="value_usd"
          type="number"
          step="0.01"
          {...register("value_usd", { valueAsNumber: true })}
          placeholder="Optional"
          className="bg-white"
        />
      </div>

      {/* From/To Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="from_location">From *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="from_location"
              {...register("from_location", {
                onChange: () => {},
              })}
              ref={(e) => {
                if (e) {
                  (fromInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                }
                const registerRef = register("from_location").ref;
                if (typeof registerRef === "function") {
                  registerRef(e);
                } else if (registerRef) {
                  (registerRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                }
              }}
              placeholder="City or location"
              className="bg-white pl-10"
              autoComplete="off"
            />
          </div>
          {errors.from_location && (
            <p className="text-sm text-red-600">{errors.from_location.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="to_location">To *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="to_location"
              {...register("to_location", {
                onChange: () => {},
              })}
              ref={(e) => {
                if (e) {
                  (toInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                }
                const registerRef = register("to_location").ref;
                if (typeof registerRef === "function") {
                  registerRef(e);
                } else if (registerRef) {
                  (registerRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                }
              }}
              placeholder="City or location"
              className="bg-white pl-10"
              autoComplete="off"
            />
          </div>
          {errors.to_location && (
            <p className="text-sm text-red-600">{errors.to_location.message}</p>
          )}
        </div>
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
          value={preferredMethod}
          onValueChange={(value) => setValue("preferred_method", value as "plane" | "boat" | "any")}
        >
          <SelectTrigger id="preferred_method" className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="plane">
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Plane only
              </div>
            </SelectItem>
            <SelectItem value="boat">
              <div className="flex items-center gap-2">
                <Ship className="h-4 w-4" />
                Boat only
              </div>
            </SelectItem>
            <SelectItem value="any">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Any (cheapest)
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Max Reward */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="max_reward">Max You&apos;re Willing to Pay *</Label>
            <span className="text-sm font-semibold text-teal-600">
              ${maxReward?.toLocaleString() || 0}
            </span>
          </div>
          {suggestedReward > 0 && (
            <p className="text-xs text-slate-500">
              Suggested: ${suggestedReward.toLocaleString()} (based on distance and weight)
            </p>
          )}
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
          <p className="text-xs text-slate-600 mt-1">
            Automatically applies 2.5× reward multiplier and sends push notifications to all verified flyers on this route
          </p>
          {watch("emergency") && (
            <div className="mt-2 p-2 bg-white border border-amber-300 rounded-md">
              <p className="text-xs text-amber-800">
                <strong>Emergency Mode Active:</strong> Your reward will be ${Math.round((watch("max_reward") || 0) * 2.5).toLocaleString()} 
                (2.5× ${(watch("max_reward") || 0).toLocaleString()})
              </p>
            </div>
          )}
        </div>
      </div>

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

