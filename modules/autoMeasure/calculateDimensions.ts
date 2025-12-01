/**
 * Calculate dimensions from manual bounding box
 * Simple formula: dimension = (boxSize / frameSize) × distance × scaleFactor
 */

import { BoundingBox, Dimensions } from "./types";
import { Dimensions as ScreenDimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = ScreenDimensions.get("window");

// Default viewing distance (user holds phone ~30-50cm from object)
const DEFAULT_DISTANCE_CM = 40;

// Scale factor calibration (adjust based on testing)
// This accounts for camera focal length and sensor size
const SCALE_FACTOR = 0.15; // Rough calibration factor

/**
 * Estimate distance based on bounding box size
 * Larger box = closer, smaller box = farther
 */
function estimateDistance(boundingBox: BoundingBox): number {
  // Normalize box size (0-1)
  const boxArea = (boundingBox.width / SCREEN_WIDTH) * (boundingBox.height / SCREEN_HEIGHT);
  
  // Optimal coverage is 0.4-0.7 at 30-50cm
  // If coverage is 0.5, we're at ~40cm
  // If coverage is 0.3, we're at ~60cm (too far)
  // If coverage is 0.7, we're at ~30cm (too close)
  const optimalDistance = 40; // cm
  const optimalCoverage = 0.5;
  
  if (boxArea < 0.3) {
    // Too far
    const distance = Math.round(optimalDistance + (optimalCoverage - boxArea) * 100);
    return Math.min(100, distance);
  } else if (boxArea > 0.75) {
    // Too close
    const distance = Math.round(optimalDistance - (boxArea - optimalCoverage) * 100);
    return Math.max(20, distance);
  } else {
    // Good distance
    const distance = Math.round(optimalDistance - (boxArea - optimalCoverage) * 50);
    return Math.max(20, Math.min(100, distance));
  }
}

/**
 * Calculate dimensions from bounding box
 */
export function calculateDimensionsFromBox(
  boundingBox: BoundingBox,
  frameWidth: number = SCREEN_WIDTH,
  frameHeight: number = SCREEN_HEIGHT
): Dimensions {
  // Estimate distance
  const distance = estimateDistance(boundingBox);
  
  // Normalize box dimensions (0-1)
  const normalizedWidth = boundingBox.width / frameWidth;
  const normalizedHeight = boundingBox.height / frameHeight;
  
  // Calculate dimensions: (normalizedSize × distance × scaleFactor)
  // Width and height from box, length estimated from average
  const width = normalizedWidth * distance * SCALE_FACTOR;
  const height = normalizedHeight * distance * SCALE_FACTOR;
  const length = ((normalizedWidth + normalizedHeight) / 2) * distance * SCALE_FACTOR;
  
  // Round to 1 decimal place
  return {
    length: Math.round(length * 10) / 10,
    width: Math.round(width * 10) / 10,
    height: Math.round(height * 10) / 10,
  };
}

/**
 * Get distance hint for user guidance
 */
export function getDistanceHint(boundingBox: BoundingBox): {
  hint: string;
  state: "too-far" | "too-close" | "perfect" | "good";
} | null {
  const boxArea = (boundingBox.width / SCREEN_WIDTH) * (boundingBox.height / SCREEN_HEIGHT);
  const distance = estimateDistance(boundingBox);
  
  if (boxArea < 0.3) {
    return {
      hint: `Move closer (~${distance}cm away)`,
      state: "too-far",
    };
  } else if (boxArea > 0.75) {
    return {
      hint: `Move back (~${distance}cm away)`,
      state: "too-close",
    };
  } else if (boxArea >= 0.4 && boxArea <= 0.7) {
    return {
      hint: `Perfect distance (~${distance}cm)`,
      state: "perfect",
    };
  } else {
    return {
      hint: `Good distance (~${distance}cm)`,
      state: "good",
    };
  }
}

