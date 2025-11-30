/**
 * useReferenceObject - Hook for detecting and calibrating reference objects
 *
 * Detects standard reference objects (credit card, coin, paper) in frame
 * Uses known sizes to calculate pixel-to-cm ratio for accurate measurements
 */

import { useState, useCallback } from "react";
import { ReferenceObject, BoundingBox } from "./types";

// Known sizes of reference objects (in cm)
const REFERENCE_SIZES = {
  credit_card: {
    width: 8.56, // Standard credit card width
    height: 5.398, // Standard credit card height
    diagonal: 10.1, // Approximate diagonal
  },
  coin: {
    diameter: 2.4, // US quarter diameter (common reference)
  },
  paper: {
    width: 21.59, // A4 paper width
    height: 27.94, // A4 paper height
    diagonal: 35.6, // Approximate diagonal
  },
};

/**
 * Detect reference object in frame
 *
 * This is a simplified detection - in production you might use:
 * - Edge detection to find rectangular objects
 * - Color detection for credit cards (blue/red)
 * - Size estimation based on typical placement
 *
 * For now, we'll use a heuristic approach:
 * - Credit card: Small rectangular object near edges
 * - Coin: Small circular object
 * - Paper: Large rectangular object
 */
export function detectReferenceObject(
  boundingBoxes: BoundingBox[],
  frameWidth: number,
  frameHeight: number
): ReferenceObject | null {
  if (boundingBoxes.length === 0) {
    return null;
  }

  // Find the smallest bounding box (likely reference object)
  // Reference objects are typically smaller than the main item
  const sortedBoxes = [...boundingBoxes].sort(
    (a, b) => a.width * a.height - b.width * b.height
  );

  const smallestBox = sortedBoxes[0];
  const boxArea = smallestBox.width * smallestBox.height;
  const frameArea = frameWidth * frameHeight;
  const coverage = boxArea / frameArea;

  // Heuristic: Reference objects are typically 5-15% of frame
  if (coverage < 0.05 || coverage > 0.15) {
    return null; // Too small or too large to be a reference object
  }

  // Determine type based on aspect ratio and size
  const aspectRatio = smallestBox.width / smallestBox.height;
  const isSquare = aspectRatio > 0.8 && aspectRatio < 1.2;
  const isWide = aspectRatio > 1.5;

  if (isSquare && coverage < 0.08) {
    // Small square-ish object - likely a coin
    return {
      type: "coin",
      detectedSizePixels: Math.max(smallestBox.width, smallestBox.height),
      knownSizeCm: REFERENCE_SIZES.coin.diameter,
    };
  } else if (isWide && coverage < 0.12) {
    // Small wide object - likely a credit card
    return {
      type: "credit_card",
      detectedSizePixels: smallestBox.width,
      knownSizeCm: REFERENCE_SIZES.credit_card.width,
    };
  } else if (coverage > 0.1 && !isSquare) {
    // Large rectangular object - likely paper
    return {
      type: "paper",
      detectedSizePixels: smallestBox.width,
      knownSizeCm: REFERENCE_SIZES.paper.width,
    };
  }

  return null;
}

/**
 * Calculate pixel-to-cm ratio from reference object
 */
export function calculatePixelToCmRatio(
  reference: ReferenceObject
): number | null {
  if (!reference.detectedSizePixels || reference.detectedSizePixels === 0) {
    return null;
  }

  return reference.knownSizeCm / reference.detectedSizePixels;
}

/**
 * Apply reference object calibration to dimensions
 */
export function applyReferenceCalibration(
  dimensions: { length: number; width: number; height: number },
  reference: ReferenceObject
): { length: number; width: number; height: number } {
  const ratio = calculatePixelToCmRatio(reference);
  if (!ratio) {
    return dimensions; // No calibration available
  }

  // Apply ratio correction
  // This assumes the reference object and item are at similar distances
  // In reality, you'd need to account for depth differences
  return {
    length: dimensions.length * ratio,
    width: dimensions.width * ratio,
    height: dimensions.height * ratio,
  };
}

export function useReferenceObject() {
  const [referenceObject, setReferenceObject] =
    useState<ReferenceObject | null>(null);

  const detectReference = useCallback(
    (boundingBoxes: BoundingBox[], frameWidth: number, frameHeight: number) => {
      const detected = detectReferenceObject(
        boundingBoxes,
        frameWidth,
        frameHeight
      );
      setReferenceObject(detected);
      return detected;
    },
    []
  );

  const clearReference = useCallback(() => {
    setReferenceObject(null);
  }, []);

  const applyCalibration = useCallback(
    (dimensions: { length: number; width: number; height: number }) => {
      if (!referenceObject) {
        return dimensions;
      }
      return applyReferenceCalibration(dimensions, referenceObject);
    },
    [referenceObject]
  );

  return {
    referenceObject,
    detectReference,
    clearReference,
    applyCalibration,
    hasReference: referenceObject !== null && referenceObject.type !== "none",
  };
}
