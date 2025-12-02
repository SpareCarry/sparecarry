/**
 * Unified Object Detection Interface
 * Switches between edge detection and ML detection based on device capability
 * Provides a single API for automatic object detection
 */

import { BoundingBox } from "./types";
import { checkDeviceCapability, DetectionCapability } from "./deviceCapability";
import { detectObjectWithEdges } from "./edgeDetection";
import { detectObjectWithML, initializeMLModel, isMLModelLoaded } from "./mlDetection";
import { Dimensions as ScreenDimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = ScreenDimensions.get("window");

let cachedCapability: DetectionCapability | null = null;
let capabilityCheckPromise: Promise<DetectionCapability> | null = null;

/**
 * Initialize object detection system
 * Should be called at app startup to preload ML model if needed
 */
export async function initializeObjectDetection(): Promise<void> {
  try {
    // Check device capability
    const capability = await checkDeviceCapability();
    cachedCapability = capability;

    // Preload ML model if device supports it
    if (capability === "enhanced") {
      console.log("[ObjectDetection] Initializing ML model for enhanced detection");
      // Initialize in background, don't block
      initializeMLModel().catch((error) => {
        console.warn("[ObjectDetection] Failed to preload ML model:", error);
        // Fallback to simple mode if ML fails
        cachedCapability = "simple";
      });
    } else {
      console.log("[ObjectDetection] Using simple edge detection mode");
    }
  } catch (error) {
    console.error("[ObjectDetection] Error initializing:", error);
    // Default to simple mode on error
    cachedCapability = "simple";
  }
}

/**
 * Detect object in frame
 * Automatically uses appropriate detection method based on device capability
 */
export async function detectObject(
  imageUri: string,
  frameWidth: number = SCREEN_WIDTH,
  frameHeight: number = SCREEN_HEIGHT
): Promise<BoundingBox | null> {
  try {
    // Get device capability (use cached if available)
    let capability = cachedCapability;
    if (!capability) {
      if (capabilityCheckPromise) {
        capability = await capabilityCheckPromise;
      } else {
        capabilityCheckPromise = checkDeviceCapability();
        capability = await capabilityCheckPromise;
        cachedCapability = capability;
        capabilityCheckPromise = null;
      }
    }

    // Use appropriate detection method
    if (capability === "enhanced") {
      // Check if ML model is ready
      if (isMLModelLoaded()) {
        console.log("[ObjectDetection] Using ML detection");
        return await detectObjectWithML(imageUri, frameWidth, frameHeight);
      } else {
        // ML model not ready yet, fallback to edge detection
        console.log("[ObjectDetection] ML model not ready, using edge detection fallback");
        return await detectObjectWithEdges(imageUri, frameWidth, frameHeight);
      }
    } else {
      // Use simple edge detection
      console.log("[ObjectDetection] Using edge detection");
      return await detectObjectWithEdges(imageUri, frameWidth, frameHeight);
    }
  } catch (error) {
    console.error("[ObjectDetection] Error detecting object:", error);
    return null;
  }
}

/**
 * Get current detection capability
 */
export function getDetectionCapability(): DetectionCapability | null {
  return cachedCapability;
}

/**
 * Force re-check of device capability
 */
export async function refreshCapability(): Promise<DetectionCapability> {
  cachedCapability = null;
  capabilityCheckPromise = null;
  return await checkDeviceCapability();
}

/**
 * Detect object with best-fit rectangle
 * Handles irregular shapes by fitting to rectangle/square
 */
export async function detectObjectWithBestFit(
  imageUri: string,
  frameWidth: number = SCREEN_WIDTH,
  frameHeight: number = SCREEN_HEIGHT,
  preferSquare: boolean = false
): Promise<BoundingBox | null> {
  // First, detect object
  const boundingBox = await detectObject(imageUri, frameWidth, frameHeight);
  
  if (!boundingBox) {
    return null;
  }

  // Apply best-fit rectangle logic
  return calculateBestFitRectangle(boundingBox, preferSquare);
}

/**
 * Calculate best-fit rectangle for bounding box
 * If preferSquare is true, makes it as square as possible
 */
function calculateBestFitRectangle(
  box: BoundingBox,
  preferSquare: boolean = false
): BoundingBox {
  if (preferSquare) {
    // Make it as square as possible
    const size = Math.max(box.width, box.height);
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    
    return {
      x: centerX - size / 2,
      y: centerY - size / 2,
      width: size,
      height: size,
    };
  } else {
    // Keep original rectangle, but ensure minimum size
    const minSize = 50; // Minimum 50px
    return {
      x: box.x,
      y: box.y,
      width: Math.max(box.width, minSize),
      height: Math.max(box.height, minSize),
    };
  }
}

/**
 * Detect object from camera frame (real-time)
 * This would be used with react-native-vision-camera frame processor
 */
export async function detectObjectFromFrame(
  frame: any, // Frame from react-native-vision-camera
  frameWidth: number = SCREEN_WIDTH,
  frameHeight: number = SCREEN_HEIGHT
): Promise<BoundingBox | null> {
  try {
    // For now, this is a placeholder
    // In production, you'd:
    // 1. Extract image data from frame
    // 2. Convert to URI or process directly
    // 3. Use detectObject() method
    
    // For real-time detection, you'd want to:
    // - Process every 2-3 frames (throttle)
    // - Use frame processor for ML detection
    // - Cache results between frames
    
    console.log("[ObjectDetection] Frame-based detection not fully implemented");
    return null;
  } catch (error) {
    console.error("[ObjectDetection] Error detecting from frame:", error);
    return null;
  }
}

