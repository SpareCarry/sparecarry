/**
 * useTiltDetection - Hook for detecting device tilt/angle
 *
 * Uses device accelerometer to detect phone tilt
 * Helps correct measurements for perspective distortion
 */

import { useState, useEffect, useRef } from "react";
import { TiltData } from "./types";

// Conditional import for expo-sensors
// expo-sensors exports Accelerometer as a named export: { Accelerometer }
let Accelerometer: any = null;
if (typeof require !== "undefined") {
  try {
    const SensorsModule = require("expo-sensors");
    // expo-sensors exports: { Accelerometer, Gyroscope, Magnetometer, ... }
    Accelerometer = SensorsModule.Accelerometer;

    if (!Accelerometer) {
      console.warn(
        "[useTiltDetection] Accelerometer not found in expo-sensors module"
      );
    }
  } catch (e) {
    // expo-sensors not available (e.g., on web or not installed)
    console.warn("[useTiltDetection] expo-sensors not available:", e);
  }
}

interface UseTiltDetectionOptions {
  enabled?: boolean;
  updateInterval?: number; // ms
}

/**
 * Convert accelerometer data to tilt angles
 *
 * pitch: rotation around X-axis (forward/backward)
 * roll: rotation around Y-axis (left/right)
 * yaw: rotation around Z-axis (not available from accelerometer alone)
 */
function calculateTilt(acceleration: {
  x: number;
  y: number;
  z: number;
}): TiltData {
  const { x, y, z } = acceleration;

  // Calculate pitch (forward/backward tilt)
  // When phone is flat, z ≈ 9.8 (gravity), pitch = 0
  // When phone tilts forward, z decreases, pitch increases
  const pitch = Math.atan2(-x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);

  // Calculate roll (left/right tilt)
  // When phone is flat, y ≈ 0, roll = 0
  // When phone tilts left, y becomes negative, roll becomes negative
  const roll = Math.atan2(y, z) * (180 / Math.PI);

  // Yaw cannot be determined from accelerometer alone (needs magnetometer)
  // For measurement purposes, we mainly care about pitch and roll
  const yaw = 0;

  return { pitch, roll, yaw };
}

/**
 * Correct dimensions based on tilt angle
 *
 * When phone is tilted, the object appears smaller in the image
 * We need to correct for perspective distortion
 */
export function correctDimensionsForTilt(
  dimensions: { length: number; width: number; height: number },
  tilt: TiltData
): { length: number; width: number; height: number } {
  // Convert tilt angles to radians
  const pitchRad = (tilt.pitch * Math.PI) / 180;
  const rollRad = (tilt.roll * Math.PI) / 180;

  // Calculate correction factors
  // When phone tilts, the apparent size decreases by cos(angle)
  // We need to divide by cos(angle) to get true size
  const pitchCorrection = Math.abs(pitchRad) < 0.1 ? 1 : 1 / Math.cos(pitchRad);
  const rollCorrection = Math.abs(rollRad) < 0.1 ? 1 : 1 / Math.cos(rollRad);

  // Apply corrections
  // Length is affected by pitch (forward/backward tilt)
  // Width is affected by roll (left/right tilt)
  // Height is affected by both
  const correctedLength = dimensions.length * pitchCorrection;
  const correctedWidth = dimensions.width * rollCorrection;
  const correctedHeight =
    dimensions.height * Math.max(pitchCorrection, rollCorrection);

  // Clamp to reasonable values (prevent extreme corrections)
  return {
    length: Math.min(correctedLength, dimensions.length * 1.5),
    width: Math.min(correctedWidth, dimensions.width * 1.5),
    height: Math.min(correctedHeight, dimensions.height * 1.5),
  };
}

export function useTiltDetection(options: UseTiltDetectionOptions = {}) {
  const { enabled = true, updateInterval = 100 } = options;
  const [tilt, setTilt] = useState<TiltData>({ pitch: 0, roll: 0, yaw: 0 });
  const [isAvailable, setIsAvailable] = useState(false);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled || !Accelerometer) {
      setIsAvailable(false);
      return;
    }

    // Check if accelerometer is available and start listening
    const checkAvailability = async () => {
      try {
        if (!Accelerometer) {
          setIsAvailable(false);
          return;
        }

        // Check if accelerometer is available
        // Try isAvailableAsync first (newer API)
        let available = true;
        if (typeof Accelerometer.isAvailableAsync === "function") {
          try {
            available = await Accelerometer.isAvailableAsync();
          } catch (checkError) {
            // If isAvailableAsync fails, assume available and try to use it
            console.warn(
              "[useTiltDetection] isAvailableAsync check failed, attempting to use anyway:",
              checkError
            );
            available = true;
          }
        } else if (typeof Accelerometer.getPermissionsAsync === "function") {
          // Alternative: check permissions
          try {
            const { status } = await Accelerometer.getPermissionsAsync();
            available = status === "granted";
          } catch (permError) {
            // If permission check fails, try to use anyway
            available = true;
          }
        }

        setIsAvailable(available);

        if (!available) {
          console.warn(
            "[useTiltDetection] Accelerometer not available on this device"
          );
          return;
        }

        // Set update interval (in milliseconds)
        if (typeof Accelerometer.setUpdateInterval === "function") {
          Accelerometer.setUpdateInterval(updateInterval);
        }

        // Subscribe to accelerometer updates
        if (typeof Accelerometer.addListener === "function") {
          subscriptionRef.current = Accelerometer.addListener(
            (data: { x: number; y: number; z: number }) => {
              try {
                const tiltData = calculateTilt(data);
                setTilt(tiltData);
              } catch (tiltError) {
                console.warn(
                  "[useTiltDetection] Error calculating tilt:",
                  tiltError
                );
              }
            }
          );
        } else {
          console.warn(
            "[useTiltDetection] Accelerometer.addListener is not available"
          );
          setIsAvailable(false);
        }
      } catch (error) {
        console.warn(
          "[useTiltDetection] Error initializing accelerometer:",
          error
        );
        setIsAvailable(false);
      }
    };

    checkAvailability();

    return () => {
      // Cleanup: remove accelerometer listener
      if (subscriptionRef.current) {
        try {
          if (typeof subscriptionRef.current.remove === "function") {
            subscriptionRef.current.remove();
          } else if (
            Accelerometer &&
            typeof Accelerometer.removeAllListeners === "function"
          ) {
            Accelerometer.removeAllListeners();
          }
        } catch (cleanupError) {
          console.warn(
            "[useTiltDetection] Error cleaning up accelerometer listener:",
            cleanupError
          );
        }
        subscriptionRef.current = null;
      }
      setIsAvailable(false);
      setTilt({ pitch: 0, roll: 0, yaw: 0 });
    };
  }, [enabled, updateInterval]);

  return {
    tilt,
    isAvailable,
    correctDimensions: (dimensions: {
      length: number;
      width: number;
      height: number;
    }) => correctDimensionsForTilt(dimensions, tilt),
  };
}
