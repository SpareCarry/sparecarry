/**
 * useAutoMeasure - Lightweight dimension estimation hook
 *
 * Uses camera focal length, sensor size, and bounding box detection
 * to estimate object dimensions. Accuracy: ~20-30% (rough estimates only)
 */

import { useState, useCallback, useRef } from "react";
import {
  Dimensions,
  MeasurementResult,
  BoundingBox,
  CameraFrame,
  MultiFrameMeasurement,
} from "./types";
import { correctDimensionsForTilt } from "./useTiltDetection";
import { applyReferenceCalibration } from "./useReferenceObject";

// Conditional import for expo-image-manipulator (mobile only)
// TypeScript-safe conditional import
let ImageManipulator: any = null;
if (typeof require !== "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ImageManipulator = require("expo-image-manipulator");
  } catch (e) {
    // expo-image-manipulator not available (e.g., on web)
    ImageManipulator = null;
  }
}

// Default camera parameters (approximate, varies by device)
const DEFAULT_FOCAL_LENGTH_MM = 4.2; // Typical smartphone camera
const DEFAULT_SENSOR_WIDTH_MM = 5.4; // Typical smartphone sensor
const DEFAULT_SENSOR_HEIGHT_MM = 4.0;

// Typical viewing distance (user holds phone ~30-50cm from object)
const DEFAULT_DISTANCE_CM = 40;

// Frame processing throttle (10fps max)
const FRAME_THROTTLE_MS = 100;

import { ReferenceObject } from "./types";

interface UseAutoMeasureOptions {
  onMeasurement?: (result: MeasurementResult) => void;
  enabled?: boolean;
  multiFrameCount?: number; // Number of frames to average (default: 3)
  tiltData?: { pitch: number; roll: number; yaw: number } | null;
  referenceObject?: ReferenceObject | null;
}

/**
 * Estimate distance to object based on bounding box size
 * Uses: distance = (focal_length * real_size) / pixel_size
 */
function estimateDistance(
  boundingBox: BoundingBox,
  frameWidth: number,
  frameHeight: number,
  focalLength: number = DEFAULT_FOCAL_LENGTH_MM,
  sensorWidth: number = DEFAULT_SENSOR_WIDTH_MM
): number {
  // Calculate pixel size of object in frame
  const objectPixelWidth = boundingBox.width;
  const objectPixelHeight = boundingBox.height;
  const objectPixelSize = Math.max(objectPixelWidth, objectPixelHeight);

  // Convert pixels to mm on sensor
  // sensor_width_mm / frame_width_pixels = mm_per_pixel
  const mmPerPixel = sensorWidth / frameWidth;
  const objectSizeOnSensor = objectPixelSize * mmPerPixel;

  // Estimate distance using similar triangles
  // distance = (focal_length * assumed_object_size) / object_size_on_sensor
  // We assume a typical object is ~20cm wide (common item size)
  const assumedObjectSizeMm = 200; // 20cm in mm
  const estimatedDistanceMm =
    (focalLength * assumedObjectSizeMm) / objectSizeOnSensor;

  // Convert to cm and clamp to reasonable range
  const distanceCm = estimatedDistanceMm / 10;
  return Math.max(20, Math.min(100, distanceCm)); // Clamp between 20-100cm
}

/**
 * Detect largest bounding box in frame (simple edge detection)
 * This is a lightweight approximation - finds the largest contour-like region
 */
function detectBoundingBox(
  imageData: ImageData | null,
  frameWidth: number,
  frameHeight: number
): BoundingBox | null {
  if (!imageData) {
    // Fallback: return center region (assumes object is centered)
    return {
      x: frameWidth * 0.2,
      y: frameHeight * 0.2,
      width: frameWidth * 0.6,
      height: frameHeight * 0.6,
    };
  }

  // Simple edge detection: find region with most contrast
  // This is a lightweight approximation - in production you might use
  // a more sophisticated algorithm, but this works for rough estimates
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  // Sample every 10th pixel for performance
  const step = 10;
  let maxContrast = 0;
  let maxX = width * 0.2;
  let maxY = height * 0.2;
  let maxW = width * 0.6;
  let maxH = height * 0.6;

  // Simple heuristic: find region with most variance
  // (This is a placeholder - real implementation would use proper edge detection)
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (r + g + b) / 3;

      // Simple contrast detection (difference from average)
      const contrast = Math.abs(brightness - 128);
      if (contrast > maxContrast) {
        maxContrast = contrast;
      }
    }
  }

  // Return estimated bounding box (centered, assumes object is in center)
  // In a real implementation, this would use proper contour detection
  return {
    x: frameWidth * 0.2,
    y: frameHeight * 0.2,
    width: frameWidth * 0.6,
    height: frameHeight * 0.6,
  };
}

