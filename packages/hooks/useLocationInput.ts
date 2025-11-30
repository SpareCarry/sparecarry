/**
 * Shared Location Input Hook
 * Handles location input with GPS, autocomplete, and saved locations
 * Used by post-request and post-trip forms
 */

import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { getCurrentLocation } from "./useLocation";
import { reverseGeocode } from "../../lib/services/location";
import AsyncStorage from "@react-native-async-storage/async-storage";

const RECENT_LOCATIONS_KEY = "recent_locations";
const MAX_RECENT_LOCATIONS = 10;

export interface LocationInputValue {
  address: string;
  lat: number | null;
  lon: number | null;
}

export interface RecentLocation {
  address: string;
  lat: number;
  lon: number;
  timestamp: number;
  country?: string; // Optional country code
}

export function useLocationInput() {
  const [gettingLocation, setGettingLocation] = useState(false);

  /**
   * Get current GPS location and reverse geocode to address
   */
  const handleGetCurrentLocation =
    useCallback(async (): Promise<LocationInputValue | null> => {
      setGettingLocation(true);
      try {
        const location = await getCurrentLocation();

        // Reverse geocode to get address
        try {
          const geocoded = await reverseGeocode(
            location.latitude,
            location.longitude
          );
          const address =
            geocoded?.formatted ||
            `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;

          // Save to recent locations
          await saveRecentLocation(
            address,
            location.latitude,
            location.longitude
          );

          return {
            address,
            lat: location.latitude,
            lon: location.longitude,
          };
        } catch (geocodeError) {
          // If geocoding fails, just use coordinates
          const coordAddress = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
          await saveRecentLocation(
            coordAddress,
            location.latitude,
            location.longitude
          );

          return {
            address: coordAddress,
            lat: location.latitude,
            lon: location.longitude,
          };
        }
      } catch (error: any) {
        Alert.alert(
          "Location Error",
          error.message || "Failed to get location. Please enter manually."
        );
        return null;
      } finally {
        setGettingLocation(false);
      }
    }, []);

  /**
   * Save location to recent locations
   */
  const saveRecentLocation = useCallback(
    async (address: string, lat: number, lon: number) => {
      try {
        const recent = await getRecentLocations();
        const newLocation: RecentLocation = {
          address,
          lat,
          lon,
          timestamp: Date.now(),
        };

        // Remove duplicate if exists
        const filtered = recent.filter(
          (loc) =>
            loc.address !== address &&
            (Math.abs(loc.lat - lat) > 0.001 || Math.abs(loc.lon - lon) > 0.001)
        );

        // Add to front and limit
        const updated = [newLocation, ...filtered].slice(
          0,
          MAX_RECENT_LOCATIONS
        );
        await AsyncStorage.setItem(
          RECENT_LOCATIONS_KEY,
          JSON.stringify(updated)
        );
      } catch (error) {
        console.error("Error saving recent location:", error);
      }
    },
    []
  );

  /**
   * Get recent locations from storage
   */
  const getRecentLocations = useCallback(async (): Promise<
    RecentLocation[]
  > => {
    try {
      const data = await AsyncStorage.getItem(RECENT_LOCATIONS_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error("Error getting recent locations:", error);
      return [];
    }
  }, []);

  /**
   * Clear recent locations
   */
  const clearRecentLocations = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(RECENT_LOCATIONS_KEY);
    } catch (error) {
      console.error("Error clearing recent locations:", error);
    }
  }, []);

  return {
    gettingLocation,
    handleGetCurrentLocation,
    getRecentLocations,
    clearRecentLocations,
    saveRecentLocation,
  };
}
