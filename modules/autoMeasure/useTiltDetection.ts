/**
 * useTiltDetection - Hook for detecting device tilt/angle
 * 
 * Uses device accelerometer to detect phone tilt
 * Helps correct measurements for perspective distortion
 */

import { useState, useEffect, useRef } from 'react';
import { TiltData } from './types';

// Conditional import for expo-sensors
let Accelerometer: typeof import('expo-sensors/build/Accelerometer') | null = null;
if (typeof require !== 'undefined') {
  try {
    Accelerometer = require('expo-sensors/build/Accelerometer');
  } catch (e) {
    // expo-sensors not available
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
function calculateTilt(acceleration: { x: number; y: number; z: number }): TiltData {
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
  const correctedHeight = dimensions.height * Math.max(pitchCorrection, rollCorrection);
  
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

    // Check if accelerometer is available
    Accelerometer.isAvailableAsync()
      .then((available) => {
        setIsAvailable(available);
        if (!available) return;

        // Set update interval
        Accelerometer.setUpdateInterval(updateInterval);

        // Subscribe to accelerometer updates
        subscriptionRef.current = Accelerometer.addListener((data) => {
          const tiltData = calculateTilt(data);
          setTilt(tiltData);
        });
      })
      .catch((error) => {
        console.warn('[useTiltDetection] Accelerometer not available:', error);
        setIsAvailable(false);
      });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, [enabled, updateInterval]);

  return {
    tilt,
    isAvailable,
    correctDimensions: (dimensions: { length: number; width: number; height: number }) =>
      correctDimensionsForTilt(dimensions, tilt),
  };
}

