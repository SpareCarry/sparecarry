"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Plane,
  Ship,
  Check,
  ChevronDown,
  Search,
  MapPin,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { popularPorts, searchPorts } from "../../lib/data/ports";
import { cn } from "../../lib/utils";
import { LithiumWarningModal } from "../modals/lithium-warning-modal";
import { LocationFieldGroup } from "../location/LocationFieldGroup";
import { Place } from "../../lib/services/location";
import { AlertCircle } from "lucide-react";
import {
  trackPostCreated,
  trackLocationSelected,
} from "../../lib/analytics/tracking";
import { useToastNotification } from "../../lib/hooks/use-toast-notification";

const planeTripSchema = z.object({
  type: z.literal("plane"),
  from_location: z.string().min(1, "Departure location is required"),
  to_location: z.string().min(1, "Arrival location is required"),
  departure_date: z.string().min(1, "Departure date is required"),
  arrival_date: z.string().min(1, "Arrival date is required"),
  departure_lat: z.number().nullable().optional(),
  departure_lon: z.number().nullable().optional(),
  departure_category: z.string().nullable().optional(),
  arrival_lat: z.number().nullable().optional(),
  arrival_lon: z.number().nullable().optional(),
  arrival_category: z.string().nullable().optional(),
  spare_kg: z.number().min(0).max(32, "Maximum 32kg for carry-on"),
  spare_volume_liters: z.number().min(0).optional(),
  max_length_cm: z.number().positive("Length must be positive"),
  max_width_cm: z.number().positive("Width must be positive"),
  max_height_cm: z.number().positive("Height must be positive"),
  prohibited_items_confirmed: z.boolean().refine((val) => val === true, {
    message: "You must confirm that you are not carrying prohibited items",
    path: ["prohibited_items_confirmed"],
  }),
});

const boatTripSchema = z.object({
  type: z.literal("boat"),
  from_location: z.string().min(1, "From port is required"),
  to_location: z.string().min(1, "To port is required"),
  eta_window_start: z.string().min(1, "ETA start date is required"),
  eta_window_end: z.string().min(1, "ETA end date is required"),
  departure_lat: z.number().nullable().optional(),
  departure_lon: z.number().nullable().optional(),
  departure_category: z.string().nullable().optional(),
  arrival_lat: z.number().nullable().optional(),
  arrival_lon: z.number().nullable().optional(),
  arrival_category: z.string().nullable().optional(),
  spare_kg: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().positive("Spare capacity must be positive").optional()),
  spare_volume_liters: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().min(0).optional()),
  can_take_outboard: z.boolean().default(false),
  can_take_spar: z.boolean().default(false),
  can_take_dinghy: z.boolean().default(false),
  can_oversize: z.boolean().default(false),
  can_take_hazardous: z.boolean().default(false),
});

const tripSchema = z.discriminatedUnion("type", [
  planeTripSchema,
  boatTripSchema,
]);

type TripFormData = z.infer<typeof tripSchema>;

