/**
 * useLocation - Universal location hook for web and mobile
 * 
 * Web: Uses navigator.geolocation
 * Mobile: Uses expo-location
 */

import { useState, useEffect, useCallback } from 'react';
import { isWeb, isMobile } from '@sparecarry/lib/platform';

type ExpoLocationModule = typeof import('expo-location');
type ExpoLocationSubscription = import('expo-location').LocationSubscription;

// Conditional import for expo-location (mobile only)
let ExpoLocation: ExpoLocationModule | null = null;
if (isMobile && typeof require !== 'undefined') {
  try {
    ExpoLocation = require('expo-location');
  } catch (e) {
    // expo-location not available
  }
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface LocationError {
  code: number;
  message: string;
}

interface UseLocationOptions {
  enabled?: boolean;
  watch?: boolean;
  accuracy?: number; // ExpoLocation.Accuracy enum value
}

/**
 * Get current location (one-time)
 */
export async function getCurrentLocation(): Promise<LocationData> {
  if (isWeb) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject({ code: 1, message: 'Geolocation not supported' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy ?? undefined,
            altitude: position.coords.altitude ?? null,
            altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
            heading: position.coords.heading ?? null,
            speed: position.coords.speed ?? null,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          reject({
            code: error.code,
            message: error.message,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  } else {
    // Mobile: Use expo-location
    if (!ExpoLocation) {
      throw { code: 1, message: 'expo-location not available' };
    }
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw { code: 1, message: 'Location permission denied' };
    }

    const location = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy ?? undefined,
      altitude: location.coords.altitude ?? null,
      altitudeAccuracy: location.coords.altitudeAccuracy ?? null,
      heading: location.coords.heading ?? null,
      speed: location.coords.speed ?? null,
      timestamp: location.timestamp,
    };
  }
}

/**
 * React hook for location
 */
export function useLocation(options: UseLocationOptions = {}) {
  const { enabled = true, watch = false, accuracy = 4 } = options; // Default to Balanced (4)
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [loading, setLoading] = useState(false);

  const updateLocation = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Wrap updateLocation in try-catch
    try {
      updateLocation();
    } catch (err) {
      console.error('❌ [useLocation] updateLocation error:', err);
      setError({
        code: 1,
        message: err instanceof Error ? err.message : String(err),
      });
    }

    if (watch) {
      let watchId: number | null = null;
      let subscription: ExpoLocationSubscription | null = null;

      try {
        if (isWeb) {
          if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
              (position) => {
                setLocation({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy ?? undefined,
                  altitude: position.coords.altitude ?? null,
                  altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
                  heading: position.coords.heading ?? null,
                  speed: position.coords.speed ?? null,
                  timestamp: position.timestamp,
                });
              },
              (error) => {
                setError({
                  code: error.code,
                  message: error.message,
                });
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000,
              }
            );
          } else {
            setError({
              code: 1,
              message: 'Geolocation not supported',
            });
          }
        } else {
          // Mobile: Use expo-location watch
          if (ExpoLocation) {
            ExpoLocation.requestForegroundPermissionsAsync()
              .then(({ status }) => {
                if (status === 'granted') {
                  ExpoLocation.watchPositionAsync(
                    {
                      accuracy: accuracy as any,
                      timeInterval: 5000,
                      distanceInterval: 10,
                    },
                    (location) => {
                      setLocation({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        accuracy: location.coords.accuracy ?? undefined,
                        altitude: location.coords.altitude ?? null,
                        altitudeAccuracy: location.coords.altitudeAccuracy ?? null,
                        heading: location.coords.heading ?? null,
                        speed: location.coords.speed ?? null,
                        timestamp: location.timestamp,
                      });
                    }
                  )
                    .then((sub) => {
                      subscription = sub;
                    })
                    .catch((err) => {
                      console.error('❌ [useLocation] watchPositionAsync error:', err);
                      setError({
                        code: 1,
                        message: err instanceof Error ? err.message : String(err),
                      });
                    });
                } else {
                  setError({
                    code: 1,
                    message: 'Location permission denied',
                  });
                }
              })
              .catch((err) => {
                console.error('❌ [useLocation] requestForegroundPermissionsAsync error:', err);
                setError({
                  code: 1,
                  message: err instanceof Error ? err.message : String(err),
                });
              });
          } else {
            setError({
              code: 1,
              message: 'expo-location not available',
            });
          }
        }
      } catch (err) {
        console.error('❌ [useLocation] watch setup error:', err);
        setError({
          code: 1,
          message: err instanceof Error ? err.message : String(err),
        });
      }

      return () => {
        try {
          if (watchId !== null && isWeb) {
            navigator.geolocation.clearWatch(watchId);
          }
        if (subscription) {
          subscription.remove();
        }
        } catch (err) {
          console.error('❌ [useLocation] cleanup error:', err);
        }
      };
    }
  }, [enabled, watch, accuracy, updateLocation]);

  return {
    location,
    error,
    loading,
    refetch: updateLocation,
  };
}