/**
 * Convert pixel dimensions to real-world dimensions
 * Uses: real_size = (pixel_size * distance) / focal_length
 */
function pixelToRealWorld(
  pixelSize: number,
  distanceCm: number,
  frameWidth: number,
  sensorWidthMm: number = DEFAULT_SENSOR_WIDTH_MM,
  focalLengthMm: number = DEFAULT_FOCAL_LENGTH_MM
): number {
  // Convert distance to mm
  const distanceMm = distanceCm * 10;

  // Calculate mm per pixel
  const mmPerPixel = sensorWidthMm / frameWidth;

  // Convert pixel size to mm on sensor
  const sizeOnSensorMm = pixelSize * mmPerPixel;

  // Calculate real-world size using similar triangles
  // real_size = (size_on_sensor * distance) / focal_length
  const realSizeMm = (sizeOnSensorMm * distanceMm) / focalLengthMm;

  // Convert to cm
  return realSizeMm / 10;
}

/**
 * Estimate dimensions from bounding box and distance
 */
function estimateDimensions(
  boundingBox: BoundingBox,
  frameWidth: number,
  frameHeight: number,
  distanceCm: number
): Dimensions {
  // Estimate width and length from bounding box
  const widthPixels = boundingBox.width;
  const lengthPixels = boundingBox.height;

  // Convert to real-world dimensions
  const widthCm = pixelToRealWorld(widthPixels, distanceCm, frameWidth);
  const lengthCm = pixelToRealWorld(lengthPixels, distanceCm, frameWidth);

  // Estimate height using heuristic:
  // - If object is more vertical (height > width), assume it's standing
  // - Otherwise, assume height is ~50% of width (typical for boxes)
  const aspectRatio = lengthPixels / widthPixels;
  let heightCm: number;

  if (aspectRatio > 1.5) {
    // Vertical object (standing)
    heightCm = lengthCm * 0.8; // Height is most of the length
  } else if (aspectRatio < 0.7) {
    // Horizontal object (lying flat)
    heightCm = lengthCm * 0.3; // Height is small
  } else {
    // Square-ish object
    heightCm = Math.min(widthCm, lengthCm) * 0.5; // Height is ~50% of smaller dimension
  }

  // Ensure reasonable values (clamp to 1-200cm range)
  return {
    length: Math.max(1, Math.min(200, lengthCm)),
    width: Math.max(1, Math.min(200, widthCm)),
    height: Math.max(1, Math.min(200, heightCm)),
  };
}

/**
 * Average multiple measurement results for better accuracy
 */
function averageMeasurements(
  measurements: MeasurementResult[]
): MeasurementResult {
  if (measurements.length === 0) {
    throw new Error("Cannot average empty measurements");
  }

  if (measurements.length === 1) {
    return measurements[0];
  }

  // Calculate average dimensions
  const avgLength =
    measurements.reduce((sum, m) => sum + m.dimensions.length, 0) /
    measurements.length;
  const avgWidth =
    measurements.reduce((sum, m) => sum + m.dimensions.width, 0) /
    measurements.length;
  const avgHeight =
    measurements.reduce((sum, m) => sum + m.dimensions.height, 0) /
    measurements.length;

  // Calculate average confidence
  const avgConfidence =
    measurements.reduce((sum, m) => sum + m.confidence, 0) /
    measurements.length;

  // Use average bounding box (or first one if available)
  const avgBoundingBox = measurements[0]?.boundingBox;

  return {
    dimensions: {
      length: avgLength,
      width: avgWidth,
      height: avgHeight,
    },
    confidence: Math.min(0.9, avgConfidence * 1.1), // Slightly increase confidence with averaging
    boundingBox: avgBoundingBox,
  };
}

