/**
 * Locations Section Component
 * 
 * Handles from/to locations and deadline selection
 */

"use client";

import { Label } from "../../ui/label";
import { LocationFieldGroup } from "../../location/LocationFieldGroup";
import { Place } from "../../../lib/services/location";
import type { LocationsSectionProps } from "./types";
import { DEADLINE_URGENCY_OPTIONS } from "./constants";

export function LocationsSection({
  register,
  errors,
  watch,
  setValue,
  departurePlace,
  arrivalPlace,
  onDeparturePlaceChange,
  onArrivalPlaceChange,
  distance,
  deadlineUrgency,
  onDeadlineUrgencyChange,
}: LocationsSectionProps) {
  return (
    <>
      {/* From/To Locations - Enhanced with Location System */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <LocationFieldGroup
          label="Departure Location"
          inputId="from_location"
          inputName="from_location"
          placeholder="Departing from..."
          value={departurePlace}
          onChange={onDeparturePlaceChange}
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
          onChange={onArrivalPlaceChange}
          showOnlyMarinas={false}
          allowFallbackToAny={true}
          showMapPreview={true}
          showCurrentLocation={true}
          showMapPicker={true}
          required
          error={errors.to_location?.message}
        />
      </div>

      {/* Distance Display */}
      {distance && distance > 0 && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm text-slate-600">
            Distance: ~{Math.round(distance)}km
          </p>
        </div>
      )}

      {/* Deadline Urgency */}
      <div className="space-y-2">
        <Label htmlFor="deadline_urgency">How soon do you need this? *</Label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {DEADLINE_URGENCY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onDeadlineUrgencyChange(option.value)}
              className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                deadlineUrgency === option.value
                  ? "border-teal-600 bg-teal-50 text-teal-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"
              }`}
              aria-pressed={deadlineUrgency === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          This helps travelers understand your urgency
        </p>
      </div>
    </>
  );
}

