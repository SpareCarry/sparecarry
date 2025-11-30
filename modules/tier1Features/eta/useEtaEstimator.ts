/**
 * ETA Estimator Hook
 *
 * Estimates delivery time based on travel method and locations
 * - Plane: Auto-calculated via distance and schedule
 * - Boat: Manual input required (user must specify days)
 */

import { useMemo } from "react";
import { EtaResult, Location } from "./types";

/**
 * Calculate distance between two points using Haversine formula (in km)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate ETA for plane travel
 */
function estimatePlaneEta(from: Location, to: Location): EtaResult {
  const distance = calculateDistance(
    from.latitude,
    from.longitude,
    to.latitude,
    to.longitude
  );

  // Average plane speed: 800 km/h
  const planeSpeed = 800;
  const flightHours = distance / planeSpeed;

  // Add handling buffer: 4 hours for check-in, security, loading, etc.
  const handlingBuffer = 4;

  const totalHours = flightHours + handlingBuffer;
  const totalDays = Math.ceil(totalHours / 24);

  return {
    estimatedHours: Math.round(totalHours),
    estimatedDays: totalDays,
    method: "plane",
  };
}

/**
 * Hook to estimate ETA based on travel method
 */
export function useEtaEstimator(
  travelMethod: "plane" | "boat",
  from?: Location,
  to?: Location,
  manualBoatDays?: number
): EtaResult | null {
  return useMemo(() => {
    if (travelMethod === "boat") {
      // Boat ETA is MANUAL - user must input days
      if (manualBoatDays === undefined || manualBoatDays === null) {
        return null; // Not yet provided
      }

      return {
        estimatedHours: manualBoatDays * 24,
        estimatedDays: manualBoatDays,
        method: "boat",
        isManual: true,
        manualDays: manualBoatDays,
      };
    }

    // Plane: auto-calculate
    if (!from || !to) {
      return null; // Need both locations
    }

    return estimatePlaneEta(from, to);
  }, [travelMethod, from, to, manualBoatDays]);
}