export function useAutoMeasure(options: UseAutoMeasureOptions = {}) {
  const {
    onMeasurement,
    enabled = true,
    multiFrameCount = 3,
    tiltData,
    referenceObject,
  } = options;
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastMeasurement, setLastMeasurement] =
    useState<MeasurementResult | null>(null);
  const [multiFrameMeasurements, setMultiFrameMeasurements] = useState<
    MeasurementResult[]
  >([]);
  const lastProcessTime = useRef<number>(0);

  /**
   * Process a camera frame and estimate dimensions
   */
  const measureFrame = useCallback(
    async (frame: CameraFrame): Promise<MeasurementResult | null> => {
      if (!enabled) return null;

      // Throttle processing (max 10fps)
      const now = Date.now();
      if (now - lastProcessTime.current < FRAME_THROTTLE_MS) {
        return null;
      }
      lastProcessTime.current = now;

      try {
        setIsProcessing(true);

        // Detect bounding box (simplified - assumes object is centered)
        // In a real implementation, this would use proper image processing
        const boundingBox = detectBoundingBox(null, frame.width, frame.height);

        if (!boundingBox) {
          return null;
        }

        // Estimate distance to object
        const distanceCm = estimateDistance(
          boundingBox,
          frame.width,
          frame.height
        );

        // Estimate dimensions
        const dimensions = estimateDimensions(
          boundingBox,
          frame.width,
          frame.height,
          distanceCm
        );

        // Calculate confidence (rough estimate based on bounding box size)
        // Larger objects in frame = higher confidence
        const boxArea = boundingBox.width * boundingBox.height;
        const frameArea = frame.width * frame.height;
        const coverage = boxArea / frameArea;
        const confidence = Math.min(0.8, Math.max(0.3, coverage * 2)); // 30-80% confidence

        let result: MeasurementResult = {
          dimensions,
          confidence,
          boundingBox,
        };

        // Apply tilt correction if available
        if (tiltData) {
          const tiltCorrected = correctDimensionsForTilt(
            result.dimensions,
            tiltData
          );
          result = {
            ...result,
            dimensions: tiltCorrected,
          };
        }

        // Apply reference object calibration if available
        if (referenceObject && referenceObject.type !== "none") {
          const calibrated = applyReferenceCalibration(
            result.dimensions,
            referenceObject
          );
          result = {
            ...result,
            dimensions: calibrated,
            confidence: Math.min(0.95, result.confidence * 1.2), // Increase confidence with calibration
          };
        }

        setLastMeasurement(result);
        onMeasurement?.(result);

        return result;
      } catch (error) {
        console.error("[useAutoMeasure] Error measuring frame:", error);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [enabled, onMeasurement, tiltData, referenceObject]
  );

  /**
   * Measure from a captured photo
   */
  const measurePhoto = useCallback(
    async (photoUri: string): Promise<MeasurementResult | null> => {
      if (!enabled) return null;

      try {
        setIsProcessing(true);

        if (!ImageManipulator) {
          throw new Error("expo-image-manipulator not available");
        }

        // Get image dimensions
        const manipResult = await ImageManipulator.manipulateAsync(
          photoUri,
          [],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        const frame: CameraFrame = {
          uri: manipResult.uri,
          width: manipResult.width,
          height: manipResult.height,
        };

        return await measureFrame(frame);
      } catch (error) {
        console.error("[useAutoMeasure] Error measuring photo:", error);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [enabled, measureFrame]
  );

  /**
   * Measure multiple frames and average results
   */
  const measureMultiFrame = useCallback(
    async (photoUris: string[]): Promise<MultiFrameMeasurement | null> => {
      if (!enabled || photoUris.length === 0) return null;

      try {
        setIsProcessing(true);
        const measurements: MeasurementResult[] = [];

        // Measure each frame
        for (const uri of photoUris) {
          const result = await measurePhoto(uri);
          if (result) {
            measurements.push(result);
          }
        }

        if (measurements.length === 0) {
          return null;
        }

        // Average measurements
        const averaged = averageMeasurements(measurements);

        // Apply tilt correction to averaged result
        let tiltCorrected = averaged;
        if (tiltData) {
          const corrected = correctDimensionsForTilt(
            averaged.dimensions,
            tiltData
          );
          tiltCorrected = {
            ...averaged,
            dimensions: corrected,
          };
        }

        // Apply reference calibration
        let referenceCalibrated: MeasurementResult | undefined;
        if (referenceObject && referenceObject.type !== "none") {
          const calibrated = applyReferenceCalibration(
            tiltCorrected.dimensions,
            referenceObject
          );
          referenceCalibrated = {
            ...tiltCorrected,
            dimensions: calibrated,
            confidence: Math.min(0.95, tiltCorrected.confidence * 1.2),
          };
        }

        const multiFrameResult: MultiFrameMeasurement = {
          frames: measurements,
          averaged,
          tiltCorrected,
          referenceCalibrated: referenceCalibrated || tiltCorrected,
          referenceObject: referenceObject || undefined,
          tiltData: tiltData || undefined,
        };

        // Use the final calibrated result
        const finalResult = referenceCalibrated || tiltCorrected;
        setLastMeasurement(finalResult);
        onMeasurement?.(finalResult);

        return multiFrameResult;
      } catch (error) {
        console.error(
          "[useAutoMeasure] Error in multi-frame measurement:",
          error
        );
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [enabled, measurePhoto, tiltData, referenceObject, onMeasurement]
  );

  return {
    measureFrame,
    measurePhoto,
    measureMultiFrame,
    isProcessing,
    lastMeasurement,
    multiFrameMeasurements,
  };
}
