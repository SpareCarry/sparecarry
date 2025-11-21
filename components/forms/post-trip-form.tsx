"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
import { createClient } from "../../lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Plane,
  Ship,
  Check,
  ChevronDown,
  Search,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { popularPorts, searchPorts } from "../../lib/data/ports";
import { cn } from "../../lib/utils";
import { LithiumWarningModal } from "../modals/lithium-warning-modal";

const planeTripSchema = z.object({
  type: z.literal("plane"),
  flight_number: z.string().optional(),
  from_airport: z.string().optional(),
  to_airport: z.string().optional(),
  departure_date: z.string().min(1, "Departure date is required"),
  spare_kg: z.number().min(0).max(32, "Maximum 32kg for carry-on"),
  spare_volume_liters: z.number().min(0).optional(),
  max_length_cm: z.number().positive("Length must be positive"),
  max_width_cm: z.number().positive("Width must be positive"),
  max_height_cm: z.number().positive("Height must be positive"),
  can_take_lithium_batteries: z.boolean().default(false),
});

const boatTripSchema = z.object({
  type: z.literal("boat"),
  from_location: z.string().min(1, "From port is required"),
  to_location: z.string().min(1, "To port is required"),
  eta_window_start: z.string().min(1, "ETA start date is required"),
  eta_window_end: z.string().min(1, "ETA end date is required"),
  spare_kg: z.number().positive("Spare capacity is required"),
  spare_volume_liters: z.number().min(0).optional(),
  can_take_outboard: z.boolean().default(false),
  can_take_spar: z.boolean().default(false),
  can_take_dinghy: z.boolean().default(false),
  can_oversize: z.boolean().default(false),
  can_take_hazardous: z.boolean().default(false),
});

