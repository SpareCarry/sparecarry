/**
 * Use Current Location Button Component
 *
 * Requests GPS permission, gets current location, and reverse geocodes it.
 * Shows suggestion to open map picker if location is not a marina.
 */

"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Loader2, MapPin, AlertCircle } from "lucide-react";
import { reverseGeocode, Place } from "../../lib/services/location";

interface UseCurrentLocationButtonProps {
  onLocationFound: (place: Place) => void;
  showOnlyMarinas?: boolean;
  onSuggestMapPicker?: () => void;
  className?: string;
}

export function UseCurrentLocationButton({
  onLocationFound,
  showOnlyMarinas = false,
  onSuggestMapPicker,
  className = "",
}: UseCurrentLocationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser");
      }

      // Get current position
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000, // Cache for 1 minute
          });
        }
      );

      const { latitude, longitude } = position.coords;

      // Reverse geocode
      const place = await reverseGeocode(latitude, longitude);

      if (!place) {
        throw new Error("Could not find location name for coordinates");
      }

      // Check if it's a marina and user wants only marinas
      if (
        showOnlyMarinas &&
        place.category !== "marina" &&
        place.category !== "port"
      ) {
        setError("Current location is not a marina");
        if (onSuggestMapPicker) {
          // Show suggestion after a delay
          setTimeout(() => {
            const confirmed = confirm(
              "Current location is not a marina. Would you like to open the map picker to find a nearby marina?"
            );
            if (confirmed && onSuggestMapPicker) {
              onSuggestMapPicker();
            }
          }, 500);
        }
        setIsLoading(false);
        return;
      }

      // Success - pass location to parent
      onLocationFound(place);
      setIsLoading(false);
    } catch (err: any) {
      console.error("Error getting current location:", err);

      let errorMessage = "Failed to get current location";
      if (err.code === 1) {
        errorMessage =
          "Location permission denied. Please enable location access in your browser settings.";
      } else if (err.code === 2) {
        errorMessage = "Location unavailable. Please check your GPS settings.";
      } else if (err.code === 3) {
        errorMessage = "Location request timed out. Please try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        onClick={getCurrentLocation}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Getting location...
          </>
        ) : (
          <>
            <MapPin className="mr-2 h-4 w-4" />
            Use Current Location
          </>
        )}
      </Button>

      {error && (
        <div className="mt-2 flex items-start gap-2 rounded border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p className="flex-1">{error}</p>
        </div>
      )}
    </div>
  );
}