interface PortOption {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

function PortSelect({
  value,
  onChange,
  placeholder,
  label,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  error?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredPorts, setFilteredPorts] = useState<PortOption[]>(
    popularPorts.slice(0, 20)
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilteredPorts(searchPorts(query));
  };

  const selectedPort = popularPorts.find((p) => p.name === value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            error && "border-red-500"
          )}
        >
          <span
            className={cn(selectedPort ? "text-slate-900" : "text-slate-500")}
          >
            {selectedPort
              ? `${selectedPort.name}, ${selectedPort.country}`
              : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
              <div className="sticky top-0 border-b border-slate-200 bg-white p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search ports..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="bg-white pl-8"
                    autoFocus
                  />
                </div>
              </div>
              <div className="p-1">
                {filteredPorts.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-500">
                    No ports found
                  </div>
                ) : (
                  filteredPorts.map((port) => (
                    <button
                      key={`${port.name}-${port.country}`}
                      type="button"
                      onClick={() => {
                        onChange(port.name);
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                    >
                      <div>
                        <div className="font-medium text-slate-900">
                          {port.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {port.country}
                        </div>
                      </div>
                      {value === port.name && (
                        <Check className="h-4 w-4 text-teal-600" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function PostTripForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient() as SupabaseClient;
  const toast = useToastNotification();
  const [tripType, setTripType] = useState<"plane" | "boat" | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLithiumWarning, setShowLithiumWarning] = useState(false);
  const [pendingLithiumCheck, setPendingLithiumCheck] = useState(false);
  const [departurePlace, setDeparturePlace] = useState<Place | null>(null);
  const [arrivalPlace, setArrivalPlace] = useState<Place | null>(null);

  // Location place states for boat trips
  const [boatFromPlace, setBoatFromPlace] = useState<Place | null>(null);
  const [boatToPlace, setBoatToPlace] = useState<Place | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      type: "plane",
      prohibited_items_confirmed: false,
    } as TripFormData,
  });

  const watchedType = watch("type");

  // Boat location place handlers
  useEffect(() => {
    // Sync boatFromPlace and boatToPlace with form values if they're set
    if (boatFromPlace && boatFromPlace.name) {
      setValue("from_location", boatFromPlace.name);
      setValue("departure_lat", boatFromPlace.lat);
      setValue("departure_lon", boatFromPlace.lon);
      setValue("departure_category", boatFromPlace.category || null);
    }
    if (boatToPlace && boatToPlace.name) {
      setValue("to_location", boatToPlace.name);
      setValue("arrival_lat", boatToPlace.lat);
      setValue("arrival_lon", boatToPlace.lon);
      setValue("arrival_category", boatToPlace.category || null);
    }
  }, [boatFromPlace, boatToPlace, setValue]);

  const onSubmit = async (data: TripFormData) => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      let tripData: { id: string } | null = null;

      if (data.type === "plane") {
        // Calculate ETA window for plane (from departure to arrival date)
        const departureDate = new Date(data.departure_date);
        const arrivalDate = new Date(data.arrival_date);
        const etaStart = format(departureDate, "yyyy-MM-dd'T'HH:mm:ss");
        const etaEnd = format(arrivalDate, "yyyy-MM-dd'T'HH:mm:ss");

        const maxDimensions = JSON.stringify({
          length_cm: data.max_length_cm,
          width_cm: data.max_width_cm,
          height_cm: data.max_height_cm,
        });

        const { data: insertedTrip, error } = await supabase
          .from("trips")
          .insert({
            user_id: user.id,
            type: "plane",
            from_location: data.from_location,
            to_location: data.to_location,
            departure_date: data.departure_date,
            arrival_date: data.arrival_date,
            departure_lat: data.departure_lat,
            departure_lon: data.departure_lon,
            departure_category: data.departure_category,
            arrival_lat: data.arrival_lat,
            arrival_lon: data.arrival_lon,
            arrival_category: data.arrival_category,
            flight_number: null, // No longer used
            eta_window_start: etaStart,
            eta_window_end: etaEnd,
            spare_kg: data.spare_kg,
            spare_volume_liters: data.spare_volume_liters || 0,
            max_dimensions: maxDimensions,
            can_oversize: false, // Planes have strict size limits
            prohibited_items_confirmed: data.prohibited_items_confirmed,
          })
          .select()
          .single();

        if (error) throw error;
        tripData = insertedTrip;

        // Track analytics
        trackPostCreated("trip", false, false);
      } else {
        // Boat trip - use boatFromPlace and boatToPlace for coordinates if available
        const { data: insertedTrip, error } = await supabase
          .from("trips")
          .insert({
            user_id: user.id,
            type: "boat",
            from_location: data.from_location,
            to_location: data.to_location,
            departure_date: data.eta_window_start, // Use ETA start as departure
            departure_lat: boatFromPlace?.lat || data.departure_lat || null,
            departure_lon: boatFromPlace?.lon || data.departure_lon || null,
            departure_category:
              boatFromPlace?.category || data.departure_category || null,
            arrival_lat: boatToPlace?.lat || data.arrival_lat || null,
            arrival_lon: boatToPlace?.lon || data.arrival_lon || null,
            arrival_category:
              boatToPlace?.category || data.arrival_category || null,
            eta_window_start: data.eta_window_start,
            eta_window_end: data.eta_window_end,
            spare_kg: data.spare_kg || null,
            spare_volume_liters: data.spare_volume_liters || null,
            max_dimensions: null, // Boats are more flexible
            can_oversize:
              data.can_oversize ||
              data.can_take_outboard ||
              data.can_take_spar ||
              data.can_take_dinghy,
          })
          .select()
          .single();

        if (error) throw error;
        tripData = insertedTrip;

        // Track analytics
        trackPostCreated("trip", false, false);
      }

      // Trigger auto-matching
      if (tripData) {
        await fetch("/api/matches/auto-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: data.type, id: tripData.id }),
        });
      }

      // Invalidate feed query to refresh
      queryClient.invalidateQueries({ queryKey: ["feed"] });

      // Show success message
      toast.showFormSuccess("Trip posted");
      
      // Redirect to browse page
      router.push("/home");
    } catch (error) {
      console.error("Error creating trip:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create trip";
      toast.showFormError("create trip", message);
    } finally {
      setLoading(false);
    }
  };

  if (!tripType) {
    return (
      <div className="space-y-4">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          How are you traveling?
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card
            className="cursor-pointer border-2 border-transparent transition-shadow hover:border-teal-600 hover:shadow-lg"
            onClick={() => {
              setTripType("plane");
              reset({
                type: "plane",
                prohibited_items_confirmed: false,
              });
            }}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <Plane className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold">✈ Plane</h4>
                <p className="text-sm text-slate-600">
                  I&apos;m flying and can carry items
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border-2 border-transparent transition-shadow hover:border-teal-600 hover:shadow-lg"
            onClick={() => {
              setTripType("boat");
              const startDate = format(new Date(), "yyyy-MM-dd");
              const endDate = format(addDays(new Date(), 60), "yyyy-MM-dd");
              reset({
                type: "boat",
                eta_window_start: startDate,
                eta_window_end: endDate,
                can_take_outboard: false,
                can_take_spar: false,
                can_take_dinghy: false,
                can_oversize: false,
                can_take_hazardous: false,
              });
            }}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                  <Ship className="h-8 w-8 text-teal-600" />
                </div>
                <h4 className="text-lg font-semibold">⚓ Boat</h4>
                <p className="text-sm text-slate-600">
                  I&apos;m sailing and can carry items
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Back button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setTripType(null);
          reset({
            type: "plane",
            prohibited_items_confirmed: false,
          });
        }}
        className="mb-4"
      >
        ← Change travel type
      </Button>

      {tripType === "plane" && (
        <>
          <div className="space-y-4">
            <div className="mb-4 flex items-center gap-2">
              <Plane className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                Plane Trip Details
              </h3>
            </div>

            {/* Departure Location */}
            <LocationFieldGroup
              label="Departure Location"
              inputId="trip_departure_location"
              inputName="trip_departure_location"
              placeholder="Search departure airport or city..."
              value={departurePlace}
              onChange={(place) => {
                setDeparturePlace(place);
                if (place) {
                  setValue("from_location", place.name);
                  setValue("departure_lat", place.lat);
                  setValue("departure_lon", place.lon);
                  setValue("departure_category", place.category || null);
                } else {
                  setValue("from_location", "");
                  setValue("departure_lat", null);
                  setValue("departure_lon", null);
                  setValue("departure_category", null);
                }
              }}
              required
              error={
                watchedType === "plane" && "from_location" in errors
                  ? errors.from_location?.message
                  : undefined
              }
              showOnlyMarinas={false}
              showMapPreview={true}
              showCurrentLocation={true}
              showMapPicker={true}
            />

            {/* Arrival Location */}
            <LocationFieldGroup
              label="Arrival Location"
              inputId="trip_arrival_location"
              inputName="trip_arrival_location"
              placeholder="Search arrival airport or city..."
              value={arrivalPlace}
              onChange={(place) => {
                setArrivalPlace(place);
                if (place) {
                  setValue("to_location", place.name);
                  setValue("arrival_lat", place.lat);
                  setValue("arrival_lon", place.lon);
                  setValue("arrival_category", place.category || null);
                } else {
                  setValue("to_location", "");
                  setValue("arrival_lat", null);
                  setValue("arrival_lon", null);
                  setValue("arrival_category", null);
                }
              }}
              required
              error={
                watchedType === "plane" && "to_location" in errors
                  ? errors.to_location?.message
                  : undefined
              }
              showOnlyMarinas={false}
              showMapPreview={true}
              showCurrentLocation={true}
              showMapPicker={true}
            />

            {/* Departure Date */}
            <div className="space-y-2">
              <Label htmlFor="departure_date">Departure Date *</Label>
              <Input
                id="departure_date"
                type="date"
                {...register("departure_date")}
                min={format(new Date(), "yyyy-MM-dd")}
                className="bg-white"
              />
              {watchedType === "plane" &&
                "departure_date" in errors &&
                errors.departure_date && (
                  <p className="text-sm text-red-600">
                    {errors.departure_date.message}
                  </p>
                )}
            </div>

            {/* Arrival Date */}
            <div className="space-y-2">
              <Label htmlFor="arrival_date">Arrival Date *</Label>
              <Input
                id="arrival_date"
                type="date"
                {...register("arrival_date")}
                min={
                  watch("departure_date") || format(new Date(), "yyyy-MM-dd")
                }
                className="bg-white"
              />
              {watchedType === "plane" &&
                "arrival_date" in errors &&
                errors.arrival_date && (
                  <p className="text-sm text-red-600">
                    {errors.arrival_date.message}
                  </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spare_kg">Spare Weight (kg) *</Label>
                <Input
                  id="spare_kg"
                  type="number"
                  step="0.1"
                  min="0"
                  max="32"
                  {...register("spare_kg", { valueAsNumber: true })}
                  className="bg-white"
                />
                <p className="text-xs text-slate-500">Max 32kg for carry-on</p>
                {errors.spare_kg && (
                  <p className="text-sm text-red-600">
                    {errors.spare_kg.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="spare_volume_liters">
                  Spare Volume (liters)
                </Label>
                <Input
                  id="spare_volume_liters"
                  type="number"
                  step="0.1"
                  min="0"
                  {...register("spare_volume_liters", { valueAsNumber: true })}
                  placeholder="For liquids"
                  className="bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Max Dimensions (cm) *</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="max_length_cm" className="text-xs">
                    Length
                  </Label>
                  <Input
                    id="max_length_cm"
                    type="number"
                    step="0.1"
                    {...register("max_length_cm", { valueAsNumber: true })}
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="max_width_cm" className="text-xs">
                    Width
                  </Label>
                  <Input
                    id="max_width_cm"
                    type="number"
                    step="0.1"
                    {...register("max_width_cm", { valueAsNumber: true })}
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="max_height_cm" className="text-xs">
                    Height
                  </Label>
                  <Input
                    id="max_height_cm"
                    type="number"
                    step="0.1"
                    {...register("max_height_cm", { valueAsNumber: true })}
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

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
                    I confirm I am not transporting prohibited items for this
                    route.
                  </span>
                </Label>
              </div>
              <div className="flex items-start gap-2 text-sm text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <p>
                  Airlines and customs agencies enforce strict rules.
                  Double-check your cargo to avoid seizures, fines, or legal
                  issues.
                </p>
              </div>
              {"prohibited_items_confirmed" in errors &&
                errors.prohibited_items_confirmed && (
                  <p className="text-sm text-red-600">
                    {errors.prohibited_items_confirmed.message}
                  </p>
                )}
            </div>
          </div>
        </>
      )}

      {tripType === "boat" && (
        <>
          <div className="space-y-4">
            <div className="mb-4 flex items-center gap-2">
              <Ship className="h-5 w-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                Boat Trip Details
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <LocationFieldGroup
                label="From Port"
                inputId="boat_from_location"
                inputName="boat_from_location"
                placeholder="Search port or city..."
                value={boatFromPlace}
                onChange={(place) => {
                  setBoatFromPlace(place);
                  trackLocationSelected("autocomplete", "departure");
                }}
                required
                error={
                  watchedType === "boat" && "from_location" in errors
                    ? errors.from_location?.message
                    : undefined
                }
                showOnlyMarinas={true}
                showMapPreview={true}
                showCurrentLocation={true}
                showMapPicker={true}
              />
              <LocationFieldGroup
                label="To Port"
                inputId="boat_to_location"
                inputName="boat_to_location"
                placeholder="Search port or city..."
                value={boatToPlace}
                onChange={(place) => {
                  setBoatToPlace(place);
                  trackLocationSelected("autocomplete", "arrival");
                }}
                required
                error={
                  watchedType === "boat" && "to_location" in errors
                    ? errors.to_location?.message
                    : undefined
                }
                showOnlyMarinas={true}
                showMapPreview={true}
                showCurrentLocation={true}
                showMapPicker={true}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eta_window_start">ETA Window Start *</Label>
                <Input
                  id="eta_window_start"
                  type="date"
                  {...register("eta_window_start")}
                  min={format(new Date(), "yyyy-MM-dd")}
                  className="bg-white"
                />
                {watchedType === "boat" &&
                  "eta_window_start" in errors &&
                  errors.eta_window_start && (
                    <p className="text-sm text-red-600">
                      {errors.eta_window_start.message}
                    </p>
                  )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="eta_window_end">ETA Window End *</Label>
                <Input
                  id="eta_window_end"
                  type="date"
                  {...register("eta_window_end")}
                  min={
                    watch("eta_window_start") ||
                    format(new Date(), "yyyy-MM-dd")
                  }
                  className="bg-white"
                />
                {watchedType === "boat" &&
                  "eta_window_end" in errors &&
                  errors.eta_window_end && (
                    <p className="text-sm text-red-600">
                      {errors.eta_window_end.message}
                    </p>
                  )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spare_kg">Max Tonnage (kg)</Label>
                <Input
                  id="spare_kg"
                  type="number"
                  step="0.1"
                  min="0"
                  {...register("spare_kg", {
                    valueAsNumber: true,
                    setValueAs: (v) =>
                      v === "" || isNaN(Number(v)) ? undefined : Number(v),
                  })}
                  className="bg-white"
                />
                {Number.isFinite(watch("spare_kg")) &&
                  watch("spare_kg")! > 0 && (
                    <p className="text-xs text-slate-500">
                      ≈ {Math.round(watch("spare_kg")! * 2.20462)} lbs
                    </p>
                  )}
                {errors.spare_kg && (
                  <p className="text-sm text-red-600">
                    {errors.spare_kg.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="spare_volume_liters">Spare Cubic Meters</Label>
                <Input
                  id="spare_volume_liters"
                  type="number"
                  step="0.1"
                  min="0"
                  {...register("spare_volume_liters", {
                    valueAsNumber: true,
                    setValueAs: (v) =>
                      v === "" || isNaN(Number(v)) ? undefined : Number(v),
                  })}
                  placeholder="m³"
                  className="bg-white"
                />
                {Number.isFinite(watch("spare_volume_liters")) &&
                  watch("spare_volume_liters")! > 0 && (
                    <p className="text-xs text-slate-500">
                      ≈ {watch("spare_volume_liters")!.toFixed(2)} m³ (
                      {Math.round(watch("spare_volume_liters")! * 35.3147)} ft³)
                    </p>
                  )}
              </div>
            </div>

            <div className="space-y-3">
              <Label>What can you carry?</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <input
                    id="can_take_outboard"
                    type="checkbox"
                    {...register("can_take_outboard")}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                  />
                  <Label
                    htmlFor="can_take_outboard"
                    className="cursor-pointer text-sm"
                  >
                    Outboard motors
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="can_take_spar"
                    type="checkbox"
                    {...register("can_take_spar")}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                  />
                  <Label
                    htmlFor="can_take_spar"
                    className="cursor-pointer text-sm"
                  >
                    Spars/masts
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="can_take_dinghy"
                    type="checkbox"
                    {...register("can_take_dinghy")}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                  />
                  <Label
                    htmlFor="can_take_dinghy"
                    className="cursor-pointer text-sm"
                  >
                    Dinghies
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="can_oversize"
                    type="checkbox"
                    {...register("can_oversize")}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                  />
                  <Label
                    htmlFor="can_oversize"
                    className="cursor-pointer text-sm"
                  >
                    Oversized items
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="can_take_hazardous"
                    type="checkbox"
                    {...register("can_take_hazardous")}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                  />
                  <Label
                    htmlFor="can_take_hazardous"
                    className="cursor-pointer text-sm"
                  >
                    Hazardous materials
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Button
        type="submit"
        className="w-full bg-teal-600 hover:bg-teal-700"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Trip...
          </>
        ) : (
          "Post Trip"
        )}
      </Button>
    </form>
  );
}