const tripSchema = z.discriminatedUnion("type", [planeTripSchema, boatTripSchema]);

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
            "w-full flex items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            error && "border-red-500"
          )}
        >
          <span className={cn(selectedPort ? "text-slate-900" : "text-slate-500")}>
            {selectedPort ? `${selectedPort.name}, ${selectedPort.country}` : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search ports..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8 bg-white"
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
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 rounded-md flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-slate-900">{port.name}</div>
                        <div className="text-xs text-slate-500">{port.country}</div>
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
  const supabase = createClient();
  const [tripType, setTripType] = useState<"plane" | "boat" | null>(null);
  const [loading, setLoading] = useState(false);
  const [useManualAirports, setUseManualAirports] = useState(false);
  const [showLithiumWarning, setShowLithiumWarning] = useState(false);
  const [pendingLithiumCheck, setPendingLithiumCheck] = useState(false);

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
      can_take_lithium_batteries: false,
    } as TripFormData,
  });

  const watchedType = watch("type");

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
        // Calculate ETA window for plane (same day as departure)
        const departureDate = new Date(data.departure_date);
        const etaStart = format(departureDate, "yyyy-MM-dd'T'HH:mm:ss");
        const etaEnd = format(
          new Date(departureDate.getTime() + 24 * 60 * 60 * 1000),
          "yyyy-MM-dd'T'HH:mm:ss"
        );

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
            from_location: useManualAirports
              ? data.from_airport || ""
              : data.flight_number
              ? `Flight ${data.flight_number}`
              : "Airport",
            to_location: useManualAirports ? data.to_airport || "" : "Destination",
            flight_number: data.flight_number || null,
            departure_date: data.departure_date,
            eta_window_start: etaStart,
            eta_window_end: etaEnd,
            spare_kg: data.spare_kg,
            spare_volume_liters: data.spare_volume_liters || 0,
            max_dimensions: maxDimensions,
            can_oversize: false, // Planes have strict size limits
          })
          .select()
          .single();

        if (error) throw error;
        tripData = insertedTrip;
      } else {
        // Boat trip
        const { data: insertedTrip, error } = await supabase
          .from("trips")
          .insert({
            user_id: user.id,
            type: "boat",
            from_location: data.from_location,
            to_location: data.to_location,
            departure_date: data.eta_window_start, // Use ETA start as departure
            eta_window_start: data.eta_window_start,
            eta_window_end: data.eta_window_end,
            spare_kg: data.spare_kg,
            spare_volume_liters: data.spare_volume_liters || 0,
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

      // Redirect to browse page
      router.push("/home");
    } catch (error) {
      console.error("Error creating trip:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create trip";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  if (!tripType) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          How are you traveling?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-teal-600"
            onClick={() => {
              setTripType("plane");
              reset({
                type: "plane",
                can_take_lithium_batteries: false,
              });
            }}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Plane className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-lg">✈ Plane</h4>
                <p className="text-sm text-slate-600">
                  I&apos;m flying and can carry items
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-teal-600"
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
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
                  <Ship className="h-8 w-8 text-teal-600" />
                </div>
                <h4 className="font-semibold text-lg">⚓ Boat</h4>
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
            can_take_lithium_batteries: false,
          });
        }}
        className="mb-4"
      >
        ← Change travel type
      </Button>

      {tripType === "plane" && (
        <>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Plane className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Plane Trip Details</h3>
            </div>

            {/* Flight number or manual airports */}
            <div className="space-y-2">
              <Label>Enter flight details</Label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  id="flight-number"
                  checked={!useManualAirports}
                  onChange={() => setUseManualAirports(false)}
                  className="h-4 w-4"
                />
                <Label htmlFor="flight-number" className="cursor-pointer">
                  Flight number
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="manual-airports"
                  checked={useManualAirports}
                  onChange={() => setUseManualAirports(true)}
                  className="h-4 w-4"
                />
                <Label htmlFor="manual-airports" className="cursor-pointer">
                  Manual airports
                </Label>
              </div>
            </div>

            {!useManualAirports ? (
              <div className="space-y-2">
                <Label htmlFor="flight_number">Flight Number</Label>
                <Input
                  id="flight_number"
                  {...register("flight_number")}
                  placeholder="e.g., AA1234"
                  className="bg-white"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from_airport">From Airport</Label>
                  <Input
                    id="from_airport"
                    {...register("from_airport")}
                    placeholder="e.g., MIA"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to_airport">To Airport</Label>
                  <Input
                    id="to_airport"
                    {...register("to_airport")}
                    placeholder="e.g., SXM"
                    className="bg-white"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="departure_date">Departure Date *</Label>
              <Input
                id="departure_date"
                type="date"
                {...register("departure_date")}
                min={format(new Date(), "yyyy-MM-dd")}
                className="bg-white"
              />
               {watchedType === "plane" && "departure_date" in errors && errors.departure_date && (
                 <p className="text-sm text-red-600">{errors.departure_date.message}</p>
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
                  <p className="text-sm text-red-600">{errors.spare_kg.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="spare_volume_liters">Spare Volume (liters)</Label>
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

            <div className="flex items-center gap-2">
              <input
                id="can_take_lithium_batteries"
                type="checkbox"
                {...register("can_take_lithium_batteries")}
                onChange={(e) => {
                  if (e.target.checked) {
                    setPendingLithiumCheck(true);
                    setShowLithiumWarning(true);
                  } else {
                    setValue("can_take_lithium_batteries", false);
                  }
                }}
                checked={watch("can_take_lithium_batteries")}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
              />
              <Label htmlFor="can_take_lithium_batteries" className="cursor-pointer">
                Can take lithium batteries
              </Label>
            </div>
          </div>
        </>
      )}

      {tripType === "boat" && (
        <>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Ship className="h-5 w-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-slate-900">Boat Trip Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PortSelect
                value={watch("from_location") || ""}
                onChange={(value) => setValue("from_location", value)}
                placeholder="Select from port"
                label="From Port *"
                 error={watchedType === "boat" && "from_location" in errors ? errors.from_location?.message : undefined}
              />
              <PortSelect
                value={watch("to_location") || ""}
                onChange={(value) => setValue("to_location", value)}
                placeholder="Select to port"
                label="To Port *"
                error={watchedType === "boat" && "to_location" in errors ? errors.to_location?.message : undefined}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eta_window_start">ETA Window Start *</Label>
                <Input
                  id="eta_window_start"
                  type="date"
                  {...register("eta_window_start")}
                  min={format(new Date(), "yyyy-MM-dd")}
                  className="bg-white"
                />
                {watchedType === "boat" && "eta_window_start" in errors && errors.eta_window_start && (
                  <p className="text-sm text-red-600">{errors.eta_window_start.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="eta_window_end">ETA Window End *</Label>
                <Input
                  id="eta_window_end"
                  type="date"
                  {...register("eta_window_end")}
                  min={watch("eta_window_start") || format(new Date(), "yyyy-MM-dd")}
                  className="bg-white"
                />
                {watchedType === "boat" && "eta_window_end" in errors && errors.eta_window_end && (
                  <p className="text-sm text-red-600">{errors.eta_window_end.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spare_kg">Max Tonnage (kg) *</Label>
                <Input
                  id="spare_kg"
                  type="number"
                  step="0.1"
                  min="0"
                  {...register("spare_kg", { valueAsNumber: true })}
                  className="bg-white"
                />
                {errors.spare_kg && (
                  <p className="text-sm text-red-600">{errors.spare_kg.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="spare_volume_liters">Spare Cubic Meters (optional)</Label>
                <Input
                  id="spare_volume_liters"
                  type="number"
                  step="0.1"
                  min="0"
                  {...register("spare_volume_liters", { valueAsNumber: true })}
                  placeholder="m³"
                  className="bg-white"
                />
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
                  <Label htmlFor="can_take_outboard" className="cursor-pointer text-sm">
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
                  <Label htmlFor="can_take_spar" className="cursor-pointer text-sm">
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
                  <Label htmlFor="can_take_dinghy" className="cursor-pointer text-sm">
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
                  <Label htmlFor="can_oversize" className="cursor-pointer text-sm">
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
                  <Label htmlFor="can_take_hazardous" className="cursor-pointer text-sm">
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

